---
id: "4.6"
title: "Structured Output Enforcement"
slug: structured-output-enforcement
module: safety-engineering
sectionOrder: 6
description: "Strict schemas that forbid extra fields and fail closed on missing ones, constrained decoding versus post-hoc validation and how each still fails, bounded retries, and template-based generation with output encoding."
category: safety
controlLayers: [deterministic]
knowledge:
  - "A schema is a deterministic contract on the shape of model output; validation either passes or fails, which makes it one of the few guardrails that behaves the same on every request."
  - "Strict validation forbids unknown fields, requires every safety-relevant field with no default, and rejects unknown tool names, so that missing or unexpected data fails closed."
  - "JSON mode produces syntactically valid JSON but not schema-valid JSON; function calling constrains structure only when the provider's strict mode is on, and strict modes support a subset of JSON Schema."
  - "Constrained decoding makes schema-valid output much more likely but still fails on max-token truncation, refusals, and unsupported schema features, so post-hoc validation is still required."
  - "Retries are for validation failures (immediate, with error feedback, bounded) and for transient API errors (with backoff, bounded); mixing the two wastes time or retries forever."
  - "Templates keep presentation out of the model's control, but every model-controlled field inserted into a template still needs encoding for its destination."
skills:
  - "Write a strict schema model that forbids extra fields and has no fail-open defaults."
  - "Implement output parsing that handles refusals, truncation, and invalid JSON without crashing or guessing."
  - "Implement bounded retry logic that separates validation failures from API errors and falls back safely."
  - "Implement template rendering with context-appropriate output encoding."
sources:
  - title: "Pydantic documentation: model configuration (extra='forbid')"
    url: "https://pydantic.dev/docs/validation/latest/api/pydantic/config/"
  - title: "Simon Willison (2024), OpenAI: Introducing Structured Outputs in the API (notes on strict mode limits)"
    url: "https://simonwillison.net/2024/Aug/6/openai-structured-outputs/"
  - title: "Willard and Louf (2023), Efficient Guided Generation for Large Language Models"
    url: "https://arxiv.org/abs/2307.09702"
lastReviewed: "2026-10-14"
---

# 4.6 Structured Output Enforcement

## The problem

A support assistant returns JSON with an `answer`, a list of `sources`, and a boolean `needs_escalation`. A downstream service routes escalations to a human queue. The schema model was written for convenience:

```python
from pydantic import BaseModel


class SupportResponse(BaseModel):  # the version that failed
    answer: str
    sources: list[str] = []
    needs_escalation: bool = False
```

After a prompt change, the model starts writing `"escalate": true` instead of `"needs_escalation": true`. The parser accepts the output: the unknown key is ignored by default, and the missing `needs_escalation` takes its default of `False`. For two weeks, every case the model flagged for a human goes nowhere. Every response validated.

The schema was a guardrail that failed open in two places: it ignored fields it did not expect, and it supplied a safe-looking default for a field that controls a safety action.

## Why it happens

A language model emits tokens. Whether those tokens form valid JSON, match a schema, or contain sensible values depends on the model, the prompt, the decoding method, and luck. Provider features narrow the gap in different ways:

| Feature | What it constrains | What it does not |
|---|---|---|
| Prompt instructions ("respond in JSON") | Nothing; it is a request | Syntax, schema, values |
| JSON mode | Output parses as JSON | Field names, types, required fields |
| Function or tool calling (non-strict) | The model is trained to emit arguments in the declared shape | Arguments can still be missing, extra, or wrongly typed |
| Strict mode or constrained decoding | Tokens are restricted so output follows the schema's grammar | Truncation, refusals, unsupported schema features, values |

