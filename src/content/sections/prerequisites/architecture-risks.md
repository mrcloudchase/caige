---
title: "Why This Architecture Is Dangerous"
slug: "architecture-risks"
module: "prerequisites"
moduleOrder: 0
sectionOrder: 4
description: "Section 4 of the prerequisites module."
---

You now understand the complete picture: how neural networks learn (Part 1), what defines an LLM and why the transformer architecture matters (Part 2), how data flows through each component of the model from text to prediction (Part 3), and how the model is trained across multiple stages to become a useful assistant (Part 4). Every property you have learned about — distributed knowledge in billions of uninspectable weights, attention that processes all tokens equally regardless of trust, probabilistic generation that varies on every run, and safety behaviors that are learned preferences rather than hard-coded rules — creates specific risks. This section connects what you have learned to the dangers that make guardrails necessary.

### 5.1 The Instruction Hierarchy Problem

In Part 4, you learned that models are trained on chat templates with distinct roles (system, user, assistant, tool) and that through instruction tuning and RLHF, models learn to prioritize system instructions over user input. This sounds like a security feature — the developer's system prompt takes priority over the user's input. But as you learned in Part 4, this hierarchy is a **learned statistical preference**, not an enforced constraint.

Think about what this means architecturally. In Part 3, you learned that the attention mechanism computes relevance scores between all tokens in the context window. There is no access control system inside the model. There is no parser that reads the system prompt and creates rules. There is no mechanism that marks certain tokens as "higher authority." The model learned during training that text after the system role token tends to be followed, so it usually follows system instructions — but under sufficient pressure (carefully crafted prompts, role-play scenarios, multi-turn manipulation), the model can and does override those instructions. The compliance is statistical, not absolute.

> **Why this matters for guardrails:** System prompts are necessary but insufficient as a security control. A user who crafts input that mimics special token patterns, uses role-play to reframe the conversation, or applies multi-turn pressure can weaken the model's adherence to system-level rules. This is why application-level guardrails — code that runs independently of the model — are essential. The model's compliance with the system prompt is a guideline, not a guarantee.

### 5.2 Architecture to Risk Mapping

Every architectural property you have learned about in this guide has a dual nature — the same property that makes LLMs powerful also creates a specific risk. The table below maps each property to the risk it creates. As you read it, notice that these are not bugs or design flaws. They are direct, unavoidable consequences of how the technology works.

| Architectural Property | What It Enables | What Can Go Wrong |
|---|---|---|
| Attention treats all tokens equally | Rich contextual understanding | Content anywhere in the context can influence output — including malicious instructions in retrieved documents (prompt injection) |
| Training data encoded in weights | Broad world knowledge | Model can reproduce memorized private data, copyrighted content, or personal information (data leakage) |
| Probabilistic token generation | Fluent, varied text | Model generates confident-sounding text that is factually wrong (hallucination) |
| Learned role boundaries (not enforced) | Flexible instruction following | Users can override system instructions through carefully crafted prompts (jailbreaking) |
| Trained to be helpful and compliant | Useful assistant behavior | Model follows user requests even when it should refuse, or drifts away from its designated topic (over-compliance, off-topic drift) |
| Training data reflects human biases | Understanding of human language and culture | Model reproduces and potentially amplifies societal biases (toxic/biased output) |
| Extended chain-of-thought reasoning | More accurate problem-solving | Thinking tokens may contain policy violations, sensitive data, or harmful reasoning not visible in the final answer |

