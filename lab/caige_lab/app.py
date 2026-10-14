"""The Acme Support harness: the agent loop and every guardrail attachment point."""
from __future__ import annotations

import json
import time
import tomllib
import uuid
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable

from .audit import AuditLog
from .control import Budget, BudgetExceeded, ControlPlane, Halted, LeaseInvalid
from .data import LabData, load
from .guardrails import Guardrails, HookContext, load_guardrails
from .model import ModelClient
from .tools import ApprovalRequired, ToolContext, ToolDenied, ToolRegistry
from .types import Action, Decision, Message, Principal, ToolCall

LAB_DIR = Path(__file__).resolve().parent.parent
REFUSAL = "I can't help with that request. If you need more help, a support agent can assist."

# An approver sees the exact principal and tool call (never the model's description of it) and returns True to approve.
Approver = Callable[[Principal, ToolCall, str], bool]


def load_config(path: Path | None = None) -> dict[str, Any]:
    with (path or LAB_DIR / "lab.toml").open("rb") as f:
        return tomllib.load(f)


@dataclass
class RunResult:
    run_id: str
    status: str  # "ok" | "denied" | "halted" | "budget_exceeded" | "error"
    output: str
    trace: list[dict[str, Any]] = field(default_factory=list)
    run_dir: Path | None = None
    latency_s: float = 0.0
    tokens: int = 0


