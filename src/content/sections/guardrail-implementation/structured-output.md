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

```
Model generates output
    |
    v
[Validate against schema]
    |
    ├── Valid → Return success
    └── Invalid → Attempt 1: retry with error feedback
        |
        ├── Valid → Return success
        └── Invalid → Attempt 2: retry with stricter constraints
            |
            ├── Valid → Return success
            └── Invalid → Return graceful fallback response
```

**Building robust parsers:**

Models frequently return structured output with minor formatting issues. Robust parsers handle these gracefully:

- **JSON in markdown code blocks:** Models often wrap JSON in ` ```json ... ``` `. Strip markdown fences before parsing.
- **Mixed text and JSON:** Models may include explanatory text before or after the JSON. Extract JSON by finding the first `{` and last `}` (or `[` and `]` for arrays).
- **Trailing commas:** Some models add trailing commas in JSON arrays or objects. Strip them before parsing.
- **Unquoted keys or single quotes:** Use lenient JSON parsers that handle these common deviations.
- **Partial output:** If the model hits a token limit mid-output, decide whether to retry or attempt partial parsing of the available data.

The principle is: parse leniently, validate strictly. Accept format variations in the raw output, then validate the parsed result against your schema.

```
Common parsing fixes:

Input:  ```json\n{"key": "value"}\n```    → Strip markdown fences → {"key": "value"}
Input:  Some text {"key": "val"} more     → Extract JSON substring → {"key": "val"}
Input:  {"key": "value",}                 → Remove trailing comma → {"key": "value"}
Input:  {key: "value"}                    → Add missing quotes    → {"key": "value"}
```

### 3.2.5 Constrained Decoding vs. Post-Hoc Validation

Two approaches to ensuring structured output:

**Constrained decoding (generation-time):**
Some model serving platforms support constraining the model's token generation to only produce valid output according to a grammar or schema. The model literally cannot produce invalid JSON because invalid tokens are masked during generation.

**How constrained decoding works:**
At each step of the autoregressive generation loop (as you learned in the prerequisites), the model produces a probability distribution over the entire vocabulary. Normally, any token can be selected. With constrained decoding, a **grammar** or **schema mask** is applied before token selection — tokens that would violate the schema are set to zero probability, so the model can only choose tokens that keep the output valid.

```
Normal generation:
  Vocabulary: {  "  [  a  b  1  2  ...  }  ]  ,  :  ...
  All tokens are candidates at every step

Constrained generation (expecting JSON key after '{'):
  Vocabulary: {  "  [  a  b  1  2  ...  }  ]  ,  :  ...
                 ^
                 Only '"' is valid here (JSON keys must be strings)
                 All other tokens masked to probability 0
```

**Grammar-based generation** takes this further by defining a formal grammar (typically in BNF or a similar notation) that specifies the complete set of valid output sequences. The generation engine tracks the current position in the grammar and masks any token that would produce an invalid sequence. This can enforce not just JSON validity but domain-specific formats — for example, a grammar that only permits valid SQL SELECT statements, or a grammar that produces valid function call syntax with specific parameter types.

```
Example grammar (simplified BNF) for a product recommendation:
  output     ::= "{" fields "}"
  fields     ::= name "," price "," reason
  name       ::= '"product_name"' ":" '"' text '"'
  price      ::= '"price"' ":" number
  reason     ::= '"reason"' ":" '"' text '"'
  number     ::= digit+ ("." digit+)?
  text       ::= [^"]{1,200}
```

Advantages: Guaranteed valid output on the first try, no retries needed, eliminates format-related failures entirely
Disadvantages: Not universally available, can slow generation (grammar tracking adds overhead per token), may produce technically valid but semantically wrong output (valid JSON with nonsensical values), grammar authoring can be complex for rich schemas

**Post-hoc validation (after generation):**
Let the model generate freely, then validate the output against the schema. If invalid, retry or reject.

Advantages: Works with any model, no special infrastructure needed, more flexible, can validate semantic content (not just format)
Disadvantages: May require retries, adds validation processing time, cannot guarantee valid output within a fixed number of attempts

**API-level structured output:**
Some model providers offer structured output as an API feature — you pass a JSON schema with your request, and the API guarantees the response conforms to that schema. This is effectively constrained decoding provided as a service, abstracting away the grammar tracking. When available, this is often the simplest path to reliable structured output.

**When to use which:**

| Approach | Format Guarantee | Semantic Validation | Availability | Best For |
|---|---|---|---|---|
| Constrained decoding | Yes — enforced during generation | No — only format, not meaning | Requires compatible serving infrastructure | Critical format requirements, high-volume APIs |
| API structured output | Yes — provider-managed | No — only format, not meaning | Depends on model provider | Standard JSON schemas with supported providers |
| Post-hoc validation | No — may need retries | Yes — can check meaning and format | Works everywhere | Semantic validation, complex business rules |
| Both combined | Yes | Yes | Requires compatible infrastructure | Maximum reliability for high-stakes applications |

---
