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
| Prerequisites | None required to sit for the exam; completion of the cAIge training program (including AI Foundations prerequisites) is strongly recommended |
| Languages | English (additional languages planned) |

---

## Question Distribution by Domain

| Domain | Weight | Scored Questions | Approx. Count |
|--------|--------|-----------------|----------------|
| 1. AI System Fundamentals & Failure Modes | 15% | 11 | 11-12 |
| 2. Guardrail Architecture & Design | 25% | 19 | 18-20 |
| 3. Guardrail Implementation | 20% | 15 | 14-16 |
| 4. Policy, Compliance & Governance | 15% | 11 | 11-12 |
| 5. Testing & Red Teaming | 15% | 11 | 11-12 |
| 6. Operations & Observability | 10% | 8 | 7-9 |
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

### Domain 1: AI System Fundamentals & Failure Modes (15%)

**1.1 — Given an AI system architecture, identify where guardrails can be applied**
- Locate input, processing, and output stages in an AI pipeline
- Identify trust boundaries between components
- Distinguish model-level safety from application-level guardrails

**1.2 — Classify common AI failure modes and map them to guardrail strategies**
- Identify hallucination, prompt injection, jailbreaking, data leakage, toxic output, and off-topic drift from examples
- Explain why each failure mode occurs
- Recommend appropriate guardrail types for each failure mode

**1.3 — Conduct threat modeling for AI applications**
- Identify adversary profiles and motivations
- Map attack surfaces in a given AI architecture
- Prioritize threats by likelihood and impact
- Identify trust boundaries and data flows that require guardrails

**1.4 — Explain how AI system characteristics affect guardrail requirements**
- Describe how non-determinism impacts guardrail design
- Explain how agentic capabilities expand attack surface
- Identify how multi-modal inputs create additional guardrail needs
- Describe how context window limitations affect guardrail strategy

---

### Domain 2: Guardrail Architecture & Design (25%)

**2.1 — Design a multi-layered guardrail strategy for a given use case**
- Select appropriate input, output, and system-level guardrails
- Layer cheap/fast checks before expensive checks
- Balance security with usability and latency
- Justify design decisions based on risk assessment

**2.2 — Design input guardrail pipelines**
- Select and sequence input validation techniques
- Choose injection detection approaches based on risk tolerance
- Define input schemas and constraints
- Design rate limiting and abuse prevention

**2.3 — Design output guardrail pipelines**
- Select content filtering approaches
- Design PII detection and redaction strategies
- Implement groundedness and factuality checks
- Design refusal responses that are helpful but secure

**2.4 — Design system-level guardrails**
- Write effective safety-oriented system prompts
- Design fallback and circuit breaker patterns
- Architect multi-model validation systems
- Plan conversation memory management with safety in mind

**2.5 — Design guardrails specific to RAG systems**
- Implement retrieval-level access controls
- Defend against indirect prompt injection via retrieved documents
- Design citation and attribution systems
- Handle relevance filtering and source validation

**2.6 — Design guardrails for agentic AI systems**
- Define tool access policies and approval workflows
- Implement scope limiting and resource caps
- Design audit trails for agent actions
- Build rollback capabilities for agent-executed actions

---

### Domain 3: Guardrail Implementation (20%)

**3.1 — Select and implement appropriate detection techniques**
- Choose between rule-based, ML-based, and LLM-as-judge approaches
- Combine detection methods for defense in depth
- Tune detection thresholds for acceptable false positive/negative rates
- Evaluate detection approaches on latency, cost, and accuracy

**3.2 — Implement structured output enforcement**
- Define and validate output schemas
- Build retry and error recovery logic
- Choose between constrained generation and post-hoc validation
- Handle edge cases in AI-generated structured output

**3.3 — Implement PII and sensitive data handling**
- Deploy PII detection appropriate to sensitivity level
- Design data flows that minimize model exposure to PII
- Configure privacy-preserving logging
- Apply data handling strategies based on classification level

**3.4 — Evaluate and integrate guardrail tools and frameworks**
- Assess guardrail tools against requirements
- Integrate guardrails at the appropriate layer (SDK, proxy, gateway)
- Decide when to build custom vs. use existing solutions
- Manage guardrail configuration as code

