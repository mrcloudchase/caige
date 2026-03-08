# Prerequisites: AI Foundations

**This is required foundational knowledge for the training program.** The concepts covered here — neural networks, tokenization, the transformer architecture, how LLMs are trained, how they generate text, and how they are used in modern applications — are assumed throughout Modules 1-6. If you are already familiar with these topics at a high level, you may skip ahead to Module 1, but make sure you can define the terms in the Key Vocabulary section at the end of this guide before proceeding.

**Note:** This prerequisite content is not directly tested on the exam, but the concepts are assumed knowledge throughout the exam domains.

**Estimated Study Time:** 2-3 hours

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

**Training** is the process of showing the network examples and adjusting weights to reduce errors. The network makes a prediction, compares it to the correct answer, calculates how wrong it was (this measurement is called the **loss**), and adjusts the weights slightly to be less wrong next time. This cycle repeats billions of times across massive datasets. The mathematical process for adjusting weights is called **backpropagation** — you do not need to understand how it works for this certification, just that it is how neural networks learn from data.

> **Why this matters for guardrails:** Knowledge in a neural network is distributed across billions of weights — it is not stored in a searchable database. You cannot open up a model and delete a specific fact it memorized, remove a bias it learned, or inspect what it "knows" about a topic. This is why external guardrails are necessary: since you cannot control what the model has learned internally, you must control what it is allowed to output.

---

## Tokens and Tokenization

LLMs do not read text the way humans do. Before any text reaches the model, it must be converted into **tokens** — subword units that are then transformed into numerical vectors the model can process.

### What Is a Token?

A token is a subword unit. It is not the same as a word. Depending on the tokenizer, a single word might be one token ("hello") or multiple tokens ("unbelievable" might become "un", "believ", "able"). Numbers, punctuation, spaces, and special characters are also tokens. A rough rule of thumb: one token is approximately 3/4 of a word in English, but this varies significantly across languages.

```
 Raw text:     "The cat sat on the mat"

 Tokenized:    ["The", " cat", " sat", " on", " the", " mat"]

 Token IDs:    [464,   3857,   3332,   319,   262,   2648]

 The model never sees the original text.
 It receives the sequence of token IDs, which are
 then converted into embedding vectors (see below).
```

### How Tokenization Works: Byte Pair Encoding

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

### Special Tokens

Beyond regular text tokens, every vocabulary includes **special tokens** — tokens with reserved meanings that the tokenizer would not produce from normal text. Common special tokens include:

- **BOS** (beginning of sequence): marks the start of an input
- **EOS** (end of sequence): signals the model to stop generating
- **PAD** (padding): fills unused positions when processing batches of different-length inputs

Special tokens become critical when we discuss chat templates and role boundaries later in this guide.

### The Context Window

The **context window** is the maximum number of tokens a model can process in a single inference call. It functions as the model's working memory — everything the model "knows" during a conversation must fit in this window. A typical context window ranges from 8,000 to over 1,000,000 tokens depending on the model, with most production models offering 32,000 to 200,000 tokens.

Context window arithmetic matters: a 128,000-token context window is approximately 96,000 words of English text. Every element of a conversation consumes tokens from this budget — the system prompt, conversation history, retrieved documents, and the user's current message all compete for space.

> **Why this matters for guardrails:** Tokenization affects guardrails in three ways. First, token boundaries determine what keyword-based filters can and cannot catch — a word split across two tokens may evade a filter looking for the whole word. Second, every guardrail instruction (system prompt safety rules, few-shot examples, retrieved context) consumes tokens from the finite context window budget. Third, special tokens will reappear when we discuss how models distinguish between system instructions and user messages.

### From Token IDs to Embeddings

Token IDs are integers — they are lookup indices, not something the model can do math on. The model cannot reason about the number 464; it needs a rich numerical representation that captures meaning. This is the job of the **embedding layer**.

The embedding layer is a large table of learned vectors — one vector per token in the vocabulary. When the model receives a token ID, it looks up the corresponding row in this table and retrieves a dense vector (typically 768 to 12,288 numbers, depending on model size). This vector is the token's **embedding** — a learned representation that captures semantic and syntactic properties of that token.

```
 Token IDs:    [464,     3857,    3332   ]
                |         |        |
                v         v        v
 Embedding    [0.12,   [-0.34,  [0.78,
 lookup:       0.87,    0.56,    0.23,
               -0.23,   0.91,   -0.45,
               ...]     ...]     ...]

 Each token ID is replaced by a dense vector
 of hundreds or thousands of numbers.
 These vectors are what the transformer processes.
```

