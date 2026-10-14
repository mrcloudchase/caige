---
title: "Learning Objectives"
slug: "learning-objectives"
module: "understanding-failure-modes"
sectionOrder: 0
description: "What you will be able to do after completing the Understanding Failure Modes module."
---

## Domain 2: Understanding Failure Modes — Learning Objectives

After completing this module, you will be able to:

- **Map architectural properties of LLMs to specific risks** — connecting attention mechanisms to prompt injection, distributed weights to data leakage, probabilistic generation to hallucination, and learned safety boundaries to jailbreaking — and explain why each mapping drives guardrail requirements.

- **Identify trust boundaries in any AI system architecture** and explain why guardrails must exist at every point where data crosses from trusted to untrusted (or vice versa), including user input, retrieved documents, tool responses, and model output.

- **Explain why defense in depth is required** by describing the three layers of defense — model training, system prompt, and application-level guardrails — and demonstrating how each layer can fail independently.

- **Describe how RAG and agentic patterns expand the attack surface** beyond simple chat applications, including retrieval poisoning, indirect prompt injection through documents, tool misuse, cascading failures, privilege escalation, and identity delegation.

- **Categorize the nine major failure modes** — hallucination, prompt injection, jailbreaking, data leakage, toxic output, off-topic drift, over-reliance, cascading agentic failures, and identity/access failures — by severity, likelihood, technical cause, and the guardrail strategies that address each.

- **Distinguish between prompt injection and jailbreaking** at a technical level, explaining why they require different detection and mitigation strategies despite both being adversarial attacks on model behavior.

- **Conduct a threat model for an AI application** using AI-specific frameworks including the OWASP Top 10 for LLM Applications, identifying key risks, attack vectors, adversary profiles, and guardrail requirements.

- **Assess adversary profiles** — malicious users, competitors, security researchers, and insiders — mapping each to their motivations, capabilities, and typical attack techniques to prioritize guardrail investment.

- **Evaluate supply chain risks** in AI systems, including third-party models, poisoned weights, poisoned datasets, and untrusted MCP servers, and identify guardrail strategies that mitigate these risks.

- **Prioritize guardrail investment** using risk assessment techniques (likelihood vs. impact analysis) to allocate engineering effort to the threats that matter most for a given use case.

---
