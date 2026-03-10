---
title: "Key Vocabulary"
slug: "key-vocabulary"
module: "prerequisites"
sectionOrder: 6
description: "Section 5 of the prerequisites module."
---

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
| **Cosine similarity** | A metric that measures the angle between two vectors, producing a score from -1 to 1; used to compare semantic similarity between embeddings |

**Architecture**

| Term | Definition |
|------|-----------|
| **Transformer** | The neural network architecture used by all modern LLMs; key innovation is self-attention |
| **Self-attention** | Mechanism that lets the model consider all parts of its input simultaneously and compute relevance between token pairs |
| **Multi-head attention** | Running multiple attention computations in parallel, each learning different types of relationships |
| **Positional encoding** | Information added to embedding vectors so the model knows token order in the sequence |
| **Logits** | The raw numerical scores a model produces for each vocabulary token before conversion to probabilities |
| **Log probabilities** | The logarithm of token probabilities; exposed by some APIs as a confidence signal for model output |

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
