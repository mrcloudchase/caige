---
title: "Production AI System Architecture"
slug: "production-ai-system-architecture"
module: "ai-foundations"
sectionOrder: 5
description: "How production AI applications are assembled and where guardrails fit in the architecture."
---

## Section 1.5: Production AI System Architecture

No LLM runs in isolation. Every production AI application wraps the model in an architecture of surrounding systems — API gateways, orchestration layers, retrieval pipelines, tool integrations, monitoring infrastructure, and guardrails at multiple points. Understanding these architectures is essential because **guardrails are not separate from the application architecture; they are part of it.**

This section covers the common patterns used to build production AI applications and maps the specific points where guardrails can and should be inserted.

### The Components of a Production AI System

A production AI application typically includes some or all of these components:

```
┌──────────────────────────────────────────────────────────────────────┐
│                    PRODUCTION AI SYSTEM                               │
│                                                                      │
│  ┌──────────┐   ┌───────────────┐   ┌──────────────┐               │
│  │   User    │──▶│  API Gateway   │──▶│  Rate Limiter │              │
│  │ Interface │   │  / Load Bal.   │   │  / Auth       │              │
│  └──────────┘   └───────────────┘   └──────┬───────┘               │
│                                             │                        │
│                                             ▼                        │
│                               ┌─────────────────────┐               │
│                               │   INPUT GUARDRAILS   │  ◀── 1st     │
│                               │  (pre-model filters) │     defense  │
│                               └──────────┬──────────┘               │
│                                          │                           │
│                                          ▼                           │
│                               ┌─────────────────────┐               │
│                               │   ORCHESTRATION      │               │
│                               │   LAYER              │               │
│                               │  ┌───────────────┐  │               │
│                               │  │ System Prompt  │  │               │
│                               │  │ Construction   │  │               │
│                               │  └───────────────┘  │               │
│                               │  ┌───────────────┐  │               │
│                               │  │ Context /      │  │               │
│                               │  │ Memory Mgmt    │  │               │
│                               │  └───────────────┘  │               │
│                               │  ┌───────────────┐  │               │
│                               │  │ Model Router   │  │               │
│                               │  │ (if multi-model)│  │               │
│                               │  └───────────────┘  │               │
│                               └──────────┬──────────┘               │
│                                          │                           │
│                        ┌─────────────────┼─────────────────┐        │
│                        ▼                 ▼                 ▼        │
│                 ┌────────────┐  ┌──────────────┐  ┌────────────┐   │
│                 │ Retrieval  │  │    LLM API    │  │   Tools /  │   │
│                 │ (RAG)      │  │   (Model)     │  │   Actions  │   │
│                 └────────────┘  └──────┬───────┘  └────────────┘   │
│                                        │                            │
│                                        ▼                            │
│                               ┌─────────────────────┐               │
│                               │  OUTPUT GUARDRAILS   │  ◀── Last    │
│                               │  (post-model filters)│     defense  │
│                               └──────────┬──────────┘               │
│                                          │                           │
│                                          ▼                           │
│                               ┌─────────────────────┐               │
│                               │  LOGGING / METRICS   │               │
│                               │  / AUDIT TRAIL       │               │
│                               └──────────┬──────────┘               │
│                                          │                           │
│                                          ▼                           │
│                                    Response to User                  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

**API Gateway / Load Balancer.** The entry point for all requests. Handles authentication, rate limiting, and routing. This layer prevents abuse at the infrastructure level (DDoS, unauthorized access) but is not typically aware of content.

**Orchestration Layer.** The "brain" of the application. It assembles the system prompt, manages conversation history, decides which model to call, manages retrieval pipelines, and coordinates multi-step workflows. This is where most application logic lives.

**Model Router.** In multi-model systems, a router selects which model to use based on the task, cost, latency, or capability requirements. A simple query might go to a small, fast model; a complex reasoning task might go to a large, capable model.

**Retrieval System (RAG).** Retrieves relevant documents or data to provide context for the model's response. Includes embedding models, vector databases, and re-ranking.

**Tools and Actions.** External capabilities the model can invoke — database queries, API calls, code execution, web search. In agentic systems, the model decides when and how to use these tools.

**Logging and Monitoring.** Records all inputs, outputs, model decisions, guardrail triggers, and performance metrics for observability, debugging, and compliance.

### Common Architecture Patterns

Production AI applications typically follow one of several patterns, each with different complexity and guardrail requirements.

#### Pattern 1: Simple Chat

The most basic pattern — a user sends a message, the system adds a system prompt, calls the model, and returns the response.

```
User Message → [System Prompt + User Message] → LLM → Response
```

**Guardrail considerations:** Input validation and output filtering are the primary guardrail points. The attack surface is relatively small — just the user message. But the system prompt is the only safety instruction, and as we discussed in Section 1.4, it can be overridden.

#### Pattern 2: Retrieval-Augmented Generation (RAG)

RAG adds a retrieval step that fetches relevant documents before calling the model. This grounds the model's responses in specific data rather than relying solely on its trained knowledge.

![RAG pipeline showing retrieval and generation flow](/svg/rag-pipeline.svg)

```
User Message
    │
    ▼
