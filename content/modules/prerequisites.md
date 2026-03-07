# Prerequisites: AI Foundations

**This content is not on the exam.** It provides background knowledge that will help you understand Module 1 and the rest of the training program. If you are already familiar with how neural networks and language models work at a high level, you can skip this and go directly to Module 1.

---

## What Is a Neural Network?

A neural network is a program that learns patterns from data. Instead of being explicitly programmed with rules ("if the email contains 'free money,' mark it as spam"), a neural network is shown thousands of examples and learns the patterns itself.

At its core, a neural network is a series of mathematical operations organized into **layers**:

```
 Input            Hidden Layers           Output
 (data)          (learned patterns)      (prediction)

 +---+          +---+    +---+          +---+
 | x |--------->| h |--->| h |--------->| y |
 +---+     +--->| h |    | h |-+   +--->| y |
 +---+     |    | h |--->| h | +-->|    +---+
 | x |-----+--->| h |    | h |    +|
 +---+          +---+    +---+     |
 +---+                             |    +---+
 | x |-----------------------------+--->| y |
 +---+                                  +---+

 Each connection has a "weight" -- a number
 that determines how much influence one node
 has on the next. Learning = adjusting weights.
```

- **Input layer:** receives data (text, numbers, pixels)
- **Hidden layers:** where the network learns intermediate patterns — simple patterns in early layers (edges in images, common word pairs in text), complex patterns in later layers (faces, sentence meaning)
- **Output layer:** produces the result (a classification, a probability, a prediction)

**Weights** are the numbers on the connections between nodes. A neural network with billions of parameters has billions of these weights. When we say a model "learns," we mean the training process adjusts these weights so the network's outputs get closer to the correct answers. When we say knowledge is "baked into the weights," we mean the model's behavior is determined by these numbers, and you cannot change the behavior without changing the weights (through additional training).

**Training** is the process of showing the network examples and adjusting weights to reduce errors. The network makes a prediction, compares it to the correct answer, calculates how wrong it was, and adjusts the weights slightly to be less wrong next time. This cycle repeats billions of times across massive datasets. The mathematical process for adjusting weights is called **backpropagation** — you do not need to understand how it works for this certification, just that it is how neural networks learn from data.

---

## The Transformer Architecture

Large language models like GPT, Claude, Llama, and Gemini are all based on the **transformer** architecture, introduced in 2017. You do not need to understand the math, but understanding the key ideas will help you reason about guardrails.

### The Core Idea: Attention

Before transformers, the dominant language models (RNNs and LSTMs) processed text sequentially — one token at a time — making it difficult to capture relationships between distant words and preventing parallelization during training. The transformer's breakthrough is **self-attention**: the ability to look at all parts of the input simultaneously and determine which parts are most relevant to each other.

For example, in the sentence "The cat sat on the mat because it was tired," the model needs to understand that "it" refers to "the cat," not "the mat." The attention mechanism lets the model compute a relevance score between every pair of words, so when processing "it," the model attends strongly to "cat."

```
 "The  cat  sat  on  the  mat  because  it  was  tired"
                                         |
                    attention scores (illustrative,
                    from a single attention head):
                         "cat" = 0.42  (strong)
                         "mat" = 0.18  (moderate)
                         "sat" = 0.09
                         ...

 The model determines "it" most likely refers to "cat"
 by computing these scores across all tokens in parallel.
```

This is important for guardrails because it means the model can be influenced by content **anywhere** in its input — a malicious instruction buried in the middle of a long document is attended to just as readily as text at the beginning.

### Layers of a Transformer

A transformer stacks multiple layers. Each layer contains two main computational components, along with **residual connections** and **layer normalization** that enable stable training across many layers:

**Self-attention:** computes which parts of the input are relevant to each other (as described above). In practice, models use **multi-head attention** — multiple attention computations running in parallel, each potentially learning to focus on different types of relationships (for example, some heads may track syntactic dependencies, while others track positional or semantic relationships).

