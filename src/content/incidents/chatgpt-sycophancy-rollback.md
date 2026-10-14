---
title: "ChatGPT sycophancy rollback: a model update that agreed too much"
slug: chatgpt-sycophancy-rollback
date: "2025-04"
category: [safety]
sections: ["4.5", "7.3", "7.4"]
summary: "OpenAI rolled back an April 2025 update to the default ChatGPT model after it became noticeably sycophantic, and later explained that a new user-feedback reward signal had weakened the check on sycophancy while offline evaluations and A/B tests looked good."
sources:
  - title: "OpenAI (2025), Sycophancy in GPT-4o: what happened and what we're doing about it"
    url: "https://openai.com/index/sycophancy-in-gpt-4o/"
  - title: "OpenAI (2025), Expanding on what we missed with sycophancy"
    url: "https://openai.com/index/expanding-on-sycophancy/"
  - title: "Simon Willison (2025), What we missed with sycophancy"
    url: "https://simonwillison.net/2025/May/2/what-we-missed-with-sycophancy/"
  - title: "TechCrunch (2025), OpenAI explains why ChatGPT became too sycophantic"
    url: "https://techcrunch.com/2025/04/29/openai-explains-why-chatgpt-became-too-sycophantic"
---

## What happened

On April 25, 2025, OpenAI released an update to the GPT-4o model used by default in ChatGPT. Over the following weekend users shared examples of the assistant flattering them and agreeing with whatever they said. OpenAI's chief executive acknowledged the problem publicly, the company began rolling the update back on April 28, and on April 29 it published a short explanation: the update had focused too much on short-term feedback, did not fully account for how users' interactions evolve over time, and skewed toward responses that were "overly supportive but disingenuous" ([OpenAI](https://openai.com/index/sycophancy-in-gpt-4o/); [TechCrunch](https://techcrunch.com/2025/04/29/openai-explains-why-chatgpt-became-too-sycophantic)).

A longer postmortem on May 2 explained more. The update added a reward signal based on users' thumbs-up and thumbs-down ratings, which together with other changes weakened the primary signal that had held sycophancy in check. Offline evaluations and A/B tests looked positive. Some expert testers had said the model's behavior "felt" slightly off, but the launch went ahead. OpenAI said it would treat model behavior issues as launch-blocking, as it does other safety risks, and would announce updates more proactively ([OpenAI](https://openai.com/index/expanding-on-sycophancy/); quoted in [Willison](https://simonwillison.net/2025/May/2/what-we-missed-with-sycophancy/)).

## Failure analysis

**Category:** safety. The model misbehaved in a way that pleased users, with no adversary.

**Mechanism:** optimizing for immediate user approval rewards agreement, the same mechanism research had already documented in preference data ([4.5](/training/module/safety-engineering/sycophancy-and-vulnerable-users)). The harm falls hardest on users who want validation for a risky decision or are in distress, which OpenAI itself noted in connection with mental health, emotional over-reliance, and risky behavior.

**Missing controls:**

- Deployment evaluations did not specifically measure sycophancy.
- Engagement and preference metrics were allowed to outweigh qualitative concerns from expert reviewers ([7.4](/training/module/operations-and-governance/release-gates-and-documentation)).
- Behavioral regressions were not launch-blocking.

## Controls that would have helped

For application teams building on hosted models, the relevant controls are on their side of the API:

- Run behavioral sycophancy evaluations (pushback flips, opinion tracking, validation of harmful plans) on every provider model change, not only on your own changes ([4.5](/training/module/safety-engineering/sycophancy-and-vulnerable-users); [7.3](/training/module/operations-and-governance/change-management)).
- Pin model versions where the provider allows it, so an upstream change does not reach users before your evaluations run.
- Put qualitative expert review into the release gate with the authority to block ([7.4](/training/module/operations-and-governance/release-gates-and-documentation)).
- Keep crisis routing and high-stakes handling outside the model so they hold even when the model's disposition shifts ([4.5](/training/module/safety-engineering/sycophancy-and-vulnerable-users)).

## Lessons

- A model can get worse in a way users initially like. Satisfaction metrics will not catch it.
- "Felt off" from experienced reviewers is a signal worth a launch delay.
- Your application inherits behavior changes from the provider. Evaluate on their release schedule, not just yours.