Embed user query (embedding model)
    │
    ▼
Search vector database for similar documents
    │
    ▼
Re-rank and select top-k results
    │
    ▼
[System Prompt + Retrieved Context + User Message] → LLM → Response
```

**Guardrail considerations:** RAG introduces a new attack surface — the retrieved documents. If the document corpus contains adversarial content, that content enters the model's context window. This is called **indirect prompt injection** — the user does not need to inject anything; the retrieval system does it for them by fetching a document that contains malicious instructions. Guardrails must be applied not just to user input and model output, but also to retrieved content before it enters the context.

Additionally, the quality of retrieval affects hallucination risk. If retrieval returns irrelevant documents, the model may still generate a confident-sounding answer that is not grounded in the retrieved content. **Groundedness checks** — verifying that the model's response is actually supported by the retrieved documents — are a critical guardrail for RAG systems.

#### Pattern 3: Agentic Systems

Agentic systems give the model the ability to take actions — calling tools, querying databases, executing code, browsing the web, or interacting with other systems. The model operates in a loop: it generates a plan, executes actions, observes results, and decides what to do next.

![Agentic tool calling flow](/svg/agentic-tool-flow.svg)

```
User Request
    │
    ▼
┌──────────────────────────────────────────────┐
│              AGENT LOOP                       │
│                                               │
│  LLM reasons about task                       │
│      │                                        │
│      ▼                                        │
│  LLM selects tool + generates arguments       │
│      │                                        │
│      ▼                                        │
│  [TOOL-CALL GUARDRAIL] ← Validate before exec│
│      │                                        │
│      ▼                                        │
│  Execute tool, return result                  │
│      │                                        │
│      ▼                                        │
│  LLM observes result, decides next step       │
│      │                                        │
│      ▼                                        │
│  Repeat or produce final answer               │
│                                               │
└──────────────────────────────────────────────┘
    │
    ▼
Final Response to User
```

**Guardrail considerations:** Agentic systems have the largest attack surface of any AI architecture pattern. The model is making decisions about what actions to take in the real world, and each tool call is a potential point of failure:

- **Tool-call validation:** Before any tool is executed, guardrails should verify that the arguments are within expected bounds. A model instructed to "query the database" should not be able to execute arbitrary SQL including DROP TABLE.
- **Permission boundaries:** The agent should have the minimum permissions necessary. A customer service agent should not have access to admin functions.
- **Loop limits:** Without guardrails, an agent can enter infinite loops, consuming resources and potentially taking repeated harmful actions.
- **Observation injection:** Tool results fed back to the model are an injection vector. If a web search returns a page containing adversarial instructions, those instructions enter the agent's context.

#### Pattern 4: Multi-Model Pipelines

Complex applications often use multiple models for different tasks:

```
User Message
    │
    ├──▶ Classification model (route the request)
    │
    ├──▶ Embedding model (retrieve relevant context)
    │
    ├──▶ Generation model (produce the response)
    │
    ├──▶ Moderation model (check the response for safety)
    │
    └──▶ Evaluation model (score response quality)
