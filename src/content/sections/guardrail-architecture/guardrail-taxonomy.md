---
title: "Guardrail Taxonomy"
slug: "guardrail-taxonomy"
module: "guardrail-architecture"
moduleOrder: 2
sectionOrder: 1
description: "Section 1 of the guardrail architecture module."
---

Before designing guardrails, you need a shared vocabulary for categorizing them. Every guardrail falls into one or more of these categories.

### 2.1.1 Input Guardrails

Input guardrails are controls applied **before** the user's request reaches the AI model. They operate on the raw input — the user's message, uploaded files, or API parameters.

**Purpose:** Prevent harmful, malicious, or out-of-scope requests from ever reaching the model.

**Examples:**
- Prompt injection detection
- Topic classification (rejecting off-topic requests)
- Input schema validation (enforcing structure)
- Content length limits
- Rate limiting
- PII detection in user input (redacting before sending to model)

**Tradeoffs:**

| Advantage | Disadvantage |
|-----------|-------------|
| Prevents harmful requests from consuming model resources | Cannot catch problems that only appear in the output |
| Fast — runs before the expensive model inference | May create false positives on legitimate requests |
| Reduces attack surface for the model | User experience impact when legitimate requests are blocked |
| Can be implemented with lightweight classifiers | Cannot evaluate the model's actual response |

### 2.1.2 Output Guardrails

Output guardrails are controls applied **after** the AI model generates a response, before that response reaches the user.

**Purpose:** Catch harmful, incorrect, or policy-violating content in the model's response.

**Examples:**
- Toxicity and content classifiers
- PII detection and redaction in responses
- Groundedness checking (verifying claims against sources)
- Structured output validation (JSON schema, format checks)
- Citation verification
- Refusal enforcement (detecting when the model should have refused but didn't)

**Tradeoffs:**

| Advantage | Disadvantage |
|-----------|-------------|
| Catches problems the model actually generated | Runs after inference — adds latency to total response time |
| Can evaluate the response in context of the request | Model resources are consumed even for blocked responses |
| Can verify factual accuracy against sources | More complex to implement (must understand response content) |
| Catches issues that input guardrails cannot predict | May require additional model calls (LLM-as-judge), adding cost |

### 2.1.3 System-Level Guardrails

System-level guardrails are architectural controls that shape the overall behavior of the AI system rather than filtering individual requests or responses.

**Purpose:** Establish the operating boundaries and behavioral framework for the entire system.

**Examples:**
- System prompt instructions
- Conversation memory management
- Fallback and circuit breaker patterns
- Model selection and routing
- Timeout and resource limits
- Multi-model validation architectures

**Tradeoffs:**

| Advantage | Disadvantage |
|-----------|-------------|
| Set the behavioral foundation for everything else | Often "soft" controls (system prompts can be overridden) |
| Low per-request overhead | Harder to test — behavior is emergent, not deterministic |
| Apply to all requests automatically | May be bypassed if the model ignores instructions |
| Can implement complex behavioral policies | Require careful engineering to be effective |

### 2.1.4 Retrieval Guardrails

Retrieval guardrails are controls specific to RAG pipelines — they govern what content is retrieved and how it is used.

**Purpose:** Ensure the AI only accesses and uses authorized, relevant, and safe content.

**Examples:**
- Access control on document retrieval
- Relevance score thresholds
- Indirect injection scanning on retrieved documents
- Source attribution enforcement
- Staleness checks on retrieved content

### 2.1.5 Agentic Guardrails

Agentic guardrails control what actions an AI agent can take and under what conditions.

**Purpose:** Prevent agents from taking unauthorized, dangerous, or unintended actions.

**Examples:**
- Tool access policies
- Action approval workflows
- Scope and budget limits
- Sandboxing for code execution
- Rollback capabilities

### 2.1.6 Human-in-the-Loop Guardrails

Human-in-the-loop guardrails route decisions to a human when the AI system cannot or should not decide on its own.

**Purpose:** Ensure human oversight for high-stakes or ambiguous situations.

**When to escalate to a human:**
- The AI's confidence is below a threshold
- The request involves a high-stakes decision (financial, medical, legal)
- The guardrail system detects a potential attack but isn't certain
- The request falls in a gray area not covered by policy
- A user appeals a guardrail decision

**Design considerations:**
- Escalation must not create a bottleneck that blocks all users
- The human must have enough context to make a good decision (show them the request, the guardrail's assessment, and relevant policy)
- There must be a fallback for when no human is available
- Track escalation volumes — if they are too high, the guardrail may need tuning

### 2.1.7 Choosing and Combining Guardrail Types

Most production AI systems use guardrails from multiple categories. A general layering principle:

```
User Request
    |
    v
[Input Guardrails] -- Block/allow/modify the request
    |
    v
[System-Level Guardrails] -- System prompt, model routing, memory management
    |
    v
[Retrieval Guardrails] -- (if RAG) Access control, relevance, injection scanning
    |
    v
[AI Model Inference]
    |
    v
[Output Guardrails] -- Content filtering, PII detection, groundedness
    |
    v
[Agentic Guardrails] -- (if agentic) Tool policies, approval, scope limits
    |
    v
[Human-in-the-Loop] -- (if needed) Escalation for uncertain or high-stakes cases
    |
    v
User Response
```

**Key design principle: defense in depth.** No single guardrail type is sufficient. Input guardrails miss attacks that produce harmful output from benign input. Output guardrails can't prevent the model from seeing injected content. System-level guardrails are soft controls. You need layers.

---
