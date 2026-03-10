---
title: "Competency Matrix"
slug: competency-matrix
order: 1
description: "Exhaustive knowledge areas and skills per domain for the cAIge certification."
---

# cAIge Competency Matrix

## Certified AI Guardrail Engineer (cAIge)

**Version:** 1.0
**Maintained by:** caige.org

---

## Overview

AI guardrails are the technical controls that prevent AI systems from producing harmful content, being exploited by adversarial users, leaking sensitive data, or taking unauthorized actions. The cAIge certification focuses on the engineering discipline of designing, building, and validating these controls — specifically for applications powered by large language models (LLMs).

The cAIge competency matrix defines what a Certified AI Guardrail Engineer must know and be able to do. It is organized into five domains that follow the guardrail engineering lifecycle:

1. **Understand the technology** — How LLMs and production AI systems work
2. **Understand the failures** — What goes wrong, why, and how to model threats
3. **Architect the defenses** — Design guardrail strategies and systems
4. **Build the defenses** — Implement guardrails using proven techniques and tooling
5. **Validate the defenses** — Test, measure, monitor, and maintain guardrail effectiveness

The matrix is vendor-agnostic — it tests understanding of concepts, patterns, and engineering thinking rather than specific product knowledge. A cAIge holder is qualified to engineer guardrail systems for LLM-powered applications across any technology stack.

---

## Domain Breakdown and Weights

| Domain | Weight | Description |
|--------|--------|-------------|
| 1. AI Foundations | 15% | How LLMs and production AI systems work |
| 2. Understanding Failure Modes | 15% | What goes wrong, why, and how to model threats |
| 3. Architecting Guardrails | 25% | Designing guardrail strategies and systems |
| 4. Implementing Guardrails | 25% | Building guardrails using proven techniques and tooling |
| 5. Validating Guardrails | 20% | Testing, measuring, monitoring, and maintaining guardrails |

---

## Domain 1: AI Foundations (15%)

This domain covers the foundational knowledge of AI technology and production AI systems. A guardrail engineer must understand how the systems they are guarding actually work — from model internals to the production architecture that surrounds them.

### 1.1 Neural Networks & Deep Learning

**Knowledge areas:**
- Neural network architecture — input layers, hidden layers, output layers, nodes, and weighted connections
- How weights (parameters) determine a network's behavior and what "model size" means
- The training loop — forward pass, loss calculation, backpropagation, and weight update
- Activation functions and why non-linearity is necessary for learning complex patterns
- Why knowledge is distributed across weights and cannot be inspected, queried, or selectively removed

**Skills — the candidate can:**
- Explain how a neural network learns patterns from data through iterative weight adjustment
- Describe why knowledge stored in neural network weights cannot be inspected or selectively removed
- Relate model parameter count to model capacity and the implications for memorization and risk
- Distinguish between training (weight adjustment) and inference (prediction using fixed weights)

### 1.2 Large Language Models

**Knowledge areas:**
- The transformer architecture and how self-attention replaced sequential processing (RNNs, LSTMs)
- Encoder-decoder vs. decoder-only architecture and why modern LLMs use decoder-only
- Next-token prediction as the fundamental training objective
- Scale — parameter counts, training data sizes, and the emergence of capabilities at scale
- Mixture-of-Experts (MoE) and efficiency tradeoffs
- Embedding models — dense vector representations, semantic similarity, and their role in retrieval and classification systems
- What an LLM is not — not a database, not a search engine, not a reasoning engine

**Skills — the candidate can:**
- Explain why the transformer architecture replaced sequential models and what self-attention enables
- Describe the next-token prediction objective and why it produces general-purpose capabilities
- Relate model scale to emergent capabilities and risk factors (memorization, unpredictability)
- Articulate why LLMs are pattern-matching systems producing statistical predictions, not reasoning engines with understanding

### 1.3 LLM Inference & Text Generation

