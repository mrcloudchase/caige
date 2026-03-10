---
title: "Key Takeaways"
slug: "key-takeaways"
module: "prerequisites"
sectionOrder: 7
description: "Section 7 of the prerequisites module."
---

1. Neural networks learn by adjusting billions of weights through training. Knowledge is distributed across these weights and cannot be inspected, queried, or selectively removed — which is why you cannot "delete" dangerous knowledge from a model.

2. LLMs are decoder-only transformers trained on next-token prediction at massive scale. Every capability they demonstrate — following instructions, refusing harmful requests, providing accurate information — is a learned statistical pattern, not a hard-coded behavior.

3. The attention mechanism processes all tokens in the context window in parallel with no distinction between trusted and untrusted content. This is the architectural root of prompt injection.

4. The autoregressive generation loop produces output one token at a time using probabilistic sampling. Non-determinism is inherent — the same input can produce different outputs on different runs.

5. LLM training happens in stages: pre-training gives knowledge, instruction tuning gives conversational ability, RLHF adds safety behaviors. Each stage creates capabilities AND risks.

6. The instruction hierarchy — where system prompts take priority over user input — is a learned preference from training data, not an architectural enforcement. It can be bypassed.

7. RAG and agentic patterns expand the attack surface from "bad text" to "bad actions with real-world consequences." Every external data source and tool integration introduces new trust boundaries.

8. The risks are inherent to the architecture, not bugs to be fixed. Guardrails exist because model-level safety is necessary but insufficient.

---
