---
title: "Exam Blueprint"
slug: exam-blueprint
order: 2
description: "Exam structure, question types, detailed objectives, and scoring methodology."
---

# cAIge Exam Blueprint

## Certified AI Guardrail Engineer (cAIge) Examination

**Version:** 1.0
**Maintained by:** caige.org

---

## Exam Overview

| Parameter | Detail |
|-----------|--------|
| Exam name | Certified AI Guardrail Engineer (cAIge) |
| Format | Multiple choice, multiple select, and scenario-based questions |
| Number of questions | 75 scored + 5 unscored (pilot questions) |
| Time limit | 120 minutes |
| Passing score | 70% (53 of 75 scored questions) |
| Delivery | Online proctored |
| Prerequisites | None required to sit for the exam; completion of the cAIge training program is strongly recommended |
| Languages | English (additional languages planned) |

---

## Question Distribution by Domain

| Domain | Weight | Scored Questions | Approx. Count |
|--------|--------|-----------------|----------------|
| 1. AI Foundations | 15% | 11 | 11-12 |
| 2. Understanding Failure Modes | 15% | 11 | 11-12 |
| 3. Architecting Guardrails | 25% | 19 | 18-20 |
| 4. Implementing Guardrails | 25% | 19 | 18-20 |
| 5. Validating Guardrails | 20% | 15 | 14-16 |
| **Total** | **100%** | **75** | |

5 additional unscored pilot questions are distributed randomly throughout the exam. Candidates cannot distinguish pilot questions from scored questions.

---

## Question Types

### Type 1: Multiple Choice (Single Answer)
Standard four-option questions with one correct answer. Tests factual knowledge and conceptual understanding.

**Example:**
> A user sends a prompt containing encoded Base64 text that, when decoded, contains instructions to ignore the system prompt. What type of attack is this?
>
> A. Social engineering attack
> B. Direct prompt injection attack
> C. Indirect prompt injection attack
> D. Model inversion attack
>
> **Correct: B** — This is a direct prompt injection attack using encoding to obfuscate the malicious instruction. It is "direct" because the user is intentionally crafting the input, not relying on injected content from an external source.

Approximately **40%** of exam questions.

### Type 2: Multiple Select (Choose All That Apply)
Questions with 5-6 options where 2-3 are correct. Tests breadth of knowledge. Questions clearly state how many answers to select.

**Example:**
> A RAG-based AI assistant retrieves documents from a shared knowledge base. Which THREE of the following are guardrail concerns specific to this architecture? (Choose 3)
>
> A. Indirect prompt injection via retrieved documents
> B. Model hallucination due to high temperature settings
> C. Retrieval of documents the user is not authorized to access
> D. Staleness of retrieved information leading to outdated answers
> E. Excessive GPU memory consumption during inference
>
> **Correct: A, C, D** — These are RAG-specific concerns. B and E are general AI concerns not specific to RAG architecture.

Approximately **25%** of exam questions.

### Type 3: Scenario-Based Questions
Multi-paragraph scenarios describing a real-world situation, followed by a question about the best course of action, root cause analysis, or architecture recommendation. Tests applied knowledge and judgment.

**Example:**
> **Scenario:** A fintech company has deployed an AI-powered customer support chatbot that helps users with account inquiries. The system uses RAG to retrieve relevant help articles and account-specific information. After launch, the security team discovers that some users are receiving responses that contain fragments of other users' account details. The guardrail system includes output PII filtering, but it was configured to detect and redact PII patterns in free text (SSNs, emails, phone numbers) rather than validate data authorization.
>
> What is the MOST important guardrail gap to address first?
>
> A. Improve the PII regex patterns to catch more formats
> B. Add output toxicity filtering to prevent harmful responses
> C. Implement retrieval-level access controls so the AI only retrieves data the current user is authorized to see
> D. Add rate limiting to prevent users from extracting data through repeated queries
>
> **Correct: C** — The root cause is that the retrieval system is pulling unauthorized data. PII filtering (A) is treating symptoms, not the cause. The AI should never see data it shouldn't return. Access controls at the retrieval layer are the fundamental fix.

Approximately **35%** of exam questions.

---

## Detailed Exam Objectives by Domain

### Domain 1: AI Foundations (15%)

**1.1 — Explain how neural networks and LLMs work at a level sufficient to reason about guardrail requirements**
- Describe how neural networks learn through the training loop and why knowledge is distributed across weights
- Explain the transformer architecture, self-attention, and why it replaced sequential models
- Articulate why LLMs are pattern-matching systems producing statistical predictions, not reasoning engines
- Relate model scale to emergent capabilities and risk factors

