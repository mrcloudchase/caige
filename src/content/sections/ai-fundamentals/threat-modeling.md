---
title: "Threat Modeling for AI Systems"
slug: "threat-modeling"
module: "ai-fundamentals"
moduleOrder: 1
sectionOrder: 3
description: "Section 3 of the ai fundamentals module."
---

Threat modeling is the practice of systematically identifying what can go wrong, who might make it go wrong, and what you should do about it. For AI systems, this requires extending traditional threat modeling to cover AI-specific attack surfaces.

### 1.3.1 AI-Specific Threat Modeling Approaches

Traditional threat modeling frameworks (STRIDE, PASTA, Attack Trees) can be adapted for AI systems, but they need extension to cover AI-specific threats. A practical AI threat modeling process:

**Step 1: Define the system**
- What does the AI system do?
- What data does it have access to?
- What actions can it take?
- Who are its users?
- What is the deployment environment?

**Step 2: Identify assets**
- What are we protecting? (User data, system integrity, brand reputation, business logic)
- What is the value of each asset?
- What are the consequences of each asset being compromised?

**Step 3: Identify threats**
- Who might attack this system? (See adversary profiles below)
- What are they trying to achieve?
- What attack techniques might they use?
- What are the AI-specific attack surfaces?

**Step 4: Assess risk**
- For each threat: What is the likelihood? What is the impact?
- Risk = Likelihood x Impact
- Prioritize by risk level

**Step 5: Define mitigations**
- For each high and medium risk: What guardrails mitigate this threat?
- What is the residual risk after guardrails are applied?
- What is the cost (latency, money, complexity) of each guardrail?

**Step 6: Document and review**
- Record the threat model in a format useful to the team
- Review and update when the system changes, new threats emerge, or after incidents

### 1.3.2 Adversary Profiles

Different attackers have different motivations, capabilities, and persistence:

**Casual malicious users** — Individual users trying to get the AI to do something it shouldn't. Low sophistication, high volume. They try known jailbreaks, prompt injection recipes from social media, and simple boundary pushing. Most common threat by volume.

**Sophisticated attackers** — Security researchers, red teamers, or determined individuals with deep knowledge of AI systems. They develop novel attack techniques, chain multiple vulnerabilities, and can invest significant time. Less common but higher impact.

**Competitors** — Organizations seeking to extract proprietary information: system prompts, training data, business logic, or pricing strategies embedded in AI systems.

**Insiders** — Employees or contractors with legitimate access who misuse AI systems. They may have knowledge of system prompts, guardrail configurations, or access controls.

**Automated attacks** — Bots and scripts that probe AI systems at scale, looking for bypasses through brute force variation of known attacks.

**Unintentional threats** — Users who are not trying to attack the system but whose legitimate use triggers failures. A user asking a medical question to a general-purpose chatbot is not attacking, but the chatbot's response could be harmful.

### 1.3.3 AI-Specific Attack Surfaces

Beyond traditional application security concerns (API authentication, network security, etc.), AI systems have unique attack surfaces:

**The prompt** — User-provided text that directly influences model behavior. The primary vector for prompt injection and jailbreaking.

**Training data** — If the model was fine-tuned on custom data, that data could be poisoned to introduce backdoors or biases. Supply chain risk.

**Retrieval corpora** — In RAG systems, the documents used for retrieval are an attack surface. An attacker who can place documents in the retrieval corpus can mount indirect prompt injection attacks.

**Tool integrations** — In agentic systems, each tool the agent can access is an attack surface. Compromising a tool or manipulating its output can influence the agent's behavior.

**Tool integration protocols (MCP)** — Protocols like the Model Context Protocol connect AI models to external tool servers. Each MCP server is a trust boundary. A malicious or compromised MCP server can return data containing prompt injections, exfiltrate information sent to it via tool calls, or expose capabilities the agent shouldn't have. Third-party MCP servers carry supply chain risk — you are trusting their code with access to your AI system's context.

