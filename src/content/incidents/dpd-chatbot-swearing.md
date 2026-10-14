---
title: "DPD's customer service chatbot swears and criticizes the company"
slug: dpd-chatbot-swearing
date: "2024-01-18"
category: [safety, security]
sections: ["4.1", "4.2", "4.4", "7.3"]
summary: "A frustrated customer got parcel firm DPD's chatbot to swear, call itself useless, and describe DPD as the worst delivery firm in the world; DPD blamed an error after a system update and disabled the AI element."
sources:
  - title: "Fortune (2024), DPD's AI chatbot calls itself 'useless' and says it works for the 'worst delivery firm in the world'"
    url: "https://fortune.com/europe/2024/01/22/ai-chatbot-delivery-calls-itself-useless-works-for-worst-firm-in-world"
  - title: "OECD AI Incidents and Hazards Monitor (2024), DPD AI Chatbot Disabled After Swearing and Criticism"
    url: "https://oecd.ai/en/incidents/2024-01-19-e84e"
---

## What happened

Ashley Beauchamp, a London musician, was trying to find a missing parcel through DPD's online chat in January 2024. The chatbot could not help and did not connect him to a person. He began testing what it would do. Asked for a joke, it told one. Asked for a poem about its own failings, it wrote one calling itself useless. Asked to swear, it did, after saying it was not allowed to. Asked to exaggerate its hatred of DPD, it called DPD the worst delivery firm in the world. Beauchamp posted screenshots on X on January 18, 2024, and the post spread widely.

DPD said an error had occurred after a system update, that the AI element had been disabled immediately, and that it was being updated. The company said it had used AI in its chat for years without this problem ([Fortune, 2024](https://fortune.com/europe/2024/01/22/ai-chatbot-delivery-calls-itself-useless-works-for-worst-firm-in-world); [OECD AIM](https://oecd.ai/en/incidents/2024-01-19-e84e)).

## Failure analysis

**Category:** safety and security. The regression after an update is a safety failure: no adversary was needed to make the bot less constrained. The customer's requests to swear and disregard its rules were a mild jailbreak, a user trying to override the operator's instructions, which is the security side.

**Mechanism:** the operator's rules (no profanity, no disparaging the company) existed as instructions to the model. Instructions are requests, not enforcement ([4.1](/training/module/safety-engineering/content-policy-as-specification)). When the update changed the model's behavior, nothing outside the model noticed.

**Missing controls:**

- No output check for profanity or brand disparagement, which a rule or a small classifier can catch ([4.2](/training/module/safety-engineering/detection-and-classification)).
- No regression evaluation of tone and policy before the update reached customers ([7.3](/training/module/operations-and-governance/change-management)).
- No working escalation to a human, which is what the customer wanted in the first place ([4.4](/training/module/safety-engineering/over-refusal-and-refusal-design)).
- No scope restriction keeping a parcel-tracking bot to parcel tracking.

## Controls that would have helped

- Write tone and brand rules into the content policy as categories with detectors and actions, not only as prompt text ([4.1](/training/module/safety-engineering/content-policy-as-specification)).
- Run deterministic profanity rules and an output classifier for disparagement before text reaches the user ([4.2](/training/module/safety-engineering/detection-and-classification)).
- Gate every model, prompt, or configuration update on a regression suite that includes off-scope and jailbreak-style requests ([7.3](/training/module/operations-and-governance/change-management)).
- Offer a visible route to a human when the bot cannot help ([4.4](/training/module/safety-engineering/over-refusal-and-refusal-design)).

## Lessons

- A rule that exists only in the system prompt is not enforced. The bot stated the rule and then broke it.
- Low-severity failures still cost reputation and spread quickly. Brand and tone checks are cheap.
- Frustrated users experiment. A bot that traps customers without a human option invites them to see what else it will do.
