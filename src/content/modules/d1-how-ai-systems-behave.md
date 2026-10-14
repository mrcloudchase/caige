---
title: "How AI Systems Behave"
slug: how-ai-systems-behave
order: 1
domain: 1
weight: "10%"
description: "The mechanics of language models and the systems built around them, limited to what a guardrail engineer needs to predict how those systems fail."
studyTime: "3-4 hours"
lab: lab-1-map-the-system
---

# How AI Systems Behave

You cannot guard a system whose behavior you cannot predict. This domain covers only the model and system mechanics that explain why guardrails succeed or fail. It returns to five facts that recur in every later domain:

- A model reads **tokens**, not strings. A filter that inspects a string can disagree with what the model reads.
- A model **samples** its output from a probability distribution. A behavior you never saw in testing can still happen at scale.
- Safety behavior is a **learned statistical preference**. Further training, prefilled responses, or adversarial pressure can remove it.
- Every role in a conversation (system, user, tool output, retrieved document) ends up in **one token stream**. Nothing separates instructions from data, which is the root cause of prompt injection.
- A model only emits text. The **application** executes tool calls, writes memory, and retrieves documents, so the application is where authority lives and where most enforceable controls attach.

## Why it matters to a guardrail engineer

Each fact maps to a control decision: normalize text before filtering it, pin sampling parameters at the gateway, refuse user-supplied assistant prefills, put authorization in the tool executor, and filter retrieval by access rights. Engineers who skip the mechanics tend to treat a request to the model ("never reveal the system prompt") as if it were an enforcement.

## How this domain connects to the others

Domain 2 draws trust boundaries on the system anatomy from section 1.5. Domain 3 builds its prompt injection defenses on the single-channel problem from section 1.3. Domain 4 assumes refusals are learned tendencies, not rules. Domain 5 starts from the tool-calling mechanics in section 1.4. Domains 6 and 7 use the sampling material in section 1.1 to explain why evaluations need many samples and why production needs monitoring.

## Learning outcomes

1. Explain why a string filter and a tokenizer can disagree, and design normalization that narrows the gap.
2. Predict how temperature, top-k, and top-p change an output distribution, and explain why temperature 0 is not deterministic on hosted APIs.
3. Describe what each training stage contributes to safety behavior and why fine-tuning or prefilling can remove it.
4. Explain the instruction hierarchy as trained behavior and identify the single-channel problem as the root cause of prompt injection.
5. Trace a tool call, agent loop, memory write, and RAG query from model output to the code that acts on it.
6. Map a production AI system's components and identify where each type of guardrail can attach.

In [Lab 1: Map the System](/labs/lab-1-map-the-system) you inventory a working AI application and mark where untrusted text enters and where model output becomes an action.
