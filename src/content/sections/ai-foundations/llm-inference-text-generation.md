---
title: "LLM Inference & Text Generation"
slug: "llm-inference-text-generation"
module: "ai-foundations"
sectionOrder: 3
description: "The complete path from input text to generated output — tokenization, attention, generation, and sampling."
---

## Section 1.3: LLM Inference & Text Generation

This section traces the complete journey of a single request through a large language model — from raw text input to generated output. Understanding this path in detail is essential because every guardrail you build will intervene at one or more points along this pipeline.

### Tokenization: From Text to Numbers

Neural networks operate on numbers, not text. The first step in any LLM inference is converting raw text into a sequence of integer **token IDs** through a process called **tokenization**.

Modern LLMs use **Byte Pair Encoding (BPE)** or similar subword tokenization algorithms. BPE works by starting with individual characters and iteratively merging the most frequent pairs into new tokens until a target vocabulary size is reached (typically 32,000 to 128,000 tokens).

The result is that common words become single tokens, while rare words are split into subword pieces:

```
Input text: "The guardrail prevented hallucination"

Tokenized:  ["The", " guard", "rail", " prevented", " hall", "ucin", "ation"]
Token IDs:  [464,    5765,    5496,    13903,        5765,   42099,  341]
```

Several properties of tokenization matter for guardrail engineering:

**Token boundaries are not word boundaries.** The model does not "see" words — it sees tokens. A word like "guardrail" might be two tokens ("guard" + "rail"). This means character-level or word-level filters applied after tokenization may not align with what the model actually processed.

**Tokenization is language-dependent.** English text is tokenized efficiently (fewer tokens per word), while other languages may require many more tokens for the same content. This affects context window utilization and can create disparate performance across languages.

**Special tokens carry structural meaning.** Tokenizers include special tokens like `<|begin_of_text|>`, `<|end_of_turn|>`, and role markers (`<|system|>`, `<|user|>`, `<|assistant|>`) that structure the conversation. These tokens are part of the chat template and define the instruction hierarchy.

> **Why this matters for guardrails:** Adversarial inputs often exploit tokenization. Inserting zero-width characters, using Unicode homoglyphs, or breaking words across token boundaries can bypass keyword-based filters. A guardrail that checks for the word "bomb" might miss "b​omb" (with a zero-width space) because the tokenizer processes them differently. Effective input guardrails must operate at multiple levels — raw text, normalized text, and sometimes token level.

### The Context Window

The **context window** is the maximum number of tokens the model can process in a single forward pass. Everything the model "knows" about the current conversation must fit within this window.

```
┌──────────────── Context Window (e.g., 128K tokens) ─────────────────┐
│                                                                      │
│  [System prompt] [Conversation history] [Current user message]       │
│  ◄── tokens ──►  ◄──── tokens ──────►  ◄──── tokens ──────►        │
│                                                                      │
│  The model attends to ALL of these tokens simultaneously.            │
│  It has NO memory beyond this window.                                │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

Modern context windows range from 8K to 1M+ tokens, but larger windows come with trade-offs:

| Context Window Size | Approximate Text | Trade-off |
|---|---|---|
| 4K tokens | ~3,000 words | Fast, cheap, limited context |
| 32K tokens | ~24,000 words | Good balance for most apps |
| 128K tokens | ~96,000 words | A full novel fits; slower, more expensive |
| 1M+ tokens | ~750,000 words | Experimental; attention quality degrades |

The context window is the model's entire working memory. It has no persistent memory between requests (unless the application explicitly carries conversation history forward). This means the system prompt, safety instructions, conversation history, and current input all compete for space in the same window.

### The Embedding Layer

Once text is tokenized into integer IDs, each ID is mapped to a learned vector representation through an **embedding lookup table**. This table is a matrix where row *i* contains the vector for token ID *i*.

![Embedding lookup from token IDs to vectors](/svg/embedding-lookup.svg)

Each embedding vector typically has 4,096 to 12,288 dimensions (depending on model size). These vectors are not hand-designed — they are learned during training. Through the training process, tokens that appear in similar contexts end up with similar embedding vectors.

```python
# Conceptual embedding lookup
embedding_table = model.token_embeddings  # Shape: [vocab_size, hidden_dim]

