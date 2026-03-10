---
title: "Structured Output Enforcement"
slug: "structured-output-enforcement"
module: "implementing-guardrails"
sectionOrder: 2
description: "Enforcing safe, predictable AI outputs through schema validation, constrained generation, and robust error recovery."
---

## Section 4.2: Structured Output Enforcement

One of the most underappreciated guardrail strategies is not checking *what* the model says, but constraining *how* it says it. When an AI model returns free-form text, anything can happen — hallucinated data, embedded injection payloads, unexpected formats that break downstream processing. Structured output enforcement turns that open-ended risk into a bounded problem.

The idea is straightforward: define exactly what shape the output must take, then reject or retry anything that does not conform. This is a fundamentally different guardrail strategy from content classification. Instead of asking "is this output safe?" you ask "does this output conform to the expected structure?" — and structural violations are often the first signal that something has gone wrong.

### JSON Schema Validation

JSON schema validation is the most common form of structured output enforcement. You define a schema that specifies the expected fields, types, and constraints, then validate every model output against it.

Here is a schema for a customer support bot that must return structured responses:

```python
RESPONSE_SCHEMA = {
    "type": "object",
    "required": ["answer", "confidence", "sources", "needs_escalation"],
    "properties": {
        "answer": {
            "type": "string",
            "maxLength": 2000,
            "minLength": 1,
        },
        "confidence": {
            "type": "number",
            "minimum": 0.0,
            "maximum": 1.0,
        },
        "sources": {
            "type": "array",
            "items": {"type": "string"},
            "maxItems": 5,
        },
        "needs_escalation": {
            "type": "boolean",
        },
    },
    "additionalProperties": False,
}
```

Validation in code:

```python
import json
import jsonschema

def validate_model_output(raw_output: str, schema: dict) -> dict:
    """Parse and validate model output against a JSON schema."""
    try:
        parsed = json.loads(raw_output)
    except json.JSONDecodeError as e:
        return {
            "valid": False,
            "error": f"Invalid JSON: {e}",
            "parsed": None,
        }

    try:
        jsonschema.validate(instance=parsed, schema=schema)
    except jsonschema.ValidationError as e:
        return {
            "valid": False,
            "error": f"Schema violation: {e.message}",
            "parsed": parsed,
        }

    return {"valid": True, "error": None, "parsed": parsed}
```

> **Why this matters for guardrails:** Schema validation catches a broad class of output problems in a single check. If the model hallucinates extra fields, omits required ones, returns a string where a number was expected, or produces an answer longer than your maximum — the schema catches it. It is fast, deterministic, and zero-cost. Every application that consumes structured AI output should validate it.

### Pydantic Models for Type-Safe Validation

In Python, Pydantic models provide an even more powerful approach than raw JSON schema. They combine parsing, validation, and type safety in a single declaration.

```python
from pydantic import BaseModel, Field, field_validator

class SupportResponse(BaseModel):
    answer: str = Field(..., min_length=1, max_length=2000)
    confidence: float = Field(..., ge=0.0, le=1.0)
    sources: list[str] = Field(default_factory=list, max_length=5)
    needs_escalation: bool = False

    @field_validator("answer")
    @classmethod
    def answer_must_not_contain_pii_patterns(cls, v: str) -> str:
        import re
        if re.search(r"\b\d{3}-\d{2}-\d{4}\b", v):
            raise ValueError("Response contains SSN-like pattern")
        return v

    @field_validator("sources")
    @classmethod
    def sources_must_be_urls(cls, v: list[str]) -> list[str]:
        for source in v:
            if not source.startswith(("http://", "https://", "doc://")):
                raise ValueError(f"Invalid source format: {source}")
        return v


def parse_model_output(raw_output: str) -> dict:
    """Parse and validate model output using Pydantic."""
    try:
        parsed = json.loads(raw_output)
        response = SupportResponse(**parsed)
        return {"valid": True, "data": response.model_dump(), "error": None}
    except json.JSONDecodeError as e:
        return {"valid": False, "data": None, "error": f"Invalid JSON: {e}"}
    except Exception as e:
        return {"valid": False, "data": None, "error": str(e)}
```

The Pydantic approach has several advantages over raw JSON schema validation:

- **Custom validators** can enforce guardrail logic directly in the schema (like the PII pattern check above).
- **Type coercion** handles minor type mismatches (e.g., `"0.95"` parsed as `0.95`).
- **Default values** provide graceful degradation when optional fields are missing.
- **Serialization** gives you clean Python objects to work with downstream.