These embedding vectors are **learned during training** — they start as random numbers and are adjusted through backpropagation just like every other weight in the model. After training, tokens with related meanings end up with similar vectors. The word "cat" and "kitten" will have vectors that are close together in this high-dimensional space, while "cat" and "spreadsheet" will be far apart.

The complete pipeline from text to transformer input is:

```
 "The cat sat" --> tokenize --> [464, 3857, 3332]
                                  |
                         embedding lookup
                                  |
                   [vec_464, vec_3857, vec_3332]
                                  |
                      + positional encoding
                                  |
                      [input to transformer]
```

This uses the same underlying concept — learned vector representations — as the embedding models used for RAG (covered later in this guide). The difference is granularity: the LLM's embedding layer converts individual tokens into vectors, while a RAG embedding model converts entire passages into a single vector that captures the meaning of the whole text.

---

## The Transformer Architecture

Large language models like GPT, Claude, Llama, and Gemini are all based on the **transformer** architecture, introduced in 2017. You do not need to understand the math, but understanding the key ideas will help you reason about guardrails.

### The Core Idea: Attention

Before transformers, the dominant language models (RNNs and LSTMs) processed text sequentially — one token at a time — making it difficult to capture relationships between distant words and preventing parallelization during training. The transformer's breakthrough is **self-attention**: the ability to look at all parts of the input simultaneously and determine which parts are most relevant to each other.

For example, in the sentence "The cat sat on the mat because it was tired," the model needs to understand that "it" refers to "the cat," not "the mat." The attention mechanism lets the model compute a relevance score between every pair of tokens, so when processing "it," the model attends strongly to "cat."

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

> **Why this matters for guardrails:** The attention mechanism treats all tokens in the context window as equally accessible. There is no architectural privilege for system prompt tokens over user input tokens — a malicious instruction buried in retrieved document #47 is attended to just as readily as the first line of the system prompt. This is why prompt injection is a fundamental architectural challenge, not a bug that can be patched.

### Positional Encoding

The attention mechanism processes all tokens in parallel, which means it has no inherent sense of token order. Without positional information, the sentences "the dog chased the cat" and "the cat chased the dog" would be indistinguishable — the embedding layer produces the same vector for a given token regardless of where it appears, so both sentences would produce the same bag of vectors. To solve this, transformers add **positional encoding** — information about each token's position in the sequence — to the embedding vectors before they enter the attention layers.

```
 Embedding:  [vec for "The"]  [vec for "cat"]  [vec for "sat"]
                   +                +                +
 Position:     [pos 1]          [pos 2]          [pos 3]
                   =                =                =
 Input:      [combined]        [combined]        [combined]
```

The original transformer paper used fixed mathematical functions (sinusoidal encoding) for positions. Modern LLMs typically use learned positional representations or techniques like Rotary Position Embeddings (RoPE) that allow the model to generalize to longer sequences. The specific technique matters less than the concept: position is information that must be explicitly added to the embedding vectors, not something the architecture inherently provides.

### Layers of a Transformer

A transformer stacks multiple layers. Each layer contains two main computational components, along with **residual connections** and **layer normalization** that enable stable training across many layers:

**Self-attention:** computes which parts of the input are relevant to each other (as described above). In practice, models use **multi-head attention** — multiple attention computations running in parallel, each potentially learning to focus on different types of relationships (for example, some heads may track syntactic dependencies, while others track positional or semantic relationships).

**Feed-forward network:** after attention determines which tokens are relevant, a feed-forward network processes that information to build more abstract representations. Think of attention as "gathering relevant context" and the feed-forward layer as "processing it further" — though this is a simplified mental model.

**Residual connections** (also called skip connections) add the input of each sub-layer to its output, allowing information to flow directly through the network and preventing the signal from degrading across many layers. **Layer normalization** stabilizes the values flowing through the network, keeping training stable. Without these two components, training deep transformers (32-128+ layers) would be extremely difficult.

```
 Embedding Vectors (+ positional encoding)
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
 | Output Linear Layer  |  Projects hidden states to
 | (unembedding)        |   vocabulary-sized logits
 +----------+----------+
            |
        softmax
            |
            v
 +---------------------+
 | Output Probabilities |  "What token comes next?"
 +---------------------+
```

