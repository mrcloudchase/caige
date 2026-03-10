---
title: "Output Guardrail Design"
slug: "output-guardrail-design"
module: "architecting-guardrails"
sectionOrder: 3
description: "Designing guardrails that inspect, validate, and control what the model delivers to users."
---

## Section 3.3: Output Guardrail Design

Output guardrails are the last automated checkpoint between the model's response and the user. While input guardrails try to prevent bad requests from reaching the model, output guardrails deal with a harder and more important problem: inspecting what the model actually generated and deciding whether it is safe to deliver.

This distinction matters. Input guardrails operate on intent — they try to infer from the user's text whether something harmful is being attempted. Output guardrails operate on reality — they inspect the concrete text the model produced. A prompt injection that evades every input filter will still be caught by an output guardrail that detects PII in the response, or that verifies the response is grounded in source documents.

Output guardrails are also the only defense against threats that originate from the model itself rather than the user: hallucination, training data leakage, bias, and overly confident claims on topics the model was not designed to address.

### Content Safety Filtering

The most fundamental output guardrail is content safety classification — scoring the model's response for toxicity, hate speech, sexual content, violence, and other categories of harmful output.

Content safety classifiers come in several varieties:

- **Multi-label classifiers** score the output across multiple harm categories simultaneously (e.g., Perspective API, OpenAI Moderation, custom fine-tuned models). These return a score per category, and you set thresholds for each.
- **Binary classifiers** make a single safe/unsafe determination. Simpler to implement but less granular — you lose the ability to set different thresholds for different harm categories.
- **LLM-based evaluators** use a language model to assess content safety with reasoning. Most flexible and accurate, but most expensive.

A critical design decision is **what to do when the classifier is uncertain**. Consider a toxicity score of 0.45 on a 0-1 scale, with your blocking threshold set at 0.5. This response is not clearly toxic — but it is not clearly safe either. Options include:

- **Block conservatively** — treat uncertain as unsafe (lower threshold). Reduces risk but increases false positives.
- **Pass with logging** — deliver the response but flag it for human review. Reduces user friction but accepts risk.
- **Regenerate** — ask the model to generate a new response, possibly with a modified prompt emphasizing safety. Adds latency and cost but may produce a better outcome.
- **Escalate** — route to a human reviewer for real-time decision. Highest quality but highest latency.

> **Why this matters for guardrails:** The threshold decision is not a technical question — it is a product and risk decision. Different applications need different thresholds for the same harm category. A children's education app should be far more conservative than an adult creative writing tool. Guardrail architects must work with product and legal teams to set these thresholds.

### PII Detection and Redaction

Large language models can leak personally identifiable information (PII) in their outputs — either from their training data, from context provided in the prompt, or from retrieved documents. PII detection and redaction is a critical output guardrail for any system that handles personal data.

![PII handling pipeline](/svg/pii-handling-pipeline.svg)

PII detection operates at multiple levels:

- **Pattern-based detection** — regex patterns for structured PII like Social Security numbers, credit card numbers, phone numbers, email addresses. Fast and highly precise for known formats.
- **NER-based detection** — Named Entity Recognition models that identify names, addresses, organizations, and other entities. Better at unstructured PII but lower precision.
- **Context-aware detection** — LLM-based systems that understand when information constitutes PII in context. "John Smith" is PII when it refers to a specific user; it is not PII when it appears in a fictional example.

Redaction strategies vary by use case:

| Strategy | Example | When to Use |
|----------|---------|-------------|
| **Full redaction** | `[REDACTED]` | Maximum safety, context loss acceptable |
| **Type-preserving** | `[EMAIL]`, `[SSN]`, `[NAME]` | Preserves response structure while removing PII |
| **Partial masking** | `j***@example.com`, `***-**-1234` | Allows user to verify it is their own data |
| **Synthetic replacement** | Replace "John Smith" with "Jane Doe" | Preserves readability for testing/demos |
| **Tokenized replacement** | Replace with a reversible token for authorized retrieval | Supports audit workflows |

A key architectural decision is where PII redaction sits relative to other output guardrails. If you run PII redaction before groundedness checking, the groundedness checker may flag the redacted response as unsupported. If you run it after, you risk logging unredacted PII in groundedness check results. The typical recommendation is to run PII detection early (for logging and alerting) but apply redaction as the final step before delivery.

### Factuality and Groundedness Checking

Hallucination — the model generating plausible but false information — is among the most common and dangerous failure modes of LLM-based systems. Groundedness checking is the output guardrail that addresses it.

Groundedness checking verifies that the model's claims are supported by the context it was given. This is most relevant in RAG systems, where the model should base its response on retrieved documents rather than its training data.

