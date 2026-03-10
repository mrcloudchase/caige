---
title: "How LLMs Are Trained"
slug: "llm-training"
module: "prerequisites"
sectionOrder: 3
description: "Section 3 of the prerequisites module."
---

You now understand the complete machine — how text is tokenized, embedded, processed through transformer layers, and converted into predictions one token at a time. But how did the model learn to produce useful outputs instead of random noise? In Part 1, you learned the fundamental training loop: forward pass, loss calculation, backpropagation, and weight update, repeated across many epochs until the weights converge on values that produce accurate predictions. LLM training uses the exact same process, but at a scale that transforms what the network can do — and across multiple distinct stages that each shape different aspects of the model's behavior.

Understanding these stages matters because each one creates specific capabilities AND specific risks. As a guardrail engineer, you need to know where the model's behaviors come from to understand which behaviors you can rely on and which you cannot.

![LLM training stages pipeline](/svg/training-stages.svg)

### 4.1 Pre-Training: Learning Language

Pre-training is where the model acquires its core knowledge. The training loop from Part 1 — forward pass, loss calculation, backpropagation, weight update — is run on a massive corpus of text, typically trillions of tokens from books, websites, code repositories, academic papers, and other sources. The training objective is the same next-token prediction you learned about in Part 2: given a sequence of tokens, **predict what comes next.**

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

### 4.2 Instruction Tuning and Chat Templates

The base model can complete text patterns, but it cannot have a conversation. To transform a text completer into an instruction-following assistant, the model is **fine-tuned** — trained further on a smaller, curated dataset of conversations. This is still the same training loop from Part 1 (forward pass, loss, backpropagation, weight update), but applied to a dataset of conversations formatted in a **chat template** — a structured format with the special tokens you learned about in Part 3 that marks where each role's content begins and ends.

#### The Chat Template

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

The tokens `<|im_start|>` and `<|im_end|>` are **special tokens** — single entries in the vocabulary with unique token IDs. In a properly configured system, the tokenizer will not produce these token IDs from regular user text input. If a user types the literal characters `<|im_start|>`, those characters are tokenized as a sequence of regular text tokens, not as the special token. This prevents users from injecting role boundaries through normal text input.

In agentic systems with tool use, the template adds a `tool` role for data returned from external tools:

```
<|im_start|>user
What's the weather in Paris?<|im_end|>
<|im_start|>assistant
<tool_call>
{"name": "get_weather", "arguments": {"location": "Paris"}}
</tool_call><|im_end|>
<|im_start|>tool
{"temperature": 22, "condition": "sunny"}<|im_end|>
<|im_start|>assistant
It's currently sunny in Paris at 22 degrees.<|im_end|>
```

The model outputs a structured tool call, the application executes the tool, and the result is injected back into the context under the `tool` role. The model then generates a final response incorporating that result.

Different model families use different template formats — Llama 3 uses `<|start_header_id|>` and `<|end_header_id|>`, for example — but the principle is the same: special tokens create role boundaries.

#### The Roles

| Role | Purpose | Who Controls It |
|------|---------|----------------|
| system | Behavioral rules and constraints | Application developer (trusted) |
| user | End-user input | End user (untrusted) |
| assistant | Model's generated response | Model (validate before use) |
| tool | Data returned from tool/function calls | External systems (untrusted) |

#### What the Model Learns

Through fine-tuning on hundreds of thousands to millions of these curated examples, the model learns:

- Text after `system` = behavioral rules to follow
- Text after `user` = questions to answer
- Text after `assistant` = helpful responses that follow the system rules

This is where the model gains its conversational ability and its tendency to follow instructions. The model also learns an **instruction hierarchy** — a priority ordering where system instructions take precedence over user instructions, with tool results treated as data the model incorporates rather than instructions that compete in the hierarchy.

> **Critical insight: learned, not enforced.** The instruction-following behavior and the instruction hierarchy are **learned from patterns in training data**, not architecturally enforced. There is no parser inside the model that reads system prompts and creates access control rules. There is no enforcement mechanism that prevents the model from ignoring system instructions. The model learned from thousands of examples where system instructions were followed, so it tends to follow them — but "tends to" is not "guaranteed to." This is foundational to understanding why guardrails exist. Part 5 examines the security implications in detail.

### 4.3 RLHF and Alignment

After instruction tuning, the model can follow instructions and have conversations, but it does not yet have reliable safety behaviors. It might follow harmful instructions, generate toxic content, or confidently state false information — because instruction tuning taught it to be helpful and compliant, not necessarily to be safe. **Reinforcement Learning from Human Feedback (RLHF)** is the training stage that adds safety and alignment behaviors.

RLHF works differently from the previous training stages. Instead of showing the model correct answers and adjusting weights to match them (as in pre-training and instruction tuning), RLHF trains the model to produce outputs that humans prefer. The process has four steps:

1. **Generate candidates.** The model is given a prompt and generates multiple different responses to it. For example, given "How do I pick a lock?", the model might generate one response that provides lock-picking instructions, another that refuses and explains why, and another that asks for clarification about the context.

2. **Human ranking.** Human raters evaluate these responses and rank them according to criteria like helpfulness, safety, accuracy, and honesty. The response that refuses the potentially harmful request might be ranked highest. The response that provides detailed instructions might be ranked lowest.

3. **Train a reward model.** A separate neural network — the **reward model** — is trained on thousands of these human rankings. It learns to predict which responses humans would prefer. Once trained, the reward model can score any response without needing a human to evaluate it, making the process scalable.

4. **Optimize the language model.** The language model is then optimized to produce responses that the reward model scores highly. This is typically done using an algorithm called **Proximal Policy Optimization (PPO)**, which adjusts the model's weights to increase the probability of high-scoring responses while constraining how much the model can change from its instruction-tuned behavior. This constraint is important — without it, the model might "game" the reward model by finding adversarial outputs that score high but are actually low quality.

Through this process, the model learns safety behaviors: refusing harmful requests, expressing uncertainty when appropriate, following system prompt instructions more reliably, and avoiding toxic or biased outputs. These behaviors are layered on top of the instruction-following ability from Stage 2, using the same fundamental mechanism — adjusting weights through training — but guided by human preferences rather than next-token prediction.

![RLHF training pipeline](/svg/rlhf-pipeline.svg)

**Variations on RLHF.** The basic RLHF process described above has inspired several alternatives. **Constitutional AI** (developed by Anthropic) is an approach where the model evaluates its own responses against a written set of principles (a "constitution") rather than relying solely on human raters — this makes the alignment criteria more transparent and scalable. **Direct Preference Optimization (DPO)** skips the separate reward model entirely and optimizes the language model directly on human preference data, simplifying the training pipeline while achieving similar results.

After these three stages — pre-training, instruction tuning, and RLHF — the result is a **chat model**: the kind of model you interact with through APIs and chat interfaces, and the kind of model you build guardrails around.

### 4.4 RL for Reasoning (Optional)

Some models undergo an optional fourth stage: reinforcement learning specifically for reasoning capabilities. Where RLHF (Stage 3) trains the model to be safe and helpful based on human preferences, RL for reasoning trains the model to solve problems by producing intermediate thinking steps — the chain-of-thought reasoning described in Part 3.

The approach works as follows:

1. The model is given a problem (e.g., a math question)
2. It generates multiple candidate solutions, each with step-by-step reasoning
3. Each solution is checked against the correct answer
4. Solutions that arrive at the correct answer are reinforced; incorrect solutions are not

One widely used algorithm for this is **Group Relative Policy Optimization (GRPO)**, which compares the model's multiple outputs against each other rather than training a separate reward model. This is significantly more efficient than the PPO approach used in RLHF and is the technique behind reasoning models like DeepSeek R1.

**Distillation** is a related technique where a smaller model is trained to mimic the reasoning behavior of a larger model. The smaller "student" model learns by training on the reasoning traces produced by the larger "teacher" model. This creates efficient reasoning models but also means the student inherits the teacher's failure modes and biases.

### 4.5 What Each Training Stage Creates — and What Can Go Wrong

| Training Stage | What Gets Encoded | What Can Go Wrong | Covered In |
|---|---|---|---|
| Pre-training | World knowledge, language patterns, code | Memorized private data, embedded biases, outdated facts | Module 1 (1.2.1, 1.2.4) |
| Instruction tuning (SFT) | Instruction following, role boundaries | Instruction hierarchy is a soft preference, can be broken | Module 1 (1.2.2, 1.2.3) |
| RLHF / alignment | Safety behaviors, refusal patterns | Safety training can be bypassed via jailbreaking | Module 1 (1.2.3) |
| RL for reasoning | Step-by-step reasoning, problem decomposition | Reasoning traces may contain harmful content or leaked data invisible in the final answer; capability gains can outpace safety guardrails | Module 1 (1.2.3), Module 5 |

> **Why this matters for guardrails:** The risks compound across every layer you have learned about: knowledge distributed across uninspectable weights, attention that does not distinguish trusted from untrusted tokens, non-deterministic outputs that vary on every run, and now safety behaviors that can be bypassed. Every training stage creates capabilities AND risks. Pre-training gives the model knowledge but also memorized data. Instruction tuning gives it conversational ability but also a breakable instruction hierarchy. Safety training gives it refusal behavior but also a target for jailbreaking. Reasoning training creates a new surface — thinking tokens — where policy violations can hide. No amount of training eliminates these risks — guardrails exist because model-level safety is necessary but insufficient.

### 4.6 What You Can and Cannot Control

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