### Function Calling and Tool Use Schema Constraints

Modern LLM APIs support function calling (or tool use), where the model's output is constrained to match a declared function signature. This is a provider-level form of structured output enforcement.

```python
tools = [
    {
        "type": "function",
        "function": {
            "name": "search_knowledge_base",
            "description": "Search the internal knowledge base for relevant articles.",
            "parameters": {
                "type": "object",
                "required": ["query"],
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The search query.",
                        "maxLength": 200,
                    },
                    "max_results": {
                        "type": "integer",
                        "minimum": 1,
                        "maximum": 10,
                        "default": 5,
                    },
                },
                "additionalProperties": False,
            },
        },
    }
]
```

When the model uses function calling, the output is structurally constrained by the API — but you still need to validate that the *values* make sense. A model might produce valid JSON with a query like `"show me all user passwords"` — structurally correct, semantically dangerous.

```python
def validate_tool_call(tool_call: dict) -> dict:
    """Validate both structure and content of a tool call."""
    name = tool_call.get("function", {}).get("name")
    args = json.loads(tool_call["function"]["arguments"])

    if name == "search_knowledge_base":
        query = args.get("query", "")
        if len(query) > 200:
            return {"valid": False, "error": "Query exceeds maximum length"}
        if any(term in query.lower() for term in ["password", "secret", "credential"]):
            return {"valid": False, "error": "Query contains restricted terms"}

    return {"valid": True, "error": None, "args": args}
```

> **Why this matters for guardrails:** Function calling schemas constrain the *structure* of tool use, but they do not constrain the *intent*. The schema says "query must be a string under 200 characters" — it does not say "query must be a legitimate search." You always need a content-level check on top of the structural constraint.

### Output Parsing and Error Recovery

AI models are not reliable JSON generators. They add commentary before or after the JSON, use single quotes instead of double quotes, include trailing commas, or emit markdown code fences around their output. A robust parser must handle all of these cases.

```python
import re
import json

def extract_json_from_response(raw: str) -> str | None:
    """Extract JSON from a model response that may contain extra text."""
    # Try parsing the raw string directly
    try:
        json.loads(raw)
        return raw
    except json.JSONDecodeError:
        pass

    # Try extracting from markdown code blocks
    code_block_match = re.search(r"```(?:json)?\s*\n?(.*?)\n?```", raw, re.DOTALL)
    if code_block_match:
        candidate = code_block_match.group(1).strip()
        try:
            json.loads(candidate)
            return candidate
        except json.JSONDecodeError:
            pass

    # Try finding JSON object boundaries
    brace_match = re.search(r"\{.*\}", raw, re.DOTALL)
    if brace_match:
        candidate = brace_match.group(0)
        try:
            json.loads(candidate)
            return candidate
        except json.JSONDecodeError:
            pass

    return None
```

### Retry Logic for Malformed Outputs

When parsing fails, you need a retry strategy. The key design decisions are: how many times to retry, whether to change the prompt on retry, and when to give up and fall back.

```python
import time
from dataclasses import dataclass

@dataclass
class RetryConfig:
    max_retries: int = 3
    backoff_base_ms: int = 100
    include_error_in_retry: bool = True
    fallback_response: dict | None = None

def generate_with_retry(
    llm_client,
    messages: list[dict],
    schema: dict,
    config: RetryConfig = RetryConfig(),
) -> dict:
    """Generate structured output with retry on validation failure."""
    last_error = None

    for attempt in range(config.max_retries + 1):
        if attempt > 0:
            wait_ms = config.backoff_base_ms * (2 ** (attempt - 1))
            time.sleep(wait_ms / 1000)

            if config.include_error_in_retry and last_error:
                messages = messages + [
                    {"role": "assistant", "content": last_raw},
                    {
                        "role": "user",
                        "content": (
                            f"Your previous response was not valid JSON matching "
                            f"the required schema. Error: {last_error}. "
                            f"Please try again, returning ONLY valid JSON."
                        ),
                    },
                ]

        response = llm_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0.0,
        )

        last_raw = response.choices[0].message.content
        extracted = extract_json_from_response(last_raw)

        if extracted is None:
            last_error = "No JSON found in response"
            continue

        result = validate_model_output(extracted, schema)
        if result["valid"]:
            return {
                "success": True,
                "data": result["parsed"],
                "attempts": attempt + 1,
            }

        last_error = result["error"]

    if config.fallback_response:
        return {
            "success": False,
            "data": config.fallback_response,
            "attempts": config.max_retries + 1,
            "error": f"All retries exhausted. Last error: {last_error}",
        }

    return {
        "success": False,
        "data": None,
        "attempts": config.max_retries + 1,
        "error": f"All retries exhausted. Last error: {last_error}",
    }
```