```

**Guardrail considerations:** Each model is an independent point of failure. The classification model might misroute a request. The embedding model might retrieve irrelevant documents. The generation model might hallucinate. Using one model to check another is a common guardrail strategy (the "moderation model" above), but it introduces its own failure modes — the checker model can also be wrong.

### Guardrail Placement Points

Guardrails can be placed at multiple points in the pipeline. Each placement has different capabilities and trade-offs:

| Placement Point | What It Checks | Examples | Trade-offs |
|---|---|---|---|
| **Pre-model input** | User message before it reaches the model | Toxicity detection, PII stripping, prompt injection detection, topic blocking | Adds latency before generation; cannot see model behavior |
| **System prompt** | Instructions to the model about behavior | Safety rules, persona constraints, output format requirements | Probabilistic (model may not follow); bypassable |
| **Retrieval level** | Documents before they enter context | Content filtering of retrieved docs, source verification, relevance thresholds | Reduces grounding quality if too aggressive; missed injection if too permissive |
| **Tool-call level** | Model's proposed actions before execution | Argument validation, permission checks, rate limiting, scope restriction | Adds latency per tool call; too strict limits agent capability |
| **Post-model output** | Model's response before it reaches the user | Toxicity filtering, hallucination detection, PII detection, format validation | Adds latency after generation; may block useful responses (false positives) |
| **Streaming** | Token-by-token as model generates | Real-time content monitoring, early termination | Partial responses may leak; complex to implement |

> **Why this matters for guardrails:** Defense in depth is the fundamental principle. No single guardrail placement is sufficient. Input guardrails catch malicious requests before they waste model compute. System prompt guardrails reduce the probability of harmful outputs. Retrieval guardrails prevent indirect injection. Tool-call guardrails prevent harmful actions. Output guardrails catch what everything else missed. The most robust systems implement guardrails at every layer.

### Model Provider vs. Application-Level Guardrails

When using model APIs (OpenAI, Anthropic, Google, etc.), there are two layers of guardrails in play:

**Provider-level guardrails** are built into the model API by the provider. These include:
- Content moderation endpoints (e.g., OpenAI Moderation API)
- Built-in refusal behaviors from RLHF
- Rate limiting and abuse detection
- Content filtering applied before the response is returned

**Application-level guardrails** are built by the developer around the model API:
- Custom input classifiers (domain-specific threat detection)
- Output validators (format checking, groundedness, business rules)
- PII handling (detection, masking, redaction)
- Topic and scope restriction (keeping the model within its intended domain)
- Monitoring and alerting (detecting unusual patterns)

```
┌──────────────────────────────────────────────────────┐
│                YOUR APPLICATION                       │
│                                                       │
│   User Input                                          │
│       │                                               │
│       ▼                                               │
│   [Your Input Guardrails]  ◀── You control these     │
│       │                                               │
│       ▼                                               │
│   ┌─────────────────────────────────────────────┐    │
│   │          MODEL PROVIDER API                  │    │
│   │                                              │    │
│   │   [Provider Input Filters]                   │    │
│   │       │                                      │    │
│   │       ▼                                      │    │
│   │   Model (with RLHF safety training)          │    │
│   │       │                                      │    │
│   │       ▼                                      │    │
│   │   [Provider Output Filters]                  │    │
│   │                                              │    │
│   │   You cannot see or control what happens     │    │
│   │   inside this box.                           │    │
│   └──────────────────────────┬──────────────────┘    │
│                              │                        │
│                              ▼                        │
│   [Your Output Guardrails]  ◀── You control these    │
│       │                                               │
│       ▼                                               │
│   Response to User                                    │
│                                                       │
└──────────────────────────────────────────────────────┘
```

**You cannot rely solely on provider guardrails.** Provider guardrails are designed for general safety, not for your specific application's requirements. They may not catch domain-specific risks. They may change without notice (providers regularly update their moderation policies). They may not align with your compliance requirements. And they may have gaps that your threat model identifies.

**You cannot skip provider guardrails either.** For API-based models, provider guardrails are your baseline. They handle the broad categories of harmful content that every application should block. Your application-level guardrails add specificity — blocking the content that is harmful *for your use case* even if it is not universally harmful.

### A Note on Modality

While this module focuses on text-based LLMs, production AI systems increasingly involve multiple modalities:

- **Image input:** Models that accept images can be attacked through visual prompt injection (text embedded in images).
- **Image generation:** Models that produce images require guardrails for harmful visual content.
- **Audio input/output:** Voice assistants face unique challenges around deepfakes and voice cloning.
- **Code execution:** Models with code interpreter capabilities can take actions on the system.
- **Structured data:** Models that generate JSON, SQL, or other structured formats need format validation guardrails.

Each modality introduces unique attack surfaces and requires modality-specific guardrails. The architectural principles are the same — defense in depth, input/output validation, least privilege — but the implementation details differ. This program focuses on text-based guardrails as the foundation, with modality-specific considerations addressed where relevant.

> **Why this matters for guardrails:** Your mental model of "the AI system" must extend far beyond the model itself. The model is one component in a larger system, and guardrails must be designed as part of the complete system architecture — not bolted on as an afterthought. The best guardrail engineers think architecturally, understanding how each component interacts and where the attack surfaces exist at every layer of the stack.

---