These are not bugs — they are direct consequences of how the technology works. You cannot "fix" hallucination by improving the model alone, because the architecture generates text probabilistically (as you saw in Part 3's discussion of temperature and sampling), so there will always be cases where the model produces plausible-sounding nonsense. You cannot "fix" prompt injection by training the model harder, because the attention mechanism (as you learned in Part 3) does not architecturally distinguish trusted from untrusted tokens. You cannot "fix" jailbreaking by writing better system prompts, because the instruction hierarchy (as you learned in Part 4) is a learned preference, not an enforcement mechanism.

This is the fundamental argument for guardrails: **the risks are inherent to the architecture, so the controls must be external to the model.**

Module 1 examines each of these failure modes in detail. The rest of the training program teaches you how to build the guardrails that address them.

### 5.3 Expanded Attack Surface: RAG and Agentic Systems

Everything you have learned so far applies to a single model in a conversation — a user sends a message, the model generates a response. But modern AI applications rarely work this way. Two architectural patterns — **Retrieval-Augmented Generation (RAG)** and **agentic systems** — are now dominant in production deployments. Each pattern makes the model more capable, but each also dramatically expands the attack surface by introducing new sources of untrusted data and new ways the model can cause harm.

#### Embedding Models and Vector Search

In Part 3, you learned that the LLM's embedding layer converts individual tokens into vectors. A different type of model — an **embedding model** — converts entire passages of text into a single vector that captures the passage's semantic meaning. Texts with similar meanings produce vectors that are close together in mathematical space (measured by cosine similarity). This enables **semantic search**: instead of matching keywords, you can find documents that are conceptually related to a query.

![Embedding model diagram](/svg/embedding-model.svg)

These vectors are stored in a **vector database** and indexed for fast similarity search.

#### Retrieval-Augmented Generation (RAG)

**RAG** is the pattern of retrieving relevant documents and including them in the model's context window before generating a response. It allows the model to answer questions using information that was not in its training data.

![RAG pipeline diagram](/svg/rag-pipeline.svg)

RAG reduces hallucination by giving the model real source material to reference, but it introduces new risks. The retrieved documents are untrusted input — they may have been written by anyone, may contain outdated information, or may have been deliberately crafted to manipulate the model. If the retrieval system does not enforce access controls, the model may retrieve and expose documents the current user is not authorized to see.

#### Agentic AI Systems

An **agentic AI system** is one that can take actions — not just generate text. Instead of simply answering questions, an agent can call tools, query databases, send emails, create files, execute code, and make decisions across multiple steps. This is a fundamental shift in what can go wrong: in a simple chat application, the worst case is the model producing harmful text. In an agentic system, the model can take harmful **actions** in real systems.

| Capability | Simple Chat | Agentic System |
|---|---|---|
| Output | Text responses | Text + real-world actions |
| Tools | None | API calls, database queries, file operations |
| Steps | Single turn | Multi-step reasoning and execution |
| Impact of errors | Bad text | Bad actions with real consequences |

Consider the difference: if a chat model hallucinates a wrong answer, a human reads it and can ignore it. If an agentic model hallucinates a database query and executes it, records may be modified before anyone reviews the output. The stakes increase dramatically when the model can act on its predictions, not just report them.

![Agentic system tool call flow](/svg/agentic-tool-flow.svg)

#### Tool Integration and MCP

Agents interact with external systems through **tool integrations** — structured interfaces that allow the model to invoke specific capabilities. The **Model Context Protocol (MCP)** is an example of a standardized approach: it defines a client-server architecture where AI models connect to tool servers that expose capabilities the model can invoke. Other approaches use function calling or custom API integrations.

Regardless of the specific protocol, the pattern is the same: the model decides which tool to call and with what parameters (based on its next-token prediction — the same mechanism you learned about in Parts 2 and 3), the application executes the tool call, and the result is returned to the model as a new message with the "tool" role (as you saw in Part 4's chat template section). The model then processes this result and decides what to do next — potentially calling more tools in a multi-step chain.

#### Identity Delegation

When an agent calls a tool, a critical question arises: **whose permissions does it use?** If a user asks an AI agent to "look up the salary data," should the agent use the user's permissions (which may not include salary access) or the application's service account (which might have broader access)?

This is the **identity delegation** problem, and it is one of the most consequential design decisions in agentic AI systems. If the agent uses the application's service account, it can access anything that account can access — regardless of what the specific user is authorized to see. The user effectively inherits the application's permissions, not their own. Without careful design, an AI agent can become a **privilege escalation vector** — giving users access to data and actions they would not have through any other channel. The user does not need to hack anything; they simply ask the agent, and the agent acts with elevated privileges on their behalf.

> **Why this matters for guardrails:** RAG and agentic patterns dramatically expand the attack surface. In a simple chat application, the worst case is bad text. With RAG, attackers can poison the documents the model reads (indirect prompt injection). With agents, attackers can cause the model to take unauthorized actions in real systems — sending data to external servers, modifying records, or escalating privileges. Modules 2 and 3 cover the guardrail architectures and implementations for these patterns in detail.

### 5.4 The Security Mindset

With the full picture you have built across all five parts of this guide — from how neural networks learn (Part 1), to the transformer architecture that powers LLMs (Part 2), to how data flows through the model (Part 3), to how training creates both capabilities and vulnerabilities (Part 4), to the risks that emerge in production applications (this section) — one conclusion emerges: **LLMs are powerful but fundamentally unpredictable systems, and the risks they create are inherent to their architecture.** You cannot train away hallucination, patch prompt injection, or configure your way out of jailbreaking. These are not bugs — they are consequences of how the technology works.

This realization is the foundation of the **security mindset** that the cAIge certification teaches. You are not trying to make the model perfectly safe (that is not possible). You are building layers of defense around an inherently unpredictable system so that when it fails — and it will fail — the consequences are contained.

#### Three Layers of Defense

Securing an AI application requires multiple independent layers:

**Layer 1: Model training** — The model provider builds safety behaviors into the model through RLHF and alignment training. This is necessary but insufficient. Safety training is a learned behavior, not an architectural guarantee, and it can be bypassed.

**Layer 2: System prompt** — The application developer writes system prompt instructions that set behavioral boundaries. This is necessary but insufficient. The instruction hierarchy is a soft preference, not an enforcement mechanism, and it can be overridden.

**Layer 3: Application-level guardrails** — Code that runs independently of the model, inspecting inputs before they reach the model and validating outputs before they reach the user. This is where guardrail engineers work. These controls are enforced by your code, not by the model's willingness to comply.

**Defense in depth** means layering all three — not relying on any single layer. Each layer catches threats that others miss.

#### Trust Boundaries

In any AI system, some components are trusted and others are not:

| Component | Trust Level | Why |
|---|---|---|
| System prompt | Trusted | You (the developer) wrote it |
| User input | Untrusted | Attacker-controlled |
| Retrieved documents (RAG) | Untrusted | May contain injected content |
| Tool results | Untrusted | External system, may be compromised |
| Model output | Untrusted until validated | Probabilistic, can hallucinate or be manipulated |

The model itself sits at the center — processing untrusted inputs and producing untrusted outputs. Every boundary between trusted and untrusted components is a point where guardrails must be applied.

#### Who Attacks AI Systems?

AI systems face threats from multiple adversary types, and understanding who attacks these systems is essential for designing effective guardrails:

- **Malicious end users** try to extract private data, bypass content restrictions, or get the model to produce harmful outputs. They use techniques like prompt injection, jailbreaking, and multi-turn manipulation.
- **Automated attacks** probe for vulnerabilities at scale, testing thousands of prompt variations to find ones that bypass guardrails. Unlike human attackers, automated attacks are tireless and systematic.
- **Insiders** have legitimate access to the system but misuse it — extracting training data, exfiltrating sensitive information through model interactions, or using agentic tools beyond their authorization.
- **Researchers** discover new attack techniques and publish them, which means the threat landscape evolves continuously. An attack technique described in an academic paper today may be automated and deployed in the wild within weeks.

Module 1 section 1.3 covers threat modeling in detail.

> With this foundation — understanding how neural networks learn, how the transformer architecture processes language, how data flows through the model from text to prediction, how training creates both capabilities and vulnerabilities, and why the resulting risks are inherent rather than fixable — you are ready to study the guardrails that address these risks. Module 1 begins with a detailed examination of how AI systems work in production and the specific failure modes you will learn to guard against.

---
