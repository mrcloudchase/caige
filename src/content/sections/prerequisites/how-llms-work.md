---
title: "How an LLM Works"
slug: "how-llms-work"
module: "prerequisites"
moduleOrder: 0
sectionOrder: 2
description: "Section 2 of the prerequisites module."
---

Parts 1 and 2 gave you the building blocks: what a neural network is, how it learns, and the three properties that define an LLM — the transformer architecture, next-token prediction, and massive scale. Now it is time to look inside the transformer and trace the complete journey of data through an LLM — from the moment raw text enters the system to the moment a generated response comes out. Each step introduces a component of the decoder-only transformer in the order that data encounters it. Understanding this data flow is essential for understanding where attacks can target the system and where guardrails can be applied.

### 3.1 Text to Numbers: Tokenization

In Part 2, you learned that a decoder-only transformer starts with an embedding layer that converts token IDs into vectors. But what are token IDs, and where do they come from? Before the embedding layer can do its work, the raw text must be broken into discrete units and assigned numerical identifiers. This process is called **tokenization**, and it is the very first step in the LLM pipeline.

#### What Is a Token?

A token is a subword unit. It is not the same as a word. Depending on the tokenizer, a single word might be one token ("hello") or multiple tokens ("unbelievable" might become "un", "believ", "able"). Numbers, punctuation, spaces, and special characters are also tokens. A rough rule of thumb: one token is approximately 3/4 of a word in English, but this varies significantly across languages.

```
 Raw text:     "The cat sat on the mat"

 Tokenized:    ["The", " cat", " sat", " on", " the", " mat"]

 Token IDs:    [464,   3857,   3332,   319,   262,   2648]

 The model never sees the original text.
 It receives the sequence of token IDs, which are
 then converted into embedding vectors (next section).
```

#### How Tokenization Works: Byte Pair Encoding

Most modern LLMs use a tokenization algorithm called **Byte Pair Encoding (BPE)**. The core idea is simple:

1. Start with individual bytes (or characters) as the initial vocabulary
2. Count all adjacent pairs in the training data
3. Merge the most frequent pair into a new token
4. Repeat until the vocabulary reaches a target size (typically 30,000 to 100,000+ entries)

```
 BPE merge example (simplified):

 Starting tokens: ["l", "o", "w", "e", "r"]
 Most frequent pair: ("l", "o") -- merge into "lo"
 Next most frequent: ("lo", "w") -- merge into "low"
 Next most frequent: ("e", "r") -- merge into "er"
 Result: ["low", "er"]  (2 tokens instead of 5)
```

This process creates a fixed **vocabulary** — a mapping from token IDs to subword strings. Once built, the vocabulary does not change. Every piece of text the model processes is broken into tokens from this fixed vocabulary.

#### Special Tokens

Beyond regular text tokens, every vocabulary includes **special tokens** — tokens with reserved meanings that the tokenizer would not produce from normal text. Common special tokens include:

- **BOS** (beginning of sequence): marks the start of an input
- **EOS** (end of sequence): signals the model to stop generating
- **PAD** (padding): fills unused positions when processing batches of different-length inputs

Special tokens become critical when we discuss chat templates and role boundaries in Part 4 — they are how the model distinguishes between system instructions, user messages, and its own responses.

#### The Context Window

The **context window** is the maximum number of tokens a model can process in a single inference call. It functions as the model's working memory — everything the model "knows" during a conversation must fit in this window. A typical context window ranges from 8,000 to over 1,000,000 tokens depending on the model, with most production models offering 32,000 to 200,000 tokens.

Context window arithmetic matters: a 128,000-token context window is approximately 96,000 words of English text. Every element of a conversation consumes tokens from this budget — instructions, conversation history, reference material, and the user's current message all compete for space.

> **Why this matters for guardrails:** Tokenization affects guardrails in two important ways. First, token boundaries determine what keyword-based filters can and cannot catch — a word split across two tokens may evade a filter looking for the whole word. Second, every guardrail instruction (safety rules, few-shot examples, reference material) consumes tokens from the finite context window budget.

### 3.2 Numbers to Meaning: The Embedding Layer

Tokenization gave us a sequence of integer IDs — for example, [464, 3857, 3332, 319, 262, 2648] for "The cat sat on the mat." But these integers are just lookup addresses. The number 464 does not carry any information about the meaning of "The" — it is simply an index. In Part 1, you learned that neural networks process numbers, not words. The model needs rich numerical representations that capture what each token means and how it relates to other tokens. This is the job of the **embedding layer** — the first true component of the decoder-only transformer.