**1.2 — Trace the complete LLM inference pipeline and identify guardrail interception points**
- Trace data from raw text through tokenization, embedding, attention, and output generation
- Explain how the attention mechanism processes all tokens without distinguishing trusted from untrusted input
- Describe how temperature and sampling parameters affect output variability and non-determinism
- Identify where in the inference pipeline guardrails can intercept or validate data

**1.3 — Describe the LLM training pipeline and explain why training alone cannot eliminate risks**
- Distinguish each stage of training (pre-training, instruction tuning, RLHF/DPO) and what each creates
- Explain why instruction-following and safety behaviors are learned statistical preferences, not hard-coded rules
- Identify which aspects of model behavior are controlled by the provider vs. the application developer
- Articulate why training alone cannot eliminate hallucination, prompt injection, or jailbreaking

**1.4 — Identify production AI system architecture patterns and map guardrail placement points**
- Map the components of production AI applications (API gateways, orchestration, model routing)
- Describe common patterns (simple chat, RAG, agentic, multi-model) and their data flows
- Identify all guardrail placement points (pre-model, post-model, system-level, retrieval-level)
- Distinguish between model provider safety controls and application-level guardrails

---

### Domain 2: Understanding Failure Modes (15%)

**2.1 — Map architectural properties of LLMs to the specific risks they create**
- Connect attention mechanisms to prompt injection, distributed weights to data leakage, probabilistic generation to hallucination, and learned boundaries to jailbreaking
- Identify trust boundaries in AI pipelines and explain why guardrails must exist at each
- Explain how RAG and agentic patterns expand the attack surface
- Articulate the defense-in-depth principle and why no single layer of defense is sufficient

**2.2 — Classify common AI failure modes and map them to guardrail strategies**
- Identify hallucination, prompt injection, jailbreaking, data leakage, toxic output, off-topic drift, over-reliance, cascading failures, and identity/access failures from examples
- Explain why each failure mode occurs at a technical level
- Categorize failure modes by severity and likelihood for a given use case
- Recommend appropriate guardrail strategies for each failure mode

**2.3 — Conduct threat modeling for AI applications**
- Apply AI-specific threat modeling frameworks (including OWASP Top 10 for LLM Applications)
- Identify adversary profiles, motivations, and capabilities
- Map attack surfaces unique to AI (prompts, training data, retrieval corpora, tool integrations, MCP)
- Assess supply chain risks (third-party models, poisoned datasets, untrusted tool servers)
- Prioritize threats by likelihood and impact

---

### Domain 3: Architecting Guardrails (25%)

**3.1 — Design multi-layered guardrail strategies using the guardrail taxonomy**
- Classify guardrails by type (input, output, system-level, retrieval, agentic, human-in-the-loop)
- Explain the tradeoffs between each type (latency, cost, coverage, false positive rate)
- Design strategies that combine multiple guardrail types for defense in depth
- Justify design decisions based on risk assessment

**3.2 — Design input guardrail pipelines**
- Select and sequence input validation techniques (sanitization, schema enforcement, injection detection)
- Choose injection detection approaches (pattern-based, classifier-based, LLM-as-judge) based on risk tolerance
- Design identity-aware guardrail systems with multi-tenant isolation
- Layer cheap checks before expensive checks

**3.3 — Design output guardrail pipelines**
- Select content filtering approaches (toxicity, bias, appropriateness classifiers)
- Design PII detection and redaction strategies
- Implement groundedness and factuality checks for RAG systems
- Design refusal responses that are helpful but do not reveal system internals

**3.4 — Design system-level guardrails**
- Write effective safety-oriented system prompts
- Design fallback and circuit breaker patterns for graceful degradation
- Architect multi-model validation systems (using one model to check another)
- Plan conversation memory management, timeouts, and resource limits

**3.5 — Design guardrails specific to RAG systems**
- Implement retrieval-level access controls respecting user permissions
- Defend against indirect prompt injection via retrieved documents
- Design citation and attribution systems
- Handle relevance filtering, contradictory sources, and knowledge base staleness

**3.6 — Design guardrails for agentic AI systems**
- Define tool access policies and action confirmation workflows
- Implement scope limiting, sandboxing, and resource caps
- Design identity delegation models that prevent privilege escalation
- Evaluate trust boundaries and security implications of tool integration protocols (MCP)

---

### Domain 4: Implementing Guardrails (25%)

**4.1 — Select and implement appropriate detection and classification techniques**
- Choose between rule-based, ML-based, embedding-based, and LLM-as-judge approaches
- Combine detection methods into layered pipelines (fast/cheap first, slow/expensive last)
- Tune detection thresholds to balance false positives and false negatives
- Evaluate approaches on latency, cost, accuracy, and maintainability

**4.2 — Implement structured output enforcement**
- Define and validate output schemas (JSON schema, function call constraints)
- Build retry and error recovery logic for malformed outputs
- Choose between constrained decoding and post-hoc validation
- Handle edge cases in AI-generated structured output

