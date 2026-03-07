# cAIge Competency Matrix

## Certified AI Guardrail Engineer (cAIge)

**Version:** 1.0
**Maintained by:** caigeai.dev

---

## Overview

AI guardrails are the controls that prevent AI systems from being used in ways they shouldn't — whether that means producing harmful content, being exploited by adversarial users, leaking sensitive data, or taking unauthorized actions. The discipline spans three broad areas:

- **Content Safety** — Preventing toxic, biased, or inappropriate outputs; enforcing topic boundaries and refusal behavior
- **Security** — Defending against prompt injection, jailbreaking, data exfiltration, system prompt exposure, and unauthorized tool use
- **Operational Safety** — Catching hallucinations, preventing cascading failures in agentic systems, enforcing resource limits, and maintaining graceful degradation

A Certified AI Guardrail Engineer works across all three areas. The cAIge competency matrix defines what they must know and be able to do. It is organized into six domains, each weighted by importance to the role. The matrix is vendor-agnostic — it tests understanding of concepts, patterns, and architectural thinking rather than specific product knowledge.

A cAIge holder is qualified to design, implement, test, and maintain guardrail systems for AI-powered applications across any technology stack.

---

## Domain Breakdown and Weights

| Domain | Weight | Description |
|--------|--------|-------------|
| 1. AI System Fundamentals & Failure Modes | 15% | Understanding the systems you are guarding |
| 2. Guardrail Architecture & Design | 25% | Designing guardrail strategies and systems |
| 3. Guardrail Implementation | 20% | Building and configuring guardrails |
| 4. Policy, Compliance & Governance | 15% | Translating rules into technical controls |
| 5. Testing & Red Teaming | 15% | Validating guardrails work under pressure |
| 6. Operations & Observability | 10% | Running guardrails in production |

---

## Domain 1: AI System Fundamentals & Failure Modes (15%)

### 1.1 How AI Systems Work

**Knowledge areas:**
- Large language model architecture at a conceptual level (tokens, context windows, attention, probability distributions)
- How model inference works — temperature, sampling, top-k/top-p and their impact on output predictability
- The role of system prompts, user prompts, and assistant responses in a conversation loop
- Embedding models and their role in retrieval and similarity search
- Multi-modal AI systems (text, image, audio) and their unique guardrail considerations
- Agentic AI systems — tool use, function calling, multi-step reasoning, and autonomous action

**Skills — the candidate can:**
- Explain why LLMs produce non-deterministic outputs and what that means for guardrail design
- Identify where in an AI system's architecture guardrails can be applied
- Distinguish between model-level safety training and application-level guardrails
- Describe how agentic systems expand the attack surface compared to simple chat interfaces

### 1.2 Common Failure Modes

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

### 1.3 Threat Modeling for AI Systems

**Knowledge areas:**
- AI-specific threat modeling frameworks and approaches
- Adversary profiles — who attacks AI systems and why (malicious users, competitors, researchers, insiders)
- Attack surfaces unique to AI — prompts, training data, retrieval corpora, tool integrations, model APIs, tool integration protocols (MCP)
- Supply chain risks — third-party models, fine-tuned weights, poisoned datasets, third-party MCP servers and tool providers
- Risk assessment — likelihood vs. impact for AI-specific threats

**Skills — the candidate can:**
- Conduct a threat model for an AI application identifying key risks and attack vectors
- Prioritize guardrail investment based on threat severity and likelihood
- Identify trust boundaries in an AI system architecture
- Document threat models in a format useful to engineering and security teams

---

## Domain 2: Guardrail Architecture & Design (25%)

### 2.1 Guardrail Taxonomy

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

### 2.2 Input Guardrail Design

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

### 2.3 Output Guardrail Design

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

### 2.4 System-Level Guardrail Design

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

### 2.5 RAG-Specific Guardrails

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

### 2.6 Agentic System Guardrails

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

## Domain 3: Guardrail Implementation (20%)

### 3.1 Detection and Classification Techniques

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

### 3.2 Structured Output Enforcement

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

### 3.3 PII and Sensitive Data Handling

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

### 3.4 Guardrail Frameworks and Tooling

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

### 3.5 Prompt Engineering for Safety

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

## Domain 4: Policy, Compliance & Governance (15%)

### 4.1 AI Governance Frameworks

**Knowledge areas:**
- NIST AI Risk Management Framework (AI RMF) — structure, core functions, profiles
- ISO/IEC 42001 — AI management system standard
- EU AI Act — risk categories, requirements for high-risk systems, prohibited practices
- OWASP Top 10 for LLM Applications
- Industry-specific guidance (healthcare, finance, government)
- Responsible AI principles and how they translate to guardrails

**Skills — the candidate can:**
- Map guardrail requirements to specific regulatory and framework requirements
- Determine which AI governance frameworks apply to a given deployment
- Translate framework requirements into actionable technical guardrail specifications
- Stay current on evolving regulatory requirements (knowing where to look, not memorizing law)

### 4.2 Policy-to-Guardrail Translation

**Knowledge areas:**
- Organizational AI use policies — what they typically contain and how they're structured
- Acceptable use policies for AI systems
- Translating natural language policies into technical rules and classifiers
- Handling ambiguity in policies — when rules don't clearly map to technical controls
- Stakeholder communication — explaining guardrail capabilities and limitations to non-technical stakeholders
- Policy versioning and change management

**Skills — the candidate can:**
- Read an organizational AI policy and produce a guardrail specification
- Identify gaps in policies that leave guardrail decisions undefined
- Recommend policy changes based on technical realities of guardrail enforcement
- Document the mapping between policy requirements and technical implementations

