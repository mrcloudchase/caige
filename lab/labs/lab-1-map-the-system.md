---
title: "Lab 1: Set Up and Map the Lab System"
slug: lab-1-map-the-system
domain: 1
order: 1
description: "Set up the Acme Support reference app (or your own practice system), then map every component, input, and authority it has."
estimatedTime: "3-4 hours"
---

# Lab 1: Set Up and Map the Lab System

## Goal

Set up the system you will harden in every later lab, and produce an accurate map of how it works. You cannot guard a system you cannot describe.

## Setup

Use the **Acme Support** reference application in the [`lab/` directory of the cAIge repository](https://github.com/mrcloudchase/caige/tree/main/lab). It is a multi-tenant support assistant with retrieval, five tools, an emergency brake, budgets, and a hash-chained audit log. It needs Python 3.11+ and nothing else:

```text
git clone https://github.com/mrcloudchase/caige.git
cd caige/lab
python3 -m unittest
python3 -m caige_lab eval --suite suites/benign.jsonl
python3 -m caige_lab chat --user alice
```

It runs out of the box with a deterministic offline stand-in. For realistic behavior and for every security measurement in later labs, point it at a real model through any OpenAI-compatible endpoint. The [lab README](https://github.com/mrcloudchase/caige/tree/main/lab#quickstart) explains how.

If you prefer, you can build your own practice system instead. Give it at least two tenants, retrieval, two or three tools whose side effects are simulated (an outbox file, not real email), and structured logging. Use only fake data, and never connect a practice system to real email, payment, or production systems.

## Task 1.1: Tokens, Context, and Sampling

Log the full context sent to the model for three different requests, and count its tokens with your provider's tokenizer or a compatible one. Send the same prompt ten times at your normal settings and record how many distinct outputs you get.

**Outcome:** a short note on how much of your context window each component uses, and evidence of non-determinism in your own system.

## Task 1.2: How Models Learn Behavior

Write down which behaviors of your system come from the provider's training and which come from your application. Examples are refusals, tone, tool-use format, and following the system prompt.

**Outcome:** a two-column table, "provider controls" and "we control", with at least eight rows.

## Task 1.3: The Instruction Hierarchy and the Single-Channel Problem

Mark every place where text enters the model's context, and label each with its role and trust level: system or developer, user, tool result, retrieved document, memory.

**Outcome:** an annotated example of one full context, showing that all of it reaches the model as one token sequence.

## Task 1.4: Tools, Agents, Memory, and Retrieval

Trace one tool call from end to end: the model's request, your code's validation (if any), execution, the result, and how the result re-enters the context.

**Outcome:** a sequence diagram that makes clear your application, not the model, executes the tool.

## Task 1.5: Anatomy of a Production AI System

Draw the architecture: gateway, orchestrator, model, retrieval, tools, data stores, and logs. Mark where a guardrail could attach at each boundary.

**Outcome:** an architecture diagram with numbered attachment points. You will reuse it in every later lab.

## Deliverables

- The running lab system and setup notes
- The context-usage note and non-determinism evidence (1.1)
- The provider-vs-application control table (1.2)
- The annotated context (1.3)
- The tool-call sequence diagram (1.4)
- The architecture diagram with attachment points (1.5)
