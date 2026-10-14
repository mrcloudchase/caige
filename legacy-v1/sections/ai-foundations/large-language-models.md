---
title: "Large Language Models"
slug: "large-language-models"
module: "ai-foundations"
sectionOrder: 2
description: "Transformer architecture, self-attention, scale, and what LLMs actually are — and are not."
---

## Section 1.2: Large Language Models

Now that you understand how neural networks learn, we can examine the specific architecture that powers modern AI systems: the **transformer**. Large language models are transformers trained at enormous scale on text data, and understanding their architecture is essential for understanding where guardrails need to intervene.

### The Problem with Sequential Processing

Before transformers, the dominant architectures for language were **Recurrent Neural Networks (RNNs)** and their variant, **Long Short-Term Memory networks (LSTMs)**. These architectures process text one token at a time, maintaining a hidden state that carries forward information from earlier tokens.

This sequential approach has two critical limitations:

1. **The bottleneck problem.** All information about earlier tokens must be compressed into a fixed-size hidden state vector. By the time an RNN reaches the 500th token, information about the 1st token has been repeatedly compressed and may be effectively lost.

2. **Training is slow.** Because each step depends on the previous step's output, RNNs cannot be parallelized across the sequence. Training on long documents is computationally expensive.

| Feature | RNNs / LSTMs | Transformers |
|---|---|---|
| **Processing** | Sequential (token by token) | Parallel (all tokens at once) |
| **Long-range dependencies** | Degrades over distance (vanishing gradient) | Direct attention between any two positions |
| **Training speed** | Slow (cannot parallelize across sequence) | Fast (massive parallelism on GPUs) |
| **Context handling** | Fixed-size hidden state bottleneck | Scales with context window size |
| **Scalability** | Diminishing returns past ~1B parameters | Continues improving at massive scale |
| **Architecture era** | 2014-2017 dominant | 2017-present dominant |

The transformer architecture, introduced in the 2017 paper "Attention Is All You Need," solved both problems with a single mechanism: **self-attention**.

### The Transformer Architecture

The original transformer was designed for machine translation and uses an **encoder-decoder** structure:

![The original encoder-decoder transformer architecture](/svg/original-transformer.svg)

- **Encoder:** Reads the entire input sequence in parallel and produces a rich representation of each token that incorporates context from all other tokens.
- **Decoder:** Generates the output sequence one token at a time, attending both to the encoder's representations and to previously generated tokens.

This design is elegant for translation (read a French sentence, produce an English sentence), but researchers quickly discovered that the two halves could be powerful on their own.

### Encoder-Only, Decoder-Only, and Encoder-Decoder

The transformer family split into three branches:

| Architecture | How It Works | Flagship Models | Primary Use |
|---|---|---|---|
| **Encoder-only** | Processes full input bidirectionally | BERT, RoBERTa | Classification, NER, embeddings |
| **Decoder-only** | Generates text left-to-right autoregressively | GPT series, Llama, Claude | Text generation, chat, reasoning |
| **Encoder-decoder** | Encodes input, then generates output | T5, BART, original Transformer | Translation, summarization |

Modern large language models — GPT-4, Claude, Llama, Gemini, Mistral — are all **decoder-only** transformers. They process input and generate output using the same mechanism: predicting the next token.

![Decoder-only transformer architecture used by modern LLMs](/svg/decoder-only-transformer.svg)

The decoder-only design won for generative AI because it simplifies the architecture while scaling effectively. A single stack of transformer layers handles both "understanding" the input (the prompt) and "generating" the output (the completion). The same attention mechanism serves both purposes.

### Self-Attention: The Core Innovation

Self-attention is the mechanism that allows every token in a sequence to directly attend to every other token, regardless of distance. This is what transformers do differently from everything that came before.

In a sentence like "The cat sat on the mat because **it** was tired," self-attention allows the model to directly connect "it" to "cat" across the intervening tokens. An RNN would need to carry that information through every intermediate hidden state.

The self-attention computation works through three learned projections — **Queries (Q)**, **Keys (K)**, and **Values (V)** — which we will examine in detail in Section 1.3. For now, the key insight is:

**Every token asks "which other tokens are relevant to me?" and directly gathers information from them, weighted by relevance.**

This happens in parallel across all tokens and across multiple "attention heads," each learning to attend to different types of relationships (syntactic, semantic, positional, etc.).

> **Why this matters for guardrails:** Self-attention is why LLMs are so good at following context — and why they can be manipulated through context. A carefully crafted prompt can cause the model to attend to adversarial instructions more strongly than to safety instructions. Understanding attention helps you understand why prompt injection works and why defending against it requires more than just telling the model to "ignore malicious instructions."

### Next-Token Prediction: The Objective

Despite all their apparent sophistication, modern LLMs are trained on a deceptively simple objective: **predict the next token**.

Given a sequence of tokens, the model learns to output a probability distribution over the entire vocabulary for what the next token should be. During training, the correct next token is known (it's the actual next token from the training text), so the model can be scored and updated through the training loop described in Section 1.1.

```
Input:   "The capital of France is"
Target:  "Paris"

Model output (probability distribution):
  "Paris"    → 0.82
  "the"      → 0.03
  "Lyon"     → 0.02
  "located"  → 0.02
  "a"        → 0.01
  ...
  (50,000+ other tokens with small probabilities)
```

This is the entire training signal. There is no "understand this concept" objective. There is no "be truthful" objective. There is no "be safe" objective. The model learns to predict the next token, and everything else — reasoning, instruction following, coding, creative writing — emerges as a byproduct of doing next-token prediction on a sufficiently large and diverse dataset at sufficient scale.

> **Why this matters for guardrails:** Next-token prediction means the model has no internal concept of truth, safety, or appropriateness. It has learned statistical patterns about what tokens follow other tokens. When a model generates a harmful response, it is not "choosing" to be harmful — it is producing tokens that are statistically likely given the context. Guardrails must operate on the inputs and outputs of this statistical process because the process itself has no safety mechanism.

### Scale and Emergent Capabilities

One of the most striking discoveries of the LLM era is that scaling — making models bigger and training them on more data — produces **emergent capabilities** that smaller models do not exhibit. These are abilities that appear suddenly as a function of scale rather than gradually improving:

- **Few-shot learning:** Given a few examples in the prompt, the model can perform novel tasks it was never explicitly trained for.
- **Chain-of-thought reasoning:** Larger models can solve multi-step problems by generating intermediate reasoning steps.
- **Instruction following:** The ability to follow complex, multi-part instructions improves dramatically with scale.
- **Code generation:** Writing functional code across multiple programming languages.

These emergent capabilities are not fully understood. They arise from the interaction of scale, data diversity, and the transformer's ability to form complex internal representations. This unpredictability is itself a guardrail concern — we cannot always predict what a larger model will be capable of.

### Mixture-of-Experts (MoE)

As models grew to hundreds of billions of parameters, a practical problem emerged: running all parameters for every single token is computationally expensive. **Mixture-of-Experts (MoE)** addresses this by splitting the feed-forward layers into multiple "expert" sub-networks and using a learned **router** to activate only a subset of experts for each token.

```
Token arrives
    │
    ▼
┌──────────┐
│  Router   │  ← Learned gating network
│ (selects  │
│  top-k)   │
└─┬──┬──┬──┘
  │  │  │
  ▼  ▼  ▼
┌──┐┌──┐┌──┐┌──┐┌──┐┌──┐┌──┐┌──┐
│E1││E2││E3││E4││E5││E6││E7││E8│  ← Expert sub-networks
└──┘└──┘└──┘└──┘└──┘└──┘└──┘└──┘
  ▲       ▲                        (only top-k activated)
  │       │
  └───┬───┘
      ▼
  Weighted sum of
  selected expert outputs
```

For example, a model might have 1.8 trillion total parameters but only activate 280 billion for any given token. This means the model has a massive knowledge capacity (total parameters) but manageable inference cost (active parameters per token).

MoE is relevant to guardrail engineering because it means that different tokens in the same request may be processed by different expert sub-networks. The model's behavior is not just a function of its weights — it is also a function of which experts the router selects, adding another layer of unpredictability.

### Embedding Models and Vector Representations

Not all transformer models are generative. **Embedding models** are transformers (typically encoder-only or encoder-decoder) trained to produce dense vector representations of text. Instead of predicting the next token, they are trained so that semantically similar texts produce similar vectors.

![Embedding model producing vector representations](/svg/embedding-model.svg)

An embedding model takes a piece of text and outputs a fixed-size vector (e.g., 768 or 1536 dimensions) that captures the semantic meaning of that text. Texts with similar meanings end up close together in this vector space; unrelated texts end up far apart.

```python
# Conceptual example
embed("How do I reset my password?")  → [0.12, -0.45, 0.78, ...]
embed("I forgot my login credentials") → [0.11, -0.43, 0.80, ...]  # Very similar
embed("What is the weather today?")    → [-0.67, 0.22, -0.15, ...]  # Very different
```

Embedding models are the backbone of:
- **Semantic search:** Finding documents by meaning rather than keyword match.
- **Retrieval-Augmented Generation (RAG):** Retrieving relevant context to ground LLM responses.
- **Classification:** Using vector similarity for content categorization.
- **Clustering:** Grouping similar content together.

> **Why this matters for guardrails:** Embedding models are used in many guardrail systems — for example, checking if a user's input is semantically similar to known attack patterns, or verifying that a model's response is grounded in retrieved documents. Understanding how embeddings represent meaning (and where they fail) is essential for building effective guardrails. Embeddings can be fooled by adversarial text that is semantically similar to benign queries but includes hidden malicious intent.

### What an LLM Is NOT

Misconceptions about LLMs lead directly to bad guardrail decisions. Let's be explicit about what LLMs are not:

**An LLM is not a knowledge base.** It does not "store" facts that can be looked up. It has learned statistical associations between tokens. It can generate text that sounds factual but is fabricated. This is called **hallucination**, and it is not a bug — it is a natural consequence of the generation mechanism.

**An LLM is not a reasoning engine.** When a model appears to reason, it is generating tokens that resemble reasoning traces from its training data. Sometimes this process arrives at correct answers; sometimes it produces fluent nonsense. The model has no internal "logic checker."

**An LLM is not an agent with goals.** The model does not "want" anything. It does not "try" to be helpful or harmful. It produces the most probable next tokens given the context. Anthropomorphizing the model leads to guardrail strategies based on "asking the model to behave" rather than building external enforcement.

**An LLM is not deterministic.** Given the same input, the model can (and often does) produce different outputs due to sampling parameters. You cannot test an LLM once and assume the same input will always produce the same output.

**An LLM is not self-aware of its limitations.** When a model says "I don't know," it is because generating those tokens was probabilistically favorable given the context — not because it evaluated its own knowledge and determined it was insufficient.

> **Why this matters for guardrails:** Every one of these misconceptions corresponds to a guardrail anti-pattern. "Just tell the model not to hallucinate" doesn't work because the model is not a reasoning engine that can evaluate its own outputs. "Test it once and ship it" doesn't work because the model is non-deterministic. "The model said it would refuse harmful requests" doesn't work because the model has no persistent goals or commitments. Effective guardrails treat the model as a statistical text generator and build safety around that reality.

### The LLM Landscape

The current LLM ecosystem includes models from multiple providers, each with different architectures, training data, and capability profiles:

| Category | Examples | Relevance to Guardrails |
|---|---|---|
| **Proprietary API models** | GPT-4, Claude, Gemini | Provider applies some guardrails; you add your own |
| **Open-weight models** | Llama, Mistral, Qwen | Full control but full responsibility for safety |
| **Specialized models** | Code Llama, Med-PaLM | Domain-specific risks require domain-specific guardrails |
| **Small language models** | Phi, Gemma | Fewer emergent capabilities but also fewer guardrails from provider |
| **Multimodal models** | GPT-4o, Gemini, Claude | Accept images/audio — new attack surfaces beyond text |

A guardrail engineer must be prepared to work with any of these. The architectural fundamentals are shared, but the specific risks, API interfaces, and available controls differ. The guardrail patterns you learn in this program are designed to be vendor-agnostic — they apply regardless of which model sits behind the API.

---