There are three main approaches:

**1. NLI-based checking.** Use a Natural Language Inference (NLI) model to classify each claim in the response as "supported," "contradicted," or "neutral" relative to the source documents. This is relatively fast (tens of milliseconds per claim) and works well for factual assertions.

**2. LLM-as-judge checking.** Present the source documents and the response to a judge LLM and ask it to identify unsupported claims. More flexible than NLI (can handle nuance, hedging, partial support) but more expensive.

**3. Claim extraction + verification.** First extract individual claims from the response, then verify each claim against the sources. Most thorough but most expensive, as it requires multiple model calls.

```python
async def check_groundedness(
    response: str,
    sources: list[Document],
) -> GroundednessResult:
    claims = extract_claims(response)
    results = []
    for claim in claims:
        support_score = await nli_model.check_entailment(
            premise="\n".join(s.text for s in sources),
            hypothesis=claim.text,
        )
        results.append(ClaimResult(
            claim=claim,
            supported=support_score > GROUNDEDNESS_THRESHOLD,
            score=support_score,
        ))

    unsupported = [r for r in results if not r.supported]
    return GroundednessResult(
        grounded=len(unsupported) == 0,
        unsupported_claims=unsupported,
        overall_score=sum(r.score for r in results) / len(results),
    )
```

When the response is not fully grounded, your options depend on the application:

- **Block and regenerate** with a prompt that explicitly instructs the model to only use provided sources
- **Add disclaimers** to the response indicating which claims are not supported
- **Remove unsupported claims** and deliver a shorter but more reliable response
- **Escalate** to human review for high-stakes domains

> **Why this matters for guardrails:** Groundedness checking is the primary defense against hallucination. In domains where factual accuracy is critical (medical, legal, financial), it is a non-negotiable output guardrail. In lower-stakes domains, it may be applied as a scoring signal rather than a hard block.

### Structured Output Enforcement

When the model is expected to produce structured output — JSON, SQL, XML, function calls — schema validation is a powerful and deterministic output guardrail.

Structured output enforcement works at two levels:

**Syntactic validation** ensures the output is well-formed. Can it be parsed as valid JSON? Does the SQL query parse without syntax errors? This catches garbled output, truncated responses, and format confusion.

**Semantic validation** ensures the output conforms to a specific schema. Does the JSON have the required fields? Are values within expected ranges? Does the SQL query only reference tables the user is authorized to access?

```python
def validate_structured_output(
    output: str,
    schema: JSONSchema,
) -> ValidationResult:
    # Syntactic check
    try:
        parsed = json.loads(output)
    except json.JSONDecodeError as e:
        return ValidationResult(valid=False, error=f"Invalid JSON: {e}")

    # Semantic check
    errors = schema.validate(parsed)
    if errors:
        return ValidationResult(valid=False, errors=errors)

    # Business rule check
    rule_violations = check_business_rules(parsed)
    if rule_violations:
        return ValidationResult(valid=False, errors=rule_violations)

    return ValidationResult(valid=True, parsed=parsed)
```

For SQL output, schema validation is especially important as a security guardrail. A model generating SQL should be constrained to SELECT queries (if the use case is read-only), specific tables, and parameterized values to prevent SQL injection in the model's output.

### Citation Enforcement in RAG Systems

In RAG systems, requiring the model to cite its sources serves both as a quality signal and as a guardrail. Citations make groundedness checking easier (you can verify each cited claim against its source), and they make hallucination visible to the user (a claim without a citation is suspect).

Citation enforcement involves:

- **Requiring citations** — instructing the model to cite sources for factual claims (via system prompt)
- **Validating citations** — checking that cited document IDs exist in the retrieved context
- **Verifying support** — checking that the cited document actually supports the claim (this is groundedness checking scoped to cited sources)
- **Detecting uncited claims** — identifying factual assertions that lack citations

The enforcement can be hard (block responses with uncited claims) or soft (add visual indicators showing which claims are cited vs. uncited, letting the user assess reliability).

### Confidence Scoring and Response Routing

Not all model responses are equally reliable. Confidence scoring estimates how reliable a particular response is and routes it accordingly.

Sources of confidence signals include:

- **Model log probabilities** — lower token-level probabilities suggest less certain generation
- **Consistency checking** — generating multiple responses and measuring agreement. High agreement suggests reliability; disagreement suggests uncertainty.
- **Retrieval relevance scores** — in RAG systems, low relevance scores for retrieved documents suggest the model is working with poor context.
- **Guardrail classifier scores** — borderline scores from content safety or groundedness classifiers indicate uncertain quality.