**Feed-forward network:** after attention determines which tokens are relevant, a feed-forward network processes that information to build more abstract representations. Think of attention as "gathering relevant context" and the feed-forward layer as "processing it further" — though this is a simplified mental model.

**Residual connections** (also called skip connections) add the input of each sub-layer to its output, allowing information to flow directly through the network and preventing the signal from degrading across many layers. **Layer normalization** stabilizes the values flowing through the network, keeping training stable. Without these two components, training deep transformers (32-128+ layers) would be extremely difficult.

```
 Input Text (tokenized)
       |
       v
 +---------------------+
 | Self-Attention       |  "Which parts of the input
 | (multi-head)         |   relate to each other?"
 +----------+----------+
            |
       Add & Norm           Residual connection +
            |                layer normalization
            v
 +---------------------+
 | Feed-Forward         |  "Process this pattern
 | Network              |   further"
 +----------+----------+
            |
       Add & Norm           Residual connection +
            |                layer normalization
            v
     (repeat 32-128x)      Stacking layers builds
            |               deeper understanding
            v
 +---------------------+
 | Output Probabilities |  "What token comes next?"
 +---------------------+
```

Modern LLMs stack 32 to 128+ of these layers. Early layers capture simple patterns (grammar, common phrases). Later layers capture complex patterns (reasoning, context, intent). The final layer produces a probability distribution over the vocabulary — the model's prediction for what token comes next.

### Scale

What makes large language models "large" is the number of parameters (weights):

| Model Size | Parameters | Rough Capability |
|-----------|-----------|-----------------|
| Small | 1-8 billion | Capable for focused tasks, code, structured outputs |
| Medium | 8-70 billion | Strong instruction following, reasoning, multi-step tasks |
| Large | 70+ billion | Complex reasoning, nuanced understanding |
| Frontier | Varies (often MoE) | State-of-the-art performance across tasks |

These categories are approximate and shift over time — training data quality, architecture innovations (such as Mixture-of-Experts, where only a fraction of parameters are active per inference), and post-training techniques can dramatically change capability at any given parameter count. A well-trained 8B model today can outperform a 100B+ model from a few years ago.

More parameters means more capacity to learn patterns from training data. However, more parameters also means more capacity to memorize training data (relevant to data leakage) and more complex behaviors that are harder to predict (relevant to guardrails).

---

## How LLMs Are Trained

LLM training happens in stages. Understanding these stages helps you understand where model behaviors come from and which behaviors you can influence as an application developer.

### Stage 1: Pre-Training

The model is trained on a massive corpus of text — typically trillions of tokens from books, websites, code repositories, academic papers, and other sources. The training objective is simple: **predict the next token.**

```
 Training example:

 Input:  "The capital of France is"
 Target: "Paris"

 The model predicts a probability distribution:
   "Paris"  = 0.85
   "Lyon"   = 0.03
   "the"    = 0.02
   ...

 The model got it mostly right. Weights are adjusted
 slightly to make "Paris" even more probable next time.

 This repeats trillions of times across the dataset.
```

After pre-training, the model has learned grammar, facts, reasoning patterns, coding conventions, and much more — all from predicting what text comes next. But it has no concept of conversations, instructions, or safety. It is a **base model** — a powerful text completer with no behavioral alignment.

If you gave a base model the prompt "What is the capital of France?", it might respond with:

```
What is the capital of France?
What is the capital of Germany?
What is the capital of Italy?
```

It is completing a pattern (a list of questions), not answering your question. It has no concept of "user asks, assistant answers."

### Stage 2: Instruction Tuning (Supervised Fine-Tuning)

The base model is fine-tuned on curated datasets of conversations formatted in a **chat template** — the structured format with special tokens that marks role boundaries (covered in detail in Module 1, section 1.1.3).

The training data for this stage contains hundreds of thousands to millions of curated examples, including conversations where a system message sets rules and an assistant follows them:

```
<|im_start|>system
You are a helpful assistant.<|im_end|>
<|im_start|>user
What is the capital of France?<|im_end|>
<|im_start|>assistant
The capital of France is Paris.<|im_end|>
```

Through fine-tuning on these examples, the model learns:
- Text after `system` = behavioral rules to follow
- Text after `user` = questions to answer
- Text after `assistant` = helpful responses that follow the system rules

This is where the model gains its conversational ability and its tendency to follow instructions. But the instruction-following behavior is **learned from patterns in training data**, not architecturally enforced — a distinction that is critical for understanding guardrails.

### Stage 3: RLHF (Reinforcement Learning from Human Feedback)

The instruction-tuned model is further refined using human preferences:

1. The model generates multiple responses to the same prompt
2. Human raters rank the responses (helpful, safe, accurate, etc.)
3. A reward model is trained on these rankings
4. The language model is optimized — typically using an algorithm called **Proximal Policy Optimization (PPO)** — to produce responses the reward model rates highly, while staying close to its original behavior to prevent instability

This is where the model learns safety behaviors — refusing harmful requests, being honest about uncertainty, following system prompt instructions more reliably. **Constitutional AI** (used by Anthropic) is a variation where the model evaluates its own responses against a set of principles rather than relying solely on human raters. More recent approaches like **Direct Preference Optimization (DPO)** skip the separate reward model and optimize the language model directly on human preference data.

After all three stages, the result is a chat model — the kind of model you interact with through APIs and chat interfaces, and the kind of model you build guardrails around.

### What You Can and Cannot Control

| Layer | Who Controls It | Can You Change It? |
|-------|----------------|-------------------|
| Pre-training data | Model provider | No (unless you train from scratch) |
| Model weights | Model provider | No (for API models), Yes (for open-weight models via fine-tuning) |
| Instruction tuning | Model provider | No (for API models), Yes (for open-weight models) |
| RLHF / safety training | Model provider | No (for API models), Yes (for open-weight models via DPO or custom RLHF) |
| System prompt | You (application developer) | Yes |
| Input/output guardrails | You (application developer) | Yes |
| Application architecture | You (application developer) | Yes |

As a guardrail engineer, you work primarily in the bottom three rows. You build controls around a model whose internal behaviors were set by the provider. This is why application-level guardrails are essential — the model's training is not under your control, and it can change when the provider releases a new version.

---

## Key Vocabulary

These terms appear throughout the training modules. If any are unfamiliar, review the relevant sections above.

| Term | Definition |
|------|-----------|
| **Neural network** | A program that learns patterns from data by adjusting weights through training |
| **Weights / Parameters** | The numbers in a neural network that determine its behavior; adjusted during training |
| **Transformer** | The neural network architecture used by all modern LLMs; key innovation is self-attention |
| **Self-attention** | Mechanism that lets the model consider all parts of its input simultaneously |
| **Pre-training** | Training a model on massive text data using next-token prediction |
| **Base model** | A pre-trained model before instruction tuning; completes text but does not follow instructions |
| **Fine-tuning** | Additional training on a specialized dataset to adapt the model's behavior |
| **Instruction tuning** | Fine-tuning a base model on conversation data so it learns to follow instructions |
| **Chat template** | Structured format with special tokens that marks role boundaries in conversations |
| **RLHF** | Reinforcement Learning from Human Feedback; trains the model to prefer safe, helpful responses, typically using PPO |
| **DPO** | Direct Preference Optimization; an alternative to RLHF that optimizes directly on preference data without a separate reward model |
| **Constitutional AI** | Training approach where the model evaluates its own responses against defined principles |
| **Inference** | Running a trained model to generate output (as opposed to training it) |
| **Token** | The basic unit of text that LLMs process; roughly 3/4 of a word in English |
| **Context window** | The maximum amount of text a model can process in a single inference call |

---

**You are now ready for Module 1.**
