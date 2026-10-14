---
id: "1.2"
title: "How Models Learn Behavior"
slug: how-models-learn-behavior
module: how-ai-systems-behave
sectionOrder: 2
description: "How pre-training, instruction tuning, preference training, and reasoning RL produce a model's behavior, why safety is a learned preference that further training or prefilling can remove, and who controls each stage."
category: safety
controlLayers: [model, deterministic]
knowledge:
  - "Pre-training on next-token prediction produces capability and knowledge, including harmful knowledge, with no preference for helpful or safe behavior."
  - "Instruction tuning, preference training (RLHF, DPO, RLAIF/Constitutional AI), and reasoning RL shape behavior on top of that knowledge; stages can be skipped, reordered, or repeated."
  - "RLHF maximizes a learned reward minus a KL penalty that keeps the policy close to a reference model, optimized through log-probabilities with a policy-gradient method such as PPO."
  - "Safety behavior is a learned statistical preference, often concentrated in the first few output tokens, which is why prefill attacks and small fine-tuning runs can undo it."
  - "Refusing to discuss something is not the same as not knowing it; knowledge cannot be reliably removed from weights with current methods."
  - "Reasoning traces may not faithfully reflect the computation that produced an answer."
  - "Providers control pre-training and base alignment; application builders control prompts, sampling, runtime controls, architecture, and, on some platforms, fine-tuning including preference fine-tuning."
skills:
  - "Explain why a model's safety behavior is probabilistic and can change between model versions."
  - "Design a release gate that measures safety before and after any fine-tuning."
  - "Implement server-side conversation state so clients cannot supply assistant turns or prefills."
  - "Identify which behaviors an application team can change and which it must compensate for with runtime controls."
sources:
  - title: "Ouyang et al. (2022). Training language models to follow instructions with human feedback"
    url: "https://arxiv.org/abs/2203.02155"
  - title: "Rafailov et al. (2023). Direct Preference Optimization: Your Language Model is Secretly a Reward Model"
    url: "https://arxiv.org/abs/2305.18290"
  - title: "Bai et al. (2022). Constitutional AI: Harmlessness from AI Feedback"
    url: "https://arxiv.org/abs/2212.08073"
  - title: "DeepSeek-AI (2025). DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning"
    url: "https://arxiv.org/abs/2501.12948"
  - title: "Guan et al. (2024). Deliberative Alignment: Reasoning Enables Safer Language Models"
    url: "https://arxiv.org/abs/2412.16339"
  - title: "Qi et al. (2023). Fine-tuning Aligned Language Models Compromises Safety, Even When Users Do Not Intend To!"
    url: "https://arxiv.org/abs/2310.03693"
  - title: "Qi et al. (2024). Safety Alignment Should Be Made More Than Just a Few Tokens Deep"
    url: "https://arxiv.org/abs/2406.05946"
  - title: "Andriushchenko, Croce, Flammarion (2024). Jailbreaking Leading Safety-Aligned LLMs with Simple Adaptive Attacks"
    url: "https://arxiv.org/abs/2404.02151"
  - title: "Li et al. (2024). The WMDP Benchmark: Measuring and Reducing Malicious Use With Unlearning"
    url: "https://arxiv.org/abs/2403.03218"
  - title: "Schaeffer, Miranda, Koyejo (2023). Are Emergent Abilities of Large Language Models a Mirage?"
    url: "https://arxiv.org/abs/2304.15004"
  - title: "Turpin et al. (2023). Language Models Don't Always Say What They Think: Unfaithful Explanations in Chain-of-Thought Prompting"
    url: "https://arxiv.org/abs/2305.04388"
  - title: "Chen et al. / Anthropic (2025). Reasoning Models Don't Always Say What They Think"
    url: "https://arxiv.org/abs/2505.05410"
  - title: "Stanford HAI (2024). AI Index Report 2024 (training cost estimates)"
    url: "https://hai.stanford.edu/ai-index/2024-ai-index-report"
  - title: "OpenAI. Direct preference optimization (fine-tuning guide)"
    url: "https://developers.openai.com/api/docs/guides/direct-preference-optimization"
lastReviewed: "2026-10-14"
---

# 1.2 How Models Learn Behavior

