"""Tool definitions and backends.

The model only ever *requests* a tool call. The harness decides whether to run
it, and the backend below executes it. Authorization belongs in the backend,
using the authenticated principal from the context, never the model's arguments
(training sections 3.6 and 5.1). With `enforce_authorization = false` the
backends are deliberately trusting; the labs have you turn enforcement on and
verify it.
"""
from __future__ import annotations

import json
import time
from dataclasses import dataclass
from email.utils import parseaddr
from pathlib import Path
from typing import Any, Callable
from urllib.parse import urlsplit

from .control import ControlPlane
from .data import LabData
from .types import Principal


class ToolDenied(Exception):
    """The backend refused the call."""


class ApprovalRequired(Exception):
    """The backend requires a human to approve this exact call."""


@dataclass
class ToolContext:
    principal: Principal
    config: dict[str, Any]
    data: LabData
    run_dir: Path
    control: ControlPlane
    lease: str
    approved: bool = False  # set by the harness after a human approves this exact call


def _enforce(ctx: ToolContext) -> bool:
    return bool(ctx.config["tools"].get("enforce_authorization", False))


def email_domain(address: str) -> str | None:
    """Exact domain of a single, well-formed address, or None."""
    name, addr = parseaddr(address)
    if not addr or addr.count("@") != 1 or any(c in addr for c in " ,;<>"):
        return None
    local, domain = addr.rsplit("@", 1)
    if not local or not domain:
        return None
    return domain.lower().rstrip(".")


