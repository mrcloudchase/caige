---
id: "2.4"
title: "Threat Frameworks and Standards"
slug: frameworks-and-standards
module: risk-and-threat-modeling
sectionOrder: 4
description: "What OWASP's LLM and agentic Top 10 lists, MITRE ATLAS, the NIST AI RMF and AI 600-1, and STRIDE are each for, how to map the failure mode catalog onto them, and why every citation needs a version."
category: cross-cutting
controlLayers: [deterministic, human]
knowledge:
  - "The OWASP Top 10 for LLM Applications 2025 entries LLM01-LLM10, with LLM10 Unbounded Consumption, and that OWASP published a reordered 2026 edition in August 2026."
  - "The OWASP Top 10 for Agentic Applications for 2026 (published December 2025) covers agent-specific risks such as goal hijack, tool misuse, memory and context poisoning, cascading failures, and rogue agents."
  - "MITRE ATLAS is a knowledge base of adversary tactics, techniques, and case studies against AI systems, modeled on ATT&CK."
  - "NIST AI RMF 1.0 (January 2023) defines the Govern, Map, Measure, and Manage functions; NIST AI 600-1 (July 2024) is its Generative AI Profile with 12 risk categories."
  - "STRIDE elicits security threats per data-flow element and must be supplemented with the catalog to find safety failures."
  - "Frameworks are vocabularies and checklists for coverage, not control sets; mappings between them are many-to-many."
skills:
  - "Map failure mode catalog entries to OWASP 2025 IDs, ATLAS technique IDs, and NIST AI 600-1 risk categories, with versions."
  - "Apply STRIDE to each element and boundary of an LLM data-flow diagram."
  - "Choose the right framework for an audience: engineers, red teams, risk committees, or auditors."
  - "Build a coverage check that flags framework entries with no threat-model entry."
sources:
  - title: "OWASP Top 10 for LLM Applications 2025"
    url: "https://genai.owasp.org/llm-top-10/"
  - title: "OWASP LLM01:2025 Prompt Injection"
    url: "https://genai.owasp.org/llmrisk/llm01-prompt-injection/"
  - title: "OWASP Top 10 for LLM Applications 2025 (resource page, published Nov 17, 2024)"
    url: "https://genai.owasp.org/resource/owasp-top-10-for-llm-applications-2025/"
  - title: "OWASP GenAI LLM Top 10 2026 (resource page, Aug 2026)"
    url: "https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/"
  - title: "Help Net Security: OWASP 2026 LLM Top 10 released (Aug 6, 2026)"
    url: "https://www.helpnetsecurity.com/2026/08/06/owasp-2026-llm-top-10-released/"
  - title: "OWASP Top 10 for LLMs 2023 v1.1 (archived PDF)"
    url: "https://owasp.org/www-project-top-10-for-large-language-model-applications/assets/PDF/OWASP-Top-10-for-LLMs-2023-v1_1.pdf"
  - title: "OWASP Top 10 for Agentic Applications for 2026 (Dec 9, 2025)"
    url: "https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/"
  - title: "MITRE ATLAS"
    url: "https://atlas.mitre.org/"
  - title: "MITRE ATLAS data repository"
    url: "https://github.com/mitre-atlas/atlas-data"
  - title: "NIST AI 100-1, AI Risk Management Framework 1.0 (January 2023)"
    url: "https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf"
  - title: "NIST AI 600-1, AI RMF Generative AI Profile (July 2024)"
    url: "https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf"
  - title: "NIST AI Risk Management Framework overview"
    url: "https://www.nist.gov/itl/ai-risk-management-framework"
  - title: "Microsoft: Threat Modeling Tool threats (STRIDE categories)"
    url: "https://learn.microsoft.com/en-us/azure/security/develop/threat-modeling-tool-threats"
lastReviewed: "2026-10-14"
---

# 2.4 Threat Frameworks and Standards

Frameworks give you shared vocabulary with security teams, auditors, and red teams, plus a checklist to catch gaps in your own threat model. They do not give you controls. This section covers the frameworks a guardrail engineer is expected to know, what each is for, and how to map the [failure mode catalog](/training/module/risk-and-threat-modeling/failure-mode-catalog) onto them without losing the version.

## The problem

A team's 2023 design document says its chatbot "mitigates LLM02." The security reviewer reads LLM02 as Sensitive Information Disclosure and asks where the PII controls are. The team meant Insecure Output Handling, which was LLM02 in the 2023 v1.1 list. In the 2025 list that risk is LLM05, renamed Improper Output Handling. Then OWASP publishes a 2026 edition in August 2026, and Improper Output Handling moves again, to tenth.

