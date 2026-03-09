---
title: "AI Governance Frameworks"
slug: "governance-frameworks"
module: "policy-compliance"
moduleOrder: 4
sectionOrder: 1
description: "Section 1 of the policy compliance module."
---

Guardrails do not exist in a vacuum. They implement requirements that come from regulations, industry standards, and organizational policies. A cAIge holder must understand the major frameworks well enough to translate their requirements into technical controls — without needing to be a lawyer.

The exam tests your ability to apply frameworks, not memorize article numbers.

### 4.1.1 NIST AI Risk Management Framework (AI RMF)

The National Institute of Standards and Technology (NIST) published the AI RMF to help organizations manage risks associated with AI systems. It is voluntary (not legally binding in most contexts) but widely referenced as a best-practice standard.

**Structure:**

The AI RMF is organized around four core functions:

**GOVERN** — Establishes the organizational culture, policies, and processes for managing AI risk.
- Defines roles and responsibilities for AI risk management
- Sets policies for acceptable AI use
- Establishes risk tolerance thresholds
- Creates accountability structures

**MAP** — Identifies and contextualizes AI risks.
- Catalogs AI systems and their intended uses
- Identifies stakeholders and potential impacts
- Categorizes risks specific to each AI deployment
- Documents assumptions and limitations

**MEASURE** — Assesses, analyzes, and tracks AI risks.
- Defines metrics for evaluating AI system performance and safety
- Establishes testing and evaluation procedures
- Tracks identified risks over time
- Benchmarks against standards and baselines

**MANAGE** — Prioritizes and acts on AI risks.
- Implements risk mitigations (this is where guardrails live)
- Monitors and responds to risks in production
- Communicates risk information to stakeholders
- Plans for incident response

```
         ┌─────────┐
    ┌───>│ GOVERN  │───┐
    │    └─────────┘   │
    │                  v
┌───┴────┐       ┌─────────┐
│ MANAGE │       │   MAP   │
└───┬────┘       └────┬────┘
    ^                 │
    │   ┌─────────┐   │
    └───│ MEASURE │<──┘
        └─────────┘

Continuous cycle — guardrails are implemented
and refined across all four functions.
```

**Guardrail connection:** The AI RMF's MANAGE function is where guardrails are explicitly relevant, but guardrail engineers need to understand all four functions. You GOVERN by setting guardrail policies. You MAP by identifying which risks guardrails address. You MEASURE by testing guardrail effectiveness. You MANAGE by deploying and operating guardrails.

**AI RMF Profiles** allow organizations to customize the framework for their specific context. A healthcare AI deployment would have a different profile than a content recommendation system. Profiles help prioritize which guardrails matter most for a given use case.

### 4.1.2 EU AI Act

The EU AI Act is the world's first comprehensive AI regulation. Unlike the NIST AI RMF, it is legally binding for organizations operating in or serving the European Union.

**Risk-based classification:**

The EU AI Act categorizes AI systems into risk tiers:

**Prohibited AI practices** — Banned outright:
- Social scoring systems by governments
- Real-time biometric identification in public spaces (with narrow exceptions)
- AI systems that exploit vulnerabilities of specific groups
- Subliminal manipulation techniques that cause harm

**High-risk AI systems** — Subject to strict requirements:
- AI in critical infrastructure (energy, transport, water)
- AI in education (admissions, grading)
- AI in employment (hiring, performance evaluation)
- AI in law enforcement, migration, and justice
- AI in healthcare and safety components

Requirements for high-risk systems include:
- Risk management systems (guardrails are a key component)
- Data governance and quality controls
- Technical documentation and transparency
- Human oversight provisions
- Accuracy, robustness, and cybersecurity measures
- Conformity assessments before deployment

**Limited risk** — Transparency obligations:
- Chatbots must disclose they are AI
- AI-generated content must be labeled
- Emotion recognition systems must inform users

**Minimal risk** — No specific requirements (e.g., spam filters, video game AI)

```
EU AI Act Risk Classification:

  ╔═══════════════════════╗
  ║     PROHIBITED        ║  Social scoring, real-time biometric ID
  ╠═══════════════════════╣
  ║     HIGH-RISK         ║  Critical infrastructure, hiring, credit
  ║  (heavy requirements) ║  → risk mgmt, data governance, human oversight
  ╠═══════════════════════╣
  ║     LIMITED RISK       ║  Chatbots, deepfakes
  ║  (transparency only)  ║  → must disclose AI interaction
  ╠═══════════════════════╣
  ║     MINIMAL RISK      ║  Spam filters, games
  ║  (no requirements)    ║  → voluntary codes of conduct
  ╚═══════════════════════╝
```

**Guardrail connection:** For high-risk systems, the EU AI Act effectively mandates guardrails. Requirements for accuracy, robustness, human oversight, and risk management directly translate to guardrail implementations. A cAIge holder working on high-risk systems must be able to demonstrate that their guardrails satisfy these requirements.