The embedding layer is essentially a giant lookup table — one row per token in the vocabulary. When the model receives a token ID, it looks up the corresponding row and retrieves a dense **vector** (a list of numbers, typically 768 to 12,288 numbers long, depending on model size). This vector is the token's **embedding** — a learned representation that captures semantic and syntactic properties of that token.

![Embedding lookup diagram](/svg/embedding-lookup.svg)

These embedding vectors are **learned during training** — they start as random numbers and are adjusted through backpropagation just like every other weight in the model (as you learned in Part 1). Before training, every token's vector is random gibberish. After training, tokens with related meanings end up with similar vectors. The word "cat" and "kitten" will have vectors that are close together in this high-dimensional space, while "cat" and "spreadsheet" will be far apart. The standard way to measure this closeness is **cosine similarity** — a calculation that compares the angle between two vectors, producing a score from -1 (opposite) to 1 (identical direction). Cosine similarity appears throughout AI systems wherever similarity between texts needs to be measured.

The LLM's embedding layer converts individual tokens into vectors. Later, in Part 5, we will see how a different type of embedding model converts entire passages into a single vector — the same concept at a different granularity, used for retrieving relevant documents.

### 3.3 Adding Position: Positional Encoding

The transformer processes all tokens in parallel — this is what makes it fast. But this creates a problem. If every token is processed simultaneously, the model has no idea what order they appear in. Without positional information, the sentences "the dog chased the cat" and "the cat chased the dog" would be indistinguishable — the embedding layer produces the same vector for a given token regardless of where it appears, so both sentences would produce the same bag of vectors.

**Positional encoding** solves this by adding information about each token's position to its embedding vector. After the embedding layer produces a vector for each token, the model adds a second vector that encodes that token's position in the sequence — "this is the 1st token," "this is the 2nd token," and so on. The result is a combined vector that represents both what the token is and where it appears.

![Positional encoding diagram](/svg/positional-encoding.svg)

The original transformer paper used fixed mathematical functions (sinusoidal encoding) for positions. Modern LLMs typically use learned positional representations or techniques like **Rotary Position Embeddings (RoPE)** that allow the model to generalize to longer sequences than it saw during training. The specific technique matters less than the concept: position is information that must be explicitly added to the embedding vectors, not something the architecture inherently provides.

The complete pipeline from text to transformer input is:

![Input pipeline diagram](/svg/input-pipeline.svg)

### 3.4 The Transformer: Processing Context

With embeddings and positional encoding in place, the token representations are ready to enter the transformer layers — the heart of the model. The diagram below shows the complete decoder-only transformer architecture. You have already seen the bottom portion (embedding and positional encoding). This section explains the transformer layers — the repeated blocks that do the actual processing.

![Decoder-only transformer architecture](/svg/decoder-only-transformer.svg)

Each transformer layer contains two main components: a **self-attention** mechanism that gathers information from across the sequence, and a **feed-forward network** that processes each token's representation independently. These are supported by **residual connections** and **layer normalization** that keep the signal stable as it passes through many layers. Let's examine each one.

#### Masked Self-Attention (Multi-Head)

This is the most important component of the transformer — the mechanism that gives the architecture its name and its power. Self-attention is what allows the model to understand context, resolve ambiguity, and connect related ideas across a sequence.

**The core idea.** When you read the sentence "The cat sat on the mat because it was tired," you instantly know that "it" refers to "the cat." You make this connection because you understand the meaning of the words and the structure of the sentence. A transformer needs to make the same kind of connection, but it does so through a mathematical process: for each token in the sequence, the model computes a **relevance score** against every other token. These scores determine how much each token should influence each other token's representation.

**How it works: Queries, Keys, and Values.** The attention mechanism uses three learned projections for each token, called **Query (Q)**, **Key (K)**, and **Value (V)**. Think of it like a search engine:

- The **Query** is what a token is looking for — "what kind of information do I need from other tokens?"
- The **Key** is what a token advertises about itself — "here is what I can offer to other tokens looking for context."
- The **Value** is the actual information a token provides when it is selected as relevant.

For each token, the model computes a score between that token's Query and every other token's Key. High scores mean "this other token is highly relevant to me." These scores are normalized (using softmax) into weights that sum to 1, and then each token's output is a weighted sum of all the Value vectors — pulling more information from tokens with high relevance scores and less from tokens with low scores. The word "it" in our example sentence would produce a high attention score when its Query matches against the Key for "cat," pulling "cat's" information into "it's" representation.