**Identity and multi-tenancy** — In systems serving multiple users or organizations, identity is an attack surface. Cross-tenant data leakage (User A seeing User B's data in AI responses), session confusion (conversation history mixing between users), and privilege escalation (a user manipulating the AI into acting with elevated permissions) are all identity-related attack vectors. In agentic systems, the question of whose identity the agent acts under when calling tools adds further complexity — an agent should never have more access than the user who invoked it.

**Model APIs** — The model provider's API can be a target. Rate limiting, authentication, and access controls on the API are important.

**Conversation history** — In multi-turn conversations, earlier messages can be used to set up attacks that execute in later turns. The full conversation is an attack surface.

**Model weights** — If using open-source or self-hosted models, the model weights themselves are an asset that needs protection from theft and a potential attack surface (model poisoning).

### 1.3.4 Supply Chain Risks

AI systems have supply chain risks that traditional software does not:

**Third-party models** — When you use a model via API, you depend on the provider's safety training, uptime, and privacy practices. Model updates can change behavior unexpectedly.

**Fine-tuned weights** — If you download and fine-tune open-source models, those base weights could contain backdoors. Verifying the provenance of model weights is important.

**Training and fine-tuning data** — Data poisoning attacks can introduce hidden behaviors. If an attacker contributes to your training dataset, they can influence model behavior.

**Embedding models** — The embedding model used for RAG affects what content is retrieved. A compromised embedding model could manipulate retrieval results.

**Guardrail dependencies** — If you use third-party guardrail tools, those tools become part of your security perimeter. A bug in a guardrail dependency could create a gap in your defenses.

**Third-party MCP servers** — Tool integration protocols allow connecting to external tool servers. A third-party MCP server is code you don't control that your AI agent will interact with. It could be compromised, poorly written, or intentionally malicious. Data sent to it via tool calls (including user context) may be logged or exfiltrated. Data returned from it may contain prompt injections designed to manipulate the agent. Treat third-party MCP servers with the same skepticism as any third-party dependency — evaluate provenance, review permissions, and limit exposure.

### 1.3.5 Risk Assessment for AI Threats

For each identified threat, assess:

**Likelihood factors:**
- How easy is the attack to execute? (Prompt injection: easy. Training data poisoning: hard.)
- How many potential attackers are there? (Every user can attempt prompt injection. Few can attempt model supply chain attacks.)
- Is the attack automated or does it require manual effort?
- Are there known, published attack techniques?

**Impact factors:**
- What is the worst-case outcome? (Bad text? Data leak? Unauthorized action?)
- How many users are affected?
- What is the financial, legal, and reputational cost?
- Is the impact reversible?

**Risk matrix example:**

| Threat | Likelihood | Impact | Risk Level | Priority |
|--------|-----------|--------|------------|----------|
| Prompt injection (direct) | High | Medium-High | High | P1 |
| Prompt injection (indirect via RAG) | Medium | High | High | P1 |
| Jailbreaking | Medium | Medium | Medium | P2 |
| Hallucination | High | Varies | Medium-High | P1-P2 |
| PII leakage | Medium | High | High | P1 |
| Off-topic drift | High | Low | Medium | P3 |
| Training data poisoning | Low | High | Medium | P3 |
| Cascading agent failure | Medium | High | High | P1 |
| Identity/access failure | Medium | High | High | P1 |

### 1.3.6 Trust Boundaries

A trust boundary is a line in your system architecture where the level of trust changes. Data crossing a trust boundary must be validated. In AI systems, key trust boundaries include:

**User input -> Application:** Users are untrusted. All user input must be validated.

**Retrieved documents -> Model context:** Retrieved documents may contain indirect injections. Content crossing this boundary should be sanitized.

**Model output -> Application:** Model output is untrusted. The model can produce any text, regardless of instructions. Output must be validated.

**Agent decision -> Tool execution:** The agent's decision to call a tool should be validated against policies before execution.

**External API -> Agent:** Data returned from external tools should be treated as untrusted input.

Drawing trust boundaries helps you identify where guardrails are needed. A general rule: **every time data crosses a trust boundary, apply a guardrail.**

```
  UNTRUSTED                                     TRUSTED
  (external)                                    (your system)
                    TRUST BOUNDARY
 +------------+          |          +---------------------+
 |   User     |----- input ------->| Input Guardrails    |
 |   Input    |          |         | (validate, classify)|
 +------------+          |         +----------+----------+
                         |                    |
 +------------+          |                    v
 | Retrieved  |----- content ----->+---------+-----------+
 |   Docs     |          |        |                      |
 +------------+          |        |        LLM           |
                         |        |                      |
                         |        +----------+-----------+
                         |                   |
                         |          TRUST BOUNDARY
                         |                   |
                         |        +----------+-----------+
                         |        | Output Guardrails    |
                         |        | (filter, redact,     |
                         |        |  ground-check)       |
                         |        +----------+-----------+
                         |                   |
                         |          TRUST BOUNDARY
                         |                   |
 +------------+          |        +----------+-----------+
 | External   |<---- tool call ---|  Agent Decision      |
 | Tool / API |          |        |  (policy check       |
 |            |----- result ----->|   before execution)  |
 +------------+          |        +----------------------+
```

### 1.3.7 Documenting Threat Models

A useful threat model document includes:

1. **System description** — What the AI system does, its architecture, its users
2. **Data flow diagram** — How data moves through the system, with trust boundaries marked
3. **Asset inventory** — What we are protecting and its value
4. **Threat catalog** — Each identified threat with description, adversary profile, attack vector
5. **Risk assessment** — Likelihood and impact ratings for each threat
6. **Mitigation plan** — Guardrails planned or implemented for each threat, with residual risk
7. **Review schedule** — When the threat model will be reviewed and updated

The document should be useful to both engineering teams (who implement guardrails) and leadership (who allocate resources). Consider maintaining two versions: a detailed technical version and an executive summary.

---
