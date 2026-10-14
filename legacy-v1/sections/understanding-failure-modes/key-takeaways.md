---
title: "Key Takeaways"
slug: "key-takeaways"
module: "understanding-failure-modes"
sectionOrder: 4
description: "Summary of the most important concepts from the Understanding Failure Modes module."
---

## Domain 2: Understanding Failure Modes — Key Takeaways

- **Every architectural property of an LLM maps to a specific risk.** Flat attention enables prompt injection. Distributed weights enable data leakage. Probabilistic generation enables hallucination. Learned safety boundaries enable jailbreaking. Understanding these mappings lets you predict vulnerabilities from first principles rather than memorizing a list of attacks.

- **The instruction hierarchy is a learned preference, not an enforced constraint.** System prompts influence model behavior through the same probabilistic mechanism as user input. No amount of "never do X" instructions in the system prompt provides a hard security guarantee. Application-level guardrails — code running outside the model — are the only way to enforce deterministic constraints.

- **Trust boundaries exist at every point where data crosses between trust levels.** User input to application (TB1), assembled prompt to model (TB2), external data to application (TB3), and model output to tool execution (TB4). Each boundary needs its own guardrails. Missing a boundary creates a gap that adversaries will find.

- **Defense in depth is required because each layer fails independently.** Model training catches most harmful requests but is probabilistic. System prompts narrow scope but can be overridden. Application guardrails enforce hard constraints but add latency and cost. All three layers are necessary — no single layer is sufficient.

- **RAG and agentic patterns dramatically expand the attack surface.** RAG introduces retrieval poisoning, indirect injection through documents, and document-level access control challenges. Agentic patterns introduce tool misuse, cascading failures, privilege escalation, and identity delegation. Every capability you add to an AI system adds attack surface that needs guardrails.

- **Prompt injection and jailbreaking are distinct threats requiring different defenses.** Prompt injection overrides the system's *instructions* by exploiting the flat attention mechanism. Jailbreaking overrides the model's *training* by finding inputs that shift probability away from safety behaviors. Injection requires input validation and structural defenses; jailbreaking requires multi-layer detection including output filtering.

- **Hallucination is inherent to probabilistic generation and cannot be eliminated by training.** LLMs produce the most *probable* continuation, not the most *true* one. They have no internal fact-checking mechanism. Output guardrails — groundedness checking, citation enforcement, confidence scoring, and human review for high-stakes decisions — are essential mitigations.

- **Cascading failures in agentic systems amplify errors across steps.** One wrong tool call feeds incorrect results into the next step, which takes another wrong action, compounding damage. Agentic guardrails must include intermediate validation checkpoints, scope limits, confirmation workflows for high-risk actions, and rollback capabilities.

- **Threat modeling must account for AI-specific attack surfaces and adversary profiles.** Prompts, training data, retrieval corpora, tool integrations, model APIs, and MCP servers are all attack surfaces unique to AI. Adversary profiles range from curious users to organized threat actors, each requiring different guardrail priorities.

- **The OWASP Top 10 for LLM Applications provides a systematic framework for threat coverage.** Walking through all ten categories — from prompt injection to unbounded consumption — ensures you have not missed a critical risk category for your application.

- **Supply chain risks extend beyond code dependencies to models, datasets, and tool servers.** Third-party models may have poisoned training data. Fine-tuned models may have degraded safety behaviors. Third-party MCP servers can inject adversarial content through tool results. Every link in the AI supply chain is a potential attack vector.

- **Risk assessment is context-dependent — the same failure mode has different severity in different applications.** Hallucination is a minor annoyance in a creative writing tool and a critical safety hazard in a medical application. Guardrail investment must be proportional to the actual likelihood and impact for your specific system, informed by structured threat modeling rather than generic best practices.

---
