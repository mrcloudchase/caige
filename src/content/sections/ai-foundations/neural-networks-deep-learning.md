---
title: "Neural Networks & Deep Learning"
slug: "neural-networks-deep-learning"
module: "ai-foundations"
sectionOrder: 1
description: "How neural networks learn from data — layers, weights, backpropagation, and why knowledge is distributed."
---

## Section 1.1: Neural Networks & Deep Learning

Before you can understand how large language models work — and more importantly, how they fail — you need to understand the computational substrate they are built on. Every LLM is, at its core, a very large neural network. This section covers what that means, how neural networks learn, and why the way they store knowledge has profound implications for guardrail engineering.

### What Is a Neural Network?

A neural network is a computational graph organized into layers of interconnected nodes (often called neurons or units). Each connection between nodes carries a **weight** — a number that determines how strongly the output of one node influences the input of the next. The collection of all weights in a network constitutes its **parameters**, and these parameters are the model's learned knowledge.

![Neural network with input, hidden, and output layers](/svg/neural-network.svg)

A basic feed-forward neural network has three types of layers:

| Layer Type | Role | Example |
|---|---|---|
| **Input layer** | Receives raw data (numbers representing features) | Pixel values of an image, token embeddings of text |
| **Hidden layers** | Transform data through weighted connections and activation functions | Detect patterns, build representations |
| **Output layer** | Produces the final prediction | Class probabilities, next-token distribution |

The "deep" in deep learning simply means the network has many hidden layers. Modern LLMs have dozens to over a hundred layers, each building progressively more abstract representations of the input.

### Weights, Parameters, and Model Size

Every connection between two nodes has a weight, and every node has a bias term. Together, these are the model's parameters. When people say a model has "70 billion parameters," they mean there are 70 billion individual numbers that were learned during training.

To put this in perspective:

| Model | Approximate Parameters |
|---|---|
| Small image classifier | 1-10 million |
| BERT (2018) | 110 million |
| GPT-3 (2020) | 175 billion |
| Llama 3.1 (2024) | 8B / 70B / 405B variants |
| GPT-4 (estimated) | ~1.8 trillion (MoE) |

These numbers matter because they define the model's capacity — how much information it can encode about the world. But they also define the problem: no human can inspect 70 billion numbers and understand what any individual weight "knows."

### The Training Loop

Neural networks learn through an iterative process called **gradient descent**. Here is the core loop that trains every neural network, from the smallest classifier to the largest language model:

```
┌──────────────────────────────────────────────────────┐
│                   THE TRAINING LOOP                  │
│                                                      │
│   ┌─────────────┐                                    │
│   │ Training Data│                                   │
│   └──────┬──────┘                                    │
│          ▼                                           │
│   ┌─────────────┐    "Given this input,              │
│   │ Forward Pass │     what does the model predict?"  │
│   └──────┬──────┘                                    │
│          ▼                                           │
│   ┌─────────────┐    "How wrong was the prediction?" │
│   │ Compute Loss │                                   │
│   └──────┬──────┘                                    │
│          ▼                                           │
│   ┌──────────────┐   "Which weights contributed      │
│   │Backpropagation│    to the error, and by how much?"│
│   └──────┬───────┘                                   │
│          ▼                                           │
│   ┌──────────────┐   "Nudge each weight a tiny bit   │
│   │ Update Weights│    to reduce the error."          │
│   └──────┬───────┘                                   │
│          │                                           │
│          └──────────── repeat millions of times ──►  │
│                                                      │
└──────────────────────────────────────────────────────┘
```

Let's break each step down:

**1. Forward pass.** A batch of training examples is fed through the network. Data flows forward from input to output, with each layer applying its weights and activation functions. The output is the model's current prediction.

**2. Compute loss.** A **loss function** compares the model's prediction to the known correct answer. For language models, this is typically **cross-entropy loss** — it measures how far the model's predicted probability distribution over the vocabulary is from the true next token. A perfect prediction yields zero loss; a terrible prediction yields high loss.

**3. Backpropagation.** This is where calculus enters the picture. The algorithm computes the **gradient** of the loss with respect to every single weight in the network. The gradient tells you two things: which direction to move each weight to reduce the loss, and how sensitive the loss is to each weight. The term "backpropagation" refers to the chain rule of calculus being applied backward through the layers.

**4. Update weights.** Each weight is adjusted by a small amount in the direction that reduces the loss. The size of this adjustment is controlled by the **learning rate** — a hyperparameter that determines how aggressively the model learns. Too large and the model overshoots; too small and training takes forever (or gets stuck).

This loop repeats millions or billions of times across the training data. Gradually, the weights converge to values that produce good predictions on the training distribution.

### Activation Functions and Non-Linearity