Modern LLMs stack 32 to 128+ of these layers. Early layers capture simple patterns (grammar, common phrases). Later layers capture complex patterns (reasoning, context, intent). After the final transformer layer, a linear output layer (sometimes called the unembedding layer) projects the hidden state vectors to a vocabulary-sized set of logits, which are then converted to probabilities via softmax — producing the model's prediction for what token comes next.

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

The base model is fine-tuned on curated datasets of conversations formatted in a **chat template** — the structured format with special tokens that marks role boundaries (covered in its own section below).

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

This is where the model gains its conversational ability and its tendency to follow instructions.

> **Critical insight: learned, not enforced.** The instruction-following behavior is **learned from patterns in training data**, not architecturally enforced. There is no parser inside the model that reads system prompts and creates access control rules. There is no enforcement mechanism that prevents the model from ignoring system instructions. The model learned from thousands of examples where system instructions were followed, so it tends to follow them — but "tends to" is not "guaranteed to." This distinction is foundational to understanding why guardrails exist.

### Stage 3: RLHF (Reinforcement Learning from Human Feedback)

The instruction-tuned model is further refined using human preferences:

1. The model generates multiple responses to the same prompt
2. Human raters rank the responses (helpful, safe, accurate, etc.)
3. A reward model is trained on these rankings
4. The language model is optimized — typically using an algorithm called **Proximal Policy Optimization (PPO)** — to produce responses the reward model rates highly, while staying close to its original behavior to prevent instability

This is where the model learns safety behaviors — refusing harmful requests, being honest about uncertainty, following system prompt instructions more reliably. **Constitutional AI** (used by Anthropic) is a variation where the model evaluates its own responses against a set of principles rather than relying solely on human raters. More recent approaches like **Direct Preference Optimization (DPO)** skip the separate reward model and optimize the language model directly on human preference data.

After these three stages, the result is a **chat model** — the kind of model you interact with through APIs and chat interfaces, and the kind of model you build guardrails around. Not all models go further; Stage 4 is an optional additional stage that produces reasoning models.

### Stage 4: Reinforcement Learning for Reasoning

Some models undergo an optional fourth stage: reinforcement learning specifically for reasoning capabilities. Where RLHF (Stage 3) trains the model to be safe and helpful based on human preferences, RL for reasoning trains the model to solve problems by producing intermediate thinking steps — a process called **chain-of-thought (CoT) reasoning**.

The approach works as follows:

1. The model is given a problem (e.g., a math question)
2. It generates multiple candidate solutions, each with step-by-step reasoning
3. Each solution is checked against the correct answer
4. Solutions that arrive at the correct answer are reinforced; incorrect solutions are not

One widely used algorithm for this is **Group Relative Policy Optimization (GRPO)**, which compares the model's multiple outputs against each other rather than training a separate reward model. This is significantly more efficient than the PPO approach used in RLHF and is the technique behind reasoning models like DeepSeek R1.

The result is a **reasoning model** — a model that "thinks" through problems step by step before providing a final answer, producing more reliable results in math, logic, and code. Some reasoning models expose their thinking tokens to the user; others hide them and only show the final answer.

**Distillation** is a related technique where a smaller model is trained to mimic the reasoning behavior of a larger model. The smaller "student" model learns by training on the reasoning traces produced by the larger "teacher" model. This creates efficient reasoning models but also means the student inherits the teacher's failure modes and biases.

### What Each Training Stage Creates — and What Can Go Wrong

| Training Stage | What Gets Encoded | What Can Go Wrong | Covered In |
|---|---|---|---|
| Pre-training | World knowledge, language patterns, code | Memorized private data, embedded biases, outdated facts | Module 1 (1.2.1, 1.2.4) |
| Instruction tuning (SFT) | Instruction following, role boundaries | Instruction hierarchy is a soft preference, can be broken | Module 1 (1.2.2, 1.2.3) |
| RLHF / alignment | Safety behaviors, refusal patterns | Safety training can be bypassed via jailbreaking | Module 1 (1.2.3) |
| RL for reasoning | Step-by-step reasoning, problem decomposition | Reasoning traces may contain harmful content or leaked data invisible in the final answer; capability gains can outpace safety guardrails | Module 1 (1.2.3), Module 5 |