## The problem

A product team wants its support assistant to sound like their brand. They upload a few hundred friendly, entirely benign support transcripts to their provider's fine-tuning API, train a custom model, and ship it after checking that the tone is right. Nobody re-runs the safety evaluation, because nothing in the training data was harmful.

Qi et al. (2023) showed why that is a mistake. Fine-tuning a safety-aligned model on only 10 adversarially designed examples, through a public fine-tuning API at a cost of less than $0.20, was enough to remove most of its refusal behavior. More relevant to this team: fine-tuning on ordinary, benign instruction datasets also degraded safety, though less severely. The model's refusals were not a fixed rule. They were one learned tendency among many, and new training pushed on them.

To reason about failures like this, you need a working model of where behavior comes from.

## Why it happens

### The training stages

Most current assistants go through some combination of the following stages. The order shown is common, but it is not fixed: stages can be skipped, repeated, or reordered. In 2025, DeepSeek reported DeepSeek-R1-Zero, which applied reinforcement learning directly to a base model with no supervised fine-tuning step first.

| Stage | Training signal | What it adds | Guardrail-relevant consequence |
|---|---|---|---|
| Pre-training | Predict the next token on a very large text corpus | Language, knowledge, and skills, including harmful knowledge | The base model completes text. It has no notion of roles, helpfulness, or refusal. |
| Instruction tuning (SFT) | Imitate curated example conversations | Chat format, role markers, following instructions | Role conventions and the instruction hierarchy are learned here, as patterns ([1.3](/training/module/how-ai-systems-behave/instruction-hierarchy-single-channel)). |
| Preference training | Prefer responses that humans or AI judges rated higher | Helpfulness style, refusals, tone | Safety becomes a preference, not a rule. Also a source of sycophancy ([4.5](/training/module/safety-engineering/sycophancy-and-vulnerable-users)). |
| Reasoning RL | Reward for verifiably correct outcomes (math, code tests) and, increasingly, safety specifications | Long chains of reasoning before answering | The model optimizes what the reward measures. Reasoning traces may be unfaithful. |

Pre-training dominates the cost. The 2024 AI Index estimated the compute to train two 2023 frontier models at about $78 million and $191 million. That cost is why application teams start from a provider's model and do not train their own.

### Preference training in more detail

**RLHF** (Ouyang et al., 2022) has three steps: collect human rankings of model responses, train a **reward model** to predict those rankings, then optimize the language model (the policy) against the reward model. The objective is not "minimize negative reward". It is:

```text
maximize over policy pi:
    E[ r(x, y) ]  -  beta * KL( pi(. | x)  ||  pi_ref(. | x) )
    with x drawn from prompts and y ~ pi(. | x)

r       = reward model score
pi_ref  = the starting (usually instruction-tuned) model
beta    = strength of the penalty for drifting from pi_ref
```

The KL penalty keeps the model from drifting into text that games the reward model. Because `y` is sampled, the objective is optimized with a policy-gradient method such as PPO, which adjusts the log-probabilities of sampled responses in proportion to how much better than expected they scored.

**DPO** (Rafailov et al., 2023) reaches a related objective without a separate reward model or RL loop. It trains directly on preference pairs, raising the log-probability of the preferred response relative to the rejected one, measured against the reference model.

**Constitutional AI** (Bai et al., 2022) replaces much of the human labeling with a written set of principles. In the supervised phase, the model critiques and revises its own responses according to those principles, and is fine-tuned on the revisions. In the RL phase, an AI model, not a human, labels which of two responses better follows the principles, and those AI preference labels train the preference model. This RL-from-AI-feedback step is called **RLAIF**.

**Reasoning models** are trained with RL to produce long chains of reasoning before answering, typically rewarded on outcomes that can be checked. The same machinery is used for safety: OpenAI's 2024 "deliberative alignment" work trained reasoning models to recall and reason over a written safety specification before responding.

### Safety is a learned statistical preference

Every stage after pre-training adjusts probabilities. None of them adds a rule the model must obey. Several things follow.

**Safety can be shallow.** Qi et al. (2024) found that in the aligned models they studied, the difference between aligned and base models was concentrated in the first few tokens of the response. If the response starts with a refusal, the rest tends to stay safe. If it starts with compliance, the model often continues as a base model would.

