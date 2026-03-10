---
title: "Key Takeaways"
slug: "key-takeaways"
module: "ai-fundamentals"
sectionOrder: 4
description: "Section 4 of the ai fundamentals module."
---

1. LLMs generate output through next-token prediction with probability distributions. Non-determinism is inherent — guardrails must account for variable output from the same input.

2. The context window is where guardrails live and compete for space with user content, system instructions, and retrieved documents.

3. Model-level safety (training) and application-level guardrails (your code) serve different purposes. You need both, and you control only the latter.

4. There are nine major failure modes: hallucination, prompt injection, jailbreaking, data leakage, toxic output, off-topic drift, over-reliance, cascading agentic failures, and identity/access failures. Each requires different guardrail strategies.

5. Prompt injection is arguably the most important failure mode to understand because it can bypass instruction-level and system-prompt-level guardrails. Models learn an instruction hierarchy through training (system prompts carry authority over user input), but this is a learned soft preference, not an architectural enforcement. Because language is subjective and attention processes all context in parallel, the hierarchy can be circumvented — which is why system prompts help but are never sufficient alone.

6. Agentic systems dramatically expand the attack surface from "bad text" to "bad actions with real-world consequences."

7. Threat modeling for AI systems follows the same principles as traditional threat modeling, extended to cover AI-specific attack surfaces: prompts, training data, retrieval corpora, tool integrations, and model APIs.

8. Trust boundaries are where guardrails belong. Every time data crosses a trust boundary, validate it.

---
