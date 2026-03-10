---
title: "Output Guardrail Design"
slug: "output-guardrail-design"
module: "guardrail-architecture"
sectionOrder: 3
description: "Section 3 of the guardrail architecture module."
---

Output guardrails are your last line of defense before content reaches the user. They evaluate what the model actually generated.

### 2.3.1 Content Filtering

Content filtering classifies model output for harmful content:

**Toxicity classification:**
- Detect hate speech, harassment, threats, self-harm content
- Commercial classifiers and open-source models are available
- Thresholds should be tuned to the application context — a creative writing tool has different thresholds than a children's app

**Category-specific filtering:**
- Sexual content detection
- Violence and gore detection
- Misinformation detection (harder — requires factual knowledge)
- Bias and stereotype detection

**Multi-dimensional scoring:**
Rather than a single "safe/unsafe" binary, score output across multiple dimensions:

| Dimension | Score | Threshold | Action |
|-----------|-------|-----------|--------|
| Toxicity | 0.12 | 0.50 | Allow |
| Sexual content | 0.03 | 0.30 | Allow |
| Violence | 0.67 | 0.40 | Block |
| PII present | 0.91 | 0.60 | Redact |

This allows nuanced decisions — content might be acceptable on one dimension but not another.

```
Model generates response
    |
    v
[Score across dimensions: toxicity, sexual, violence, PII, bias]
    |
    ├── Any score exceeds hard threshold? → BLOCK response
    ├── Multiple flags, none critical? → REDACT flagged content
    └── All scores below threshold → ALLOW response
```

### 2.3.2 PII Detection and Redaction

Detecting and handling personally identifiable information in model output:

**Detection approaches:**
- Regex patterns for structured PII (SSNs, phone numbers, email addresses, credit card numbers)
- Named Entity Recognition (NER) models for unstructured PII (names, addresses, organizations)
- Purpose-built PII detection services
- Combination approaches (regex for structured, NER for unstructured)

**Handling strategies:**

| Strategy | Description | When to Use |
|----------|-------------|-------------|
| Redaction | Replace PII with placeholder text ("[REDACTED]") | When PII should never appear in output |
| Masking | Partially obscure PII ("John D***") | When some information is needed for context |
| Tokenization | Replace PII with a reversible token | When PII needs to be recoverable by authorized parties |
| Blocking | Reject the entire response | When any PII presence indicates a serious failure |

### 2.3.3 Factuality and Groundedness Checking

For RAG systems and any system that should provide factual information:

**Groundedness checking** verifies that the model's claims are supported by the retrieved source documents:

1. Extract claims from the model's response
2. For each claim, search the retrieved documents for supporting evidence
3. Flag claims that have no supporting evidence
4. Score the overall response's groundedness (percentage of claims supported)

**Implementation approaches:**
- **NLI (Natural Language Inference) models** — Given a premise (source document) and hypothesis (model claim), classify as entailment, contradiction, or neutral
- **LLM-as-judge** — Ask a separate LLM: "Is this claim supported by the following source text?"
- **Embedding similarity** — Check if the claim's embedding is close to any source content embedding

**Design decisions:**
- What groundedness threshold is required? (e.g., all claims must be supported vs. 80% of claims)
- What happens to ungrounded claims? (Block the whole response? Redact ungrounded claims? Add a disclaimer?)
- How do you handle legitimate general knowledge that won't be in the sources?

```
Retrieved sources + Model response
    |
    v
Extract individual claims from response
    |
    v
For each claim:
    ├── Found in source documents? → Supported ✓
    ├── Contradicts source? → Contradiction ✗
    └── Not mentioned in sources? → Unsupported ?
    |
    v
Groundedness score = Supported / Total claims
    |
    ├── Score > 80% → Accept response
    ├── Score 50-80% → Flag for review or add caveat
    └── Score < 50% → Reject, regenerate with sources
```

### 2.3.4 Structured Output Enforcement

