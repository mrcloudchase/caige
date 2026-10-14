---
id: "1.5"
title: "Anatomy of a Production AI System"
slug: anatomy-of-production-ai-systems
module: how-ai-systems-behave
sectionOrder: 5
description: "The components of a production AI system, the common deployment patterns, the split between provider-side and application-side controls, and the points where guardrails can attach."
category: cross-cutting
controlLayers: [deterministic, runtime-ml, human]
knowledge:
  - "A production AI system includes a gateway, an orchestrator or harness, one or more models, retrieval, tools, memory, a control plane, and logging, and the model is usually the smallest part of the code."
  - "Chat, RAG, agent, and multi-model patterns differ in where untrusted content enters and where model output turns into action."
  - "Provider-side controls (alignment, platform filters, abuse monitoring) apply generic policy and cannot see the application's users, data, or authorization rules."
  - "Guardrails can attach at ingress, prompt assembly, model input, model output, tool calls, tool results, retrieval, memory writes, egress, and the control plane."
  - "Controls that sit outside the model and outside the paths the model can influence are the ones that still hold if the model is fully compromised."
skills:
  - "Map an AI application's components, data flows, and trust boundaries."
  - "Identify where untrusted text enters the context and where model output becomes an action or leaves the system."
  - "Assign each guardrail to an attachment point and a control layer, and find paths that bypass it."
  - "Explain which risks the provider's controls cover and which the application team owns."
sources:
  - title: "Anthropic (2024). Building effective agents"
    url: "https://www.anthropic.com/engineering/building-effective-agents"
  - title: "OWASP Top 10 for LLM Applications 2025"
    url: "https://genai.owasp.org/llm-top-10/"
  - title: "Model Context Protocol Specification (2025-11-25)"
    url: "https://modelcontextprotocol.io/specification/2025-11-25"
lastReviewed: "2026-10-14"
---

# 1.5 Anatomy of a Production AI System

## The problem

A security review asks an application team, "Where are your guardrails?" The team answers: "The provider filters harmful content, and our system prompt tells the model what not to do."

The application is a RAG-backed assistant with three tools, a nightly batch job that summarizes support tickets with the same model, a long-term memory feature, and an admin console that changes the system prompt without a deploy. Neither guardrail named in the answer knows who the user is, what documents they may see, what the tools can do, or that the batch job exists. The system prompt is a request to the model. The provider's filter applies the provider's generic content policy, not the application's.

The team was not careless. They described the part of the system that looks like "AI" and missed the rest. Guarding a system starts with an accurate map of it.

## Why it happens

### The components

A model API call is a small part of a production AI system. Most of the behavior, and most of the attack surface, lives in the code around it.

| Component | What it does | Guardrail relevance |
|---|---|---|
| Client | Web app, mobile app, IDE plugin, API consumer, or another service | Untrusted. Anything it sends, including claimed roles or history, can be forged. |
| Gateway | Authentication, rate limits, quotas, request size limits, routing | First place to establish identity and enforce volume limits. |
| Orchestrator / harness | Assembles prompts, runs the agent loop, calls tools, manages memory, parses output | Where most deterministic controls live: role assembly, tool authorization, budgets, output validation. |
| Model(s) | Provider-hosted or self-hosted; may be several | Untrusted component. Produces text and tool requests, nothing else. |
| Retrieval | Embedding model, vector store, search index, rerankers, connectors to source systems | Brings third-party text into the context. Must enforce access rights. |
| Tools | APIs, databases, code execution, email, browsers, MCP servers | Where model output becomes action. Identity and limits are set here. |
| Memory | Session state, summaries, long-term stores | Persistence of content across turns and sessions. |
| Control plane | Configuration: prompts, model versions, tool lists, policies, feature flags, kill switch | Changes behavior without code deploys. A high-value target; must be outside the model's reach. |
| Logging and telemetry | Request and response logs, tool-call audit trail, metrics, traces | Detection and investigation. Contains sensitive data; must resist tampering. |

### A request's path

```text
 client
   |  (untrusted input)
   v
 [gateway] -- authn, rate limit, size limit, input checks
   |
   v
 [orchestrator] <---- control plane (prompts, model version, tool list, kill switch)
   |   |   ^
   |   |   |  tool results / retrieved chunks / memory reads  (untrusted input)
   |   |   |
   |   +---+---> [retrieval]   [memory]   [tools] ---> external systems
   |              ^ access check  ^ scope    ^ authz, limits, approval
   v
 [model] -- returns text and tool-call requests (untrusted output)
   |
   v
 [orchestrator] -- output validation, egress checks
   |
   v
 client / downstream system
                         all of the above ---> [logging / audit]
```