> **Why this matters for guardrails:** Every training stage creates capabilities AND risks. Pre-training gives the model knowledge but also memorized data. Instruction tuning gives it conversational ability but also a breakable instruction hierarchy. Safety training gives it refusal behavior but also a target for jailbreaking. Reasoning training gives the model step-by-step thinking but creates a new guardrail surface — the thinking tokens themselves — where policy violations can hide. No amount of training eliminates these risks — guardrails exist because model-level safety is necessary but insufficient.

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

## Chat Templates and Role Boundaries

When you use a chat API, your messages are formatted using a **chat template** — a structured format that uses special tokens to mark where each role's content begins and ends. Understanding this structure is essential because the model's ability to distinguish "system rules" from "user input" depends entirely on these templates.

### The Structure

A chat template wraps each message with special tokens that identify the role:

```
<|im_start|>system
You are a helpful customer service agent. Do not discuss
competitor products.<|im_end|>
<|im_start|>user
What can you tell me about your competitor's pricing?<|im_end|>
<|im_start|>assistant
I am not able to provide information about competitor products.
I would be happy to help you with our pricing instead.<|im_end|>
```

The tokens `<|im_start|>` and `<|im_end|>` are **special tokens** — they exist as single entries in the vocabulary with unique token IDs. In a properly configured system, the tokenizer will not produce these token IDs from regular user text input. If a user types the literal characters `<|im_start|>`, those characters are tokenized as a sequence of regular text tokens, not as the special token. This prevents users from injecting role boundaries through normal text input.

Different model families use different template formats — Llama 3 uses `<|start_header_id|>` and `<|end_header_id|>`, for example — but the principle is the same: special tokens create role boundaries.

### The Roles

| Role | Purpose | Who Controls It |
|------|---------|----------------|
| system | Behavioral rules and constraints | Application developer (trusted) |
| user | End-user input | End user (untrusted) |
| assistant | Model's generated response | Model (validate before use) |
| tool | Data returned from tool/function calls | External systems (untrusted) |

### The Instruction Hierarchy

During instruction tuning and RLHF, models learn to treat these roles with a priority order: **system > user**, with tool results treated as data the model incorporates rather than instructions that compete in the hierarchy. The system prompt sets the rules, and the model generally follows them even when the user asks it not to.

But this hierarchy is a **learned statistical preference**, not an enforced constraint. There is no access control system inside the model. There is no parser that reads the system prompt and creates rules. The model learned during training that system instructions should take priority, so it usually follows them — but under sufficient pressure (carefully crafted prompts, role-play scenarios, multi-turn manipulation), the model can and does override system instructions.

> **Why this matters for guardrails:** System prompts are necessary but insufficient as a security control. A user who crafts input that mimics special token patterns, uses role-play to reframe the conversation, or applies multi-turn pressure can weaken the model's adherence to system-level rules. This is why application-level guardrails — code that runs independently of the model — are essential. The model's compliance with the system prompt is a guideline, not a guarantee.

---

## Inference: How LLMs Generate Text

**Inference** is the process of running a trained model to generate output. Understanding how text generation works explains why LLM output is non-deterministic and why the same prompt can produce different responses.

### The Generation Loop

LLMs generate text one token at a time in an **autoregressive** loop: each generated token is appended to the input, and the model runs again to predict the next token.

```
 Step 1: Input  = "The capital of France is"
         Model predicts -> " Paris"
         Append token

 Step 2: Input  = "The capital of France is Paris"
         Model predicts -> "."
         Append token

 Step 3: Input  = "The capital of France is Paris."
         Model predicts -> [EOS]
         Stop -- end of sequence token reached
```

At each step, the model does not output a single token directly. It produces **logits** — raw numerical scores for every token in the vocabulary. These logits are converted into a probability distribution using a mathematical function called softmax. The question is: which token do you actually select from this distribution?

### Temperature and Sampling

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

### Stop Conditions

Generation continues until one of these conditions is met:

- The model generates an **EOS** (end of sequence) special token
- A **maximum token limit** is reached (set by the application)
- A **stop sequence** is encountered (a specific string the application defines as a termination signal)

### The Generation Loop in Pseudocode

```
tokens = tokenize(prompt)
while not stop_condition_met:
    logits = model.forward(tokens)
    probabilities = softmax(logits / temperature)
    next_token = sample(probabilities, top_k, top_p)
    tokens = tokens + [next_token]
return detokenize(tokens)
```

