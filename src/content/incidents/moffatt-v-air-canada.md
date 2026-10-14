---
title: "Moffatt v. Air Canada: an airline is held liable for its chatbot's invented policy"
slug: moffatt-v-air-canada
date: "2024-02-14"
category: [safety]
sections: ["4.3", "4.1", "4.6"]
summary: "Air Canada's website chatbot told a grieving customer he could claim a bereavement fare after travel, contradicting the airline's policy page, and a British Columbia tribunal ordered the airline to pay the difference."
sources:
  - title: "McCarthy Tetrault (2024), Moffatt v. Air Canada: A Misrepresentation by an AI Chatbot"
    url: "https://www.mccarthy.ca/en/insights/blogs/techlex/moffatt-v-air-canada-misrepresentation-ai-chatbot"
  - title: "Manatt (2024), AI Gone Wild: Airline Has to Honor a Refund Policy Its Chatbot Fabricated"
    url: "https://manatt.com/insights/newsletters/advertising-law/ai-gone-wild-airline-has-to-honor-a-refund-policy"
  - title: "CTV News (2024), Air Canada's chatbot gave a B.C. man the wrong information. Now, the airline has to pay for the mistake"
    url: "https://www.ctvnews.ca/vancouver/article/air-canadas-chatbot-gave-a-bc-man-the-wrong-information-now-the-airline-has-to-pay-for-the-mistake/"
---

## What happened

After his grandmother died in November 2022, Jake Moffatt asked the chatbot on Air Canada's website about bereavement fares. The chatbot told him he could book at the regular price and apply for the reduced bereavement fare afterwards, within 90 days. A separate page on the same website, titled "Bereavement travel," said the opposite: the reduced fare could not be claimed retroactively. Moffatt booked, travelled, applied for the partial refund, and was refused.

He took the claim to British Columbia's Civil Resolution Tribunal. Air Canada argued that it could not be held liable for information provided by the chatbot, describing the chatbot in effect as a separate entity responsible for its own statements, and that Moffatt had not followed the proper process. In a decision issued on February 14, 2024 (*Moffatt v. Air Canada*, 2024 BCCRT 149), tribunal member Christopher Rivers rejected both arguments. The tribunal found that Air Canada owed its chatbot users a duty of care and "did not take reasonable care to ensure its chatbot was accurate," which amounted to negligent misrepresentation. It also questioned why customers should have to double-check information found in one part of the airline's website against another. Air Canada was ordered to pay CAD 650.88, the fare difference, plus interest and tribunal fees ([McCarthy Tetrault](https://www.mccarthy.ca/en/insights/blogs/techlex/moffatt-v-air-canada-misrepresentation-ai-chatbot); [Manatt](https://manatt.com/insights/newsletters/advertising-law/ai-gone-wild-airline-has-to-honor-a-refund-policy)).

## Failure analysis

**Category:** safety. No adversary was involved; the customer asked a reasonable question and received a fluent, wrong answer.

**Mechanism:** the chatbot generated a statement of the airline's own policy instead of presenting the policy text. Whether it paraphrased a retrieved page badly or produced the rule from general patterns about airline refunds, the result was a plausible policy that did not exist (see [4.3](/training/module/safety-engineering/groundedness-and-hallucination)).

**Missing controls:**

- No path that answered policy questions with the authoritative policy text and a link.
- No support check comparing the answer's claims with the policy page.
- No content policy treating "statements about our own terms and prices" as a category needing care ([4.1](/training/module/safety-engineering/content-policy-as-specification)).
- An organizational assumption that a disclaimer or a link elsewhere on the site shifted responsibility to the customer. The tribunal did not accept that.

## Controls that would have helped

- Retrieve and quote the canonical policy passage for fare, refund, and eligibility questions, with the model choosing which passage applies rather than restating it ([4.3](/training/module/safety-engineering/groundedness-and-hallucination), pattern 1).
- Require structured output with citations and verify them deterministically; check each claim against the cited passage ([4.3](/training/module/safety-engineering/groundedness-and-hallucination), patterns 2 and 3; [4.6](/training/module/safety-engineering/structured-output-enforcement)).
- Abstain and hand off to an agent when the policy text does not clearly answer the question.

## Lessons

- An operator answers for what its chatbot says to customers. "The bot said it, not us" did not work as a defence here.
- Questions about your own policies are high-stakes even when the amounts are small, because the answer can bind you.
- For facts you own, the safest generation is no generation: show the authoritative text.
