---
title: "Security Engineering"
slug: security-engineering
order: 3
domain: 3
weight: "20%"
description: "Controls that stop an adversary from borrowing authority through an AI system: prompt injection defenses, input and output handling, data isolation, delegated identity, and the AI supply chain."
studyTime: "7-9 hours"
lab: lab-3-security-hardening
---

# Security Engineering

Security failures are the ones with an adversary behind them. Someone plants instructions in an email, a web page, a GitHub issue, or a tool description, and the model treats those instructions as if they came from a principal with real authority. Or someone ships a poisoned model file, an MCP server that changes after you approve it, or a retrieval index that ignores who is asking. In every case the attacker is trying to borrow authority they do not hold in the system/developer > user > tool and retrieved-content hierarchy.

This domain is about the controls that deny that borrowed authority. It starts with prompt injection, because injection is the attack that makes most of the others possible, and because it has no fix that works the way parameterized queries fix SQL injection. Detection lowers the attack success rate. Architecture limits what a successful injection can do. The rest of the domain builds that architecture: input handling that normalizes and bounds what reaches the model, output handling that treats every model response as untrusted input to the next system, data protection that filters retrieval by the caller's identity before anything reaches the context window, delegated identity that keeps the agent from becoming a confused deputy, and supply-chain controls for the models, datasets, tools, and extensions you did not write.

## Why it matters to a guardrail engineer

The incidents in this domain share a shape. EchoLeak, the Slack AI exfiltration, and the GitHub MCP leak each combined private data, untrusted content, and a way to send data out, and in each a classifier or a prompt was the only thing standing in the way. The design test from Domain 2 applies directly: if the model were fully compromised, what is the worst it could do? This domain teaches you to answer "read only what this user may read, and send it nowhere the user did not intend" and then to build the deterministic controls that make that answer true.

## How this domain connects to the others

Domain 1 explains the single-channel problem (section 1.3) that makes injection possible. Domain 2 supplies the trust boundaries, the lethal trifecta, and the blast-radius analysis that decide which controls you need. Domain 4 covers safety controls that share infrastructure with these, such as classifiers and structured output, but face no adversary. Domain 5 takes the deterministic controls here (least privilege, egress control, approvals) and applies them to agents as containment. Domain 6 tests these defenses with adaptive attacks, and Domain 7 runs them in production.

## Learning outcomes

After this domain you should be able to:

1. Explain why prompt injection is unsolved, distinguish it from jailbreaking, and describe why detectors fail against adaptive attackers.
2. Design an agent architecture (dual-LLM, plan-then-execute, capability and data-flow control) that bounds what injected content can do.
3. Implement input handling with Unicode normalization, correctly keyed rate limits, and escaped or randomized delimiters.
4. Treat model output as untrusted: encode it for its destination, block markdown exfiltration, and route model-chosen URLs through an allowlisting egress proxy.
5. Enforce retrieval-time authorization, tenant isolation, PII handling, and keyed pseudonymization.
6. Design delegated access with scoped, short-lived, audience-bound tokens and no token passthrough.
7. Vet and pin third-party models, datasets, MCP servers, and extensions.

In [Lab 3: Security Hardening](/labs/lab-3-security-hardening) you take a deliberately vulnerable RAG agent and close its injection, exfiltration, authorization, and supply-chain gaps one control at a time.