A confidence-based routing architecture might look like:

| Confidence Level | Action |
|-----------------|--------|
| High (> 0.9) | Deliver response directly |
| Medium (0.6-0.9) | Deliver with disclaimer or reduced formatting |
| Low (0.3-0.6) | Route to human review or generate alternative response |
| Very Low (< 0.3) | Refuse to answer, suggest alternative resources |

### Refusal Design

When an output guardrail blocks a response, the system must deliver a refusal — a message explaining that the request cannot be fulfilled. Refusal design is an underappreciated aspect of guardrail architecture that significantly impacts user experience and system perception.

| Refusal Strategy | Example | Pros | Cons |
|-----------------|---------|------|------|
| **Generic refusal** | "I can't help with that." | Simple, no information leakage | Frustrating, no guidance |
| **Category-specific** | "I can't provide medical advice." | Informative, sets expectations | Reveals detection category |
| **Redirect** | "I can't do that, but I can help with X." | Good UX, retains engagement | Complex to implement well |
| **Explanation** | "That request was flagged because..." | Transparent, builds trust | May help attackers probe |
| **Silent fallback** | Response is replaced with a topic-appropriate alternative | Seamless UX | May confuse user, hides guardrail action |

The right refusal strategy depends on the application and the threat model:

- **Customer-facing applications** benefit from category-specific or redirect refusals that maintain a helpful tone.
- **Security-sensitive applications** should avoid explanations that reveal detection mechanisms to potential attackers.
- **Regulated applications** may be required to explain why a request was refused (transparency regulations).

Regardless of strategy, refusals should be:

- **Consistent** — similar blocked requests should produce similar refusals
- **Non-informative to attackers** — avoid revealing what specific guardrail triggered or what threshold was crossed
- **Helpful to legitimate users** — provide enough context for users to understand what happened and what to do instead
- **Logged** — every refusal should be recorded for monitoring and analysis

### Output Guardrail Pipeline Design

Bringing these components together, a complete output guardrail pipeline processes the model's response through multiple stages:

```python
async def output_guardrail_pipeline(
    response: str,
    sources: list[Document] | None,
    request_context: RequestContext,
    config: GuardrailConfig,
) -> GuardrailResult:

    # Stage 1: Content safety classification
    safety_scores = await content_safety.classify(response)
    for category, score in safety_scores.items():
        if score > config.thresholds[category]:
            return GuardrailResult(
                action="block",
                reason=f"content_safety_{category}",
                refusal=config.refusal_messages[category],
            )

    # Stage 2: PII detection
    pii_findings = await pii_detector.scan(response)
    if pii_findings:
        response = pii_redactor.redact(response, pii_findings)
        log_pii_event(pii_findings, request_context)

    # Stage 3: Groundedness check (RAG only)
    if sources:
        groundedness = await check_groundedness(response, sources)
        if not groundedness.grounded:
            if config.strict_groundedness:
                return GuardrailResult(
                    action="block",
                    reason="ungrounded_claims",
                    detail=groundedness.unsupported_claims,
                )
            response = add_disclaimers(response, groundedness)

    # Stage 4: Structured output validation (if applicable)
    if request_context.expected_format:
        validation = validate_structured_output(
            response, request_context.expected_format
        )
        if not validation.valid:
            return GuardrailResult(
                action="retry",
                reason="invalid_structure",
                detail=validation.errors,
            )

    # Stage 5: Confidence scoring and routing
    confidence = compute_confidence(response, sources, safety_scores)
    if confidence < config.human_review_threshold:
        return GuardrailResult(
            action="escalate",
            reason="low_confidence",
            confidence=confidence,
        )

    return GuardrailResult(action="allow", response=response)
```

Note that unlike input guardrails (which are strictly ordered by cost), output guardrails may need to run in a specific order for correctness. Content safety should run before PII redaction (so the safety classifier sees the full text). PII redaction should run before the response is delivered. Groundedness checking needs the original sources. Design the pipeline carefully.

### Response Constraints and Formatting

Beyond blocking harmful content, output guardrails can enforce positive constraints on response quality:

- **Length limits** — preventing excessively long or short responses
- **Tone enforcement** — ensuring responses match the expected register (formal, casual, technical)
- **Language constraints** — ensuring responses are in the requested language
- **Format compliance** — ensuring responses follow expected structure (headers, bullet points, numbered steps)
- **Disclaimer insertion** — automatically appending required disclaimers for regulated domains

These "soft" guardrails improve quality and consistency without blocking responses. They can be implemented as post-processing steps that modify the response rather than making block/allow decisions.

---