**Knowledge areas:**
- Tokenization — subword units, Byte Pair Encoding (BPE), vocabulary, special tokens
- The context window as working memory and the token budget tradeoff
- The embedding layer — converting token IDs to dense learned vectors
- Positional encoding — adding sequence order information to embeddings
- Masked self-attention — queries, keys, values, multi-head attention, and the causal mask
- Feed-forward networks and their role in storing factual knowledge
- Residual connections and layer normalization for training stability
- The output head — logits, softmax, and probability distributions over the vocabulary
- The autoregressive generation loop — producing one token at a time
- Temperature, top-k, top-p sampling and their effect on output variability
- Reasoning models, chain-of-thought, and inference-time scaling

**Skills — the candidate can:**
- Trace the complete data path from raw text through tokenization, embedding, transformer layers, and output generation
- Explain how the attention mechanism processes all tokens in parallel without distinguishing trusted from untrusted input
- Describe how temperature and sampling parameters affect output variability and non-determinism
- Identify where in the inference pipeline guardrails can intercept or validate data

### 1.4 LLM Training Pipeline

**Knowledge areas:**
- Pre-training on massive text corpora — next-token prediction at scale, base models
- Instruction tuning — fine-tuning on conversation data, chat templates with role boundaries (system, user, assistant, tool)
- The instruction hierarchy as a learned statistical preference, not an enforced constraint
- RLHF — reward models, Proximal Policy Optimization (PPO), and alignment training
- Alternatives to RLHF — Constitutional AI, Direct Preference Optimization (DPO)
- RL for reasoning — training models to produce step-by-step thinking tokens
- Distillation — training smaller models to replicate larger model behavior
- What each training stage creates and what can go wrong at each stage
- What the application developer can and cannot control

**Skills — the candidate can:**
- Describe each stage of LLM training and the capabilities and risks each introduces
- Explain why instruction-following and safety behaviors are learned statistical preferences, not hard-coded rules
- Identify which aspects of model behavior are controlled by the provider vs. the application developer
- Articulate why training alone cannot eliminate risks like hallucination, prompt injection, or jailbreaking

### 1.5 Production AI System Architecture

**Knowledge areas:**
- How production AI applications are assembled — API gateways, orchestration layers, model routing, and the request/response pipeline
- Common production patterns — simple chat, RAG pipelines, agentic workflows, multi-model architectures — and how each pattern structures the data flow
- Guardrail placement points — pre-processing (before the model), post-processing (after the model), system-level (around the model), and retrieval-level (before context injection)
- The relationship between model provider safety features and application-level guardrails — what the provider handles vs. what you must build
- Guardrail principles apply across modalities (text, image, audio, video); this program uses text as the primary example

**Skills — the candidate can:**
- Map the components of a production AI application and identify where guardrails should be placed
- Distinguish between model provider safety controls and application-level guardrails, and explain why both are necessary
- Describe how RAG, agentic, and multi-model patterns change the architectural complexity and guardrail insertion points
- Identify all guardrail insertion points for a given AI system architecture

---

## Domain 2: Understanding Failure Modes (15%)

This domain covers how and why AI systems fail — from the architectural properties that create vulnerabilities to the specific failure modes that guardrails must address. A guardrail engineer must understand the risk landscape before designing defenses.

### 2.1 Architecture-to-Risk Mapping

**Knowledge areas:**
- The instruction hierarchy problem — why learned compliance is not enforced constraint, and what that means for guardrail design
- Mapping architectural properties to specific risks — attention mechanisms enable prompt injection, distributed weights enable data leakage, probabilistic generation enables hallucination, learned safety boundaries enable jailbreaking
- Trust boundaries — where data crosses from trusted to untrusted in an AI pipeline, and why guardrails must exist at each boundary
- The three layers of defense — model training, system prompt, application-level guardrails — and why defense in depth is required
- How RAG expands the attack surface — retrieval poisoning, indirect prompt injection through documents, document-level access control gaps
- How agentic patterns expand the attack surface — tool misuse, cascading failures, privilege escalation, identity delegation