Constrained decoding works by masking, at each step, the tokens that would make the output violate a grammar derived from the schema; the method can be implemented with modest overhead ([Willard and Louf, 2023](https://arxiv.org/abs/2307.09702)). Hosted "strict" modes apply the same idea. They come with limits. When OpenAI introduced strict structured outputs in 2024, only a subset of JSON Schema was supported, every object needed `additionalProperties: false` with all keys listed as required, a refusal came back in a separate field rather than as schema content, and a generation could still run until it hit the token limit without closing the object ([Willison, 2024](https://simonwillison.net/2024/Aug/6/openai-structured-outputs/)). Other providers and open-source servers have their own supported subsets.

So even with the strongest provider feature, three outcomes are not schema-valid output: the response was cut off at the token limit, the model refused, or the request used a schema feature the provider does not enforce. Your code has to handle all three.

Finally, the parsing library's defaults matter. Pydantic, for example, ignores extra input by default and raises a validation error only when configured with `extra="forbid"` ([Pydantic docs](https://pydantic.dev/docs/validation/latest/api/pydantic/config/)). A field with a default is optional by definition.

## Control patterns

Every pattern here is deterministic. That is why structured output is worth the effort: within its scope it behaves the same way every time. Its scope is shape and simple value constraints. A perfectly valid object can still contain a hallucinated answer or harmful text; the checks in [4.2](/training/module/safety-engineering/detection-and-classification) and [4.3](/training/module/safety-engineering/groundedness-and-hallucination) still apply to the values.

### 1. Strict schemas that fail closed

- **Forbid extra fields.** Unknown keys are a signal that the model and the schema disagree. Reject them instead of dropping them.
- **No defaults on safety-relevant fields.** Fields that trigger a safety action (`needs_escalation`, `contains_medical_advice`, `requires_approval`) are required. Missing means invalid, not false.
- **Closed sets as enums.** Categories, actions, and tool names are enums, not free strings.
- **Bounds on everything.** String lengths, list sizes, numeric ranges. A 50,000-character "answer" is a failure, not an answer.
- **Strict types.** Do not let `"true"` coerce to `True` or `"5"` to `5` silently where the difference matters.
- **Unknown tool names fail.** A tool-call validator that returns valid for a tool it does not recognize lets the model call anything the dispatcher can reach.

### 2. Constrained decoding plus validation, not instead of it

Use strict mode or constrained decoding when the provider or serving stack supports your schema; it reduces retries. Then validate the result anyway, and check the completion status first:

- **Refusal:** handle as a refusal ([4.4](/training/module/safety-engineering/over-refusal-and-refusal-design)), not as a parse failure to retry.
- **Truncated** (the provider reports the token limit was hit): do not try to repair the JSON. Either retry once with a higher limit or a request for a shorter answer, or fall back.
- **Unsupported schema features:** if the provider ignores a constraint (a pattern, a numeric bound), only your validator enforces it.

### 3. Parse narrowly; do not repair

Model output sometimes arrives inside a markdown code fence. Stripping one surrounding fence is reasonable. Beyond that, "repairing" JSON (swapping quotes, deleting trailing commas, extracting the first `{...}` from prose) accepts output the model did not produce as intended and can turn garbage into a plausible object. If the output is not valid JSON after removing a fence, treat it as a validation failure and retry.

### 4. Bounded retries that distinguish failure types

Two different things go wrong and need different retry logic:

| Failure | Cause | Retry policy |
|---|---|---|
| Transient API error (timeout, rate limit, server error) | Infrastructure | Retry with exponential backoff and jitter, a small fixed number of times |
| Validation failure | The model's output | Retry immediately with the validation error in the conversation, a small fixed number of times; no backoff, since waiting does not change the model |
| Refusal, policy block, or non-retryable API error (bad request, authentication) | Policy or configuration | Do not retry; handle or fall back |

Cap the total attempts and total cost per request. When attempts run out, return a predefined safe fallback that fails toward the cautious path (for a support bot: a holding message and `needs_escalation=True`).

### 5. Templates with output encoding

For high-stakes or strictly formatted output, let the model supply data fields and let code assemble the final text or markup from a template. The model controls only the field values, so it cannot add links, buttons, or formatting outside them. Text inside a field can still imitate a notice, which is why values still get encoding and content checks.

Templates move presentation out of the model's control. They do not make the inserted values safe. The `answer` field is still model-controlled text, and if it is inserted into HTML unescaped, a response containing `<img src=...>` becomes markup in the user's browser. Encode each value for its destination: HTML-escape for HTML, parameterize for SQL, URL-encode for query strings. The full treatment is in [3.4 Output Handling and Egress Control](/training/module/security-engineering/output-handling-and-egress).

## Implementation

A strict response model. Every field is required, extra fields are rejected, types are not coerced, and the category is a closed set.

```python
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, ValidationError


class Category(str, Enum):
    BILLING = "billing"
    SHIPPING = "shipping"
    ACCOUNT = "account"
    OTHER = "other"


class SupportResponse(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    answer: str = Field(min_length=1, max_length=2000)
    category: Category
    sources: list[str] = Field(max_length=5)
    needs_escalation: bool  # required, no default: a missing value is a validation error


SAFE_FALLBACK = SupportResponse(
    answer="I can't complete this request right now. A member of our team will follow up.",
    category=Category.OTHER,
    sources=[],
    needs_escalation=True,
)
```

`model_validate_json` parses and validates in one step and raises `ValidationError` for invalid JSON as well as schema violations, so there is no unguarded `json.loads`. In JSON mode Pydantic's strict setting still accepts a string for an enum field, because JSON has no enum type.

Parsing a provider response: check refusal and truncation before touching the text, strip at most one code fence, and never repair.

```python
import re
from dataclasses import dataclass

_FENCE = re.compile(r"^```(?:json)?\s*\n(.*)\n```\s*$", re.DOTALL)


@dataclass(frozen=True)
class ParseOutcome:
    value: SupportResponse | None
    error: str | None
    retryable: bool


def parse_response(resp) -> ParseOutcome:
    """resp has .text, .finish_reason, and .refusal (None when the model did not refuse)."""
    if resp.refusal:
        return ParseOutcome(None, "refusal", retryable=False)
    if resp.finish_reason == "length":
        return ParseOutcome(None, "truncated at token limit", retryable=False)
    text = resp.text.strip()
    m = _FENCE.match(text)
    if m:
        text = m.group(1)
    try:
        return ParseOutcome(SupportResponse.model_validate_json(text), None, retryable=False)
    except ValidationError as exc:
        # Summarize field locations and messages; do not echo the full input back.
        summary = "; ".join(f"{'.'.join(map(str, e['loc']))}: {e['msg']}" for e in exc.errors()[:5])
        return ParseOutcome(None, f"schema: {summary}", retryable=True)
```

Validating tool calls. An unknown tool name fails, arguments are validated strictly, and validation is separate from authorization (whether this user may run this tool with these arguments, covered in [5.1](/training/module/agent-containment-and-control/least-privilege-for-agents) and [3.6](/training/module/security-engineering/identity-and-delegation)).

```python
class SearchArgs(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)
    query: str = Field(min_length=1, max_length=200)
    max_results: int = Field(ge=1, le=10)


class Priority(str, Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"


class TicketArgs(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)
    summary: str = Field(min_length=1, max_length=500)
    priority: Priority


TOOL_ARG_MODELS: dict[str, type[BaseModel]] = {
    "search_knowledge_base": SearchArgs,
    "create_ticket": TicketArgs,
}


@dataclass(frozen=True)
class ToolCallCheck:
    ok: bool
    args: BaseModel | None
    error: str | None


def validate_tool_call(name: str, raw_arguments: str) -> ToolCallCheck:
    model = TOOL_ARG_MODELS.get(name)
    if model is None:
        return ToolCallCheck(False, None, f"unknown tool {name!r}")  # fail closed
    try:
        return ToolCallCheck(True, model.model_validate_json(raw_arguments), None)
    except ValidationError as exc:
        return ToolCallCheck(False, None, f"invalid arguments for {name}: {exc.error_count()} error(s)")
```

Bounded retries that separate API errors from validation failures. `llm.chat` is a provider-neutral call that raises `TransientAPIError` for timeouts, rate limits, and server errors, and other exceptions for non-retryable failures.

```python
import random
import time

MODEL = "your-model"


class TransientAPIError(Exception):
    pass


def call_with_backoff(llm, messages: list[dict], schema: dict,
                      max_api_retries: int = 3, base_delay_s: float = 0.5):
    for attempt in range(max_api_retries + 1):
        try:
            return llm.chat(messages, model=MODEL, response_schema=schema, timeout=15)
        except TransientAPIError:
            if attempt == max_api_retries:
                raise
            time.sleep(base_delay_s * (2 ** attempt) * random.uniform(0.5, 1.5))


def generate_support_response(llm, messages: list[dict], max_validation_attempts: int = 3) -> SupportResponse:
    schema = SupportResponse.model_json_schema()
    history = list(messages)  # copy; never mutate the caller's list
    for _ in range(max_validation_attempts):
        try:
            resp = call_with_backoff(llm, history, schema)
        except Exception:
            return SAFE_FALLBACK  # API retries exhausted or non-retryable error
        outcome = parse_response(resp)
        if outcome.value is not None:
            return outcome.value
        if not outcome.retryable:
            return SAFE_FALLBACK  # refusal or truncation: handled by policy, not retried here
        history = history + [
            {"role": "assistant", "content": resp.text},
            {"role": "user", "content": f"That response did not match the required schema ({outcome.error}). "
                                        "Reply with only a JSON object that matches the schema."},
        ]
    return SAFE_FALLBACK
```

There is no mutable default argument, validation retries do not sleep, API retries do, and both are bounded. In production, log the reason for each fallback, and route refusals to the refusal handling in [4.4](/training/module/safety-engineering/over-refusal-and-refusal-design) rather than to a generic fallback.

Rendering with a template and encoding for HTML:

```python
import html

_ESCALATION_NOTE = '<p class="note">A member of our team will follow up on this.</p>'


def render_support_html(r: SupportResponse) -> str:
    items = "".join(f"<li>{html.escape(s)}</li>" for s in r.sources)
    sources = f"<ul class=\"sources\">{items}</ul>" if items else ""
    note = _ESCALATION_NOTE if r.needs_escalation else ""
    return f'<div class="answer"><p>{html.escape(r.answer)}</p>{sources}{note}</div>'
```

The fixed strings are written by engineers; every model-controlled value passes through `html.escape`. If sources are rendered as links, validate each URL against an allowlist first, since escaping does not make a `javascript:` URL safe ([3.4](/training/module/security-engineering/output-handling-and-egress)).

## Where it breaks

- **Valid but wrong.** The schema checks shape. `{"answer": "Your refund is approved", "needs_escalation": false}` is valid whether or not it is true. Content checks still apply to every field.
- **Plausible enum values.** A model can pick `"billing"` when the question was about shipping. Enums constrain the vocabulary, not the choice.
- **Schema features the provider ignores.** If strict mode does not support a constraint, the model may violate it and the provider will not stop it. Only your validator enforces it, so keep the full schema in your validator even when you send a reduced one to the provider.
- **Truncation and refusals.** Constrained decoding does not prevent either. Code that assumes a strict-mode response is always parseable will crash or, worse, catch the exception and continue with defaults.
- **Retries multiply cost.** A prompt change that makes the model fail validation half the time can double or triple spend without any visible error. Track retry rate and fallback rate as metrics ([7.1](/training/module/operations-and-governance/monitoring-and-alerting)).
- **Error feedback as an injection path.** Validation errors fed back to the model may echo content from the model's output, which may contain text from the user or retrieved documents. Keep the feedback to field paths and messages, and treat it as untrusted.
- **Encoding for the wrong context.** HTML escaping does not protect a value placed in a URL, a script block, a SQL query, or a shell command. Each sink needs its own encoding.
- **Schema bloat.** Very large schemas cost tokens, slow the first constrained request while the grammar is built, and hit provider limits on nesting or size. Keep schemas as small as the task allows.

## Lab exercise

In [Lab 4: Safety Controls](/labs/lab-4-safety-controls), Task 4.6 has you replace the lab assistant's permissive response model with a strict one, add refusal and truncation handling, fix its retry loop so API errors and validation failures are retried differently, and render the answer through an encoded template; the provided test suite includes a missing-escalation-field case and an HTML payload in the answer.

## Check your understanding

<details>
<summary>1. A response model declares <code>needs_escalation: bool = False</code> and uses the library's default handling of extra fields. The model outputs <code>{"answer": "...", "escalate": true}</code>. What happens and what should the schema look like?</summary>

The unknown `escalate` key is silently ignored and `needs_escalation` takes its default of `False`, so the escalation is lost while validation passes. Make `needs_escalation` required with no default and configure the model to forbid extra fields, so this output fails validation and is retried or falls back.
</details>

<details>
<summary>2. A team enables the provider's strict structured-output mode and removes its own validation. Name two ways a request can still produce output that is not schema-valid.</summary>

The generation can stop at the token limit before the object is closed, and the model can refuse, returning a refusal instead of schema content. A third: schema features the provider does not support are not enforced.
</details>

<details>
<summary>3. A retry loop sleeps with exponential backoff after every validation failure and does not catch API timeouts. What is wrong?</summary>

Backoff does nothing for validation failures, since the model is not rate-limited by its own bad output; those should be retried immediately with error feedback. Timeouts and rate limits are the failures that need backoff, and leaving them uncaught means a transient API error crashes the request instead of being retried or falling back.
</details>

<details>
<summary>4. A template inserts the model's answer into HTML. Why is the template alone not enough?</summary>

The answer is still model-controlled text. Without HTML escaping, markup in the answer is rendered by the browser, which enables injected links, images that exfiltrate data, or scripts. Encode every model-controlled value for its destination.
</details>