> **Why this matters for guardrails:** LLM output is non-deterministic by design. The same prompt can produce different outputs on different runs. This means you cannot test a guardrail once and assume it will always catch the same issue — a prompt that was blocked today might produce a slightly different output tomorrow that slips through. Guardrail testing requires repeated runs, diverse inputs, and statistical evaluation rather than simple pass/fail on a single test case.

### Reasoning Models and Chain-of-Thought

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

## What LLMs Get Wrong: Failure Modes from Architecture

The architectural properties described in the previous sections are not just technical details — each one creates specific risks. Understanding these connections is the bridge between "how LLMs work" and "why guardrails are necessary."

| Architectural Property | What It Enables | What Can Go Wrong |
|---|---|---|
| Attention treats all tokens equally | Rich contextual understanding | Content anywhere in the context can influence output — including malicious instructions in retrieved documents (prompt injection) |
| Training data encoded in weights | Broad world knowledge | Model can reproduce memorized private data, copyrighted content, or personal information (data leakage) |
| Probabilistic token generation | Fluent, varied text | Model generates confident-sounding text that is factually wrong (hallucination) |
| Learned role boundaries (not enforced) | Flexible instruction following | Users can override system instructions through carefully crafted prompts (jailbreaking) |
| Trained to be helpful and compliant | Useful assistant behavior | Model follows user requests even when it should refuse, or drifts away from its designated topic (over-compliance, off-topic drift) |
| Training data reflects human biases | Understanding of human language and culture | Model reproduces and potentially amplifies societal biases (toxic/biased output) |
| Extended chain-of-thought reasoning | More accurate problem-solving | Thinking tokens may contain policy violations, sensitive data, or harmful reasoning not visible in the final answer |

These are not bugs. They are direct consequences of how the technology works. You cannot "fix" hallucination by improving the model alone — the architecture generates text probabilistically, so there will always be cases where the model produces plausible-sounding nonsense. You cannot "fix" prompt injection by training the model harder — the attention mechanism does not architecturally distinguish trusted from untrusted tokens.

This is the fundamental argument for guardrails: **the risks are inherent to the architecture, so the controls must be external to the model.**

Module 1 examines each of these failure modes in detail. The rest of the training program teaches you how to build the guardrails that address them.

---

## Beyond Single Models: RAG and Agentic Systems

Modern AI applications rarely consist of a single model answering questions. Two architectural patterns — Retrieval-Augmented Generation (RAG) and agentic systems — are now dominant in production deployments, and each introduces its own guardrail challenges.

### Embedding Models and Vector Search

An **embedding model** converts text into a numerical vector — a list of numbers that captures the text's semantic meaning. Texts with similar meanings produce vectors that are close together in mathematical space. This enables **semantic search**: instead of matching keywords, you can find documents that are conceptually related to a query.

```
 "How do I reset my password?"
       |
       v
 Embedding model
       |
       v
 [0.23, -0.41, 0.87, 0.12, ...]   (vector with hundreds
                                     of dimensions)
```

These vectors are stored in a **vector database** and indexed for fast similarity search.

### Retrieval-Augmented Generation (RAG)

**RAG** is the pattern of retrieving relevant documents and including them in the model's context window before generating a response. It allows the model to answer questions using information that was not in its training data.

```
 User query: "What is our refund policy?"
       |
       v
 1. Embed the query into a vector
       |
       v
 2. Search vector database for similar documents
       |
       v
 3. Retrieve top matching chunks
    (e.g., "Refunds are available within 30 days...")
       |
       v
 4. Include retrieved chunks in the context window
    alongside the system prompt and user query
       |
       v
 5. Model generates a response grounded in
    the retrieved documents
```

RAG reduces hallucination by giving the model real source material to reference, but it introduces new risks. The retrieved documents are untrusted input — they may have been written by anyone, may contain outdated information, or may have been deliberately crafted to manipulate the model. If the retrieval system does not enforce access controls, the model may retrieve and expose documents the current user is not authorized to see.

### Agentic AI Systems

An **agentic AI system** is one that can take actions — not just generate text. Instead of simply answering questions, an agent can call tools, query databases, send emails, create files, execute code, and make decisions across multiple steps.

| Capability | Simple Chat | Agentic System |
|---|---|---|
| Output | Text responses | Text + real-world actions |
| Tools | None | API calls, database queries, file operations |
| Steps | Single turn | Multi-step reasoning and execution |
| Impact of errors | Bad text | Bad actions with real consequences |

### Tool Integration and MCP