**Skills — the candidate can:**
- Map each architectural property of an LLM to the specific risk it creates
- Identify trust boundaries in an AI system and explain why guardrails belong at each boundary
- Explain why RAG and agentic patterns expand the attack surface beyond simple chat applications
- Articulate the defense-in-depth principle and why no single layer of defense is sufficient

### 2.2 Common Failure Modes

**Knowledge areas:**
- Hallucination — factual errors, fabricated citations, confident but wrong answers
- Prompt injection — direct injection, indirect injection via retrieved content
- Jailbreaking — techniques that bypass model safety training (role-playing, encoding, multi-turn manipulation)
- Data leakage — exposing training data, system prompts, or user PII
- Toxic and harmful output — hate speech, bias, dangerous instructions
- Off-topic drift — model responding outside its intended scope
- Over-reliance — systems that defer too much to AI without human checks
- Cascading failures in agentic systems — one bad tool call leading to compounding errors
- Identity and access failures — cross-tenant data leakage, privilege escalation, impersonation through prompt manipulation

**Skills — the candidate can:**
- Categorize failure modes by severity and likelihood for a given use case
- Explain why each failure mode occurs at a technical level
- Map failure modes to the guardrail strategies that mitigate them
- Recognize novel failure patterns that don't fit existing categories

### 2.3 Threat Modeling for AI Systems

**Knowledge areas:**
- AI-specific threat modeling frameworks and approaches (including OWASP Top 10 for LLM Applications)
- Adversary profiles — who attacks AI systems and why (malicious users, competitors, researchers, insiders)
- Attack surfaces unique to AI — prompts, training data, retrieval corpora, tool integrations, model APIs, tool integration protocols (MCP)
- Supply chain risks — third-party models, fine-tuned weights, poisoned datasets, third-party MCP servers and tool providers
- Risk assessment — likelihood vs. impact for AI-specific threats

**Skills — the candidate can:**
- Conduct a threat model for an AI application identifying key risks and attack vectors
- Prioritize guardrail investment based on threat severity and likelihood
- Map adversary profiles to specific attack techniques and guardrail requirements
- Document threat models in a format useful to engineering and security teams

---

## Domain 3: Architecting Guardrails (25%)

This domain covers the design of guardrail strategies and systems. A guardrail engineer must be able to architect multi-layered defenses that address the failure modes identified in Domain 2, selecting the right guardrail types for each use case and placement point.

### 3.1 Guardrail Taxonomy

**Knowledge areas:**
- Input guardrails — controls applied before the AI processes a request
- Output guardrails — controls applied after the AI generates a response
- System-level guardrails — controls that govern the overall behavior of the AI system
- Retrieval guardrails — controls specific to RAG pipelines and knowledge retrieval
- Agentic guardrails — controls on tool use, action execution, and autonomous decision-making
- Human-in-the-loop guardrails — when and how to escalate to a human

**Skills — the candidate can:**
- Classify any guardrail into its correct category
- Explain the tradeoffs between each guardrail type (latency, cost, coverage, false positive rate)
- Design a multi-layered guardrail strategy that combines input, output, and system-level controls
- Justify why certain use cases require specific guardrail types

### 3.2 Input Guardrail Design

**Knowledge areas:**
- Prompt validation and sanitization techniques
- Prompt injection detection — pattern-based, classifier-based, and LLM-as-judge approaches
- Input schema enforcement — constraining what users can send
- Topic and intent classification — detecting off-topic or malicious intent
- Rate limiting and abuse prevention at the input layer
- Identity and access control as guardrail foundations — authentication, authorization, session isolation
- Multi-tenant isolation — ensuring one user's data, context, and conversation history never leaks to another
- Identity-aware guardrail tuning — different guardrail profiles based on user role, trust level, or authorization scope
- Content length and complexity limits

**Skills — the candidate can:**
- Design an input validation pipeline for a given use case
- Select appropriate injection detection methods based on risk tolerance and performance requirements
- Define input schemas that balance usability with safety
- Implement layered input defenses (cheap checks first, expensive checks for edge cases)
- Design identity-aware guardrail systems that enforce different policies based on user context

