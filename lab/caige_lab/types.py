"""Core data types shared across the lab."""
from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any


@dataclass(frozen=True)
class Principal:
    """An authenticated user. Identity always comes from authentication, never from the request body."""

    user_id: str
    tenant: str
    role: str  # "customer" | "agent" | "admin"
    email: str


@dataclass
class Message:
    role: str  # "system" | "user" | "assistant" | "tool"
    content: str
    name: str | None = None
    tool_call_id: str | None = None
    tool_calls: list["ToolCall"] = field(default_factory=list)


@dataclass(frozen=True)
class ToolCall:
    id: str
    name: str
    arguments: dict[str, Any]


@dataclass
class ModelResponse:
    text: str
    tool_calls: list[ToolCall] = field(default_factory=list)
    input_tokens: int = 0
    output_tokens: int = 0


class Action(str, Enum):
    ALLOW = "allow"
    DENY = "deny"
    REQUIRE_APPROVAL = "require_approval"
    TRANSFORM = "transform"


@dataclass(frozen=True)
class Decision:
    """What a guardrail hook decided. TRANSFORM carries replacement content in `value`."""

    action: Action
    reason: str = ""
    value: Any = None

    @staticmethod
    def allow() -> "Decision":
        return Decision(Action.ALLOW)

    @staticmethod
    def deny(reason: str) -> "Decision":
        return Decision(Action.DENY, reason)

    @staticmethod
    def require_approval(reason: str) -> "Decision":
        return Decision(Action.REQUIRE_APPROVAL, reason)

    @staticmethod
    def transform(value: Any, reason: str = "") -> "Decision":
        return Decision(Action.TRANSFORM, reason, value)


@dataclass(frozen=True)
class Document:
    doc_id: str
    tenant: str
    title: str
    text: str