Agents interact with external systems through tool integrations. The **Model Context Protocol (MCP)** is an example of a standardized approach to tool integration: it defines a client-server architecture where AI models connect to tool servers that expose capabilities the model can invoke.

Regardless of the specific protocol, the pattern is the same: the model decides which tool to call and with what parameters, the application executes the tool call, and the result is returned to the model for further processing.

### Identity Delegation

When an agent calls a tool, a critical question arises: **whose permissions does it use?** If a user asks an AI agent to "look up the salary data," should the agent use the user's permissions (which may not include salary access) or the application's service account (which might have broader access)?

This is the **identity delegation** problem. Without careful design, an AI agent can become a privilege escalation vector — giving users access to data and actions they would not have through normal channels.

> **Why this matters for guardrails:** RAG and agentic patterns dramatically expand the attack surface. In a simple chat application, the worst case is bad text. With RAG, attackers can poison the documents the model reads (indirect prompt injection). With agents, attackers can cause the model to take unauthorized actions in real systems — sending data to external servers, modifying records, or escalating privileges. Modules 2 and 3 cover the guardrail architectures and implementations for these patterns in detail.

---

## The Security Mindset: Why Guardrails Are Necessary

Everything in this guide leads to a single conclusion: **LLMs are powerful but fundamentally unpredictable systems, and the risks they create are inherent to their architecture.** You cannot train away hallucination, patch prompt injection, or configure your way out of jailbreaking. These are not bugs — they are consequences of how the technology works.

### Three Layers of Defense

Securing an AI application requires multiple independent layers:

**Layer 1: Model training** — The model provider builds safety behaviors into the model through RLHF and alignment training. This is necessary but insufficient. Safety training is a learned behavior, not an architectural guarantee, and it can be bypassed.

**Layer 2: System prompt** — The application developer writes system prompt instructions that set behavioral boundaries. This is necessary but insufficient. The instruction hierarchy is a soft preference, not an enforcement mechanism, and it can be overridden.

**Layer 3: Application-level guardrails** — Code that runs independently of the model, inspecting inputs before they reach the model and validating outputs before they reach the user. This is where guardrail engineers work. These controls are enforced by your code, not by the model's willingness to comply.

**Defense in depth** means layering all three — not relying on any single layer. Each layer catches threats that others miss.

### Trust Boundaries

In any AI system, some components are trusted and others are not:

| Component | Trust Level | Why |
|---|---|---|
| System prompt | Trusted | You (the developer) wrote it |
| User input | Untrusted | Attacker-controlled |
| Retrieved documents (RAG) | Untrusted | May contain injected content |
| Tool results | Untrusted | External system, may be compromised |
| Model output | Untrusted until validated | Probabilistic, can hallucinate or be manipulated |

The model itself sits at the center — processing untrusted inputs and producing untrusted outputs. Every boundary between trusted and untrusted components is a point where guardrails must be applied.

### Who Attacks AI Systems?

AI systems face threats from multiple adversary types: malicious end users trying to extract data or bypass restrictions, automated attacks probing for vulnerabilities at scale, insiders with legitimate access who misuse the system, and researchers discovering new attack techniques that are rapidly adopted in the wild. Module 1 section 1.3 covers threat modeling in detail.

> With this foundation — understanding how LLMs are built, how they generate text, and why their architecture creates inherent risks — you are ready to study the guardrails that address these risks. Module 1 begins with a detailed examination of how AI systems work in production and the specific failure modes you will learn to guard against.

---

## Key Vocabulary

These terms appear throughout the training modules. They are grouped by topic area. If any are unfamiliar, review the relevant sections above.

**Neural Networks and Training**

| Term | Definition |
|------|-----------|
| **Neural network** | A program that learns patterns from data by adjusting weights through training |
| **Weights / Parameters** | The numbers in a neural network that determine its behavior; adjusted during training |
| **Loss** | A measurement of how wrong the model's prediction was; training minimizes this value |
| **Backpropagation** | The mathematical process for adjusting weights based on prediction errors |
| **Pre-training** | Training a model on massive text data using next-token prediction |
| **Base model** | A pre-trained model before instruction tuning; completes text but does not follow instructions |
| **Fine-tuning** | Additional training on a specialized dataset to adapt the model's behavior |
| **Instruction tuning** | Fine-tuning a base model on conversation data so it learns to follow instructions |
| **RLHF** | Reinforcement Learning from Human Feedback; trains the model to prefer safe, helpful responses, typically using PPO |
| **DPO** | Direct Preference Optimization; an alternative to RLHF that optimizes directly on preference data without a separate reward model |
| **Constitutional AI** | Training approach where the model evaluates its own responses against defined principles |