### 4.3 Documentation and Audit

**Knowledge areas:**
- Guardrail documentation standards — what to document and for whom
- Model cards and system cards as guardrail documentation
- Audit trail requirements — what regulators and auditors need to see
- Change management for guardrail updates — who approves, how changes are tracked
- Incident documentation for guardrail failures
- Risk registers and how guardrails map to identified risks

**Skills — the candidate can:**
- Create guardrail documentation that satisfies audit requirements
- Maintain audit trails that demonstrate guardrail effectiveness
- Produce reports on guardrail performance for compliance and leadership audiences
- Document guardrail incidents with root cause analysis and remediation steps

### 4.4 Ethical Considerations

**Knowledge areas:**
- Bias in AI systems — how guardrails can both mitigate and introduce bias
- Fairness considerations in content filtering (disproportionate impact on certain groups or languages)
- Transparency vs. security — how much to reveal about guardrail mechanisms
- User autonomy — balancing safety with user freedom
- Accessibility — ensuring guardrails don't create barriers for users with disabilities
- Cultural and linguistic considerations in global deployments

**Skills — the candidate can:**
- Evaluate guardrails for unintended bias or disproportionate impact
- Design guardrail transparency disclosures that are honest without enabling bypass
- Balance safety and usability in guardrail design decisions
- Adapt guardrail strategies for multi-cultural and multi-lingual deployments

---

## Domain 5: Testing & Red Teaming (15%)

### 5.1 Adversarial Testing Fundamentals

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

### 5.4 Continuous Validation

**Knowledge areas:**
- Canary testing for guardrail deployments
- Synthetic traffic and chaos testing for guardrail systems
- Ongoing adversarial probing in production (automated red teaming)
- Community and research-driven attack updates — staying current on new bypass techniques
- Bug bounty programs for AI guardrails
- Model update impact assessment — re-validating guardrails when underlying models change

**Skills — the candidate can:**
- Implement automated canary tests that validate guardrails on every deployment
- Design synthetic adversarial traffic that continuously probes for weaknesses
- Build processes that incorporate newly discovered attack patterns into test suites
- Assess guardrail effectiveness after model updates or configuration changes

---

## Domain 6: Operations & Observability (10%)

### 6.1 Monitoring and Alerting

**Knowledge areas:**
- Key metrics to monitor for guardrail systems (block rate, bypass rate, latency, error rate)
- Anomaly detection for guardrail behavior — sudden spikes in blocks or passes
- Alert design — what warrants a page vs. a ticket vs. a log entry
- Dashboard design for guardrail operations
- Correlation between guardrail events and downstream system behavior

**Skills — the candidate can:**
- Design monitoring systems that surface guardrail health and effectiveness
- Configure alerts that catch guardrail failures without creating alert fatigue
- Build operational dashboards for day-to-day guardrail management
- Investigate anomalies in guardrail behavior and determine root causes

### 6.2 Logging and Audit Trails

**Knowledge areas:**
- What to log for guardrail events (decision, reasoning, input hash, output action, latency)
- Privacy-preserving logging — capturing enough for debugging without storing sensitive content
- Log retention policies and compliance requirements
- Structured logging formats for guardrail events
- Log analysis and forensics for guardrail investigations

**Skills — the candidate can:**
- Design logging schemas for guardrail systems that balance utility with privacy
- Implement log pipelines that support both real-time monitoring and historical analysis
- Conduct forensic analysis of guardrail logs to investigate incidents
- Ensure logging practices comply with data retention and privacy requirements

### 6.3 Incident Response

**Knowledge areas:**
- AI-specific incident response procedures — guardrail bypass, data exposure, harmful output
- Severity classification for AI guardrail incidents
- Containment strategies — killing sessions, disabling features, rolling back models
- Communication templates for AI incidents (internal and external)
- Post-incident review and guardrail hardening
- Escalation paths — when to involve security, legal, PR

**Skills — the candidate can:**
- Execute incident response procedures for common AI guardrail failure scenarios
- Classify AI incidents by severity and determine appropriate response
- Contain active guardrail failures quickly while minimizing user impact
- Conduct blameless post-mortems that produce concrete guardrail improvements

### 6.4 Lifecycle Management

**Knowledge areas:**
- Guardrail drift — why guardrails degrade over time (new attacks, model updates, data shifts)
- Guardrail versioning and rollback strategies
- Deprecation and migration of guardrail components
- Capacity planning for guardrail systems (as traffic grows, guardrails must scale)
- Cost optimization — reducing guardrail spend without reducing coverage
- Guardrail debt — accumulation of outdated or redundant guardrails

**Skills — the candidate can:**
- Plan guardrail maintenance schedules that account for model and threat evolution
- Implement blue-green or canary deployment strategies for guardrail updates
- Identify and remove redundant or outdated guardrails
- Project guardrail infrastructure costs and optimize for efficiency

---

## Cross-Cutting Competencies

These are not tested as separate domains but are expected throughout all areas:

- **Vendor-agnostic thinking** — understanding patterns and principles rather than memorizing product-specific configurations
- **Risk-based decision making** — always connecting guardrail decisions to actual risk levels
- **Communication** — ability to explain guardrail decisions to technical and non-technical audiences
- **Continuous learning** — awareness that the AI guardrail landscape evolves rapidly and commitment to staying current
- **Systems thinking** — understanding how guardrails interact with the broader application, infrastructure, and organizational context
