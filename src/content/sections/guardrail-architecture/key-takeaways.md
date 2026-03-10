---
title: "Key Takeaways"
slug: "key-takeaways"
module: "guardrail-architecture"
sectionOrder: 7
description: "Section 7 of the guardrail architecture module."
---

1. Guardrails are categorized as input, output, system-level, retrieval, agentic, and human-in-the-loop. Most production systems need multiple types working together.

2. Defense in depth is the governing design principle. No single guardrail type is sufficient. Layer cheap, fast checks before expensive, thorough ones.

3. Input guardrails use a layered approach: rules first (fast/cheap), then classifiers (moderate), then LLM-as-judge (expensive) only when needed.

4. Output guardrails must handle content filtering, PII detection, groundedness checking, and structured output validation. Refusal messages should be helpful, not exposing.

5. System prompts are the foundation but not a security boundary. Never rely on them as your only guardrail.

6. RAG systems need retrieval-level access controls (not just output filtering), indirect injection defense, and citation verification.

7. Agentic guardrails must include tool access policies, confirmation workflows, scope limits, sandboxing, and rollback capabilities. The risk model shifts from "bad text" to "bad actions."

8. Identity is a guardrail concern, not just a prerequisite. Multi-tenant isolation, identity-aware guardrail tuning, and preventing impersonation through prompts are all design responsibilities.

9. In agentic systems, identity delegation determines whose permissions the agent acts under. Agents should never escalate beyond the invoking user's access level.

10. Tool integration protocols like MCP introduce trust boundaries between your application and external tool servers. Permission scoping, injection defense on tool results, transport security, and third-party server evaluation are all guardrail requirements.

11. Human-in-the-loop is a guardrail of last resort for high-stakes and ambiguous situations. Design it so escalation is useful, not just a bottleneck.

---
