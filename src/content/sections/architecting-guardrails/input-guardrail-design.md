---
title: "Input Guardrail Design"
slug: "input-guardrail-design"
module: "architecting-guardrails"
sectionOrder: 2
description: "Designing guardrails that validate, sanitize, and control what reaches the model."
---

## Section 3.2: Input Guardrail Design

Input guardrails are the first line of defense in any AI system. They sit between the user (or upstream system) and the model, inspecting every request before it consumes inference resources. A well-designed input guardrail pipeline blocks malicious, malformed, and out-of-scope requests cheaply — before they become expensive model calls that produce harmful output.

This section covers the full spectrum of input guardrail techniques, from simple validation to sophisticated injection detection, and shows how to compose them into an efficient pipeline.

![Input guardrail pipeline](/svg/input-pipeline.svg)

### The Input Guardrail Pipeline

The key architectural principle for input guardrails is **order by cost**. Cheap, fast checks run first. Expensive, high-latency checks run last. If a $0.0001 regex check blocks 50% of attacks, you have saved 50% of the cost of your $0.01 LLM-as-judge classifier.

```
┌──────────────────────────────────────────────────────────┐
│              Input Guardrail Pipeline                     │
│                                                          │
│  Raw User Input                                          │
│      │                                                   │
│      ▼                                                   │
│  ┌──────────────────┐                                    │
│  │  1. Rate Limiter  │ ──exceeded──▶ 429 Too Many Reqs   │
│  │     (< 1ms)       │                                   │
│  └────────┬─────────┘                                    │
│           │                                              │
│           ▼                                              │
│  ┌──────────────────┐                                    │
│  │  2. Auth / ACL    │ ──denied──▶ 403 Forbidden         │
│  │     (< 5ms)       │                                   │
│  └────────┬─────────┘                                    │
│           │                                              │
│           ▼                                              │
│  ┌──────────────────┐                                    │
│  │  3. Schema Check  │ ──invalid──▶ 400 Bad Request      │
│  │     (< 1ms)       │                                   │
│  └────────┬─────────┘                                    │
│           │                                              │
│           ▼                                              │
│  ┌──────────────────┐                                    │
│  │  4. Length Limits  │ ──too long──▶ 400 Payload Too     │
│  │     (< 1ms)       │              Large                │
│  └────────┬─────────┘                                    │
│           │                                              │
│           ▼                                              │
│  ┌──────────────────┐                                    │
│  │  5. Pattern Match │ ──match──▶ Blocked (known attack) │
│  │     (< 5ms)       │                                   │
│  └────────┬─────────┘                                    │
│           │                                              │
│           ▼                                              │
│  ┌──────────────────┐                                    │
│  │  6. Topic / Intent│ ──off-topic──▶ Polite Redirect    │
│  │     (10-50ms)     │                                   │
│  └────────┬─────────┘                                    │
│           │                                              │
│           ▼                                              │
│  ┌──────────────────┐                                    │
│  │  7. Injection     │ ──detected──▶ Blocked (injection) │
│  │    Classifier     │                                   │
│  │     (20-100ms)    │                                   │
│  └────────┬─────────┘                                    │
│           │                                              │
│           ▼                                              │
│  ┌──────────────────┐                                    │
│  │  8. LLM-as-Judge │ ──flagged──▶ Blocked / Escalated  │
│  │     (200-2000ms)  │                                   │
│  └────────┬─────────┘                                    │
│           │                                              │
│           ▼                                              │
│      Approved Input ──▶ Model Inference                  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

Each stage acts as a gate. If the request fails any stage, it is rejected with an appropriate response, and subsequent stages never run. This fail-fast design keeps average latency low for legitimate requests (which pass all checks) and cost low for malicious ones (which are caught early).

### Rate Limiting and Abuse Prevention

Rate limiting is the simplest and cheapest input guardrail, and it should always be the first check. It requires no understanding of content — just counting requests per identity per time window.

Effective rate limiting for AI systems goes beyond simple request counting:

- **Per-user rate limits** prevent individual abuse while allowing the system to serve other users normally.
- **Per-token rate limits** prevent users from submitting enormous prompts that consume disproportionate resources. A user sending 10 requests with 100,000 tokens each is very different from one sending 10 requests with 100 tokens each.
- **Sliding window counters** are more resilient than fixed windows to burst attacks at window boundaries.
- **Adaptive limits** can tighten when the system detects anomalous patterns — a sudden spike in requests from one user may indicate automated probing.

> **Why this matters for guardrails:** Rate limiting is not just a cost control — it is a security guardrail. Many prompt injection attacks require multiple attempts to probe the system's boundaries. Rate limiting increases the cost of these probing campaigns and gives monitoring systems time to detect them.

### Identity and Access Control

Before evaluating the content of a request, verify that the requester is authorized to make it. In multi-tenant systems, this is critical — a request that is perfectly safe for an admin may be dangerous from an unauthenticated user.

Identity-aware guardrail tuning means adjusting guardrail strictness based on who is making the request:

- **Unauthenticated users** get the strictest guardrails: limited topics, no access to sensitive tools, aggressive injection detection.
- **Authenticated users** get standard guardrails appropriate to their role.
- **Privileged users** (admins, developers) may get relaxed guardrails for legitimate use cases like testing and debugging.
- **Service accounts** (system-to-system calls) may bypass certain guardrails that are only relevant to human users, but should still be subject to rate limits and schema validation.

Multi-tenant isolation is a related concern. In systems that serve multiple organizations, guardrails must ensure that one tenant's data never leaks into another tenant's responses. This requires isolation at the retrieval layer (separate vector store namespaces), the system prompt layer (tenant-specific instructions), and the output layer (PII detection scoped to cross-tenant leakage).

### Input Schema Enforcement

For systems that accept structured inputs (API endpoints, function calls, form submissions), schema validation is a near-zero-cost guardrail that catches a surprising number of issues.

Schema enforcement includes:

- **Type checking** — ensuring fields have expected types (string, number, array)
- **Required field validation** — rejecting requests with missing mandatory fields
- **Value constraints** — enforcing ranges, enumerations, and patterns (e.g., email format)
- **Nested structure validation** — validating deeply structured inputs against a complete schema
- **Size limits** — capping array lengths, string sizes, and total payload size

Schema validation is deterministic and has zero false positives when the schema accurately reflects the system's contract. It is a "free" guardrail in the sense that you should be doing it anyway for API correctness — but it also has security value. Malformed inputs are a common vector for unexpected model behavior.

### Content Length Limits

Large language models have context windows, and the cost of inference scales with input length. Content length limits serve dual purposes:

1. **Cost control** — preventing users from submitting prompts that consume excessive resources
2. **Security** — many prompt injection techniques rely on large payloads that bury injection content deep in the input, hoping the model's attention mechanism will pick it up while human reviewers miss it

Effective length limits should be applied at multiple levels:

- **Total prompt length** — a hard ceiling on the complete input
- **Individual field length** — caps on specific input fields (user message, file attachment, etc.)
- **Token count** (not just character count) — because token-to-character ratios vary by language and content type

### Prompt Injection Detection

Prompt injection is the defining security challenge for LLM-based systems. It occurs when an attacker crafts input that causes the model to deviate from its system instructions — treating the attacker's injected text as instructions rather than data.

There are three main approaches to detecting prompt injection, each with different cost, accuracy, and latency characteristics:

#### Pattern-Based Detection

The simplest approach uses regular expressions, keyword lists, and string matching to identify known injection patterns. Examples:

- Strings like "ignore previous instructions," "you are now," "system prompt:"
- Encoded payloads (base64, URL encoding, Unicode tricks)
- Known jailbreak templates from public datasets

```python
INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?previous\s+instructions",
    r"you\s+are\s+now\s+",
    r"system\s*prompt\s*:",
    r"<\|im_start\|>system",
    r"\[INST\].*\[/INST\]",
    r"\\x[0-9a-f]{2}",  # hex-encoded characters
]

