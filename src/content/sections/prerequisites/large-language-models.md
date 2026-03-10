---
title: "What Is a Large Language Model?"
slug: "large-language-models"
module: "prerequisites"
sectionOrder: 2
description: "Section 1 of the prerequisites module."
---

A **large language model (LLM)** is a neural network — but a very specific kind. Not all neural networks are LLMs. Neural networks are used for many different tasks: classifying images, detecting fraud, recommending products, controlling robots. What makes an LLM distinct is three things: its architecture, its training objective, and its scale. This section explains each in detail.

### Architecture: The Transformer

LLMs are built on a specific neural network architecture called the **transformer**. To understand why this architecture exists and why it matters, it helps to know where it came from.

#### The Paper That Changed Everything

In 2017, a team of researchers at Google published a paper titled [Attention Is All You Need](https://arxiv.org/pdf/1706.03762) (Vaswani et al.). This paper introduced the transformer architecture, and it is not an exaggeration to say it changed the trajectory of artificial intelligence. Every major LLM today — GPT, Claude, Llama, Gemini, Mistral — is built on the architecture described in this paper.

Before the transformer, the dominant approach to language modeling was **recurrent neural networks (RNNs)** and their variant, **Long Short-Term Memory networks (LSTMs)**. These architectures processed text **sequentially** — one token at a time, from left to right. Each token's processing depended on the previous token's output, like reading a book one word at a time and trying to remember everything you have read so far. This created two fundamental problems:

- **Long-range dependencies were difficult.** By the time the model reached the 500th word in a paragraph, the information about the 1st word had been passed through 499 sequential processing steps, degrading at each step. The model struggled to connect ideas that were far apart in the text.
- **Training was slow.** Because each step depended on the previous step, the computation could not be parallelized. You had to wait for token 1 to finish before processing token 2, then wait for token 2 before processing token 3, and so on. This made training on large datasets impractical.

```
 RNN (sequential):
 token1 --> token2 --> token3 --> ... --> token500
 (each step waits for the previous one)

 Transformer (parallel):
 token1 <-> token2 <-> token3 <-> ... <-> token500
 (all tokens attend to all others simultaneously)
```

The transformer solved both problems with a single mechanism: **self-attention**. Instead of processing tokens one at a time, the transformer processes all tokens in a sequence simultaneously. Each token can directly attend to every other token in the input, regardless of distance. The word at position 500 can directly reference the word at position 1 without any information having to pass through 499 intermediate steps. And because every token is processed in parallel, training became dramatically faster, making it feasible to train on internet-scale datasets.

#### From Encoder-Decoder to Decoder-Only

The original transformer described in "Attention Is All You Need" had two halves: an **encoder** and a **decoder**.

![Original transformer architecture from Attention Is All You Need](/svg/original-transformer.svg)

- The **encoder** reads an entire input sequence and builds a rich internal representation of it. It processes all input tokens in parallel, and each token can attend to every other token in the input (full bidirectional attention). The encoder's job is understanding — it creates a contextual representation of the input.
- The **decoder** generates output one token at a time, attending both to the encoder's representation of the input and to the tokens it has already generated. The decoder uses **masked self-attention** (also called causal attention) — each token can only attend to tokens that came before it, not tokens that come after. This is because during generation, future tokens do not exist yet.

This encoder-decoder design was built for **sequence-to-sequence tasks** like machine translation, where you have a complete input (a sentence in French) and need to produce a complete output (the same sentence in English). The encoder understands the French sentence; the decoder generates the English translation.

Modern generative AI models like GPT, Claude, and Llama use a **decoder-only** architecture. They removed the encoder entirely. Why?

- **Generative tasks do not have a fixed input to encode.** In a conversation, the "input" is the entire conversation history so far, and the "output" is the next response. The boundary between input and output is fluid — the model's own previous outputs become part of the input for the next generation step. A decoder-only architecture handles this naturally: everything is one continuous sequence, processed left-to-right.
- **Simplicity and scalability.** Removing the encoder cuts the architecture roughly in half, making it simpler to train, scale, and optimize. One unified architecture handles both understanding and generation.
- **It works.** Empirically, decoder-only transformers trained on massive datasets match or exceed the performance of encoder-decoder models on virtually all tasks, including tasks the encoder-decoder was specifically designed for. Scale compensated for the architectural simplification.

The result is that every major LLM you interact with today is a **decoder-only transformer**: a stack of repeated layers that process a token sequence from left to right, where each token can attend to all previous tokens but not to future tokens.

Internally, a decoder-only transformer is assembled from a small number of component types, stacked and repeated: an **embedding layer** converts tokens to numerical vectors, **positional encoding** adds sequence position information, **masked self-attention** lets each token attend to all previous tokens, **feed-forward networks** process each token's representation independently, **residual connections** and **layer normalization** keep signals stable across dozens of stacked layers, and an **output head** converts the final representations into a probability distribution over the vocabulary. Part 3 walks through each of these components in detail, following the path that data takes from raw text to generated output.

### Training Objective: Next-Token Prediction

While a spam classifier is trained to predict "spam or not spam" and an image classifier is trained to predict "cat, dog, or bird," an LLM is trained on a fundamentally different task: **predict the next token**. Given a sequence of text, the model learns to predict what comes next. For example, given "The capital of France is," the model should assign high probability to "Paris."

This single objective — next-token prediction — is deceptively powerful. To predict the next word accurately across billions of sentences drawn from the entire internet, a model must implicitly learn grammar, facts, reasoning patterns, coding conventions, mathematical relationships, and much more. No one explicitly teaches the model these things. They emerge as a byproduct of getting very good at predicting what word comes next. This is why LLMs can answer questions, write code, summarize documents, and carry on conversations — all of these are forms of "what token should come next, given everything that came before?"

The training objective also explains why the decoder-only architecture uses **masked** self-attention. During training, the model is shown a complete text and must predict each token from only the tokens that precede it. The causal mask prevents the model from "cheating" by looking at the answer. This training setup mirrors how the model will be used in practice — during generation, future tokens genuinely do not exist yet, so the model must predict them from context alone.

### Scale

The "large" in large language model refers to the number of parameters (weights). Early neural networks had thousands or millions of parameters. Modern LLMs have billions to trillions:

| Model | Parameters | Training Data |
|-------|-----------|---------------|
| GPT-2 (2019) | 1.5 billion | 40 GB of text |
| GPT-3 (2020) | 175 billion | 570 GB of text |
| LLaMA 2 (2023) | 7-70 billion | 2 trillion tokens |
| Modern frontier models | 200B-1T+ | 10+ trillion tokens |

Scale matters because larger models with more training data develop capabilities that smaller models do not exhibit. A model with 1 billion parameters might produce grammatically correct text but hallucinate facts constantly. A model with 100 billion parameters trained on more data might demonstrate reasoning, follow complex instructions, and produce factually grounded responses — even though it was trained on the exact same objective (next-token prediction). These emergent capabilities appear as models scale up, often unexpectedly.

Architecture innovations like **Mixture-of-Experts (MoE)** — where only a fraction of the model's parameters are active for any given input — allow models to have very large total parameter counts while keeping per-inference computation manageable. A well-trained 8B parameter model today can outperform a 100B+ model from a few years ago due to improvements in training data quality and techniques. More parameters also means more capacity to **memorize** training data (relevant to data leakage risks) and more complex behaviors that are harder to predict and test (relevant to guardrails).

### What an LLM Is Not

Understanding what an LLM is also means understanding what it is not:

- **It is not a database.** An LLM does not store facts in a retrievable table. Knowledge is distributed across billions of weights in ways that cannot be queried, inspected, or selectively deleted.
- **It is not a search engine.** An LLM does not look up answers. It generates text by predicting the most likely next token based on patterns learned during training. It can produce confident, fluent text about things that are completely false.
- **It is not a reasoning engine.** An LLM produces outputs that often look like reasoning, but it is fundamentally a pattern-matching system trained on statistical correlations in text. This distinction matters enormously for guardrail design — you cannot assume the model "understands" a safety rule just because it can recite it.

> **Why this matters for guardrails:** An LLM is a decoder-only transformer trained to predict the next token at massive scale. Every capability it demonstrates — following instructions, refusing harmful requests, providing accurate information — is a learned statistical pattern, not a hard-coded behavior. Learned behaviors can be fragile: they work in the scenarios well-represented in training data and can fail unpredictably in novel situations. Guardrails exist because you cannot rely on the model's learned behaviors alone.

Part 3 opens up the transformer and traces the complete data path step by step — showing how text is converted to numbers, processed through each component of the architecture, and turned back into text. Part 4 explains how LLMs are trained across multiple stages. Part 5 connects everything to the risks that make guardrails necessary.

---
