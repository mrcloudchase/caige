---
title: "Review Questions"
slug: "review-questions"
module: "prerequisites"
sectionOrder: 8
description: "Section 8 of the prerequisites module."
---

### Question 1 (Multiple Choice)

A neural network has been trained to classify emails as spam or not spam. After training, you discover that the training data contained examples with racial bias. What is the MOST accurate description of where that bias now exists in the model?

A. The bias is stored in a specific layer of the network and can be surgically removed
B. The bias is distributed across the model's weights and cannot be selectively identified or removed without retraining
C. The bias only exists in the training data and does not affect the model after training is complete
D. The bias is stored in the model's activation functions

**Answer: B**
Knowledge in a neural network is distributed across billions of weights. You cannot open up a model and locate or remove a specific piece of learned information — including biases. Addressing the bias requires retraining on corrected data, or applying external guardrails to mitigate biased outputs.

---

### Question 2 (Multiple Choice)

What is the fundamental training objective of a large language model?

A. Answering questions accurately
B. Following instructions from a system prompt
C. Predicting the next token in a sequence
D. Classifying text into predefined categories

**Answer: C**
LLMs are trained on next-token prediction — given a sequence of text, predict what comes next. All other capabilities (answering questions, following instructions, writing code) emerge as a byproduct of getting very good at this single objective. Instruction-following (B) is added later through fine-tuning.

---

### Question 3 (Multiple Choice)

Why did the transformer architecture replace recurrent neural networks (RNNs) as the foundation for language models?

A. Transformers require less training data than RNNs
B. Transformers use self-attention to process all tokens in parallel, solving the long-range dependency and training speed problems of sequential processing
C. Transformers are simpler architectures with fewer parameters
D. Transformers do not require GPUs for training

**Answer: B**
RNNs processed tokens sequentially — each token had to wait for the previous one, making training slow and causing information to degrade over long sequences. The transformer's self-attention mechanism processes all tokens simultaneously, allowing each token to directly attend to any other token regardless of distance, and enabling parallel computation during training.

---

### Question 4 (Multiple Choice)

A model has a context window of 128,000 tokens. The system prompt uses 1,500 tokens, safety instructions use 500 tokens, few-shot examples use 800 tokens, and the conversation history uses 50,000 tokens. How many tokens remain for the user's current message and the model's response?

A. 128,000 tokens
B. 75,200 tokens
C. 125,200 tokens
D. The context window only limits input, not output

**Answer: B**
The context window is a fixed budget shared by everything: system prompt (1,500) + safety instructions (500) + few-shot examples (800) + conversation history (50,000) = 52,800 tokens consumed. 128,000 - 52,800 = 75,200 tokens remaining for the user's message and the model's response. Every guardrail instruction competes with useful content for context window space.

---

### Question 5 (Multiple Select)

Which TWO of the following are reasons that the attention mechanism creates security challenges for AI systems? (Choose 2)

A. Attention is computationally expensive, making real-time guardrails impractical
B. Attention treats all tokens in the context window as equally accessible, with no architectural privilege for system instructions over user input
C. Attention only processes tokens sequentially, creating race conditions
D. A malicious instruction in a retrieved document receives the same attention as the first line of the system prompt

**Answer: B, D**
The attention mechanism computes relevance scores between all tokens in the context window regardless of their source. There is no access control system inside the model that gives system prompt tokens higher architectural authority than user input or retrieved content. This means a malicious instruction embedded anywhere in the context — including retrieved documents — can influence the model's output just as readily as trusted instructions.

---

### Question 6 (Multiple Choice)

During LLM training, instruction tuning teaches the model to follow instructions and respect role boundaries (system, user, assistant). Why is this NOT sufficient as a security control?

A. Instruction tuning only works for English-language prompts
B. The instruction-following behavior is a learned statistical preference from training data, not an architecturally enforced constraint, and can be bypassed under sufficient pressure
C. Instruction tuning degrades the model's general knowledge
D. Instruction tuning is only applied to open-source models, not commercial ones

**Answer: B**
Instruction tuning trains the model on thousands of examples where system instructions were followed, so it tends to follow them. But "tends to" is not "guaranteed to." The compliance is a learned pattern — there is no parser, access control system, or enforcement mechanism inside the model. Under sufficient pressure (crafted prompts, role-play, multi-turn manipulation), the model can override its training.

---

### Question 7 (Multiple Choice)

What is the PRIMARY security concern with identity delegation in agentic AI systems?

A. Agents cannot authenticate to external systems
B. Agents may act under a privileged service account rather than the invoking user's permissions, creating a privilege escalation vector
C. Agents always use the weakest available credentials
D. Identity delegation only applies to on-premises deployments

**Answer: B**
When an AI agent calls external tools using a shared service account with broad permissions, every user who interacts with the agent effectively inherits those elevated permissions. A user with read-only access could instruct the agent to perform write operations. The agent becomes a privilege escalation vector — not through a hack, but through a design flaw in how permissions are delegated.

---

### Question 8 (Multiple Choice)

Which statement BEST describes why external guardrails are necessary for AI systems?

A. LLMs are poorly trained and produce random output
B. The risks — hallucination, prompt injection, jailbreaking, data leakage — are inherent consequences of the architecture, not bugs that can be fixed through better training alone
C. Guardrails are only needed for open-source models because commercial models are safe
D. External guardrails replace the need for model-level safety training

**Answer: B**
Hallucination exists because the architecture generates text probabilistically. Prompt injection exists because attention does not distinguish trusted from untrusted tokens. Jailbreaking exists because safety behaviors are learned preferences, not enforced rules. These are direct consequences of how LLMs work — not flaws that better training can eliminate. External guardrails provide controls that operate independently of the model's willingness to comply.

---
