---
title: "Learning Objectives"
slug: "learning-objectives"
module: "ai-foundations"
sectionOrder: 0
description: "What you will be able to do after completing the AI Foundations module."
---

## Domain 1: AI Foundations — Learning Objectives

After completing this module, you will be able to:

- **Explain how neural networks learn** by describing the training loop (forward pass, loss computation, backpropagation, weight update) and why knowledge is distributed across billions of parameters rather than stored in discrete, inspectable locations.

- **Describe the transformer architecture** including self-attention, positional encoding, and the distinction between encoder-decoder and decoder-only designs, and explain why transformers replaced recurrent architectures for language tasks.

- **Trace the full path of a single inference request** from raw text through tokenization, embedding lookup, positional encoding, multi-head masked self-attention, feed-forward layers, and the output probability distribution over the vocabulary.

- **Explain autoregressive text generation** including the generation loop, sampling strategies (temperature, top-k, top-p), and why each token choice is irreversible and shapes all subsequent output.

- **Distinguish each stage of the LLM training pipeline** — pre-training, instruction tuning, and alignment (RLHF/DPO) — and identify what capabilities each stage creates, what can go wrong at each stage, and what the application developer can versus cannot control.

- **Identify common production AI system architectures** — simple chat, RAG, agentic, and multi-model pipelines — and describe the data flow through each pattern.

- **Map guardrail placement points** within a production AI pipeline (pre-model input, post-model output, system-prompt level, retrieval level, tool-call level) and explain the trade-offs of each placement.

- **Explain why LLMs cannot be made safe by training alone**, connecting concepts like distributed knowledge, stochastic generation, and instruction hierarchy as learned preference to the need for external guardrail systems.

- **Describe embedding models and vector representations**, explaining how they enable semantic search and retrieval-augmented generation, and where guardrails must be applied in retrieval pipelines.

- **Articulate the guardrail implications of each foundational concept** — translating technical understanding of how AI systems work into reasoning about where and why they fail and how to defend against those failures.

---