**Key concepts for the exam:**
- Know the risk tiers and what makes a system "high-risk"
- Understand the requirements for high-risk systems (you don't need to memorize specific articles)
- Know that transparency obligations apply to chatbots and AI-generated content
- Understand that compliance requires documentation, not just technical controls

### 4.1.3 ISO/IEC 42001

ISO/IEC 42001 is an international standard for AI management systems. It provides a framework for organizations to establish, implement, maintain, and improve their AI management.

**Key concepts:**

- **Management system approach** — Like ISO 27001 (information security), ISO 42001 treats AI governance as a management system requiring continuous improvement
- **Plan-Do-Check-Act cycle** — Plan AI policies, implement them, check effectiveness, act on findings
- **Risk-based thinking** — Identify and address AI-specific risks throughout the lifecycle
- **Annex controls** — Specific controls for AI systems covering data, models, and deployment

**Guardrail connection:** ISO 42001 provides the organizational wrapper for guardrail programs. It requires organizations to have policies (which guardrails implement), monitoring (which guardrail observability provides), and continuous improvement (which guardrail testing and iteration provides).

Organizations pursuing ISO 42001 certification need to demonstrate that their AI systems have appropriate controls — guardrails are a primary way to demonstrate this.

### 4.1.4 OWASP Top 10 for LLM Applications

The OWASP Top 10 for LLM Applications identifies the most critical security risks specific to large language model applications. This is the most directly technical framework and maps almost 1:1 to guardrail requirements.

The list (which is periodically updated):

1. **Prompt Injection** — Manipulating model behavior through crafted inputs
   - Guardrails: Input validation, injection detection, output verification

2. **Insecure Output Handling** — Trusting model output without validation
   - Guardrails: Output sanitization, structured output enforcement, content filtering

3. **Training Data Poisoning** — Manipulating training data to influence model behavior
   - Guardrails: Data provenance tracking, model behavior monitoring, anomaly detection

4. **Model Denial of Service** — Consuming excessive resources through crafted inputs
   - Guardrails: Rate limiting, input size limits, timeout controls

5. **Supply Chain Vulnerabilities** — Risks from third-party models, data, and components
   - Guardrails: Vendor assessment, model provenance verification, dependency management

6. **Sensitive Information Disclosure** — Exposing confidential data through model outputs
   - Guardrails: PII detection, output filtering, data minimization in prompts

7. **Insecure Plugin Design** — Vulnerabilities in tool integrations and plugins
   - Guardrails: Tool access policies, input validation for tools, sandboxing

8. **Excessive Agency** — Granting models too much autonomy or access
   - Guardrails: Scope limiting, approval workflows, least-privilege tool access

9. **Overreliance** — Trusting AI output without appropriate verification
   - Guardrails: Confidence indicators, human review workflows, uncertainty communication

10. **Model Theft** — Unauthorized extraction of model weights or capabilities
    - Guardrails: API access controls, rate limiting, output watermarking

**Guardrail connection:** Each item in the OWASP Top 10 for LLMs directly corresponds to one or more guardrail strategies. This framework is the most actionable for guardrail engineers because it specifies threats at a technical level.

### 4.1.5 Industry-Specific Guidance

Different industries have additional AI governance requirements:

**Healthcare:**
- FDA guidance on AI/ML-based Software as a Medical Device (SaMD)
- HIPAA requirements for protecting patient health information in AI systems
- Requirements for clinical validation of AI-assisted diagnoses
- Guardrail focus: Accuracy, groundedness, PII protection, human oversight for clinical decisions

**Financial Services:**
- Model risk management (SR 11-7 in the US)
- Fair lending requirements — AI-based credit decisions must not discriminate
- Explainability requirements for AI-driven financial decisions
- Guardrail focus: Bias detection, explainability, audit trails, human review for consequential decisions

**Government:**
- Executive orders and agency-specific AI policies
- Requirements for transparency in government AI use
- Procurement requirements for AI vendors
- Guardrail focus: Transparency, accountability, accessibility, bias prevention

**Education:**
- Student data privacy (FERPA in the US)
- Equity and accessibility requirements
- Guardrail focus: PII protection, bias detection, accessibility, scope limiting

### 4.1.6 Responsible AI Principles

Most major AI organizations have published responsible AI principles. While not legally binding, they represent the ethical foundation that guardrails implement. Common principles include:

- **Fairness** — AI systems should not discriminate. Guardrails: bias testing, demographic parity checks.
- **Transparency** — Users should know when they're interacting with AI and understand how decisions are made. Guardrails: disclosure requirements, explainability features.
- **Accountability** — There should be clear responsibility for AI system behavior. Guardrails: audit trails, decision logging.
- **Safety** — AI systems should not cause harm. Guardrails: content filtering, scope limiting, human oversight.
- **Privacy** — AI systems should protect user data. Guardrails: PII detection, data minimization, access controls.
- **Reliability** — AI systems should work as intended. Guardrails: testing, monitoring, fallback mechanisms.

| Framework | Type | Legally Binding | Primary Focus | Guardrail Connection |
|---|---|---|---|---|
| NIST AI RMF | Voluntary framework | No | Risk management lifecycle | Maps guardrails to GOVERN/MAP/MEASURE/MANAGE |
| EU AI Act | Regulation | Yes (in EU) | Risk classification + requirements | Defines guardrail obligations by risk tier |
| ISO/IEC 42001 | Standard | No (voluntary certification) | AI management systems | Guardrails as part of Plan-Do-Check-Act |
| OWASP Top 10 for LLMs | Community guidance | No | Technical vulnerabilities | Direct mapping of threats to guardrail types |

---
