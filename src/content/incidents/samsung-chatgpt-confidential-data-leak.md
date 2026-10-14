---
title: "Samsung Engineers Paste Confidential Code and Meeting Notes into ChatGPT"
slug: samsung-chatgpt-confidential-data-leak
date: "2023-04"
category: [security]
sections: ["2.2", "2.3", "3.5", "7.3"]
summary: "Within weeks of Samsung's semiconductor division allowing ChatGPT, employees pasted proprietary source code and a meeting transcript into the public service, which led Samsung to cap prompt sizes and then restrict generative AI tools."
sources:
  - title: "The Register: Samsung reportedly leaked its own secrets through ChatGPT (Apr 6, 2023)"
    url: "https://www.theregister.com/2023/04/06/samsung_reportedly_leaked_its_own/"
  - title: "CSO Online: Samsung bans staff AI use over data leak concerns (May 2, 2023)"
    url: "https://www.csoonline.com/article/3695170/samsung-bans-staff-ai-use-over-data-leak-concerns.html"
---

## What happened

Samsung's semiconductor business lifted an internal restriction on ChatGPT on March 11, 2023. According to Korean media reports (citing Economist Korea) summarized by The Register on April 6, 2023, three incidents followed in less than three weeks:

1. An engineer pasted faulty source code from a semiconductor facility database program and asked ChatGPT to fix it.
2. Another engineer pasted program code used to identify defective equipment.
3. A third employee pasted a recorded meeting, converted to text, so ChatGPT could produce minutes.

The reported material included equipment measurement and yield data. Samsung reportedly took "emergency measures", including limiting each prompt to 1,024 bytes, and warned that access could be blocked if it happened again. On May 2, 2023, Bloomberg reported, and Samsung confirmed, a memo restricting generative AI tools on company-owned devices and internal networks. The memo also warned employees not to upload company information from personal devices, with disciplinary action up to termination for violations.

At the time, ChatGPT consumer conversations could be reviewed and used to improve OpenAI's models unless the user opted out. API traffic was opt-in for training. Data submitted through the consumer service was therefore stored outside Samsung's control and could be retained.

## Failure analysis

**Category.** Security impact (loss of confidentiality of trade secrets), with no adversary and no model malfunction. The mechanism was a principal with legitimate access to data moving it across a trust boundary to a third party whose handling nobody had assessed. That gap is why it was missed: threat models that list only attackers and model failures do not include well-meaning employees taking data out.

**Mechanism.** In the terms of section [2.2](/training/module/risk-and-threat-modeling/principals-authority-trust-boundaries), the model provider is a principal, and the context sent to it crosses boundary B6. No one had decided what data may cross that boundary, under which contract terms, or how to enforce that decision. Lifting the restriction opened the boundary without a control on it.

**Missing controls.**
- No approved enterprise channel with contractual retention and no-training terms, so employees used the consumer service.
- No data loss prevention at the network edge for AI service destinations, and no allowlist of approved AI endpoints.
- No data classification guidance telling engineers that source code and meeting content may not be sent to external services.
- The 1,024-byte cap that followed limits how much leaks per prompt. It is a blast-radius control, not a boundary.

## Controls that would have helped

- Enumerate the model provider as a principal and draw the boundary to it in every threat model ([2.2 Principals, Authority, and Trust Boundaries](/training/module/risk-and-threat-modeling/principals-authority-trust-boundaries)).
- Provide a sanctioned route: an enterprise agreement or self-hosted model with defined retention and no training on inputs, so the safe path is also the easy one ([3.5 Data Protection and Isolation](/training/module/security-engineering/data-protection-and-isolation)).
- Enforce at the network edge: allowlist approved AI endpoints and run DLP on traffic to them. Treat "lift the ban" as a change that requires a threat model review ([7.3 Change Management](/training/module/operations-and-governance/change-management)).
- Include "sensitive data sent to the provider" as a data-leakage entry in the [failure mode catalog](/training/module/risk-and-threat-modeling/failure-mode-catalog) review.

## Lessons

- Not every confidentiality loss needs an attacker. A common form of AI data leak is an authorized person pasting data into the wrong service.
- A policy change that enables a tool is a system change. It needs the same boundary analysis as a code change.
- Bans push usage to personal devices, where it is harder to see. Sanctioned, controlled access to an approved service usually reduces risk more than prohibition.
