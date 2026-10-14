"""Model adapters.

The harness talks to any model through `ModelClient.complete`. Three adapters ship:

- OpenAICompatibleModel: any endpoint that implements the OpenAI-style chat
  completions API with tool calling. Many hosted providers and local servers do.
  Configure with CAIGE_MODEL_BASE_URL, CAIGE_MODEL_API_KEY, CAIGE_MODEL_NAME.
- OfflineModel: a deterministic stand-in so the app runs with no API key. It is
  NOT a language model. It answers from the top retrieved document and looks up
  orders when an order number appears. Use it to try the app and to measure
  benign behavior (latency, over-refusal of your guardrails). Security
  measurements need a real model.
- ScriptedModel: returns pre-written responses. Used by the tests.
"""
from __future__ import annotations

import json
import os
import re
import urllib.request
from typing import Any, Callable, Protocol

from .types import Message, ModelResponse, ToolCall


class ModelClient(Protocol):
    def complete(self, messages: list[Message], tools: list[dict[str, Any]]) -> ModelResponse: ...


def _estimate_tokens(text: str) -> int:
    # Rough estimate for budgets when the provider does not report usage.
    return max(1, len(text) // 4)


class ScriptedModel:
    """Returns responses from a list, or from a function of the conversation."""

    def __init__(self, script: list[ModelResponse] | Callable[[list[Message]], ModelResponse]):
        self._script = script
        self._index = 0

    def complete(self, messages: list[Message], tools: list[dict[str, Any]]) -> ModelResponse:
        if callable(self._script):
            return self._script(messages)
        if self._index >= len(self._script):
            return ModelResponse(text="(script exhausted)")
        response = self._script[self._index]
        self._index += 1
        return response


ORDER_ID = re.compile(r"\b([A-Z]{2}-\d{4})\b")
_WORD = re.compile(r"[a-z0-9$%]+")
_STOP = {"the", "a", "an", "and", "or", "to", "of", "in", "on", "for", "is", "are", "do", "does", "i", "my", "you", "your",
         "can", "what", "how", "when", "it", "be", "with", "at", "if", "much", "long", "take", "there", "we"}


def _terms(text: str) -> set[str]:
    from .data import _stem
    return {_stem(w) for w in _WORD.findall(text.lower()) if w not in _STOP}


class OfflineModel:
    """Deterministic stand-in for trying the app without a model provider. Not an LLM."""

    def complete(self, messages: list[Message], tools: list[dict[str, Any]]) -> ModelResponse:
        last_user = next((m for m in reversed(messages) if m.role == "user"), None)
        tool_names = {t["function"]["name"] for t in tools}
        # After a tool result, summarize it.
        if messages and messages[-1].role == "tool":
            return ModelResponse(text=f"Here is what I found: {messages[-1].content}")
        if last_user is None:
            return ModelResponse(text="How can I help?")
        question = last_user.content.split("\n\nDocuments:", 1)[0]
        match = ORDER_ID.search(question)
        if match and "lookup_order" in tool_names:
            call = ToolCall(id="call-1", name="lookup_order", arguments={"order_id": match.group(1)})
            return ModelResponse(text="", tool_calls=[call])
        docs = last_user.content.split("\n\nDocuments:", 1)
        if len(docs) == 2 and docs[1].strip():
            q = _terms(question)
            sentences = [
                s for line in docs[1].strip().splitlines()
                for s in re.split(r"(?<=[.!?])\s+", re.sub(r"^\[[^\]]*\]\s*", "", line))
                if s and "MARKER" not in s
            ]
            ranked = sorted(sentences, key=lambda s: -len(q & _terms(s)))
            best = [s for s in ranked[:2] if q & _terms(s)]
            if best:
                answer = " ".join(best)
                return ModelResponse(text=answer, input_tokens=_estimate_tokens(last_user.content), output_tokens=_estimate_tokens(answer))
        return ModelResponse(text="I could not find that in our documents. A support agent can help.")


class OpenAICompatibleModel:
    """Chat-completions client for any OpenAI-compatible endpoint, using only the standard library."""

    def __init__(self, base_url: str | None = None, api_key: str | None = None, model: str | None = None, timeout: float = 60.0):
        self.base_url = (base_url or os.environ.get("CAIGE_MODEL_BASE_URL", "")).rstrip("/")
        self.api_key = api_key or os.environ.get("CAIGE_MODEL_API_KEY", "")
        self.model = model or os.environ.get("CAIGE_MODEL_NAME", "")
        self.timeout = timeout
        if not self.base_url or not self.model:
            raise ValueError("Set CAIGE_MODEL_BASE_URL and CAIGE_MODEL_NAME (and CAIGE_MODEL_API_KEY if required).")

    @staticmethod
    def _to_wire(message: Message) -> dict[str, Any]:
        wire: dict[str, Any] = {"role": message.role, "content": message.content}
        if message.role == "tool":
            wire["tool_call_id"] = message.tool_call_id
        if message.tool_calls:
            wire["tool_calls"] = [
                {"id": c.id, "type": "function", "function": {"name": c.name, "arguments": json.dumps(c.arguments)}}
                for c in message.tool_calls
            ]
        return wire

    def complete(self, messages: list[Message], tools: list[dict[str, Any]]) -> ModelResponse:
        payload: dict[str, Any] = {"model": self.model, "messages": [self._to_wire(m) for m in messages]}
        if tools:
            payload["tools"] = tools
        request = urllib.request.Request(
            f"{self.base_url}/chat/completions",
            data=json.dumps(payload).encode(),
            headers={"Content-Type": "application/json", **({"Authorization": f"Bearer {self.api_key}"} if self.api_key else {})},
            method="POST",
        )
        with urllib.request.urlopen(request, timeout=self.timeout) as resp:
            body = json.loads(resp.read())
        choice = body["choices"][0]["message"]
        calls = []
        for raw in choice.get("tool_calls") or []:
            try:
                args = json.loads(raw["function"].get("arguments") or "{}")
            except json.JSONDecodeError:
                args = {"_unparseable": raw["function"].get("arguments")}
            calls.append(ToolCall(id=raw["id"], name=raw["function"]["name"], arguments=args if isinstance(args, dict) else {"_value": args}))
        usage = body.get("usage") or {}
        text = choice.get("content") or ""
        return ModelResponse(
            text=text,
            tool_calls=calls,
            input_tokens=int(usage.get("prompt_tokens") or 0),
            output_tokens=int(usage.get("completion_tokens") or _estimate_tokens(text)),
        )


def model_from_env() -> ModelClient:
    """A real model if CAIGE_MODEL_BASE_URL is set, otherwise the offline stand-in."""
    if os.environ.get("CAIGE_MODEL_BASE_URL"):
        return OpenAICompatibleModel()
    return OfflineModel()
