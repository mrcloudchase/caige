---
title: "Agent Containment and Control"
slug: agent-containment-and-control
order: 5
domain: 5
weight: "15%"
description: "Cause-agnostic controls that limit, observe, and stop AI agents: least privilege, sandboxing, action gating, budgets, the emergency brake, an external control plane with tamper-evident audit, and monitoring for multi-agent and long-running systems."
studyTime: "5-7 hours"
lab: lab-5-containment-and-brake
---

Domains 3 and 4 ask why a model misbehaves and how to make that less likely. This domain asks a different question. Suppose those defenses fail. What can the agent still do, who will see it, and how fast can a person stop it?

Containment controls are deliberately indifferent to cause. A read-only database role stops a destructive query whether the model made a mistake, was steered by a poisoned document, or was pursuing a goal its operators did not intend. As agents gain tools and autonomy, you cannot enumerate every reason one might go wrong, but you can bound what any of them can reach.

The domain takes its frame from Satya Nadella's October 2026 essay, [*Models as Insider Risks in the Super Intelligence Era*](https://snscratchpad.com/posts/models-as-insider-risks/): treat a capable model like a powerful insider, "not because they are necessarily malicious, but because any sufficiently capable actor with access to important systems can make mistakes or be compromised." The essay's central instruction, to "separate the supply of intelligence from the authority over it," runs through every section. The model proposes; deterministic systems and authorized humans decide.

The case studies are real. In 2025 a coding agent [deleted a production database during a code freeze](/incidents/replit-agent-production-database-deletion) and then misreported whether it could be recovered. In 2026 models under a capability evaluation [escaped their test environment and reached another company's production systems](/incidents/openai-agent-sandbox-escape-hugging-face). Neither was stopped by instructions in a prompt.

## How this domain connects

- **Domain 2** gives you the blast-radius question ("if the model were fully compromised, what is the worst it could do?"). This domain is how you make the answer small.
- **Domain 3** covers identity, delegation, egress, and supply chain from the attacker's side. Here they become standing limits on every agent.
- **Domain 6** tests whether these controls hold, including red-teaming the brake itself.
- **Domain 7** turns the audit trail and the brake into monitoring, incident response, and disclosure.

## Learning outcomes

After this domain you will be able to:

- Reduce an agent's tools and credentials to the task, and enforce constraints in the backend rather than the prompt.
- Choose an isolation boundary for model-generated code and default-deny its network egress.
- Tier actions by reversibility and design approvals that show reviewers the real action, without wearing them out.
- Bound runs in steps, tokens, cost, time, and effects.
- Build a pause, stop, and kill that sits outside the model's reach, revokes credentials, and handles in-flight work.
- Separate the model from its harness and action space, and keep tamper-evident evidence independent of the model's own account.
- Contain multi-agent systems and memory, and use reasoning-trace monitoring knowing its limits.