Between the weighted sum computation and the output of each node, an **activation function** introduces non-linearity. Without activation functions, stacking layers would be pointless — a stack of linear transformations is equivalent to a single linear transformation.

Common activation functions include:

| Function | Formula | Used In |
|---|---|---|
| ReLU | max(0, x) | Most hidden layers |
| GELU | x · Φ(x) | Transformer hidden layers |
| Sigmoid | 1/(1+e⁻ˣ) | Gating mechanisms |
| Softmax | eˣᵢ / Σeˣⱼ | Output layer (probability distribution) |

Non-linearity is what allows neural networks to model complex, non-linear relationships. It's what lets a network learn that "the word 'bank' means something different after 'river' than after 'investment'" — a relationship that no linear function could capture.

### How Knowledge Is Stored: Distributed Representations

Here is the single most important concept in this section for guardrail engineers:

**A neural network does not store facts in discrete, addressable locations.** There is no "Paris is the capital of France" neuron. There is no "don't say offensive things" weight. Instead, every piece of knowledge is encoded as a pattern across millions or billions of weights, and every weight participates in encoding thousands of different pieces of knowledge.

This property is called **distributed representation**, and it has been a defining characteristic of neural networks since the 1980s. A concept like "the capital of France" is represented by a specific pattern of activation across many neurons. Change any one weight and you subtly shift thousands of concepts simultaneously.

Think of it like a hologram: the information is spread across the entire medium. You cannot cut out a piece of a hologram and expect to have cleanly removed one image — you degrade the entire picture.

> **Why this matters for guardrails:** This is arguably the most consequential technical fact for guardrail engineering. You cannot "delete" harmful knowledge from a model. You cannot "remove" the ability to generate toxic content by editing weights. Fine-tuning and alignment can make harmful outputs less *likely*, but the underlying capability remains encoded in the distributed weights. This is why external guardrails — systems that operate *around* the model rather than *inside* it — are necessary. You are not fixing the model; you are building safety infrastructure around an inherently unpredictable system.

### From Simple Networks to Deep Learning

The jump from simple neural networks to "deep learning" is fundamentally about depth — adding more hidden layers. Each additional layer allows the network to learn more abstract representations:

```
Layer 1:  Detects basic patterns    (edges, character fragments)
Layer 2:  Combines patterns          (shapes, common words)
Layer 4:  Recognizes concepts        (objects, phrases)
Layer 8:  Understands relationships  (scenes, sentence meaning)
Layer 16: Abstract reasoning         (context, intent, style)
  ...
Layer 96: Complex compositions       (multi-step reasoning, nuance)
```

This hierarchical feature learning is what makes deep networks so powerful. Early layers learn general features useful for many tasks; later layers learn task-specific abstractions. In a language model, early layers capture syntax and common patterns while later layers encode more abstract semantic and reasoning capabilities.

### What Does This Mean for Model Behavior?

Because knowledge is distributed and learned statistically from data, neural networks exhibit several properties that directly affect how we must guard them:

**1. Probabilistic, not deterministic.** The model does not "know" things the way a database does. It assigns probabilities. Sometimes the wrong answer has a high probability.

**2. No built-in notion of truth.** The model learned statistical patterns from training data. If the training data contains false information, the model learns false information with the same confidence as true information.

**3. Graceful degradation, not clean failure.** When a neural network encounters something outside its training distribution, it does not return an error. It returns its best guess — which may be confidently, fluently wrong.

**4. Entangled capabilities.** The same weights that enable helpful, creative responses also enable harmful ones. You cannot surgically remove one capability without affecting others.

**5. Opaque reasoning.** Even when a model produces a correct answer, we generally cannot trace *why* it produced that answer through the billions of weight interactions. This opacity is not a bug in current implementations — it is a fundamental property of distributed representations.

> **Why this matters for guardrails:** These five properties define the guardrail engineering problem. You are defending against a system that is probabilistic, has no concept of truth, fails gracefully (making failures hard to detect), has entangled capabilities (making selective restriction hard), and is opaque (making root-cause analysis hard). Every guardrail strategy you learn in this program is a response to one or more of these properties.

### The Scale of Modern Models

To appreciate the guardrail challenge, consider what "training" means at modern scale. GPT-3 was trained on roughly 300 billion tokens of text. Llama 3 was trained on over 15 trillion tokens. During training, the model sees patterns of human language, reasoning, creativity, toxicity, bias, misinformation, and everything else present in that data.

The training process does not label individual facts as "true" or "false," "safe" or "unsafe." It simply adjusts weights to predict the next token better. The result is a system that has absorbed an enormous amount of human knowledge and human dysfunction in equal measure, encoded inseparably across its parameters.

This is not a flaw in any particular model or training approach. It is an inherent property of how neural networks learn from data. The guardrail engineer's job exists precisely because this property cannot be engineered away at the model level.

---