token_ids = [464, 5765, 5496, 13903]  # "The guardrail prevented"
embeddings = embedding_table[token_ids]  # Shape: [4, hidden_dim]
```

At this point, each token is a dense vector of floating-point numbers. The model will transform these vectors through dozens of layers, but this is where the journey from discrete text to continuous mathematics begins.

### Positional Encoding

Self-attention, by design, is **position-agnostic** — it does not inherently know whether a token is first or last in the sequence. To give the model a sense of word order, **positional encodings** are added to the embedding vectors.

![Positional encoding added to token embeddings](/svg/positional-encoding.svg)

Older models (like the original Transformer) used fixed sinusoidal functions. Modern LLMs typically use **Rotary Position Embeddings (RoPE)**, which encode relative positions directly into the attention computation. RoPE allows models to generalize to sequence lengths longer than those seen during training, which is how context window extension techniques work.

The result is that each token's representation now encodes both *what* the token is (from the embedding) and *where* it is in the sequence (from the positional encoding).

### Masked Self-Attention: Queries, Keys, and Values

This is the computational core of the transformer. For each token, the model computes three vectors by multiplying the token's representation by three learned weight matrices:

- **Query (Q):** "What am I looking for?"
- **Key (K):** "What do I contain?"
- **Value (V):** "What information do I provide?"

Attention scores are computed by taking the dot product of each Query with all Keys, scaling by the square root of the dimension, and applying softmax to get weights:

![Attention score computation showing Q, K, V projections](/svg/attention-scores.svg)

```
Attention(Q, K, V) = softmax(Q · K^T / √d_k) · V
```

The softmax output is a set of weights that sum to 1.0, indicating how much each token should "attend to" every other token. The final output for each position is a weighted sum of all Value vectors, where the weights come from the attention scores.

**Masked** self-attention means that during generation, each token can only attend to tokens at the same position or earlier — never to future tokens. This is enforced by setting attention scores for future positions to negative infinity before the softmax, making them effectively zero.

**Multi-head attention** runs this computation multiple times in parallel (typically 32 to 128 heads), each with different Q/K/V projection matrices. Different heads learn to attend to different types of relationships — one head might track syntactic dependencies while another tracks semantic similarity.

> **Why this matters for guardrails:** Attention is the mechanism through which the model decides what context to prioritize. When a user crafts a prompt injection like "Ignore all previous instructions," the attack works (when it works) because the injected text creates strong attention patterns that override the system prompt. Understanding attention helps you understand why position and formatting of safety instructions matter — and why simply prepending "Be safe" is insufficient.

### Feed-Forward Networks and Residual Connections

After self-attention, each token's representation passes through a **feed-forward network (FFN)** — typically two linear transformations with a GELU activation between them. Research suggests that the FFN layers act as the model's "memory," storing factual associations learned during training, while attention layers handle contextual reasoning.

```
┌─────────────────────────────────────────────────────────┐
│              Single Transformer Layer                    │
│                                                         │
│   Input                                                 │
│     │                                                   │
│     ├──────────────────┐                                │
│     ▼                  │                                │
│  Layer Norm            │  ◄── Normalize activations     │
│     │                  │                                │
│     ▼                  │                                │
│  Multi-Head            │                                │
│  Self-Attention        │                                │
│     │                  │                                │
│     ▼                  │                                │
│  + ◄───────────────────┘  ◄── Residual connection       │
│     │                                                   │
│     ├──────────────────┐                                │
│     ▼                  │                                │
│  Layer Norm            │                                │
│     │                  │                                │
│     ▼                  │                                │
│  Feed-Forward          │                                │
│  Network               │                                │
│     │                  │                                │
│     ▼                  │                                │
│  + ◄───────────────────┘  ◄── Residual connection       │
│     │                                                   │
│     ▼                                                   │
│   Output (→ next layer)                                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Residual connections** (the "+" operations) add the input of each sub-layer directly to its output. This allows gradients to flow through the network without degrading, making it possible to train networks with 100+ layers. **Layer normalization** stabilizes the activations at each step.

![Full transformer layer stack](/svg/transformer-stack.svg)

A complete LLM stacks dozens of these layers. Llama 3 70B has 80 transformer layers. Each layer refines the token representations, adding more context and abstraction. By the final layer, each token's vector has been transformed from a simple word embedding into a rich, context-aware representation that encodes the model's "understanding" of that token's role in the full sequence.

### The Output Head: From Vectors to Words

After the final transformer layer, the model needs to convert the last token's vector back into a probability distribution over the vocabulary. This is done by a **linear projection** (often tied to the embedding matrix) followed by **softmax**:

```python
# After final transformer layer
hidden_state = transformer_layers(embeddings)  # Shape: [seq_len, hidden_dim]
last_token = hidden_state[-1]                  # Shape: [hidden_dim]

# Project to vocabulary size
logits = linear_head(last_token)               # Shape: [vocab_size]

# Convert to probabilities
probabilities = softmax(logits)                # Shape: [vocab_size], sums to 1.0
```

The **logits** are raw scores (unnormalized log-probabilities) for each token in the vocabulary. The softmax function converts these into a proper probability distribution. The token with the highest probability is the model's "best guess" for the next token — but we do not always pick the most probable token.

### Autoregressive Generation

LLMs generate text one token at a time in an **autoregressive** loop: each generated token is appended to the input, and the model runs again to predict the next token.

![The autoregressive generation loop](/svg/generation-loop.svg)