### 3.3 Output Guardrail Design

**Knowledge areas:**
- Content filtering — toxicity, bias, appropriateness classifiers
- PII detection and redaction in AI-generated output
- Factuality and groundedness checking — verifying claims against source material
- Structured output enforcement — JSON schema validation, function call validation
- Citation and attribution enforcement in RAG systems
- Confidence scoring and uncertainty communication
- Response length and format constraints
- Refusal design — how the system communicates that it cannot fulfill a request

**Skills — the candidate can:**
- Design output filtering pipelines that catch harmful content without excessive false positives
- Implement PII detection strategies appropriate to the data sensitivity level
- Build groundedness checks that verify AI output against retrieved sources
- Design user-friendly refusal messages that are helpful without revealing system internals

### 3.4 System-Level Guardrail Design

**Knowledge areas:**
- System prompt engineering for safety — setting behavioral boundaries
- Conversation memory management — what to retain, what to forget, what to never store
- Fallback and circuit breaker patterns — degrading gracefully when AI fails
- Model selection and routing as a guardrail strategy (simpler models for lower-risk tasks)
- Multi-model architectures — using one model to check another
- Timeout and resource limits
- Canary and shadow deployment patterns for guardrail changes

**Skills — the candidate can:**
- Write system prompts that establish clear behavioral boundaries
- Design fallback chains that maintain user experience during guardrail-triggered blocks
- Architect multi-model validation systems (e.g., a small classifier guarding a large generator)
- Plan guardrail deployment strategies that minimize risk of breaking production

### 3.5 RAG-Specific Guardrails

**Knowledge areas:**
- Source document access control — ensuring retrieved content respects permissions
- Relevance filtering — preventing irrelevant retrieval from polluting AI responses
- Indirect prompt injection via retrieved documents
- Source attribution and traceability requirements
- Chunk-level vs. document-level guardrails
- Handling contradictory sources in retrieval
- Staleness and versioning of knowledge bases

**Skills — the candidate can:**
- Design access control systems for RAG knowledge bases
- Implement relevance thresholds that balance recall with safety
- Defend against indirect injection through retrieved content
- Build citation systems that let users verify AI claims against sources

### 3.6 Agentic System Guardrails

**Knowledge areas:**
- Tool use policies — which tools an agent can access and under what conditions
- Action confirmation and approval workflows
- Scope limiting — constraining what an agent can do in a single session
- Sandboxing and isolation for agent-executed code or actions
- Budget and resource caps (API calls, tokens, time, cost)
- Rollback and undo capabilities for agent actions
- Observation and reasoning trace auditing
- Multi-agent coordination and trust boundaries
- Identity delegation — whose identity an agent acts under when calling tools and accessing systems
- Privilege boundaries — preventing agents from escalating beyond the invoking user's permissions
- Tool integration protocols (MCP) — how models connect to external tools, trust boundaries between MCP clients and servers, permission scoping, transport security
- Supply chain risks of third-party tool servers — untrusted MCP servers as attack surface, prompt injection through tool results

**Skills — the candidate can:**
- Define tool access policies based on risk level and user authorization
- Design approval workflows that balance autonomy with safety
- Implement resource caps that prevent runaway agent behavior
- Build audit trails that capture agent reasoning and actions for review
- Design identity delegation models that prevent privilege escalation in agentic systems
- Evaluate the trust boundaries and security implications of tool integration protocols like MCP

---

## Domain 4: Implementing Guardrails (25%)

This domain covers the practical techniques and tooling used to build guardrails. A guardrail engineer must be able to select and combine detection methods, enforce output constraints, handle sensitive data, and integrate guardrails into application architectures.

### 4.1 Detection and Classification Techniques