Two kinds of arrows matter most. **Untrusted text in**: every arrow that carries text into the model's context (user input, retrieved chunks, tool results, memory reads, tool descriptions). **Model output out**: every arrow where the model's output becomes an action (tool execution, memory write) or leaves the system (response to the user, rendered HTML, a message to another system). Guardrails cluster at these two kinds of crossings.

### Common patterns

| Pattern | Shape | Where untrusted text enters | Where output turns into effect |
|---|---|---|---|
| Chat | Gateway, prompt assembly, one model call, response | User turn | The rendered response |
| RAG | Chat plus a retriever over private or public sources | User turn, retrieved chunks | The response, which may disclose retrieved data |
| Agent | A loop of model calls and tool executions ([1.4](/training/module/how-ai-systems-behave/tools-agents-memory-retrieval)) | User turn, every tool result, memory reads | Every tool call, memory write, and the final response |
| Multi-model | Several models with different jobs: a router, a main model, a classifier or judge, a summarizer, or several agents passing messages | All of the above, plus one model's output becoming another's input | Wherever the last model's output goes |

Anthropic's 2024 guide on agents describes a related spectrum: **workflows**, where code fixes the sequence of model calls, and **agents**, where the model chooses its own next step. For a guardrail engineer, the more the model decides, the fewer actions can be enumerated and reviewed ahead of time.

In multi-model systems, a guard model (a classifier or LLM judge checking another model) is still a model. It reads the same untrusted text and can be manipulated by it, so it is a runtime-ml control, not a deterministic one.

### Provider-side versus application-side controls

| Provider side | Application side |
|---|---|
| Training and alignment of the model | Everything about who the user is and what they may do |
| Platform content filters and abuse monitoring, applying the provider's policies | Content policy specific to the use case ([4.1](/training/module/safety-engineering/content-policy-as-specification)) |
| API features: structured output modes, sampling limits, fine-tuning, data retention settings | Prompt assembly, tool definitions and their permissions, retrieval access control, memory scoping |
| Security of the provider's own infrastructure | Gateway, logging, monitoring, incident response, the kill switch |

Provider controls are real and useful, but they are generic. A provider filter cannot know that this user should not see that document, that refunds over $200 need approval, or that a particular URL is an exfiltration channel. Where provider filters are classifiers, they are probabilistic, like any runtime-ml control. The OWASP Top 10 for LLM Applications (2025) is written for application builders for this reason: entries such as Excessive Agency (LLM06) and Improper Output Handling (LLM05) are mitigated by application-side controls.

### Where guardrails can attach

| Attachment point | Typical controls | Usual layer |
|---|---|---|
| Ingress (gateway) | Authentication, rate limits, size limits, normalization ([1.1](/training/module/how-ai-systems-behave/tokens-context-sampling)) | deterministic |
| Ingress (content) | Injection and abuse classifiers on user input | runtime-ml |
| Prompt assembly | Correct roles, no user-derived text in the system role, server-side history | deterministic |
| Model input from tools and retrieval | Access-filtered retrieval, injection scanning of results, size caps | deterministic, runtime-ml |
| Model output | Schema validation, content classifiers, groundedness checks | deterministic, runtime-ml |
| Tool-call boundary | Allowlists, argument validation, authorization, limits, approvals | deterministic, human |
| Memory write | Scoping by user and tenant, provenance, write policies | deterministic |
| Egress | Output encoding, URL and domain allowlists, DLP | deterministic, runtime-ml |
| Control plane | Change approval, version pinning, the kill switch | deterministic, human |
| Logging | Tamper-resistant audit, alerting | deterministic |

Apply the program's design test to the map: **if the model were fully compromised, what is the worst it could do?** The answer is the union of what every tool, every egress path, and every memory write permits, bounded only by controls outside the model. Classifiers lower how often things go wrong. The deterministic controls at the tool, egress, and control-plane points bound how bad it can get.

## Control patterns

The patterns for mapping and placing guardrails, strongest first:

1. **Put enforcement where the model cannot reach it** (deterministic). Authorization in tool executors, access filtering in the retriever, egress rules in the network or proxy, and the kill switch in the control plane. None of these should accept instructions from model output.
2. **Make the orchestrator the single choke point** (deterministic). Every model call, tool call, and memory access goes through code you control, so no path skips the checks. Batch jobs and internal tools use the same path.
3. **Keep the control plane separate and audited** (deterministic, human). Prompt and policy changes are versioned, reviewed, and reversible ([7.3](/training/module/operations-and-governance/change-management)).
4. **Add classifiers at ingress, tool results, and output** (runtime-ml). They catch content the deterministic layer cannot judge, such as toxicity or likely injection.
5. **Human review for consequential actions and for incidents** (human).
6. **System prompt instructions** (prompt). Useful for task quality and defaults. Not a guardrail on their own.

## Implementation

A system map is a document you can review and diff. A minimal machine-readable form for one tool path:

```json
{
  "system": "support-assistant",
  "pattern": "agent+rag",
  "untrusted_inputs": [
    {"source": "user_message", "enters_via": "user role", "controls": ["gateway authn", "normalization", "injection classifier"]},
    {"source": "help_center_chunks", "enters_via": "tool role", "controls": ["acl filter", "size cap"]},
    {"source": "ticket_body", "enters_via": "tool role", "writable_by": "anyone who emails support", "controls": ["injection classifier"]}
  ],
  "effects": [
    {"action": "issue_refund", "identity": "delegated user token", "controls": ["schema", "authz: own orders", "cap 20000 cents", "human approval"]},
    {"action": "send_reply", "identity": "service account", "controls": ["recipient = ticket owner", "egress: no external links"]},
    {"action": "memory_write", "identity": "service account", "controls": ["scoped to customer_id"]}
  ],
  "control_plane": {"prompt_changes": "reviewed PR", "model_version": "pinned", "kill_switch": "feature flag outside orchestrator"},
  "logging": {"tool_calls": "append-only audit log", "raw_prompts": "redacted before storage"},
  "bypass_paths": ["nightly ticket summarizer calls the model directly, skipping the gateway"]
}
```

The `bypass_paths` entry is the most valuable line in most real maps. It records the ways around the controls you thought you had.

## Where it breaks

- **Maps go stale.** A new tool, a new data source, or an admin feature added after the review changes the map. Tie map updates to change management.
- **Shadow paths skip the choke point.** Batch jobs, evaluation scripts, internal admin tools, and direct SDK calls from other services often bypass the gateway and its controls.
- **Gateway checks cannot see indirect input.** An input classifier at the gateway never sees text that arrives later through a tool result or retrieval. Controls must sit at each entry point, not only the front door.
- **Logging can become the leak.** Full prompt and response logs contain user data, retrieved documents, and sometimes secrets. Redact before storage and restrict access ([3.5](/training/module/security-engineering/data-protection-and-isolation)).
- **The control plane is itself a target.** If an agent's tools can change its own configuration, prompts, or tool list, the deterministic controls are only as strong as that access path.
- **Guard models share failure modes.** A judge model reading the same injected text as the main model can be manipulated by it.
- **Shared responsibility gaps.** Teams assume the provider covers a risk the provider assumes the application covers. Write down which side owns each control.

## Lab exercise

In [Lab 1: Map the System](/labs/lab-1-map-the-system), **Task 1.5** has you produce a system map of the sample application: its components, every untrusted input, every effect, the controls at each point, and at least one path that bypasses them.

## Check your understanding

<details>
<summary>1. Why is "the provider filters harmful content" an incomplete answer to "where are your guardrails"?</summary>

Provider filters apply generic content policy and do not know the application's users, data access rules, tools, or egress paths. They are also probabilistic. Authorization, retrieval access control, tool limits, and egress controls are the application's responsibility.
</details>

<details>
<summary>2. An input classifier at the gateway blocks known injection phrases. An attacker plants the same phrase in a help-center article. Why does the classifier miss it, and what fixes the gap?</summary>

The article enters through retrieval after the gateway, so the gateway classifier never sees it. Scan retrieved content where it enters the context, and bound the effect with deterministic controls at the tool and egress points.
</details>

<details>
<summary>3. A nightly job calls the model directly with ticket contents. What should the system map record, and what is the usual fix?</summary>

Record it as a bypass path: untrusted input (tickets) reaches the model without the gateway's controls. Route it through the orchestrator so the same checks apply, or apply equivalent controls on that path.
</details>

<details>
<summary>4. Using the design test, which controls in an agent determine the worst case if the model is fully compromised?</summary>

The deterministic controls outside the model: tool authorization and limits, the tool executor's identity, egress rules, memory scoping, budgets, and the kill switch. Classifiers and prompts change how likely failure is, not how bad it can get.
</details>