def check_patterns(text: str) -> tuple[bool, str | None]:
    normalized = text.lower().strip()
    for pattern in INJECTION_PATTERNS:
        if re.search(pattern, normalized):
            return True, pattern
    return False, None
```

Pattern-based detection is fast (microseconds), cheap (no model calls), and has zero false negatives on known patterns. But it is trivially evadable — an attacker who knows your patterns can rephrase around them. It should be your first detection layer, not your only one.

#### Classifier-Based Detection

A dedicated classification model (typically a fine-tuned transformer) scores the input for injection likelihood. These classifiers are trained on datasets of known injections and benign inputs, and they generalize better than pattern matching because they learn semantic features rather than exact strings.

Classifier characteristics:

- **Latency**: 10-100ms (depending on model size and hardware)
- **Cost**: Low (small models, can run on CPU)
- **Accuracy**: Good on distribution, weaker on novel attacks
- **False positive rate**: Typically 1-5% depending on threshold

The threshold is a critical design decision. A low threshold catches more attacks but blocks more legitimate requests. A high threshold misses more attacks but reduces friction. The right threshold depends on your application's risk tolerance.

#### LLM-as-Judge Detection

The most powerful (and most expensive) approach uses an LLM itself to evaluate whether the input contains an injection attempt. You present the input to a judge model with a prompt like "Does this input attempt to override system instructions? Analyze and explain."

LLM-as-judge characteristics:

- **Latency**: 200-2000ms (full LLM inference)
- **Cost**: High (model inference costs per request)
- **Accuracy**: Highest, especially on novel attacks
- **False positive rate**: Lowest (the judge can reason about context)

Because of the cost, LLM-as-judge is typically reserved for high-risk applications or used as a second-stage filter — only invoked when the classifier is uncertain (e.g., confidence between 0.4 and 0.7).

```python
async def detect_injection(user_input: str) -> InjectionResult:
    # Stage 1: Pattern matching (< 1ms, ~$0)
    is_match, pattern = check_patterns(user_input)
    if is_match:
        return InjectionResult(blocked=True, method="pattern", detail=pattern)

    # Stage 2: Classifier (10-50ms, ~$0.0001)
    score = await classifier.predict(user_input)
    if score > HIGH_CONFIDENCE_THRESHOLD:
        return InjectionResult(blocked=True, method="classifier", score=score)
    if score < LOW_CONFIDENCE_THRESHOLD:
        return InjectionResult(blocked=False, method="classifier", score=score)

    # Stage 3: LLM-as-judge for uncertain cases (500ms, ~$0.01)
    judgment = await llm_judge.evaluate(user_input)
    return InjectionResult(
        blocked=judgment.is_injection,
        method="llm_judge",
        reasoning=judgment.explanation,
    )