```python
def generate(prompt, model, max_tokens, temperature=1.0, top_p=0.9):
    tokens = tokenize(prompt)
    
    for _ in range(max_tokens):
        logits = model.forward(tokens)        # Full forward pass
        next_token_logits = logits[-1]         # Logits for next position
        
        # Apply temperature scaling
        scaled_logits = next_token_logits / temperature
        
        # Apply top-p (nucleus) sampling
        probs = softmax(scaled_logits)
        filtered_probs = top_p_filter(probs, p=top_p)
        
        # Sample from the filtered distribution
        next_token = sample(filtered_probs)
        
        tokens.append(next_token)
        
        if next_token == EOS_TOKEN:
            break
    
    return detokenize(tokens)
```

Several critical properties of this process affect guardrail design:

**Each token is irreversible.** Once a token is generated and added to the context, it influences all subsequent tokens. The model cannot "go back" and reconsider. If the first few tokens of a response commit to a harmful direction, the remaining tokens will often follow that direction due to the autoregressive nature of generation.

**The model sees its own output.** During generation, previously generated tokens become part of the input for generating the next token. This creates a feedback loop where early outputs steer later outputs.

**Generation is stochastic.** Due to sampling (described below), the same prompt can produce different outputs each time. This makes exhaustive testing impossible.

> **Why this matters for guardrails:** The autoregressive, irreversible nature of generation is why streaming output guardrails are challenging. If you are monitoring a model's output token-by-token and detect a harmful turn at token 50, the user has already received tokens 1-49. Some guardrail systems buffer entire responses before delivering them (latency trade-off), while others monitor the stream and can halt or replace output mid-generation. Understanding this trade-off is a core guardrail design decision.

### Temperature, Top-k, and Top-p Sampling

Sampling parameters control the randomness of text generation by shaping the probability distribution before a token is selected:

**Temperature** scales the logits before softmax. Lower temperatures sharpen the distribution (making the most probable token much more likely); higher temperatures flatten it (giving lower-probability tokens more chance).

| Temperature | Effect | Use Case |
|---|---|---|
| 0.0 | Greedy (always pick most probable) | Deterministic outputs, factual tasks |
| 0.3 | Low randomness | Code generation, structured outputs |
| 0.7 | Moderate randomness | General conversation, balanced tasks |
| 1.0 | Default (unscaled) | Creative writing |
| 1.5+ | High randomness | Brainstorming, highly creative tasks |

**Top-k sampling** restricts selection to the *k* most probable tokens, setting all others to zero probability. With k=50, only the top 50 tokens are candidates, regardless of their absolute probabilities.

**Top-p (nucleus) sampling** restricts selection to the smallest set of tokens whose cumulative probability exceeds *p*. With p=0.9, the model considers only enough top tokens to cover 90% of the probability mass. This adapts to the distribution — when the model is confident, fewer tokens are considered; when uncertain, more tokens are considered.

```
Example probability distribution for next token:

Token:     "Paris"  "the"   "Lyon"  "a"    "France" ...
Prob:       0.72    0.08    0.05    0.04    0.03    ...

Temperature 0.0 → Always selects "Paris"
Temperature 0.7 → Usually "Paris", occasionally "the" or "Lyon"
Temperature 1.5 → Wide variety; even low-probability tokens appear

Top-p 0.9  → Considers "Paris", "the", "Lyon", "a", "France", + more
Top-p 0.5  → Considers only "Paris" (already exceeds 50%)
Top-k 3    → Considers "Paris", "the", "Lyon" only
```

> **Why this matters for guardrails:** Temperature and sampling settings directly affect guardrail effectiveness. Higher temperatures increase the probability of unusual, potentially harmful outputs because low-probability tokens (including toxic completions) get more weight. If your application allows users to control temperature, you need guardrails that remain effective across the full range of sampling parameters. A response that passes output filters at temperature 0.3 might produce harmful variants at temperature 1.5.

### Reasoning Models and Chain-of-Thought

A significant recent development is **reasoning models** — LLMs that are trained (often via reinforcement learning) to generate explicit chains of thought before producing a final answer. Models like OpenAI's o1/o3 and DeepSeek-R1 produce extended reasoning traces that break problems into steps.

```
User: "What is 247 × 83?"

Standard model:
"247 × 83 = 20,501"  ← may or may not be correct

Reasoning model:
<thinking>
Let me break this down:
247 × 80 = 19,760
247 × 3 = 741
19,760 + 741 = 20,501
</thinking>
"247 × 83 = 20,501"  ← same answer, but with verifiable steps
```

Reasoning models have distinct guardrail implications:

1. **The thinking trace may contain harmful content** even when the final answer is safe. Some providers hide the thinking trace from the user, but the model still generated it.
2. **Longer generation means more tokens to monitor.** Reasoning traces can be thousands of tokens long, expanding the attack surface.
3. **The reasoning process itself can be manipulated.** Adversarial inputs can steer the chain of thought in harmful directions.
4. **Reasoning improves capability, including harmful capability.** A model that reasons step-by-step about how to circumvent safety measures is more dangerous than one that attempts to answer directly.

These models represent an important frontier for guardrail engineering — more capable models require more sophisticated guardrails.

---
