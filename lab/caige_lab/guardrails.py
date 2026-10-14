"""The guardrail interface.

Subclass `Guardrails`, override the hooks you need, and point
`[guardrails] module` in lab.toml at your class (for example
"my_guardrails:MyGuardrails" for a file my_guardrails.py in the lab directory).

Every hook receives a `HookContext` with the authenticated principal and the
run's trace, and returns a `Decision`:

- Decision.allow()
- Decision.deny(reason)
- Decision.transform(new_value, reason)  # replace the content
- Decision.require_approval(reason)      # on_tool_call only: ask a human

Hooks are probabilistic or deterministic depending on what you put in them.
Remember the control-strength ladder from training section 2.1: a hook that
calls a classifier reduces how often things go wrong; turning on tenant
filtering and backend authorization bounds how bad they can get.
"""
from __future__ import annotations

import importlib
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from .types import Decision, Document, Principal, ToolCall


@dataclass
class HookContext:
    principal: Principal
    run_id: str
    trace: list[dict[str, Any]] = field(default_factory=list)


class Guardrails:
    """Pass-through defaults. Override any hook."""

    def on_input(self, ctx: HookContext, text: str) -> Decision:
        """Before the user's message is used. TRANSFORM replaces the text."""
        return Decision.allow()

    def on_retrieval(self, ctx: HookContext, doc: Document) -> Decision:
        """For each retrieved document before it enters the context. DENY drops it; TRANSFORM replaces its text."""
        return Decision.allow()

    def wrap_documents(self, ctx: HookContext, docs: list[Document]) -> str:
        """How retrieved documents are placed in the prompt. The default is naive: no delimiters, no escaping."""
        return "\n".join(f"[{d.title}] {d.text}" for d in docs)

    def on_tool_call(self, ctx: HookContext, call: ToolCall) -> Decision:
        """Before a tool runs. DENY blocks it; REQUIRE_APPROVAL asks a human; TRANSFORM replaces the arguments dict."""
        return Decision.allow()

    def on_tool_result(self, ctx: HookContext, call: ToolCall, result: str) -> Decision:
        """Before a tool result re-enters the context. TRANSFORM replaces the result text."""
        return Decision.allow()

    def on_output(self, ctx: HookContext, text: str) -> Decision:
        """Before the answer is returned. DENY replaces it with a refusal; TRANSFORM rewrites it."""
        return Decision.allow()


def load_guardrails(spec: str, base_dir: Path) -> Guardrails:
    if not spec:
        return Guardrails()
    module_name, _, class_name = spec.partition(":")
    if not class_name:
        raise ValueError('guardrails.module must look like "module_name:ClassName"')
    if str(base_dir) not in sys.path:
        sys.path.insert(0, str(base_dir))
    cls = getattr(importlib.import_module(module_name), class_name)
    instance = cls()
    if not isinstance(instance, Guardrails):
        raise TypeError(f"{spec} must subclass caige_lab.guardrails.Guardrails")
    return instance