**4.3 — Implement PII and sensitive data handling**
- Deploy PII detection (regex, NER, purpose-built detectors) appropriate to sensitivity level
- Choose between redaction, masking, and tokenization strategies
- Design data flows that minimize model exposure to PII
- Configure privacy-preserving logging

**4.4 — Evaluate and integrate guardrail frameworks and tooling**
- Assess guardrail tools against requirements (categories, not specific vendors)
- Integrate guardrails at the appropriate layer (SDK, proxy, gateway)
- Decide when to build custom vs. use existing solutions
- Manage guardrail configuration as code with version control

**4.5 — Apply prompt engineering techniques for safety**
- Write defensive system prompts with clear behavioral boundaries
- Structure prompts to minimize injection surface (delimiters, separation of instructions and user content)
- Use few-shot examples to demonstrate desired refusal behavior
- Identify dynamic prompt construction risks and mitigations

---

### Domain 5: Validating Guardrails (20%)

**5.1 — Plan and execute adversarial testing and red teaming against AI guardrails**
- Structure a red team engagement for an AI system (planning, execution, reporting)
- Apply known prompt injection, jailbreak, and encoding-based attack techniques
- Distinguish between theoretical vulnerabilities and practically exploitable ones
- Document and report findings in a format actionable by engineering teams

**5.2 — Build and maintain guardrail test suites**
- Create unit tests for individual guardrail components (classifiers, filters, validators)
- Build integration and regression tests for guardrail pipelines
- Design edge case tests (encoding variations, language mixing, boundary inputs)
- Measure performance impact of guardrails under load

**5.3 — Define and measure guardrail effectiveness metrics**
- Calculate precision, recall, and F1 for guardrail classifiers
- Measure and report false positive rate (user friction) and false negative rate (safety gaps)
- Track latency percentiles (p50, p95, p99) and cost per evaluation
- Use metrics to drive guardrail tuning decisions

**5.4 — Design monitoring and observability for guardrail systems**
- Identify key operational metrics (block rate, bypass rate, latency, error rate)
- Configure alerts that catch failures without creating alert fatigue
- Design structured, privacy-preserving logging for guardrail events
- Investigate anomalies and conduct forensic analysis of guardrail logs

**5.5 — Implement continuous validation and lifecycle management**
- Deploy canary tests and synthetic adversarial probes for guardrail releases
- Re-validate guardrails after model updates or configuration changes
- Plan for guardrail drift, versioning, and rollback
- Execute incident response procedures for guardrail bypass events
- Identify and address guardrail debt (outdated or redundant guardrails)

---

## Exam Development and Maintenance

### Question Development Process
1. Subject matter experts (SMEs) write questions aligned to exam objectives
2. Each question is reviewed by at least two additional SMEs
3. Questions are pilot-tested as unscored items before becoming scored
4. Statistical analysis (item difficulty, discrimination index) determines if pilot questions become scored
5. Questions are reviewed annually for relevance and accuracy

### Cut Score Methodology
- The passing score of 70% was established using a modified Angoff method
- A panel of SMEs rated the probability that a minimally qualified candidate would answer each question correctly
- The cut score will be re-evaluated with each major exam version update

### Exam Security
- Question pool is significantly larger than any single exam form (minimum 3x)
- Questions are randomized per candidate
- Multiple exam forms are in rotation at any time
- Statistical monitoring detects potential exam fraud (unusual score patterns, timing anomalies)

### Version Control
- Minor updates (adding/retiring questions, fixing errors) do not change the version number
- Major updates (domain weight changes, new domains, significant objective changes) increment the version
- Candidates are notified at least 90 days before major version changes
- Both old and new versions are available for 60 days during transitions

---

## Candidate Preparation Guide

### Recommended Experience
While there are no formal prerequisites to sit for the exam, candidates are most successful with:
- Completion of the cAIge training program (all five modules)
- 1-2 years of experience working with AI/ML systems in any capacity
- Basic understanding of software architecture and API design
- Familiarity with at least one programming language
- Exposure to security concepts (not required to be a security specialist)

### Study Approach
1. Review the competency matrix to understand all knowledge areas and skills
2. Complete the official cAIge training program (five text-based modules)
3. Build hands-on experience by implementing guardrails in a practice environment
4. Take practice exams to identify knowledge gaps
5. Review areas of weakness against the competency matrix

### What This Exam Does NOT Test
- Vendor-specific product configuration (e.g., "configure NeMo Guardrails rule X")
- Deep machine learning theory (e.g., backpropagation math, attention mechanism implementation)
- General software engineering skills (e.g., data structures, algorithms)
- Legal expertise (e.g., detailed regulatory interpretation)
- Memorization of specific regulatory article numbers or section references
