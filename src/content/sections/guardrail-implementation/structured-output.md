---
title: "Structured Output Enforcement"
slug: "structured-output"
module: "guardrail-implementation"
moduleOrder: 3
sectionOrder: 2
description: "Section 2 of the guardrail implementation module."
---

When AI systems produce structured output (JSON, function calls, specific formats), enforcement guardrails ensure the output conforms to expectations.

### 3.2.1 JSON Schema Validation

Define a schema that the AI's output must conform to:

**Example schema for a product recommendation:**
```json
{
  "type": "object",
  "required": ["product_name", "price", "reason"],
  "properties": {
    "product_name": {
      "type": "string",
      "maxLength": 200
    },
    "price": {
      "type": "number",
      "minimum": 0,
      "maximum": 100000
    },
    "reason": {
      "type": "string",
      "maxLength": 500
    },
    "category": {
      "type": "string",
      "enum": ["electronics", "clothing", "home", "food", "other"]
    }
  },
  "additionalProperties": false
}
```

**What schema validation catches:**
- Missing required fields
- Wrong data types (string where number expected)
- Values outside allowed ranges
- Values not in allowed enumerations
- Unexpected additional fields (which could contain injected content)

### 3.2.2 Function Call Validation

When AI systems make function/tool calls, validate the calls:

**Parameter validation:**
- Required parameters are present
- Parameter types are correct
- Parameter values are within allowed ranges
- No unexpected parameters are included

**Function allowlisting:**
- The function being called is in the approved list
- The user has permission to invoke this function
- The function is appropriate for the current context

**Argument sanitization:**
- String arguments don't contain injection attacks (SQL injection, command injection)
- File paths don't contain traversal attacks (../../../etc/passwd)
- URLs point to allowed domains

### 3.2.3 Template-Based Output Generation

Rather than letting the model generate free-form output and validating afterward, template-based approaches constrain generation by defining the output structure in advance:

**How it works:**
The model fills in specific slots within a predefined template rather than generating the entire response:

```
Template:
"Product: {product_name}
Price: ${price}
Summary: {one_sentence_summary}
Recommendation: {recommend_yes_no}"

Model fills in:
"Product: Widget Pro
Price: $49.99
Summary: A durable widget suitable for professional use.
Recommendation: Yes"
```

**Why this is a guardrail:**
- The model can only generate content within defined slots — it cannot inject extra fields, change the structure, or produce unexpected content types
- Each slot can have its own validation rules (price must be numeric, recommendation must be yes/no)
- The template defines the response format, not the model — reducing format-related failures
- Severely limits the model's ability to include harmful content because the scope of each generation is narrow and constrained

**When to use templates:**
- Structured data extraction (pulling specific fields from text)
- Standardized reports with fixed sections
- Form-filling applications
- Any use case where the output structure is known in advance

**Limitations:**
- Not suitable for open-ended conversation or creative tasks
- Requires upfront template design for each output type
- Less flexible — adding a new field means updating the template

### 3.2.4 Error Recovery and Retry Logic

AI output frequently fails to conform to schemas on the first attempt:

**Retry strategies:**

**Simple retry:** Ask the model again with the same prompt. Works for random format errors.
```
Attempt 1: Model returns invalid JSON
Attempt 2: Model returns valid JSON (success)
```

**Retry with error feedback:** Include the validation error in the retry prompt.
```
Your previous response was not valid JSON.
Error: Missing required field "price".
Please respond again with the correct format.
```

**Retry with stronger constraints:** Escalate the formatting instructions.
```
You MUST respond with ONLY a JSON object. No other text.
The JSON must include these exact fields: product_name, price, reason.
```

**Design considerations for retries:**
- Set a maximum retry count (typically 2-3 retries)
- Each retry adds latency — factor this into your response time budget
- After max retries, return a graceful fallback response, not a raw error
- Log retry events — a high retry rate indicates the prompt or model needs adjustment
- Consider whether the model is fundamentally struggling with the format (indicating a prompt design issue) or just occasionally failing (indicating a normal variation)

**Building robust parsers:**

Models frequently return structured output with minor formatting issues. Robust parsers handle these gracefully:

- **JSON in markdown code blocks:** Models often wrap JSON in ` ```json ... ``` `. Strip markdown fences before parsing.
- **Mixed text and JSON:** Models may include explanatory text before or after the JSON. Extract JSON by finding the first `{` and last `}` (or `[` and `]` for arrays).
- **Trailing commas:** Some models add trailing commas in JSON arrays or objects. Strip them before parsing.
- **Unquoted keys or single quotes:** Use lenient JSON parsers that handle these common deviations.
- **Partial output:** If the model hits a token limit mid-output, decide whether to retry or attempt partial parsing of the available data.

The principle is: parse leniently, validate strictly. Accept format variations in the raw output, then validate the parsed result against your schema.

### 3.2.5 Constrained Decoding vs. Post-Hoc Validation

Two approaches to ensuring structured output:

**Constrained decoding (generation-time):**
Some model serving platforms support constraining the model's token generation to only produce valid output according to a grammar or schema. The model literally cannot produce invalid JSON because invalid tokens are masked during generation.

Advantages: Guaranteed valid output on the first try, no retries needed
Disadvantages: Not universally available, can slow generation, may produce technically valid but semantically wrong output

**Post-hoc validation (after generation):**
Let the model generate freely, then validate the output against the schema. If invalid, retry or reject.

Advantages: Works with any model, no special infrastructure needed, more flexible
Disadvantages: May require retries, adds validation processing time

**When to use which:**
- Constrained decoding when available and the output format is critical (e.g., API responses that downstream systems parse)
- Post-hoc validation when constrained decoding isn't available, or when you need to validate semantic content (not just format)
- Both together for maximum reliability

---