When the model is expected to produce structured output (JSON, function calls, specific formats):

- **Schema validation** — Validate the output against a JSON schema or format specification
- **Type checking** — Verify that fields have the correct data types
- **Range validation** — Check that numeric values are within expected ranges
- **Enum enforcement** — Verify that categorical values are from the allowed set
- **Required field validation** — Ensure all required fields are present

This is covered in more depth in Module 3 (Implementation).

### 2.3.5 Citation and Attribution Enforcement

For systems that should cite their sources:

- **Citation presence** — Verify that citations/references are included in the response
- **Citation validity** — Check that cited sources actually exist in the knowledge base
- **Citation accuracy** — Verify that the cited source actually supports the claim being made
- **Citation format** — Ensure citations follow the required format

### 2.3.6 Confidence Scoring and Uncertainty Communication

AI systems should communicate how certain they are about their responses, especially in high-stakes applications:

**Generating confidence signals:**
- **Retrieval-based confidence:** How well did retrieved documents match the query? High similarity scores suggest the model has good source material; low scores suggest it may be guessing.
- **Model-based confidence:** Some models expose token-level log probabilities. Low average log probability across the response suggests uncertainty.
- **Consistency-based confidence:** Generate multiple responses to the same query. If they agree, confidence is higher. If they diverge, confidence is lower.
- **Coverage-based confidence:** What percentage of the user's question is addressed by retrieved sources? Partial coverage suggests partial confidence.

**Communicating uncertainty to users:**
- **Explicit hedging:** "Based on the available information, it appears that..." vs. "The answer is..."
- **Confidence indicators:** Visual cues (confidence bars, labels like "High confidence" / "Low confidence")
- **Source transparency:** "This answer is based on 3 matching documents" vs. "I couldn't find specific documentation on this"
- **Actionable uncertainty:** "I'm not confident in this answer. You may want to verify with [authoritative source]."

**As a guardrail trigger:**
- Below a confidence threshold → Route to human review
- Below a lower threshold → Refuse to answer rather than risk a wrong answer
- Different thresholds for different topics (lower tolerance for medical/legal/financial)

### 2.3.7 Response Length and Format Constraints

Constraining the length and format of AI responses is a guardrail:

**Response length limits:**
- Set maximum response lengths appropriate to the use case (a FAQ bot should give concise answers, not essays)
- Truncate or summarize responses that exceed length limits
- Very long responses may contain content that drifts off-topic or includes hallucinated material — length limits reduce this risk

**Format enforcement:**
- Require responses in a specific format (bullet points, numbered steps, structured sections)
- Reject or regenerate responses that don't follow the required format
- Format constraints reduce the model's ability to go on tangents or include unexpected content

**Implementation:**
- System prompt instructions ("Respond in 3 sentences or fewer")
- Post-processing truncation with intelligent summarization
- Token count limits on the model API call (max_tokens parameter)
- Output validators that check format compliance

### 2.3.8 Refusal Design

When a guardrail blocks a response, the user needs to see something. Refusal design matters:

**Good refusal messages are:**
- Clear about what can't be done
- Helpful — suggest alternatives or next steps
- Consistent — similar requests get similar refusal messages
- Safe — don't reveal guardrail implementation details
- Respectful — don't lecture or condescend

**Refusal message template:**
```
I'm not able to [specific thing requested]. [Brief reason if appropriate].
[Alternative suggestion or redirect].
```

**Example:**
> "I'm not able to provide specific tax advice for your situation. For personalized tax guidance, I'd recommend consulting a tax professional or CPA. I can help you understand general tax concepts or find a tax professional near you."

**Anti-patterns:**
- "I can't do that." (No explanation, no alternative)
- "Your request was blocked by safety filter SF-2291 with confidence 0.87." (Exposes internals)
- "I must refuse this request as it violates policy 4.3.1 section B paragraph 2." (References internal policy)
- "I would never help with something like that!" (Judgmental tone, may not even be what the user intended)

---