**Knowledge areas:**
- Rule-based detection — regex, keyword lists, blocklists/allowlists
- ML-based classification — text classifiers, toxicity models, intent detection
- LLM-as-judge — using language models to evaluate other language model outputs
- Embedding-based similarity detection — cosine similarity for topic matching, nearest-neighbor for known-bad inputs
- Hybrid approaches — combining rules, ML, and LLM-based methods
- Tradeoffs: latency, cost, accuracy, maintainability for each approach

**Skills — the candidate can:**
- Select the right detection approach for a given guardrail requirement
- Combine multiple detection methods into a layered pipeline
- Evaluate detection accuracy using precision, recall, and F1 metrics
- Tune detection thresholds to balance false positives and false negatives

### 4.2 Structured Output Enforcement

**Knowledge areas:**
- JSON schema validation for AI outputs
- Function calling and tool use schema constraints
- Output parsing and error recovery strategies
- Retry logic for malformed outputs
- Constrained decoding and grammar-based generation (where supported)
- Template-based output generation as a guardrail strategy

**Skills — the candidate can:**
- Define output schemas that enforce safety and correctness constraints
- Build robust parsers that handle edge cases in AI-generated structured output
- Implement retry strategies that don't degrade user experience
- Choose between constrained generation and post-hoc validation based on use case

### 4.3 PII and Sensitive Data Handling

**Knowledge areas:**
- PII categories and sensitivity levels (names, emails, SSNs, medical records, financial data)
- Detection methods — regex, NER models, purpose-built PII detectors
- Redaction vs. masking vs. tokenization strategies
- Data minimization in prompts — sending only what the model needs
- Logging considerations — what to log, what to never log
- Regional and regulatory differences in PII definitions

**Skills — the candidate can:**
- Implement PII detection pipelines with appropriate sensitivity for the use case
- Design data flows that minimize PII exposure to AI models
- Configure logging systems that capture useful debugging info without storing PII
- Apply different PII handling strategies based on data classification levels

### 4.4 Guardrail Frameworks and Tooling

**Knowledge areas:**
- Understanding of the guardrail tooling landscape (not vendor-specific configuration, but categories of tools)
- Guardrail middleware and interceptor patterns
- SDK-level vs. proxy-level vs. gateway-level guardrail enforcement
- Custom guardrail development — when to build vs. buy vs. use open source
- Integration patterns — how guardrails fit into existing application architectures, including tool integration protocols (MCP)
- Version control and configuration management for guardrail rules

**Skills — the candidate can:**
- Evaluate guardrail tools and frameworks against requirements
- Integrate guardrails into an application without requiring major architectural changes
- Build custom guardrails when off-the-shelf solutions don't fit
- Manage guardrail configurations as code with proper version control

### 4.5 Prompt Engineering for Safety

**Knowledge areas:**
- Defensive system prompt techniques — clear boundaries, explicit refusal instructions
- Few-shot examples for guiding safe behavior
- Chain-of-thought prompting for improved reasoning and guardrail compliance
- Prompt templates that minimize injection surface area
- Separation of instructions and user content in prompts
- Dynamic prompt construction risks and mitigations

**Skills — the candidate can:**
- Write system prompts that establish clear, robust behavioral boundaries
- Use few-shot examples to demonstrate desired refusal behavior
- Structure prompts to minimize the effectiveness of injection attacks
- Test system prompts against known bypass techniques

---

## Domain 5: Validating Guardrails (20%)

This domain covers the complete validation lifecycle — from adversarial testing before deployment to ongoing monitoring in production. A guardrail engineer must be able to prove that guardrails work, measure their effectiveness, detect when they degrade, and respond when they fail.

### 5.1 Adversarial Testing & Red Teaming

**Knowledge areas:**
- Red teaming methodology for AI systems — planning, execution, reporting
- Prompt injection attack taxonomy — direct, indirect, multi-turn, encoded
- Jailbreak techniques — role-play attacks, DAN prompts, encoding tricks, language switching
- Social engineering attacks against AI systems
- Automated vs. manual red teaming — tools and approaches
- Responsible disclosure for AI vulnerabilities