class AcmeSupport:
    def __init__(self, model: ModelClient, config: dict[str, Any] | None = None, runs_dir: Path | None = None,
                 data: LabData | None = None, guardrails: Guardrails | None = None):
        self.config = config or load_config()
        self.model = model
        self.runs_dir = runs_dir or LAB_DIR / "runs"
        self.data = data or load()
        self.guardrails = guardrails or load_guardrails(self.config.get("guardrails", {}).get("module", ""), LAB_DIR)
        self.registry = ToolRegistry(self.config["tools"]["enabled"])

    def authenticate(self, token: str) -> Principal | None:
        return self.data.users_by_token.get(token)

    def new_run(self, run_id: str | None = None) -> tuple[str, Path, ControlPlane, AuditLog]:
        run_id = run_id or uuid.uuid4().hex[:12]
        run_dir = self.runs_dir / run_id
        c = self.config.get("control", {})
        control = ControlPlane(run_dir, operators=c.get("operators", []), pause_timeout=float(c.get("pause_timeout_seconds", 300)),
                               lease_seconds=float(c.get("lease_seconds", 120)))
        return run_id, run_dir, control, AuditLog(run_dir / "audit.jsonl")

    def handle(self, principal: Principal, text: str, approver: Approver | None = None, run_id: str | None = None,
               history: list[Message] | None = None) -> RunResult:
        run_id, run_dir, control, audit = self.new_run(run_id)
        started = time.monotonic()
        trace: list[dict[str, Any]] = []
        ctx = HookContext(principal=principal, run_id=run_id, trace=trace)
        b = self.config["budgets"]
        budget = Budget(int(b["max_steps"]), int(b["max_tool_calls"]), int(b["max_tokens"]), float(b["max_seconds"]))

        def record(event: str, **data: Any) -> None:
            trace.append({"event": event, **data})
            audit.append(event, **data)

        def finish(status: str, output: str) -> RunResult:
            record("result", status=status, output=output)
            audit.anchor(run_dir / "anchor.jsonl")
            (run_dir / "trace.json").write_text(json.dumps({"principal": principal.__dict__, "trace": trace}, indent=2, default=str))
            return RunResult(run_id, status, output, trace, run_dir, time.monotonic() - started, budget.tokens)

        record("request", user=principal.user_id, tenant=principal.tenant, role=principal.role, text=text)
        try:
            decision = self.guardrails.on_input(ctx, text)
            record("hook", hook="on_input", action=decision.action.value, reason=decision.reason)
            if decision.action == Action.DENY:
                return finish("denied", REFUSAL)
            if decision.action == Action.TRANSFORM:
                text = str(decision.value)

            # Retrieval happens in the harness, scoped by configuration, before the model runs.
            retrieval = self.config["retrieval"]
            include_internal = not (retrieval.get("hide_internal_from_customers") and principal.role == "customer")
            docs = self.data.store.search(text, top_k=int(retrieval.get("top_k", 3)),
                                          tenant=principal.tenant if retrieval.get("tenant_filter") else None,
                                          include_internal=include_internal)
            kept = []
            for doc in docs:
                d = self.guardrails.on_retrieval(ctx, doc)
                record("retrieval", doc_id=doc.doc_id, doc_tenant=doc.tenant, action=d.action.value, reason=d.reason)
                if d.action == Action.DENY:
                    continue
                kept.append(doc if d.action != Action.TRANSFORM else type(doc)(doc.doc_id, doc.tenant, doc.title, str(d.value)))

            documents = self.guardrails.wrap_documents(ctx, kept)
            messages = [Message("system", self.config["app"]["system_prompt"]), *(history or []),
                        Message("user", f"{text}\n\nDocuments:\n{documents}" if documents else text)]
            lease = control.issue_lease()
            tool_ctx = ToolContext(principal, self.config, self.data, run_dir, control, lease)

            while True:
                control.checkpoint()
                budget.step()
                response = self.model.complete(messages, self.registry.specs())
                budget.add_tokens(response.input_tokens + response.output_tokens)
                record("model", text=response.text, tool_calls=[c.__dict__ for c in response.tool_calls],
                       tokens=response.input_tokens + response.output_tokens)
                if not response.tool_calls:
                    break
                messages.append(Message("assistant", response.text, tool_calls=response.tool_calls))
                for call in response.tool_calls:
                    content = self._run_tool(call, ctx, tool_ctx, control, budget, approver, record)
                    messages.append(Message("tool", content, name=call.name, tool_call_id=call.id))

            out = self.guardrails.on_output(ctx, response.text)
            record("hook", hook="on_output", action=out.action.value, reason=out.reason)
            if out.action == Action.DENY:
                return finish("denied", REFUSAL)
            return finish("ok", str(out.value) if out.action == Action.TRANSFORM else response.text)
        except Halted as h:
            return finish("halted", f"This request was stopped by an operator ({h.state}).")
        except BudgetExceeded as e:
            return finish("budget_exceeded", f"This request was stopped: {e}.")
        except LeaseInvalid as e:
            return finish("halted", f"This request was stopped: {e}.")

    def _run_tool(self, call: ToolCall, ctx: HookContext, tool_ctx: ToolContext, control: ControlPlane, budget: Budget,
                  approver: Approver | None, record: Callable[..., None]) -> str:
        control.checkpoint()  # the brake is honored between a tool request and its execution
        budget.tool_call()
        decision = self.guardrails.on_tool_call(ctx, call)
        record("hook", hook="on_tool_call", tool=call.name, args=call.arguments, action=decision.action.value, reason=decision.reason)
        args = decision.value if decision.action == Action.TRANSFORM else call.arguments
        if decision.action == Action.DENY:
            return f"Tool call denied: {decision.reason}"
        approved = False
        if decision.action == Action.REQUIRE_APPROVAL:
            approved = self._approve(call, decision.reason, tool_ctx.principal, approver, record)
            if not approved:
                return "Tool call was not approved."
        for attempt in range(2):
            tool_ctx.approved = approved
            try:
                result = self.registry.execute(tool_ctx, call.name, args)
                break
            except ApprovalRequired as e:
                if attempt == 0 and self._approve(call, str(e), tool_ctx.principal, approver, record):
                    approved = True
                    continue
                record("tool", tool=call.name, args=args, status="not_approved", reason=str(e))
                return "Tool call was not approved."
            except ToolDenied as e:
                record("tool", tool=call.name, args=args, status="denied", reason=str(e))
                return f"Tool call denied: {e}"
        result_text = json.dumps(result, default=str)
        record("tool", tool=call.name, args=args, status="ok", result=result_text)
        r = self.guardrails.on_tool_result(ctx, call, result_text)
        record("hook", hook="on_tool_result", tool=call.name, action=r.action.value, reason=r.reason)
        if r.action == Action.DENY:
            return f"Tool result withheld: {r.reason}"
        return str(r.value) if r.action == Action.TRANSFORM else result_text

    @staticmethod
    def _approve(call: ToolCall, reason: str, principal: Principal, approver: Approver | None, record: Callable[..., None]) -> bool:
        ok = bool(approver and approver(principal, call, reason))
        record("approval", tool=call.name, args=call.arguments, reason=reason, approved=ok)
        return ok