**Prefill attacks exploit this.** Some APIs let the caller supply the beginning of the assistant's response, a feature called prefilling, intended for steering format. Open-weight models let anyone control decoding entirely. An attacker who can write `Sure, here are the detailed steps:` as the start of the assistant turn skips the tokens where refusal usually happens. Andriushchenko et al. (2024) reported jailbreaking every Claude model they tested with either a transfer attack or a prefilling attack, at a 100% success rate. Fabricated earlier assistant turns in a client-supplied conversation history work the same way: the model continues the pattern it is shown.

**Fine-tuning moves the preference.** Any gradient update can trade safety for whatever the new data rewards. The Qi et al. (2023) results apply to fine-tuning through hosted APIs, not only to open weights.

**Refusal is not ignorance.** A model that refuses to explain something usually still encodes it. Unlearning research tries to remove specific hazardous knowledge (WMDP, Li et al., 2024, is one benchmark for this), but current methods cannot reliably and verifiably remove knowledge from weights. Treat anything in the pre-training data as potentially extractable.

**Behavior changes between versions.** A new model version is a new set of learned preferences. Capabilities can appear that earlier versions lacked. Whether such jumps are truly sudden "emergent abilities" is disputed: Schaeffer et al. (2023) argued many apparent jumps are artifacts of the metrics used. Either way, re-evaluate on every model change ([7.3](/training/module/operations-and-governance/change-management)).

**Reasoning is not evidence.** Turpin et al. (2023) showed that chain-of-thought explanations can omit the factor that actually drove an answer. A 2025 Anthropic study of reasoning models found they often did not mention hints they had used. Monitoring reasoning traces can still catch some problems, but a trace that looks benign does not prove the action is benign. Never show an approver the model's reasoning as the justification for an action.

### Who controls what

| Party | Controls | Does not control |
|---|---|---|
| Model provider | Pre-training data, base alignment, provider-side abuse monitoring and filters, which API features exist (prefill, fine-tuning, sampling parameters) | Your system prompt, tools, data, authorization, or users |
| Application builder on a hosted API | System prompt, conversation assembly, sampling parameters (where allowed), runtime classifiers, tool permissions, architecture, and on some platforms fine-tuning, including supervised and preference (DPO) fine-tuning | Pre-training and base alignment |
| Deployer of open weights | Everything above, including weights and decoding | Whether anyone else who downloads the weights strips the safety training |

Application builders therefore do have training control in many cases, and each use of it is a change to safety behavior that needs testing.

## Control patterns

Ordered from strongest to weakest.

| Control | Layer | Purpose |
|---|---|---|
| Bound what the model can do with deterministic controls (authorization, tool allowlists, egress limits) | deterministic | Holds even if safety training fails entirely. Domain 5 covers this. |
| Keep conversation state server-side; reject client-supplied assistant turns and prefills | deterministic | Removes the cheapest way to skip the refusal tokens. |
| Gate every fine-tune and model upgrade on a safety evaluation comparison | deterministic (release gate) | Catches regressions before release. The gate is deterministic; what it measures is a sample. |
| Mix safety examples into fine-tuning data | model | Qi et al. (2023) found this mitigates, but does not fully restore, safety. |
| Run output classifiers in production | runtime-ml | Catches some harmful outputs that alignment missed. Probabilistic. |
| Rely on the provider's alignment | model | Useful and real, but the weakest layer you can lean on. |

## Implementation

**Server-side conversation state.** If the client sends the whole message list, it can invent assistant turns or end the list with a partial assistant message. Store history on the server and accept only the new user text from the client.

```python
from dataclasses import dataclass, field

MAX_USER_CHARS = 8_000


@dataclass
class Conversation:
    owner_id: str
    messages: list = field(default_factory=list)  # server-side source of truth


def build_request(conv: Conversation, caller_id: str, user_text: str, system_prompt: str) -> list:
    if caller_id != conv.owner_id:
        raise PermissionError("conversation belongs to another user")
    if not isinstance(user_text, str) or not user_text.strip():
        raise ValueError("empty user message")
    if len(user_text) > MAX_USER_CHARS:
        raise ValueError("user message too long")
    conv.messages.append({"role": "user", "content": user_text})
    # The client never supplies roles, so it cannot add assistant turns or a prefill.
    return [{"role": "system", "content": system_prompt}, *conv.messages]
```