```

> **Why this matters for guardrails:** The three-stage detection pattern — pattern, classifier, judge — is a general template for balancing cost and accuracy. You will see this pattern again in output guardrails and retrieval guardrails. The key insight is that cheap filters reduce the volume that expensive filters must process.

### Topic and Intent Classification

Many AI systems are designed for specific domains — customer service for a SaaS product, medical information, legal document review. Topic classification guardrails reject or redirect requests that fall outside the system's intended scope.

This serves several purposes:

- **Safety** — the system was not designed or tested for off-topic queries, so its behavior is unpredictable
- **Liability** — responding to off-topic queries (especially in regulated domains) creates risk
- **Quality** — the system will produce better responses when it stays within its training and retrieval domain
- **Cost** — off-topic queries waste inference resources on low-value responses

Topic classification can range from simple keyword-based approaches to fine-tuned intent classifiers. For many applications, a small classifier model (or even a zero-shot classifier using embeddings) is sufficient.

The design of the rejection response matters. A blunt "I cannot help with that" frustrates users. A well-designed redirect explains the system's scope and suggests alternatives:

```
I'm designed to help with questions about our product's billing and account
management features. For technical support with product configuration,
please visit our help center at help.example.com or contact our support
team directly.
```

### Putting It All Together: Input Pipeline Design

The pseudocode below shows a complete input guardrail pipeline that chains all the techniques discussed in this section:

```python
async def input_guardrail_pipeline(
    request: Request,
    user: User,
    config: GuardrailConfig,
) -> GuardrailResult:

    # Layer 1: Rate limiting
    if not rate_limiter.allow(user.id, request.token_count):
        return GuardrailResult(
            action="block",
            reason="rate_limit_exceeded",
            status_code=429,
        )

    # Layer 2: Authentication and authorization
    if not authz.check(user, request.resource, request.action):
        return GuardrailResult(
            action="block",
            reason="unauthorized",
            status_code=403,
        )

    # Layer 3: Schema validation
    schema_errors = schema.validate(request.body)
    if schema_errors:
        return GuardrailResult(
            action="block",
            reason="schema_violation",
            detail=schema_errors,
            status_code=400,
        )

    # Layer 4: Content length limits
    if request.token_count > config.max_tokens:
        return GuardrailResult(
            action="block",
            reason="input_too_long",
            status_code=413,
        )

    # Layer 5: Prompt injection detection (staged)
    injection = await detect_injection(request.user_message)
    if injection.blocked:
        log_security_event("injection_blocked", request, injection)
        return GuardrailResult(
            action="block",
            reason="injection_detected",
            detail=injection.method,
        )

    # Layer 6: Topic classification
    topic = await topic_classifier.classify(request.user_message)
    if topic.category not in config.allowed_topics:
        return GuardrailResult(
            action="redirect",
            reason="off_topic",
            message=config.redirect_messages[topic.category],
        )

    # All checks passed
    return GuardrailResult(action="allow")
```

Notice the ordering: each layer is cheaper and faster than the next. The rate limiter costs nothing. Schema validation is a few microseconds. The injection classifier is tens of milliseconds. The topic classifier is similar. Only requests that pass all cheap checks reach the more expensive analysis stages.

### Handling Guardrail Bypass in Input Design

A critical mindset for input guardrail design is to assume that every input guardrail can be bypassed. This is not defeatism — it is engineering realism. Input guardrails operate on the user's stated input, but the actual harm happens in the model's output. An attacker who bypasses input detection has only won half the battle; output guardrails and system-level controls are still in play.

This means input guardrails should be designed to maximize coverage at acceptable cost, not to achieve perfection. Log what you detect. Monitor what you miss. Feed false negatives back into your detection models. And rely on defense in depth to catch what gets through.

Common bypass techniques to design against:

- **Payload splitting** — spreading the injection across multiple messages in a conversation
- **Encoding** — using base64, ROT13, Unicode homoglyphs, or other encodings to evade pattern matching
- **Language switching** — writing injections in languages your detectors were not trained on
- **Semantic rephrasing** — expressing the same instruction differently to evade classifiers
- **Indirect injection** — embedding the attack in data the model will retrieve, bypassing input guardrails entirely (addressed in Section 3.5)

Each of these techniques has countermeasures, but no countermeasure is perfect. The correct response is layered defense, continuous monitoring, and rapid iteration on detection models.

---