**Why "masked" (causal).** In a decoder-only transformer, each token can only attend to tokens at its position or **earlier** in the sequence — it cannot look ahead at tokens that come after it. This is enforced by a **causal mask** that sets the attention scores for all future positions to negative infinity before the softmax step, effectively making them zero. This constraint exists because the model is trained to predict the next token — if it could see the answer, it would just copy it instead of learning to predict. During actual text generation, this constraint matches reality: when the model is generating the 10th word, the 11th word does not exist yet.

```
 Can attend to:  The  cat  sat  on   it
                 ---  ---  ---  ---  ---
 The            [ Y    .    .    .    . ]
 cat            [ Y    Y    .    .    . ]
 sat            [ Y    Y    Y    .    . ]
 on             [ Y    Y    Y    Y    . ]
 it             [ Y    Y    Y    Y    Y ]

 Y = can attend    . = masked (future token)
```

**Why "multi-head."** A single attention computation can only capture one type of relationship at a time. But language has many simultaneous relationships: grammatical structure, semantic meaning, coreference (what "it" refers to), temporal ordering, and more. **Multi-head attention** runs multiple attention computations in parallel — typically 32 to 128 "heads" — each with its own learned Q, K, and V projections. One head might learn to track grammatical subjects, another might learn to connect pronouns to their referents, another might focus on positional relationships. The outputs of all heads are concatenated and projected back down to the model's hidden dimension. This allows the model to simultaneously attend to different types of information from different parts of the sequence.

#### Attention in Action

To see self-attention in practice, consider the sentence "The cat sat on the mat because it was tired." When the model processes the token "it," the attention mechanism computes scores between "it's" Query vector and the Key vectors of every preceding token: "The," "cat," "sat," "on," "the," "mat," "because." The result: "cat" gets a high attention score (because "it" refers to the cat), while tokens like "on" and "the" get low scores.

![Attention scores diagram](/svg/attention-scores.svg)

These scores determine how much each token's Value vector contributes to "it's" updated representation. After attention, the representation of "it" now carries information about what it refers to — the model has connected a pronoun to its referent, not by following a grammar rule, but by learning statistical patterns from billions of similar examples during training.

Remember that this is **multi-head** attention: dozens of these computations run in parallel. One head might connect "it" to "cat" (coreference). Another head might note that "it" is the subject of "was tired" (syntactic role). Another might track that "it" appears after "because" (causal relationship). Each head captures a different type of relationship, and their combined outputs give the model a rich, multi-faceted understanding of each token's role in context.

And because this is a **decoder-only** transformer, the attention is **masked**: each token can only attend to tokens at its position or earlier. The token "was" cannot look ahead to see "tired." This constraint matches how the model generates text — when predicting the next word, it genuinely cannot see the future.

#### Feed-Forward Network

After the attention mechanism gathers relevant context from across the sequence, a **feed-forward network (FFN)** processes each token's representation independently. If attention is "gathering information from context," the feed-forward layer is "thinking about what that information means."

The feed-forward network is structurally simple: it takes each token's vector, expands it to a larger dimension (typically 4x the model's hidden size), applies an activation function (introducing the non-linearity you learned about in Part 1), and then projects it back down to the original size. This expand-activate-compress pattern gives the network a large internal workspace to transform each token's representation.

```
 token vector --> expand    --> activate      --> compress   --> output
 (4,096 dims)   (16,384)      (non-linearity)   (4,096)
```

Two important details distinguish the FFN from the attention layer. First, the FFN is applied to each token **separately** — unlike attention, it does not look at other tokens. Each token goes through the same computation independently. Second, the FFN is typically the largest component in each layer by parameter count, often containing two-thirds of the layer's total parameters. Research suggests that the feed-forward layers are where much of the model's **factual knowledge** is stored — the attention layers decide what information to gather, and the feed-forward layers encode the knowledge that informs the model's responses.

#### Residual Connections and Layer Normalization

Modern LLMs stack 32 to 128+ transformer layers on top of each other. Without special architectural support, this would be impossible — the signal would degrade to nothing as it passes through dozens of sequential transformations, and the network would be extremely difficult to train. Two components solve this problem.

**Residual connections** (also called **skip connections**) add a shortcut around each sub-component. After the attention sub-layer processes a token's representation, the original input to that sub-layer is added directly to the output. The same happens after the feed-forward sub-layer. In the decoder-only transformer diagram above, these are the (+) circles with arrows bypassing each block. The effect is powerful: information can flow through the entire depth of the network without being forced through every transformation. If a particular layer has nothing useful to add for a given token, the residual connection lets the original signal pass through unchanged. Without residual connections, training networks deeper than a few layers is practically impossible because gradients (the signals used to update weights during backpropagation, as you learned in Part 1) vanish or explode as they propagate through too many layers.

