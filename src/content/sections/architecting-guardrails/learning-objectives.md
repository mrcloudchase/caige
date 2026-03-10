---
title: "Learning Objectives"
slug: "learning-objectives"
module: "architecting-guardrails"
sectionOrder: 0
description: "What you will be able to do after completing the Architecting Guardrails module."
---

## Domain 3: Architecting Guardrails — Learning Objectives

After completing this module, you will be able to:

- **Classify guardrails using a comprehensive taxonomy** — distinguishing input, output, system-level, retrieval, agentic, and human-in-the-loop guardrails by placement, purpose, and trade-offs — and select the right combination for a given use case.

- **Design a multi-layered guardrail strategy** that applies defense in depth, ordering checks from cheapest to most expensive, and ensuring that no single guardrail failure leaves the system unprotected.

- **Architect input guardrail pipelines** that chain prompt validation, injection detection (pattern-based, classifier-based, and LLM-as-judge), schema enforcement, topic classification, rate limiting, and identity-aware access control in an efficient sequence.

- **Architect output guardrail pipelines** that enforce content safety (toxicity, bias), detect and redact PII, verify factual groundedness, validate structured output against schemas, enforce citation requirements, and apply confidence-based routing — including designing appropriate refusal behaviors.

- **Design system-level guardrails** including safety-oriented system prompts, conversation memory management, fallback and circuit breaker patterns, model selection and routing strategies, multi-model verification architectures, and canary/shadow deployment for safe rollout.

- **Apply guardrail patterns specific to RAG pipelines** — including source document access control, relevance filtering, indirect prompt injection defense, source attribution enforcement, chunk-level versus document-level policy, contradiction handling, and staleness detection.

- **Design guardrails for agentic AI systems** — including tool use policies, action confirmation workflows, scope limiting, sandboxing, budget and resource caps, reasoning trace auditing, multi-agent trust boundaries, and identity delegation with privilege boundaries.

- **Evaluate guardrail architectures for MCP-based tool integrations** — reasoning about trust boundaries, permission scoping, and supply chain risks when AI agents interact with third-party tool servers through integration protocols.

- **Analyze the trade-offs of each guardrail placement** — weighing latency, cost, false positive rate, coverage gaps, and user experience impact — and justify architectural decisions with concrete reasoning.

- **Design human-in-the-loop escalation tiers** that route uncertain or high-risk decisions to human reviewers based on confidence scores, risk classification, and operational context, without creating bottlenecks that undermine system usability.

- **Apply the principle of least privilege to AI system design** — scoping model access, tool permissions, data visibility, and action authority to the minimum required for each task, and enforcing those boundaries architecturally rather than relying on prompt instructions alone.

- **Compose guardrail components into a complete system architecture** for a realistic application, documenting placement decisions, failure modes, bypass risks, and operational considerations in a design that could be reviewed by a security team.

---