Important retry design principles:

- **Exponential backoff** prevents hammering the API on transient failures.
- **Error feedback** tells the model what went wrong, dramatically improving success on retry.
- **Attempt limit** prevents infinite loops and unbounded cost.
- **Fallback response** provides a safe default when all retries fail — better than crashing.

### Constrained Decoding and Grammar-Based Generation

Some model serving frameworks support **constrained decoding**, where the model's output is forced to conform to a grammar or schema at the token level. Instead of generating freely and validating afterward, the model can only produce tokens that lead to valid output.

```
┌──────────────────────────────────────────────────────────────┐
│              Constrained Decoding                            │
│                                                              │
│  Model logits ──► Grammar filter ──► Valid tokens only       │
│                                                              │
│  At each step, only tokens that maintain valid JSON/grammar  │
│  are allowed. The model CANNOT produce invalid output.       │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│              Post-Hoc Validation                             │
│                                                              │
│  Model generates freely ──► Parse ──► Validate ──► Retry?   │
│                                                              │
│  The model CAN produce invalid output. You catch it after    │
│  generation and either fix it or retry.                      │
└──────────────────────────────────────────────────────────────┘
```

### Constrained Generation vs. Post-Hoc Validation

| Factor | Constrained Generation | Post-Hoc Validation |
|--------|----------------------|---------------------|
| **Guarantee** | 100% — output is always structurally valid | Probabilistic — depends on retry success |
| **Latency** | Slightly higher per token (grammar check at each step) | Lower per attempt, but retries add latency |
| **Availability** | Requires framework support (vLLM, llama.cpp, Outlines) | Works with any model API |
| **Flexibility** | Limited to supported grammar types | Can validate any arbitrary constraint |
| **Content quality** | May reduce output quality by over-constraining | Preserves full model capability |
| **Error handling** | No errors to handle — output is always valid | Must handle parse failures, retries, fallbacks |
| **Cost** | Single generation attempt | Multiple attempts on failure |
| **API support** | Growing — OpenAI structured outputs, Anthropic tool use | Universal — works with any provider |

> **Why this matters for guardrails:** Constrained generation eliminates an entire class of guardrail failures — you never have to deal with malformed output. But it is not always available, and it only guarantees *structure*, not *content*. A JSON object that perfectly matches the schema can still contain hallucinated data, toxic text, or PII. Structured output enforcement is a necessary layer, but it is not a sufficient one.

### Template-Based Output Generation

For high-stakes applications where output format must be absolutely predictable, template-based generation removes the model from the formatting step entirely. The model fills in specific fields, and the application assembles the final output from a template.

```python
RESPONSE_TEMPLATE = """Based on your question about {topic}:

{answer}

Sources consulted:
{sources}

Confidence: {confidence_label}
{escalation_note}"""

def build_response_from_template(model_output: dict) -> str:
    """Build a user-facing response from validated model output and a template."""
    sources_text = "\n".join(
        f"  - {source}" for source in model_output["sources"]
    ) or "  - No specific sources cited"

    if model_output["confidence"] >= 0.8:
        confidence_label = "High"
    elif model_output["confidence"] >= 0.5:
        confidence_label = "Medium"
    else:
        confidence_label = "Low — please verify this information"

    escalation_note = (
        "\n⚠️ This question has been flagged for human review."
        if model_output["needs_escalation"]
        else ""
    )

    return RESPONSE_TEMPLATE.format(
        topic=model_output.get("topic", "your inquiry"),
        answer=model_output["answer"],
        sources=sources_text,
        confidence_label=confidence_label,
        escalation_note=escalation_note,
    )
```

This pattern ensures the final user-facing text always follows the expected format, regardless of what the model produces. The model provides the *content* (answer, sources, confidence), and the application controls the *presentation*.

> **Why this matters for guardrails:** Template-based generation is the strongest structural guardrail you can apply. The model never controls the final format, only the data that fills it. This prevents format injection — where an attacker manipulates the model into producing output that looks like system messages, UI elements, or instructions to the user.

---