**Layer normalization** standardizes the numerical values at each layer, keeping them in a stable range. Without normalization, the values flowing through the network can grow very large or very small as they pass through many layers, causing training to become unstable or fail entirely. Layer normalization is applied before each sub-component (in modern pre-norm architectures) and ensures that regardless of what happened in previous layers, the inputs to each component are in a well-behaved numerical range.

#### Through the Layers

One complete transformer layer consists of self-attention followed by the feed-forward network, with residual connections and layer normalization applied after each. This completes one layer. The output flows into the next layer, where the same process repeats: attention gathers new contextual information (now building on the richer representations from the previous layer), and the feed-forward network refines it further.

![Transformer stack diagram](/svg/transformer-stack.svg)

A single transformer layer has limited capacity — it can capture some patterns, but not enough to understand the full complexity of language. The power of the transformer comes from **stacking many identical layers in sequence**. Modern LLMs use 32 to 128+ layers. Each layer takes the output of the previous layer as its input and refines the representations further. Research has shown that different depths of the network learn different kinds of information:

- **Early layers** (layers 1-10) tend to learn surface-level patterns: syntax, grammar, common word combinations, formatting conventions.
- **Middle layers** build on those patterns to develop semantic understanding: what words mean in context, how concepts relate, factual associations.
- **Deep layers** (the final layers) combine everything into high-level representations: intent, logical relationships, complex reasoning patterns, and the nuanced judgment needed to produce a specific output.

This progression from simple to complex mirrors what you learned about hidden layers in Part 1 — each layer builds on the patterns detected by the layer before it. The difference is scale: instead of a few hidden layers with thousands of parameters, a modern LLM stacks 100+ layers with billions of parameters, allowing it to learn extraordinarily complex patterns in language.

> **Why this matters for guardrails:** Now you can see why prompt injection is a fundamental architectural challenge, not a bug that can be patched. The attention mechanism treats all tokens in the context window as equally accessible. There is no architectural privilege for system prompt tokens over user input tokens — a malicious instruction buried in retrieved document #47 is attended to just as readily as the first line of the system prompt. The model has no way to distinguish "instructions I should follow" from "text I should process" — it simply computes attention scores across everything in its context window.

### 3.5 From Predictions to Text: The Output Head

After the final transformer layer, the model has produced a rich internal representation for each token — a vector that encodes the token's meaning in the context of the entire sequence. But this vector is not yet useful as a prediction. The model needs to answer the question: "What token should come next?"

This is the job of the **output head**, which works in two steps. First, a **linear layer** (sometimes called the **unembedding layer**, because it reverses what the embedding layer did) projects each token's hidden state vector to a set of raw scores called **logits**. There is one logit for every token in the model's vocabulary — if the vocabulary has 100,000 tokens, this linear layer produces 100,000 scores. A high logit means "this token is a likely next token." A low logit means "this token is unlikely."

Second, the **softmax** function converts these raw logits into a **probability distribution** — a set of values between 0 and 1 that sum to exactly 1. After softmax, each score represents the model's estimated probability that the corresponding token is the correct next token. The token with the highest probability is the model's best guess, but the full distribution matters: during generation, the model can sample from this distribution (not always picking the top choice) to produce varied and natural-sounding text.

```
 hidden state --> Linear Layer --> logits    --> Softmax --> probabilities
 (4,096 dims)    (unembedding)    (100,000      (normalize)  (100,000 values
                                   raw scores)                summing to 1.0)
```

This output head connects directly back to what you learned in Part 1: the output layer of a neural network produces the final result. For a spam classifier, the output was a single probability (spam or not). For an LLM, the output is a probability distribution across the entire vocabulary — tens of thousands of simultaneous predictions about what comes next.

Some model APIs expose **log probabilities** (the logarithm of the token probabilities) for each generated token, which can serve as a confidence signal — low log probabilities across a response suggest the model is uncertain about its output, which is useful for guardrail systems that need to flag low-confidence outputs for human review.

### 3.6 The Generation Loop

You now understand the complete forward pass: text is tokenized into IDs, IDs are converted to embedding vectors, positional encoding is added, and the transformer layers process the sequence through repeated rounds of attention and feed-forward computation to produce a probability distribution over the vocabulary. But that entire process — from input to probability distribution — produces just **one prediction**: the probability of the next single token. How does the model generate an entire response?