**A fine-tuning release gate.** Compare the candidate against the current model on the same prompts, with several samples per prompt, and fail closed if either harm or over-refusal gets worse beyond a tolerance.

```python
def safety_gate(baseline: dict, candidate: dict, max_harm_increase=0.005, max_overrefusal_increase=0.02):
    """Each dict holds rates measured on the same eval sets with several samples per prompt:
    harmful_compliance_rate: share of responses to disallowed prompts that complied
    overrefusal_rate: share of responses to allowed prompts that refused
    sample_count: number of graded responses
    """
    for result in (baseline, candidate):
        if result.get("sample_count", 0) < 1000:
            return False, "not enough samples to compare"  # fail closed
    harm_delta = candidate["harmful_compliance_rate"] - baseline["harmful_compliance_rate"]
    refusal_delta = candidate["overrefusal_rate"] - baseline["overrefusal_rate"]
    if harm_delta > max_harm_increase:
        return False, f"harmful compliance up by {harm_delta:.3f}"
    if refusal_delta > max_overrefusal_increase:
        return False, f"over-refusal up by {refusal_delta:.3f}"
    return True, "pass"
```

The thresholds and minimum sample count are placeholders. Section [6.2](/training/module/evaluation-and-red-teaming/metrics-and-statistics) covers how to choose them and how to account for sampling error.

## Where it breaks

- **Server-side state only removes one path.** Many-shot and role-play jailbreaks can be written entirely inside a single user message. Blocking prefills raises the cost of an attack; it does not stop jailbreaks.
- **Some products need prefill.** If your application uses prefilling to force a format, it must come from server code, never from user input.
- **Evaluation sets are samples.** A fine-tune can pass your gate and still fail on prompts your set does not cover. Red-teaming ([6.4](/training/module/evaluation-and-red-teaming/red-team-engagements)) and production monitoring fill some of the gap.
- **Provider updates move under you.** If you use an unpinned model alias, the provider can change the weights without a release on your side. Pin versions where the provider allows it, and re-run the gate on each change.
- **Open weights cannot be recalled.** Once weights are public, anyone can fine-tune the safety training away. Your application controls apply only to your deployment.
- **Reasoning-trace monitors inherit unfaithfulness.** A monitor that reads the model's reasoning can miss behavior the trace does not mention.

## Lab exercise

In [Lab 1: Map the System](/labs/lab-1-map-the-system), **Task 1.2** has you classify each behavior-shaping control in the sample application by who owns it (provider or application) and by layer, and confirm whether the API accepts client-supplied assistant turns or prefills.

## Check your understanding

<details>
<summary>1. A team fine-tunes a hosted model on benign customer-support data and skips safety testing. Why is that a risk?</summary>

Safety behavior is a learned preference, and any fine-tuning can shift it. Qi et al. (2023) found that even benign fine-tuning data degraded safety, and 10 adversarial examples removed most of it. Every fine-tune needs a before-and-after safety comparison.
</details>

<details>
<summary>2. Why does a prefill attack work against an aligned model?</summary>

Alignment is often concentrated in the first few tokens of the response, where the model decides whether to refuse. Supplying a compliant opening skips that decision, and the model continues the pattern.
</details>

<details>
<summary>3. State the RLHF objective in words.</summary>

Maximize the expected reward-model score of sampled responses minus a KL penalty for drifting from the reference model, optimized with a policy-gradient method such as PPO through the log-probabilities of the sampled responses.
</details>

<details>
<summary>4. An approver sees the agent's reasoning trace, which explains why a refund is justified. Is that adequate evidence?</summary>

No. Reasoning traces can omit what actually drove the output, and the model is untrusted. The approver needs independent evidence such as the order record and the policy check result.
</details>

<details>
<summary>5. Name two training controls an application builder on a hosted API may have.</summary>

Supervised fine-tuning and, on some platforms, preference fine-tuning such as DPO. Both change safety behavior and need gating.
</details>