**3.5 — Apply prompt engineering techniques for safety**
- Write defensive system prompts
- Structure prompts to minimize injection surface
- Use few-shot examples for safe behavior guidance
- Separate instructions from user-provided content

---

### Domain 4: Policy, Compliance & Governance (15%)

**4.1 — Map regulatory and framework requirements to guardrail implementations**
- Identify applicable sections of EU AI Act, NIST AI RMF, ISO 42001
- Apply OWASP Top 10 for LLM Applications to guardrail design
- Determine risk classification and corresponding requirements
- Stay current on evolving regulatory landscape

**4.2 — Translate organizational policies into technical guardrails**
- Read AI use policies and produce guardrail specifications
- Identify policy gaps that leave guardrail decisions undefined
- Recommend policy changes based on technical feasibility
- Document policy-to-guardrail mappings

**4.3 — Implement documentation and audit capabilities**
- Create guardrail documentation for audit purposes
- Maintain decision audit trails
- Produce compliance reports on guardrail effectiveness
- Document incidents with root cause and remediation

**4.4 — Evaluate guardrails for ethical considerations**
- Assess guardrails for unintended bias or disproportionate impact
- Balance transparency with security in guardrail design
- Adapt guardrails for multi-cultural and multi-lingual contexts
- Consider accessibility in guardrail interactions

---

### Domain 5: Testing & Red Teaming (15%)

**5.1 — Plan and execute adversarial testing against AI guardrails**
- Structure a red team engagement for an AI system
- Apply known prompt injection and jailbreak techniques
- Test guardrails with encoding, language, and formatting variations
- Document and report findings actionably

**5.2 — Build and maintain guardrail test suites**
- Create test cases covering known attack patterns
- Build regression tests for guardrail changes
- Design integration tests for end-to-end guardrail pipelines
- Measure performance impact of guardrails under test conditions

**5.3 — Define and measure guardrail effectiveness metrics**
- Calculate precision, recall, and F1 for guardrail classifiers
- Measure and report latency impact
- Track false positive and false negative rates over time
- Use metrics to drive guardrail tuning decisions

**5.4 — Implement continuous validation processes**
- Deploy canary tests for guardrail releases
- Build automated adversarial probing systems
- Incorporate new attack patterns from research and community
- Re-validate guardrails after model updates

---

### Domain 6: Operations & Observability (10%)

**6.1 — Design monitoring and alerting for guardrail systems**
- Identify key operational metrics for guardrail health
- Configure alerts for guardrail anomalies
- Build operational dashboards
- Investigate and resolve guardrail operational issues

**6.2 — Implement logging that supports debugging and compliance**
- Design guardrail event logging schemas
- Balance logging detail with privacy requirements
- Support forensic investigation through log design
- Comply with data retention requirements

**6.3 — Execute incident response for AI guardrail failures**
- Classify AI guardrail incidents by severity
- Contain guardrail failures quickly
- Conduct post-incident reviews
- Produce guardrail hardening recommendations from incidents

**6.4 — Manage the guardrail lifecycle**
- Plan for guardrail drift and degradation
- Implement guardrail versioning and deployment strategies
- Identify and remove redundant guardrails
- Optimize guardrail cost and performance over time

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
While there are no formal prerequisites to sit for the exam, the cAIge training program requires foundational knowledge of AI concepts (neural networks, transformer architecture, LLM training stages) covered in the AI Foundations prerequisites guide. Candidates are most successful with:
- Completion of the cAIge training program, including the AI Foundations prerequisites
- 1-2 years of experience working with AI/ML systems in any capacity
- Basic understanding of software architecture and API design
- Familiarity with at least one programming language
- Exposure to security concepts (not required to be a security specialist)

### Study Approach
1. Review the competency matrix to understand all knowledge areas and skills
2. Complete the official cAIge training program (text-based modules with supporting video content)
3. Build hands-on experience by implementing guardrails in a practice environment
4. Take practice exams to identify knowledge gaps
5. Review areas of weakness against the competency matrix

### What This Exam Does NOT Test
- Vendor-specific product configuration (e.g., "configure NeMo Guardrails rule X")
- Deep machine learning theory (e.g., backpropagation math, attention mechanism implementation)
- General software engineering skills (e.g., data structures, algorithms)
- Legal expertise (e.g., detailed regulatory interpretation)
- Memorization of specific regulatory article numbers or section references