The answer is an **autoregressive** loop: the model generates one token, appends it to the input, and runs the entire forward pass again to predict the next token after that.

![Generation loop diagram](/svg/generation-loop.svg)

At each step, the model produces a probability distribution over the entire vocabulary. But which token does it actually select?

#### Temperature and Sampling

**Temperature** controls how the probability distribution is shaped before a token is selected:

```
 Example: model predicts the next token after
 "The best programming language is"

 Temperature = 0 (greedy decoding):
   "Python" = select    (highest probability, always chosen)
   "Java"   = ignored
   "Rust"   = ignored
   Result: deterministic -- same output every time

 Temperature = 1.0 (balanced):
   "Python" = 0.45      (likely but not guaranteed)
   "Java"   = 0.25
   "Rust"   = 0.15
   "Go"     = 0.10
   "C++"    = 0.05
   Result: varied -- samples from the distribution

 Temperature = 2.0 (high / creative):
   "Python" = 0.28      (probabilities flattened)
   "Java"   = 0.22
   "Rust"   = 0.20
   "Go"     = 0.17
   "C++"    = 0.13
   Result: unpredictable -- even unlikely tokens get chosen
```

At **temperature 0** (greedy decoding), the model always selects the single highest-probability token. This is deterministic in theory, though in practice, floating-point arithmetic and GPU batching effects can cause slight variation.

Additional sampling strategies further control token selection:

- **Top-k sampling:** only consider the k most probable tokens (e.g., top-5 means only the 5 highest-probability tokens are candidates)
- **Top-p (nucleus) sampling:** only consider the smallest set of tokens whose cumulative probability exceeds p (e.g., top-p 0.9 means include tokens until their probabilities sum to 0.9)

These strategies can be combined. For example, temperature 0.7 with top-p 0.9 produces focused but slightly varied output.

#### Stop Conditions

Generation continues until one of these conditions is met:

- The model generates an **EOS** (end of sequence) special token
- A **maximum token limit** is reached (set by the application)
- A **stop sequence** is encountered (a specific string the application defines as a termination signal)

#### The Generation Loop in Pseudocode

```
tokens = tokenize(prompt)
while not stop_condition_met:
    logits = model.forward(tokens)
    probabilities = softmax(logits / temperature)
    next_token = sample(probabilities, top_k, top_p)
    tokens = tokens + [next_token]
return detokenize(tokens)
```

> **Why this matters for guardrails:** Add non-determinism to the list of architectural challenges: uninspectable weights, unprivileged attention, and now outputs that vary on every run. The same prompt can produce different outputs on different runs. This means you cannot test a guardrail once and assume it will always catch the same issue — a prompt that was blocked today might produce a slightly different output tomorrow that slips through. Guardrail testing requires repeated runs, diverse inputs, and statistical evaluation rather than simple pass/fail on a single test case.

### 3.7 Reasoning Models and Chain-of-Thought

The autoregressive generation loop described above applies to all LLMs — every model generates text one token at a time, left to right. But some models add an additional step that changes how they approach complex problems.

Standard LLMs generate their answer directly — one token at a time from left to right. **Reasoning models** add an additional step: before producing the final answer, the model generates an extended sequence of **thinking tokens** — intermediate reasoning steps that break the problem down.

```
 Standard model:
   Input:  "What is 27 * 43?"
   Output: "1,161"

 Reasoning model:
   Input:  "What is 27 * 43?"
   Thinking: "I need to multiply 27 by 43.
              27 * 40 = 1,080
              27 * 3 = 81
              1,080 + 81 = 1,161"
   Output: "1,161"
```

The thinking tokens may be visible to the user, hidden behind an interface, or only available through the API. Either way, they are generated using the same autoregressive process described above — the model is still predicting one token at a time.

**Inference-time scaling** is a related concept: making a model "think harder" by spending more compute at inference time. Techniques include generating multiple candidate answers and selecting the best one (**Best-of-N sampling**), having the model check its own work (**self-refinement**), or generating multiple solutions and picking the most common answer (**self-consistency**). These techniques can significantly improve accuracy without changing the model's weights.

> **Why this matters for guardrails:** Reasoning models create a new guardrail surface. The final answer may look safe and compliant, but the reasoning trace — the thinking tokens — may contain policy violations, leaked sensitive data, or harmful content. Guardrails must inspect both the reasoning trace and the final output. Additionally, inference-time scaling means the same model can behave very differently depending on how it is configured — a model that passes guardrail testing with standard inference may fail when inference-time scaling is enabled.

---
