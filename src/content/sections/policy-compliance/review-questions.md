---
title: "Review Questions"
slug: "review-questions"
module: "policy-compliance"
sectionOrder: 6
description: "Section 6 of the policy compliance module."
---

### Question 1 (Multiple Choice)

Which of the four NIST AI RMF core functions is MOST directly associated with implementing technical guardrails?

A. GOVERN
B. MAP
C. MEASURE
D. MANAGE

**Answer: D**
MANAGE is the function that addresses implementing risk mitigations, which includes deploying and operating guardrails. GOVERN sets policies, MAP identifies risks, and MEASURE evaluates them, but MANAGE is where guardrails are actually implemented and operated.

---

### Question 2 (Multiple Select)

Under the EU AI Act, which THREE of the following are requirements for high-risk AI systems? (Choose 3)

A. Open-sourcing the model weights
B. Risk management systems
C. Human oversight provisions
D. Achieving 100% accuracy on all benchmarks
E. Technical documentation and transparency
F. Using only European-developed AI models

**Answer: B, C, E**
The EU AI Act requires high-risk systems to have risk management systems (B), human oversight provisions (C), and technical documentation with transparency (E). It does not require open-sourcing (A), perfect accuracy (D), or European-only models (F).

---

### Question 3 (Scenario-Based)

A retail company's AI policy states: "The AI shopping assistant must not provide health-related advice to customers." During testing, you find that the assistant sometimes answers questions like "Is this shampoo good for sensitive skin?" with responses that reference dermatological conditions. The product team argues this is normal product information, not health advice.

What is the BEST approach?

A. Implement a strict health topic classifier that blocks any response mentioning skin, health, or medical conditions
B. Ignore the product team's objection and implement the guardrail as strictly as possible
C. Work with the policy owner and product team to define specific examples of what constitutes "health advice" vs. product information, then build guardrails based on that agreed definition
D. Remove the guardrail entirely since the policy is too ambiguous to implement

**Answer: C**
Policy ambiguity must be resolved through stakeholder collaboration, not unilateral technical decisions. The guardrail engineer should bring the policy owner and product team together to define the boundary between health advice and product information with concrete examples. This produces a guardrail that matches the policy's actual intent.

---

### Question 4 (Multiple Choice)

A content filtering guardrail is flagging messages written in African American Vernacular English (AAVE) at twice the rate of messages written in Standard American English. The flagged messages are not actually toxic. What type of problem is this?

A. A false negative problem
B. A guardrail performance problem
C. A guardrail bias problem with disproportionate impact on a specific demographic group
D. An expected tradeoff of content filtering

**Answer: C**
This is a bias problem. The content classifier is disproportionately flagging content from a specific linguistic/demographic group. This is a known issue with toxicity classifiers trained primarily on Standard American English data. It requires retraining on more diverse data, adjusting thresholds, or using a different classification approach — not accepting it as normal.

---

### Question 5 (Multiple Select)

Which THREE of the following should be included in a guardrail audit trail? (Choose 3)

A. The raw, unredacted user input including any PII
B. Which guardrail was triggered and its decision (allow, block, modify)
C. The reason the guardrail triggered (classification result, rule match)
D. The full text of the system prompt
E. A timestamp of the guardrail evaluation
F. The user's physical location

**Answer: B, C, E**
Audit trails should capture which guardrail fired and its decision (B), the reason it triggered (C), and when it happened (E). Raw user input with PII (A) should not be stored — use hashed or redacted versions. The full system prompt (D) should be referenced by version, not embedded. The user's physical location (F) is not relevant to guardrail auditing and raises privacy concerns.

---

### Question 6 (Multiple Choice)

An organization is deploying an AI system in multiple countries. Which approach to content filtering guardrails is MOST appropriate?

A. Use the strictest filtering requirements from any single country and apply them globally
B. Disable content filtering in countries without explicit AI regulation
C. Build locale-aware guardrails that adjust to regional legal requirements and cultural context
D. Let the AI model's built-in safety training handle regional differences

**Answer: C**
Locale-aware guardrails are the correct approach. The strictest global standard (A) would create unnecessary friction in less-restricted markets. Disabling filtering where regulations don't exist (B) is irresponsible. Relying solely on model-level safety (D) doesn't account for legal or cultural requirements. Locale-aware guardrails respect both legal requirements and cultural context.

---

### Question 7 (Scenario-Based)

A guardrail engineer is writing a refusal message for when the AI system declines to answer a question about medications. Which response is MOST appropriate?

A. "Request blocked by pharmaceutical topic classifier (confidence: 0.92). Please try a different query."
B. "I'm not able to provide information about medications. For medication questions, please consult your doctor or pharmacist. I can help you find a pharmacy near you."
C. "No."
D. "Your query violated Policy 4.3.1 Section B, which prohibits AI-generated pharmaceutical advice per FDA guidelines."

**Answer: B**
This response is transparent (explains what can't be done), helpful (suggests an alternative), and doesn't reveal implementation details. Response A exposes guardrail internals (classifier name, confidence score). Response C provides no useful information. Response D references internal policy documents the user cannot access and provides no helpful alternative.

---

### Question 8 (Multiple Choice)

Which OWASP Top 10 for LLM Applications risk is MOST directly addressed by implementing structured output validation and content filtering on model responses?

A. Prompt Injection (LLM01)
B. Insecure Output Handling (LLM02)
C. Training Data Poisoning (LLM03)
D. Model Denial of Service (LLM04)

**Answer: B**
Insecure Output Handling (LLM02) is the risk of trusting model output without validation. Structured output validation and content filtering directly address this by ensuring model output is verified before being used or displayed. While these techniques can also help with prompt injection (A), the primary alignment is with LLM02.

---

### Question 9 (Multiple Select)

A policy states: "AI-generated content must be reviewed by a human before publication." Which TWO guardrail approaches BEST implement this requirement? (Choose 2)

A. A toxicity classifier on AI output
B. A mandatory review queue where AI-generated content is held for human approval before publishing
C. A system-level guardrail that sets a "draft" status on all AI-generated content, preventing automatic publication
D. Reducing the model's temperature to minimize errors
E. Adding a disclaimer that content was AI-generated

**Answer: B, C**
The policy requires human review before publication. A review queue (B) ensures content goes to a human for approval. Setting draft status (C) prevents automatic publication and enforces the review step. A toxicity classifier (A) is automated, not human review. Reducing temperature (D) reduces errors but doesn't ensure human review. A disclaimer (E) is transparency, not review.

---

### Question 10 (Scenario-Based)

An AI guardrail engineer discovers that their company's content filtering guardrail blocks the word "kill" in all contexts. This has resulted in the following legitimate requests being blocked:
- "How do I kill a process in Linux?"
- "What's the best way to kill weeds in my garden?"
- "Can you explain the phrase 'kill two birds with one stone'?"

What is the BEST approach to fixing this?

A. Remove the word "kill" from the blocklist entirely since it causes too many false positives
B. Replace the keyword blocklist with a context-aware content classifier that can distinguish between harmful and benign uses of the word
C. Add exceptions for "kill a process," "kill weeds," and "kill two birds" to the blocklist
D. Keep the blocklist as is — blocking these queries is an acceptable tradeoff for safety

**Answer: B**
A context-aware classifier is the right fix. It can distinguish between "kill a process" (benign) and genuinely harmful uses of the word. Removing the word entirely (A) creates a safety gap. Adding specific exceptions (C) creates a whack-a-mole pattern that will never cover all benign uses. Accepting the false positives (D) creates unnecessary user friction and demonstrates why keyword-only approaches are insufficient for content filtering.