Nobody was wrong about the risk. The reference had no version, so it stopped meaning one thing. Framework IDs are only meaningful with a version: write "OWASP LLM05:2025", never "LLM05".

## Why it happens

Each framework was built for a different audience and job. Confusion comes from treating them as interchangeable or as control catalogs.

| Framework | Version to cite | Built for | Unit | Use it to |
|---|---|---|---|---|
| OWASP Top 10 for LLM Applications | 2025 (published Nov 2024); a 2026 edition followed in Aug 2026 | Application builders | A ranked list of vulnerability classes | Check coverage; talk to AppSec teams |
| OWASP Top 10 for Agentic Applications | 2026 (published Dec 9, 2025) | Builders of tool-using agents | Ranked agentic risk classes | Check agent-specific coverage |
| MITRE ATLAS | Cite the data release you used | Red teams, threat intel, detection engineers | Tactics, techniques with IDs, case studies | Describe attacker behavior; plan red-team scenarios |
| NIST AI RMF | AI 100-1, version 1.0 (Jan 2023) | Organizations and risk owners | Functions (Govern, Map, Measure, Manage) and trustworthiness characteristics | Structure the risk-management process |
| NIST AI 600-1 | July 2024 | Organizations deploying generative AI | 12 GenAI risk categories with suggested actions | Map risks for governance and audit |
| STRIDE | Method, not versioned | Engineers doing design review | Six threat types per data-flow element | Elicit threats systematically from a diagram |

### OWASP Top 10 for LLM Applications (2025)

The 2025 list, mapped to the catalog. The last column shows where each entry moved in the 2026 edition, as published by OWASP in August 2026. This program teaches the 2025 IDs because most current tooling, audits, and vendor documentation still reference them.

| ID (2025) | Name | Catalog entries | Category | 2026 position |
|---|---|---|---|---|
| LLM01:2025 | Prompt Injection | Direct, indirect, and multimodal injection; jailbreaking (OWASP treats jailbreaking as a form of injection) | security | 1 |
| LLM02:2025 | Sensitive Information Disclosure | Training data extraction, context and cross-tenant leakage | security | 2 |
| LLM03:2025 | Supply Chain | Supply-chain compromise, package hallucination (exploited) | security | 4 |
| LLM04:2025 | Data and Model Poisoning | Data and model poisoning | security | 5 |
| LLM05:2025 | Improper Output Handling | Improper output handling, markdown exfiltration | security | 10 |
| LLM06:2025 | Excessive Agency | Excessive agency, overreach | containment | 3 |
| LLM07:2025 | System Prompt Leakage | System prompt leakage | security | 8, renamed Hidden Context Exposure |
| LLM08:2025 | Vector and Embedding Weaknesses | RAG corpus poisoning, unfiltered retrieval | security | 9 |
| LLM09:2025 | Misinformation | Hallucination, sycophancy (partly) | safety | 7 |
| LLM10:2025 | Unbounded Consumption | Unbounded consumption, denial of wallet | containment | 6 |

Catalog entries with no clean OWASP LLM home: over-refusal, harmful content (outside of jailbreaks), off-scope behavior, behavior drift after provider updates, memory poisoning (covered by the agentic list), and cascading agent failures (agentic list). OWASP's LLM list is a security list. It was not designed to cover safety failures with no adversary, so a threat model that only maps to it will under-cover safety.

### OWASP Top 10 for Agentic Applications (2026)

Published by the OWASP GenAI Security Project on December 9, 2025, this list uses IDs ASI01 to ASI10:

| ID | Name | Closest catalog entries |
|---|---|---|
| ASI01 | Agent Goal Hijack | Direct and indirect injection that redirects the agent's objective |
| ASI02 | Tool Misuse and Exploitation | Excessive agency, improper output handling into tools |
| ASI03 | Identity and Privilege Abuse | Confused deputy, excessive agency |
| ASI04 | Agentic Supply Chain Vulnerabilities | Supply-chain compromise (tools, MCP servers, plugins) |
| ASI05 | Unexpected Code Execution | Improper output handling into interpreters and shells |
| ASI06 | Memory and Context Poisoning | Memory poisoning, RAG poisoning |
| ASI07 | Insecure Inter-Agent Communication | Cascading failures, injection between agents |
| ASI08 | Cascading Failures | Cascading agent failures |
| ASI09 | Human-Agent Trust Exploitation | Approvals shown the model's story; sycophancy toward approvers |
| ASI10 | Rogue Agents | An agent acting outside its intended behavior, by compromise or misalignment |

