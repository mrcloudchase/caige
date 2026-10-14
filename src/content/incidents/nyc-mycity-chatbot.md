---
title: "NYC MyCity chatbot advises businesses to break the law"
slug: nyc-mycity-chatbot
date: "2024-03-29"
category: [safety]
sections: ["4.3", "4.1", "4.5"]
summary: "New York City's AI chatbot for business owners gave answers that contradicted city, state, and federal law, including on housing vouchers, tips, and cash acceptance, and answered the same question inconsistently."
sources:
  - title: "The Markup (2024), NYC's AI Chatbot Tells Businesses to Break the Law"
    url: "https://themarkup.org/news/2024/03/29/nycs-ai-chatbot-tells-businesses-to-break-the-law"
  - title: "The Markup (2026), Mamdani to Kill the NYC AI Chatbot We Caught Telling Businesses to Break the Law"
    url: "https://themarkup.org/artificial-intelligence/2026/01/30/mamdani-to-kill-the-nyc-ai-chatbot-we-caught-telling-businesses-to-break-the-law"
---

## What happened

In October 2023 New York City launched the MyCity chatbot, built on Microsoft's Azure AI services, to answer questions from business owners about operating in the city. On March 29, 2024, *The Markup* published the results of testing it. The bot told users that landlords did not have to accept tenants with housing vouchers, although source-of-income discrimination is illegal in New York City apart from a narrow exception. It said employers could take a cut of workers' tips, that there were no restrictions on residential rent, that businesses could go cash-free despite a 2020 city law requiring them to accept cash, and that there were no rules on notifying staff of schedule changes. Answers were also inconsistent: one reporter was told landlords must accept vouchers, while ten other staff members asking the same question were told they need not. The page carried a notice that the bot "may occasionally produce incorrect, harmful or biased content" and suggested checking the links it provided, but it often answered without links ([The Markup, 2024](https://themarkup.org/news/2024/03/29/nycs-ai-chatbot-tells-businesses-to-break-the-law)).

The city described the bot as a pilot that would improve. Administrators later added a disclaimer telling users not to treat responses as legal or professional advice and appeared to narrow the questions it would answer. In January 2026 the new mayor, Zohran Mamdani, called the bot "functionally unusable," and the city took it down in early February 2026 ([The Markup, 2026](https://themarkup.org/artificial-intelligence/2026/01/30/mamdani-to-kill-the-nyc-ai-chatbot-we-caught-telling-businesses-to-break-the-law)).

## Failure analysis

**Category:** safety. The testers were ordinary users asking ordinary questions.

**Mechanism:** the bot generated confident statements of law that the government's own sources did not support. Because outputs vary between runs, the same question received contradictory answers ([4.3](/training/module/safety-engineering/groundedness-and-hallucination)).

**Missing controls:**

- No per-claim support check against the authoritative sources the city held.
- No requirement that legal statements carry verifiable citations.
- No abstention when sources did not clearly answer.
- A disclaimer used in place of controls. Users acting on a government website's answer have little reason to doubt it.
- No policy tier treating legal-compliance answers as high-stakes ([4.1](/training/module/safety-engineering/content-policy-as-specification), [4.5](/training/module/safety-engineering/sycophancy-and-vulnerable-users)).

## Controls that would have helped

- Answer compliance questions from retrieved, authoritative regulatory text, show that text with a link, and abstain when it does not clearly apply ([4.3](/training/module/safety-engineering/groundedness-and-hallucination), patterns 1 and 4).
- Verify citations deterministically and check each claim against them ([4.3](/training/module/safety-engineering/groundedness-and-hallucination), patterns 2 and 3).
- Before launch, run an evaluation set of known legal questions, sampled several times each to expose inconsistency, and treat any answer that contradicts the law as launch-blocking.

## Lessons

- A disclaimer does not make a wrong answer safe, especially on an official site.
- Consistency is testable. Asking the same question many times reveals a system that answers from probability rather than from sources.
- Legal and regulatory answers belong in the needs-care tier, with grounding and abstention, regardless of how routine the questions seem.
