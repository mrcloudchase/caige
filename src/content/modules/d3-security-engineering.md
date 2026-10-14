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

Security failures have an adversary behind them: instructions planted in an email, web page, or tool description; a poisoned model file; an MCP server that changes after approval. In each case the attacker borrows authority they do not hold in the system/developer > user > tool and retrieved-content hierarchy.

This domain covers the controls that deny that borrowed authority. It starts with prompt injection, which enables most of the other attacks and has no fix equivalent to parameterized queries. Detection lowers the attack success rate; architecture limits what a successful injection can do. The rest of the domain builds that architecture: input handling, output handling that treats every response as untrusted input to the next system, retrieval filtered by the caller's identity, delegated identity that keeps the agent from becoming a confused deputy, and supply-chain controls for components you did not write.

## Why it matters to a guardrail engineer

EchoLeak, the Slack AI exfiltration, and the GitHub MCP leak each combined private data, untrusted content, and a way to send data out. The design test from Domain 2 applies directly: if the model were fully compromised, what is the worst it could do? This domain teaches you to make the answer "read only what this user may read, and send it nowhere the user did not intend," and to enforce that with deterministic controls.

## How this domain connects to the others

Domain 1 explains the single-channel problem that makes injection possible. Domain 2 supplies the trust boundaries and the lethal trifecta that decide which controls you need. Domain 5 applies the same deterministic controls to agents as containment. Domain 6 tests these defenses with adaptive attacks, and Domain 7 runs them in production.

## Learning outcomes

After this domain you should be able to:

1. Explain why prompt injection is unsolved, how it differs from jailbreaking, and why detectors fail against adaptive attackers.
2. Design agent architectures (dual-LLM, plan-then-execute, capability and data-flow control) that bound what injected content can do.
3. Implement input handling with Unicode normalization, correctly keyed limits, and escaped or randomized delimiters.
4. Encode model output for its destination, block markdown exfiltration, and enforce egress allowlists.
5. Enforce retrieval-time authorization, tenant isolation, PII handling, and keyed pseudonymization.
6. Design delegated access with scoped, short-lived, audience-bound tokens and no token passthrough.
7. Vet and pin third-party models, datasets, MCP servers, and extensions.

In [Lab 3: Security Hardening](/labs/lab-3-security-hardening) you fix the security risks from your Lab 2 threat model in your practice system, starting with the controls that bound damage.