Use both lists for agentic systems. The agentic list covers what the LLM list leaves out: persistence, multi-agent trust, and the human approval loop.

### MITRE ATLAS

ATLAS (Adversarial Threat Landscape for AI Systems) follows the structure of MITRE ATT&CK: tactics (the attacker's goal at each stage, such as Reconnaissance, Initial Access, Exfiltration, Impact), techniques with stable IDs, and documented case studies. Red teams use it to plan scenarios and to describe findings in a common language. Detection engineers use it to decide what to log. Technique IDs relevant to the catalog, as listed in ATLAS data release v2026.09 (September 2026). ATLAS now publishes date-versioned releases, so check for the current one before citing:

| ATLAS ID | Technique | Catalog entry |
|---|---|---|
| AML.T0051.000 / .001 | LLM Prompt Injection: Direct / Indirect | Direct / indirect injection |
| AML.T0054 | LLM Jailbreak | Jailbreaking |
| AML.T0056 | Extract LLM System Prompt | System prompt leakage |
| AML.T0057 | LLM Data Leakage | Context leakage, training data extraction |
| AML.T0070 | RAG Poisoning | Poisoning (retrieval) |
| AML.T0020 | Training Data Poisoning | Poisoning (training) |
| AML.T0080.000 | AI Agent Context Poisoning: Memory | Memory poisoning |
| AML.T0086 | Exfiltration via AI Agent Tool Invocation | Exfiltration through tools |
| AML.T0010 | AI Supply Chain Compromise | Supply-chain compromise |
| AML.T0029 / AML.T0034 | Denial of AI Service / Cost Harvesting | Unbounded consumption |

ATLAS is attacker-centric by design. It has no technique for a model that hallucinates or over-refuses on its own.

### NIST AI RMF 1.0 and AI 600-1

The AI RMF (NIST AI 100-1, January 2023) is a process framework. Its four functions are **Govern** (policies, roles, accountability), **Map** (context and risks of a specific system), **Measure** (analysis and tracking), and **Manage** (prioritization and response). It lists trustworthiness characteristics, including "valid and reliable", "safe", and "secure and resilient". It says that when a system presents unacceptable risk, "development and deployment should cease in a safe manner until risks can be sufficiently managed." That is a governance-level statement of the stop capability this program calls containment.

NIST AI 600-1 (July 2024) is the RMF's Generative AI Profile. It names 12 risks: CBRN Information or Capabilities; Confabulation; Dangerous, Violent, or Hateful Content; Data Privacy; Environmental Impacts; Harmful Bias and Homogenization; Human-AI Configuration; Information Integrity; Information Security; Intellectual Property; Obscene, Degrading, and/or Abusive Content; and Value Chain and Component Integration. Unlike OWASP, it covers safety failures directly: confabulation corresponds to hallucination, and Human-AI Configuration covers over-reliance and automation bias. Risk committees and auditors often ask for this mapping (section [7.5](/training/module/operations-and-governance/regulation-and-standards)).

### STRIDE applied to LLM systems

STRIDE is a method, not a list. For each element and trust boundary on your data-flow diagram (section [2.2](/training/module/risk-and-threat-modeling/principals-authority-trust-boundaries)), ask the six questions:

| STRIDE threat | Violates | In an LLM system |
|---|---|---|
| Spoofing | Authentication | Injected text claiming to be the system or an admin; a fake tool server; one agent impersonating another |
| Tampering | Integrity | Poisoned RAG documents or memories; a tool description changed after approval; edited logs |
| Repudiation | Non-repudiation | Agent actions with no attributable, tamper-evident record of who requested them |
| Information disclosure | Confidentiality | System prompt and context leakage; markdown or tool-based exfiltration; data sent to the provider |
| Denial of service | Availability | Unbounded consumption; denial of wallet; context flooding |
| Elevation of privilege | Authorization | Prompt injection borrowing operator authority; excessive agency; confused deputy |

STRIDE asks about security properties, so it does not find hallucination, sycophancy, or over-refusal. Run STRIDE per boundary for security, then go through the safety entries of the catalog separately.

## Control patterns

Use the frameworks in order of what they are good at:

1. **Elicit** threats from your own diagram with STRIDE and the catalog. Starting from a top-10 list makes you think about the list instead of your system.
2. **Check coverage** against OWASP LLM 2025 and, for agents, OWASP Agentic 2026. Every entry needs either a threat in your model or a written reason it does not apply.
3. **Describe attacks** for red-team plans and findings with ATLAS IDs, so results are comparable across engagements (section [6.4](/training/module/evaluation-and-red-teaming/red-team-engagements)).
4. **Report** to governance in NIST AI RMF and AI 600-1 terms, with the engineering evidence underneath.

Store every mapping with the framework version. When a framework revises, re-map deliberately rather than renumbering by search-and-replace.

## Implementation

Keep mappings as data next to the threat model, and check coverage in CI:

```python
OWASP_LLM_2025 = {
    "LLM01": "Prompt Injection",
    "LLM02": "Sensitive Information Disclosure",
    "LLM03": "Supply Chain",
    "LLM04": "Data and Model Poisoning",
    "LLM05": "Improper Output Handling",
    "LLM06": "Excessive Agency",
    "LLM07": "System Prompt Leakage",
    "LLM08": "Vector and Embedding Weaknesses",
    "LLM09": "Misinformation",
    "LLM10": "Unbounded Consumption",
}


def owasp_coverage(threats: list[dict], not_applicable: dict[str, str]) -> list[str]:
    """threats: entries like {"id": "T-004", "owasp_llm_2025": ["LLM01", "LLM05"]}.
    not_applicable: OWASP ID -> written justification."""
    covered: set[str] = set()
    problems = []
    for t in threats:
        for ref in t.get("owasp_llm_2025", []):
            if ref not in OWASP_LLM_2025:
                problems.append(f"{t['id']}: unknown OWASP 2025 ID {ref!r}")
            covered.add(ref)
    for oid, name in OWASP_LLM_2025.items():
        if oid not in covered and not not_applicable.get(oid, "").strip():
            problems.append(f"{oid} {name}: no threat entry and no justification")
    return problems
```

The field name carries the version (`owasp_llm_2025`). When you adopt the 2026 edition, add an `owasp_llm_2026` field and map it explicitly. Do not overwrite the old one, because past audit evidence refers to it.

## Where it breaks

- **Coverage is not protection.** Every OWASP ID can be "covered" by a threat entry whose control is a system prompt. The coverage check verifies that a threat was considered, not that it was controlled. Section [2.1](/training/module/risk-and-threat-modeling/safety-security-containment)'s layer check verifies control strength.
- **Lists lag attacks.** Top 10 lists are revised every year or two, and ATLAS adds techniques after they are documented. New attack classes appear in research and incidents first.
- **Mappings are many-to-many and lossy.** Jailbreaking falls under LLM01 in OWASP but is a separate technique in ATLAS. Over-refusal has no OWASP home at all, and sycophancy fits LLM09 only partly. A one-to-one mapping table hides these gaps.
- **Security lists miss safety.** OWASP and ATLAS are security frameworks. A system can look complete against both while ignoring over-refusal, harmful content on benign input, and drift. NIST AI 600-1 and the catalog fill that gap.
- **Compliance can replace thinking.** A threat model written to satisfy a framework tends to follow the framework's structure instead of the system's data flows, and it misses whatever is unique to the system.
- **Versions churn.** IDs move between editions, as LLM02 and LLM05 did. Undated references become ambiguous.

## Lab exercise

In [Lab 2: Threat Model](/labs/lab-2-threat-model), Task 2.4, you map the threats you identified for the lab system to OWASP LLM 2025 IDs, OWASP Agentic 2026 IDs where relevant, ATLAS technique IDs, and NIST AI 600-1 risk categories, recording versions and justifying every framework entry you mark not applicable.

## Check your understanding

1. A vendor datasheet says its product "covers LLM05." What should you ask before accepting that?
2. Which framework would you use to describe a red-team finding so it can be compared across engagements, and which to report to a risk committee?
3. You apply STRIDE to every boundary of a medical-information chatbot and find nothing about wrong dosage answers. Why, and what fills the gap?
4. Which of the following belongs to the OWASP Agentic 2026 list but has no direct entry in OWASP LLM 2025: memory and context poisoning, prompt injection, or supply chain?

<details>
<summary>Answers</summary>

1. Which edition. LLM05 is Improper Output Handling in 2025 but was Supply Chain Vulnerabilities in 2023 v1.1. Then ask what control at what layer provides the coverage, because "covers" does not tell you its strength.
2. MITRE ATLAS technique IDs for the red-team finding. NIST AI RMF functions and AI 600-1 risk categories for the risk committee, with engineering evidence underneath.
3. STRIDE elicits violations of security properties, and a wrong dosage answer with no adversary is a safety (reliability) failure. Go through the safety entries in the failure mode catalog. NIST AI 600-1's Confabulation category covers it for governance mapping.
4. Memory and context poisoning (ASI06). Prompt injection and supply chain are LLM01:2025 and LLM03:2025.

</details>
