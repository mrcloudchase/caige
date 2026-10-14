---
title: "Glossary"
slug: glossary
order: 3
description: "Terms used across the cAIge program."
---

# Glossary

Section references point to where each term is taught in depth.

| Term | Definition |
|---|---|
| **Action gating** | Requiring a check, often human approval, before an agent executes an action, based on the action's risk and reversibility. (5.3) |
| **Adaptive attack** | An attack that is iterated against a specific defense until it succeeds. Defenses must be evaluated against adaptive attackers, not just fixed lists of known prompts. (6.4) |
| **Attack success rate (ASR)** | Successful attacks divided by attempts, measured over multiple trials because model behavior is stochastic. Success is judged on the response or action, not on whether a filter fired. (6.2) |
| **Audit log (tamper-evident)** | An append-only record of meaningful model actions, stored where the model and its harness cannot modify it, so outcomes can be reconstructed without relying on the model's account. (5.6) |
| **Blast radius** | The worst outcome a component could cause if it were fully compromised. Architecture limits blast radius; classifiers mainly reduce likelihood. (2.5) |
| **Brake (emergency brake)** | A human-operated control, enforced outside the model, that can pause, stop, or kill a running AI system mid-task. (5.5) |
| **Category** | The program's classification of a failure or control by its source: safety, security, or containment. (2.1) |
| **Confused deputy** | A privileged component (here, an agent) tricked into using its authority on behalf of a party that lacks that authority. (3.6) |
| **Constrained decoding** | Restricting generation so output must match a grammar or schema. Reduces malformed output but still fails on truncation and refusals. (4.6) |
| **Containment** | Controls that limit, observe, and stop a model whatever the reason it misbehaves. Based on treating the model as an insider risk. (2.1, Domain 5) |
| **Control layer** | Where a control is enforced, from weakest to strongest: model, prompt, runtime ML, deterministic, human. (2.1) |
| **Control plane** | The components that decide what a model may access and do, kept separate from the model and outside its reach. (5.6) |
| **Direct prompt injection** | Instructions supplied by the user to override the system's intended behavior. (3.1) |
| **Dual-LLM pattern** | An architecture where a privileged model never reads untrusted content and a quarantined model that reads it has no tool access. (3.2) |
| **Egress control** | Restricting where a system can send data over the network, such as URL allowlists, an egress proxy, or a content security policy. (3.4, 5.2) |
| **Excessive agency** | Giving a model more tools, permissions, or autonomy than its task requires (OWASP LLM06:2025). (5.1) |
| **Fail-closed / fail-open** | What a guardrail does when it errors or times out: block, or allow. Chosen by risk. Neither setting contains an active bypass that is not causing errors. (4.7, 7.2) |
| **False-refusal rate** | The share of benign requests that are blocked or refused. Measures user friction and is reported alongside ASR. (4.4, 6.2) |
| **Groundedness** | Whether each claim in an output is supported by the provided sources. (4.3) |
| **Indirect prompt injection** | Instructions planted in content the system processes, such as documents, web pages, emails, images, or tool descriptions, rather than typed by the user. (3.1) |
| **Instruction hierarchy** | The trained preference for system or developer instructions over user input, and user input over tool or retrieved content. It is learned behavior, not an enforced boundary. (1.3) |
| **Insider-risk model** | Treating a capable model as you would a privileged insider who may err or be compromised: establish identity, limit privileges, log activity, contain. (2.5, 5.1) |
| **Jailbreak** | An attempt to get a model to violate its safety training. A security mechanism with a safety impact. (2.3) |
| **Least privilege** | Granting only the tools, data, and permissions a task needs, enforced by the tool backend rather than the model. (5.1) |
| **Lethal trifecta** | The combination of access to private data, exposure to untrusted content, and a way to send data out. Any system with all three is exposed to data exfiltration through injection. (2.5) |
| **LLM-as-judge** | Using a language model to evaluate content or another model's output. Probabilistic, biased in known ways, and itself vulnerable to injection. (4.2, 6.3) |
| **MCP (Model Context Protocol)** | A protocol for connecting models to tools and data sources. Its servers and tool descriptions are part of the AI supply chain. (1.4, 3.7) |
| **Over-refusal** | Refusing benign requests. A failure mode in its own right, measured and traded off against harm. (4.4) |
| **Principal** | Any party whose input or authority enters the system: operator, developer, user, tenant, tool, retrieved content, other agents, and the model. (2.2) |
| **Reference monitor** | A mechanism that mediates every access, cannot be bypassed or tampered with by the program it controls, and is small enough to verify. (5.6) |
| **Release gate** | Explicit go/no-go criteria an AI change must meet before it ships, with a named owner. (7.4) |
| **Safety** | Preventing a model from saying or doing unintended or undesirable things when no adversary is involved. (2.1) |
| **Security** | Protecting a system's authority and assets from adversaries, including attempts to manipulate instructions to gain authority the attacker does not hold. (2.1) |
| **Shadow mode** | Running a new guardrail alongside the current one without enforcing it, or enforcing the stricter of the two, to compare behavior safely. (7.3) |
| **Spotlighting** | Marking or encoding untrusted content so the model can better distinguish it from instructions. Reduces, but does not eliminate, injection. (3.2, 3.3) |
| **Sycophancy** | A model's tendency to agree with or flatter the user at the expense of accuracy. (4.5) |
| **Taint tracking** | Tracking which data in a session came from untrusted sources, and restricting what tainted data can influence, especially outbound actions. (3.2, 5.1) |
| **Trust boundary** | A point in the data flow where data passes between principals of different trust. Controls belong at these points. (2.2) |
| **Unbounded consumption** | Uncontrolled resource use, including runaway loops and denial-of-wallet attacks (OWASP LLM10:2025). (5.4) |