**Tokenization and Input Processing**

| Term | Definition |
|------|-----------|
| **Token** | The basic unit of text that LLMs process; a subword unit, roughly 3/4 of a word in English |
| **Byte Pair Encoding (BPE)** | A tokenization algorithm that iteratively merges frequent adjacent pairs to build a vocabulary |
| **Vocabulary** | The fixed mapping from token IDs to subword strings used by a model's tokenizer |
| **Special tokens** | Reserved tokens (BOS, EOS, PAD, role delimiters) with unique IDs that the tokenizer does not produce from regular text |
| **Context window** | The maximum number of tokens a model can process in a single inference call |
| **Embedding layer** | A lookup table of learned vectors that converts token IDs into dense numerical representations the transformer can process |
| **Embedding vector** | A dense list of numbers (typically 768-12,288 dimensions) representing a token's learned semantic and syntactic properties |

**Architecture**

| Term | Definition |
|------|-----------|
| **Transformer** | The neural network architecture used by all modern LLMs; key innovation is self-attention |
| **Self-attention** | Mechanism that lets the model consider all parts of its input simultaneously and compute relevance between token pairs |
| **Multi-head attention** | Running multiple attention computations in parallel, each learning different types of relationships |
| **Positional encoding** | Information added to embedding vectors so the model knows token order in the sequence |
| **Logits** | The raw numerical scores a model produces for each vocabulary token before conversion to probabilities |

**Inference and Generation**

| Term | Definition |
|------|-----------|
| **Inference** | Running a trained model to generate output (as opposed to training it) |
| **Autoregressive generation** | Generating text one token at a time, where each token depends on all previous tokens |
| **Temperature** | A parameter that controls the randomness of token selection; 0 = deterministic, higher = more random |
| **Top-k sampling** | Limiting token selection to the k most probable candidates |
| **Top-p (nucleus) sampling** | Limiting token selection to the smallest set of tokens whose cumulative probability exceeds p |
| **Greedy decoding** | Selecting the single highest-probability token at each step (temperature = 0) |
| **Chain-of-thought (CoT)** | A reasoning pattern where the model produces intermediate thinking steps before providing a final answer |
| **Reasoning model** | An LLM trained (via RL for reasoning) to generate step-by-step thinking tokens before its final output |
| **Inference-time scaling** | Techniques that improve output quality by spending more compute at inference (Best-of-N, self-consistency, self-refinement) |
| **Distillation** | Training a smaller model to replicate a larger model's behavior by learning from its outputs |

**Chat and Roles**

| Term | Definition |
|------|-----------|
| **Chat template** | Structured format with special tokens that marks role boundaries (system, user, assistant, tool) in conversations |
| **Instruction hierarchy** | The learned preference for system instructions over user instructions; a statistical pattern, not an enforced rule |

**Application Patterns**

| Term | Definition |
|------|-----------|
| **Embedding model** | A model that converts text into numerical vectors capturing semantic meaning |
| **Vector database** | A database optimized for storing and searching embedding vectors by similarity |
| **RAG** | Retrieval-Augmented Generation; retrieving relevant documents and including them in the context window before generating |
| **Agentic system** | An AI system that can take actions (tool calls, API requests, multi-step decisions), not just generate text |
| **MCP** | Model Context Protocol; a standardized client-server architecture for connecting AI models to external tool servers |
| **Identity delegation** | The question of whose permissions an AI agent uses when calling external tools or accessing data |

**Security Concepts**

| Term | Definition |
|------|-----------|
| **Trust boundary** | The point in a system where data crosses from trusted to untrusted (or vice versa); where guardrails are applied |
| **Defense in depth** | Layering multiple independent security controls so no single failure compromises the system |
| **Prompt injection** | An attack where crafted input causes the model to ignore its instructions; direct (user-crafted) or indirect (via retrieved content) |
| **Jailbreaking** | Techniques that bypass a model's safety training to produce outputs it was trained to refuse |
| **Hallucination** | When a model generates confident-sounding text that is factually incorrect or fabricated |

---

**You are now ready for [Module 1: AI System Fundamentals & Failure Modes](module-1-ai-fundamentals.md).**