**Skills — the candidate can:**
- Plan and execute a structured red team engagement against an AI system
- Apply known attack techniques to test guardrail effectiveness
- Document findings in a format actionable by engineering teams
- Distinguish between theoretical vulnerabilities and practically exploitable ones

### 5.2 Guardrail Testing Methodology

**Knowledge areas:**
- Unit testing individual guardrail components (classifiers, filters, validators)
- Integration testing guardrail pipelines end-to-end
- Regression testing — ensuring guardrail updates don't break existing protections
- Edge case testing — boundary inputs, encoding variations, language mixing
- Performance testing — latency impact, throughput under load
- A/B testing guardrail configurations

**Skills — the candidate can:**
- Build comprehensive test suites for guardrail systems
- Create adversarial test datasets that cover known attack patterns
- Design regression test pipelines that run on every guardrail change
- Measure and report on guardrail performance impact (latency, cost, user experience)

### 5.3 Evaluation Metrics

**Knowledge areas:**
- Precision, recall, and F1 for guardrail classifiers
- False positive rate — blocking legitimate requests (user friction)
- False negative rate — missing harmful content (safety gaps)
- Latency percentiles (p50, p95, p99) for guardrail processing
- Cost per guardrail evaluation
- Coverage metrics — what percentage of inputs/outputs are checked
- User satisfaction and complaint rates as indirect guardrail metrics

**Skills — the candidate can:**
- Define appropriate success metrics for guardrails based on use case risk level
- Build dashboards and reports that communicate guardrail effectiveness
- Use metrics to justify guardrail tuning decisions to stakeholders
- Identify when metrics indicate a guardrail is underperforming

### 5.4 Monitoring & Observability

**Knowledge areas:**
- Key metrics to monitor for guardrail systems (block rate, bypass rate, latency, error rate)
- Anomaly detection for guardrail behavior — sudden spikes in blocks or passes
- Alert design — what warrants a page vs. a ticket vs. a log entry
- Dashboard design for guardrail operations
- Structured logging for guardrail events — decision, reasoning, input hash, output action, latency
- Privacy-preserving logging — capturing enough for debugging without storing sensitive content
- Log analysis and forensics for guardrail investigations

**Skills — the candidate can:**
- Design monitoring systems that surface guardrail health and effectiveness
- Configure alerts that catch guardrail failures without creating alert fatigue
- Design logging schemas that balance debugging utility with privacy requirements
- Investigate anomalies in guardrail behavior and determine root causes

### 5.5 Continuous Validation & Lifecycle Management

**Knowledge areas:**
- Canary testing for guardrail deployments
- Synthetic traffic and chaos testing for guardrail systems
- Ongoing adversarial probing in production (automated red teaming)
- Community and research-driven attack updates — staying current on new bypass techniques
- Model update impact assessment — re-validating guardrails when underlying models change
- Guardrail drift — why guardrails degrade over time (new attacks, model updates, data shifts)
- Guardrail versioning and rollback strategies
- Incident response for guardrail failures — containment, classification, root cause analysis, hardening
- Cost optimization — reducing guardrail spend without reducing coverage
- Guardrail debt — accumulation of outdated or redundant guardrails

**Skills — the candidate can:**
- Implement automated canary tests that validate guardrails on every deployment
- Design synthetic adversarial traffic that continuously probes for weaknesses
- Build processes that incorporate newly discovered attack patterns into test suites
- Execute incident response procedures for guardrail bypass events
- Plan guardrail maintenance schedules that account for model and threat evolution
- Identify and remove redundant or outdated guardrails

---

## Cross-Cutting Competencies

These are not tested as separate domains but are expected throughout all areas:

- **Vendor-agnostic thinking** — understanding patterns and principles rather than memorizing product-specific configurations
- **Risk-based decision making** — always connecting guardrail decisions to actual risk levels
- **Systems thinking** — understanding how guardrails interact with the broader application, infrastructure, and organizational context
- **Continuous learning** — awareness that the AI guardrail landscape evolves rapidly and commitment to staying current