def _append_jsonl(path: Path, record: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a") as f:
        f.write(json.dumps(record) + "\n")


# ---- backends -------------------------------------------------------------

def search_docs(ctx: ToolContext, query: str) -> list[dict[str, str]]:
    retrieval = ctx.config["retrieval"]
    tenant = ctx.principal.tenant if retrieval.get("tenant_filter") else None
    include_internal = not (retrieval.get("hide_internal_from_customers") and ctx.principal.role == "customer")
    docs = ctx.data.store.search(query, top_k=int(retrieval.get("top_k", 3)), tenant=tenant, include_internal=include_internal)
    return [{"doc_id": d.doc_id, "title": d.title, "text": d.text} for d in docs]


def lookup_order(ctx: ToolContext, order_id: str) -> dict[str, Any]:
    row = ctx.data.db.execute(
        "SELECT order_id, tenant, customer, item, total, status FROM orders WHERE order_id = ?", (order_id,)
    ).fetchone()
    if row is None:
        return {"error": "order not found"}
    order = dict(zip(("order_id", "tenant", "customer", "item", "total", "status"), row))
    if _enforce(ctx):
        p = ctx.principal
        if order["tenant"] != p.tenant or (p.role == "customer" and order["customer"] != p.user_id):
            return {"error": "order not found"}  # do not reveal that the order exists
    return order


def send_email(ctx: ToolContext, to: str, subject: str, body: str) -> dict[str, Any]:
    domain = email_domain(to)
    if domain is None:
        raise ToolDenied("recipient must be a single well-formed address")
    allowed = [d.lower() for d in ctx.config["tools"].get("email_allowed_domains", [])]
    if allowed and domain not in allowed:  # exact match on the parsed domain, never suffix or substring
        raise ToolDenied(f"recipient domain {domain} is not allowed")
    record = {"ts": time.time(), "from_user": ctx.principal.user_id, "to": to, "domain": domain, "subject": subject, "body": body}
    _append_jsonl(ctx.run_dir / "outbox.jsonl", record)
    return {"status": "queued", "to": to}


def issue_refund(ctx: ToolContext, order_id: str, amount: float, reason: str) -> dict[str, Any]:
    order = ctx.data.db.execute("SELECT tenant, total FROM orders WHERE order_id = ?", (order_id,)).fetchone()
    if order is None:
        raise ToolDenied("order not found")
    tenant, total = order
    amount = float(amount)
    if amount <= 0 or amount > total:
        raise ToolDenied("refund amount must be positive and no more than the order total")
    if _enforce(ctx):
        p = ctx.principal
        if p.role not in ("agent", "admin") or tenant != p.tenant:
            raise ToolDenied("not authorized to refund this order")
        threshold = float(ctx.config["tools"].get("refund_approval_threshold", 200.0))
        if amount >= threshold and not ctx.approved:
            raise ApprovalRequired(f"refunds of {threshold:.2f} or more need human approval")
    record = {"ts": time.time(), "by_user": ctx.principal.user_id, "by_role": ctx.principal.role, "by_tenant": ctx.principal.tenant,
              "order_id": order_id, "order_tenant": tenant, "amount": amount, "reason": reason, "approved": ctx.approved}
    _append_jsonl(ctx.run_dir / "refunds.jsonl", record)
    return {"status": "refunded", "order_id": order_id, "amount": amount}


def fetch_url(ctx: ToolContext, url: str) -> dict[str, Any]:
    """Serves pages from data/web.json only. The lab never makes real network requests."""
    parts = urlsplit(url)
    if parts.scheme != "https" or not parts.hostname or parts.username or parts.password:
        raise ToolDenied("only plain https URLs are allowed")
    host = parts.hostname.lower().rstrip(".")
    allowed = [h.lower() for h in ctx.config["tools"].get("fetch_allowed_hosts", [])]
    if allowed and host not in allowed:
        raise ToolDenied(f"host {host} is not allowed")
    canonical = f"https://{host}{parts.path or '/'}"
    _append_jsonl(ctx.run_dir / "fetches.jsonl", {"ts": time.time(), "url": url, "host": host})
    page = ctx.data.web_pages.get(canonical)
    return {"url": canonical, "status": 200, "text": page} if page is not None else {"url": canonical, "status": 404, "text": ""}


# ---- registry -------------------------------------------------------------

@dataclass(frozen=True)
class Tool:
    name: str
    description: str
    parameters: dict[str, Any]
    run: Callable[..., Any]

    def spec(self) -> dict[str, Any]:
        return {"type": "function", "function": {"name": self.name, "description": self.description, "parameters": self.parameters}}


def _params(**props: str) -> dict[str, Any]:
    types = {"amount": "number"}
    return {
        "type": "object",
        "properties": {k: {"type": types.get(k, "string"), "description": v} for k, v in props.items()},
        "required": list(props),
        "additionalProperties": False,
    }


ALL_TOOLS = {
    t.name: t
    for t in [
        Tool("search_docs", "Search the store's help documents.", _params(query="What to search for"), search_docs),
        Tool("lookup_order", "Look up an order by its order number.", _params(order_id="Order number, e.g. BF-1001"), lookup_order),
        Tool("send_email", "Send an email.", _params(to="Recipient address", subject="Subject line", body="Message body"), send_email),
        Tool("issue_refund", "Refund part or all of an order.", _params(order_id="Order number", amount="Amount to refund", reason="Why"), issue_refund),
        Tool("fetch_url", "Fetch a web page over https.", _params(url="The https URL"), fetch_url),
    ]
}


class ToolRegistry:
    def __init__(self, enabled: list[str]):
        unknown = set(enabled) - set(ALL_TOOLS)
        if unknown:
            raise ValueError(f"unknown tools in config: {sorted(unknown)}")
        self.tools = {name: ALL_TOOLS[name] for name in enabled}

    def specs(self) -> list[dict[str, Any]]:
        return [t.spec() for t in self.tools.values()]

    def execute(self, ctx: ToolContext, name: str, arguments: dict[str, Any]) -> Any:
        ctx.control.validate_lease(ctx.lease)  # a killed run's credentials fail here, even for in-flight calls
        tool = self.tools.get(name)
        if tool is None:
            raise ToolDenied(f"unknown or disabled tool {name!r}")
        expected = set(tool.parameters["properties"])
        if set(arguments) != expected:
            raise ToolDenied(f"arguments must be exactly {sorted(expected)}")
        return tool.run(ctx, **arguments)
