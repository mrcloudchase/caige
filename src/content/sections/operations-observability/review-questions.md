---
title: "Review Questions"
slug: "review-questions"
module: "operations-observability"
sectionOrder: 6
description: "Section 6 of the operations observability module."
---

### Question 1 (Multiple Choice)

A guardrail system's block rate suddenly drops from 3% to 0.1% after a model update. No changes were made to the guardrail configuration. What is the MOST likely explanation?

A. Users stopped sending harmful requests
B. The model update changed the format of outputs, breaking the guardrail's parsing logic
C. The guardrail system is performing better due to the model's improved safety
D. The monitoring system is reporting incorrect data

**Answer: B**
A sudden, dramatic drop in block rate after a model update — with no guardrail changes — strongly suggests the model's output format changed in a way that the guardrail no longer processes correctly. This is a common form of guardrail drift. The guardrail may be silently failing to evaluate content because it can't parse the new format. This requires immediate investigation.

---

### Question 2 (Multiple Select)

Which THREE of the following should be included in a guardrail log entry? (Choose 3)

A. The raw, unredacted user input
B. A hash of the user input
C. The guardrail's decision (allow, block, modify)
D. The user's full name and email address
E. The processing latency in milliseconds
F. The user's credit card number if present in the input

**Answer: B, C, E**
Guardrail logs should include input hashes (B) for correlation without storing raw content, the guardrail decision (C) for audit and analysis, and processing latency (E) for performance monitoring. Raw user input (A), user PII like names/emails (D), and especially credit card numbers (F) should never be stored in guardrail logs. Use privacy-preserving techniques instead.

---

### Question 3 (Scenario-Based)

A fintech company's AI chatbot has been live for 6 months. The guardrail team notices that the false negative rate for prompt injection detection has increased from 2% to 8% over the past 3 months, while the guardrail configuration has not changed.

What is the MOST likely cause and the BEST remediation?

A. The guardrail system has a memory leak causing degraded performance. Restart the service.
B. New prompt injection techniques have emerged that the current detection methods don't cover. Update the detection models and test suites with current attack patterns.
C. Users have become more skilled at using the chatbot legitimately. Reduce guardrail sensitivity.
D. The false negative rate increase is within normal statistical variation. No action needed.

**Answer: B**
A steady increase in false negatives over 3 months, with no configuration changes, strongly suggests guardrail drift due to evolving attack techniques. The prompt injection landscape evolves continuously, and detection methods must be updated to match. The remediation is to research current attack patterns, update detection models, and expand test suites. An 8% false negative rate (1 in 12 attacks succeeding) is a significant security gap.

---

### Question 4 (Multiple Choice)

What is the PRIMARY advantage of shadow deployment for guardrail updates?

A. It is the fastest deployment method
B. It tests the new guardrail against real production traffic without affecting users
C. It eliminates the need for rollback procedures
D. It automatically tunes guardrail thresholds

**Answer: B**
Shadow deployment runs the new guardrail alongside the current one, logging what the new version would have done without actually enforcing its decisions. This tests against real traffic patterns and attack vectors without any risk to users. It is not the fastest method (A), doesn't eliminate rollback needs (C), and doesn't auto-tune thresholds (D).

---

### Question 5 (Multiple Select)

A P1/SEV-1 guardrail incident has been detected: PII from multiple users is appearing in AI-generated responses. Which THREE actions should be taken FIRST? (Choose 3)

A. Begin writing a detailed root cause analysis document
B. Contain the incident by increasing guardrail sensitivity or disabling the affected feature
C. Notify the incident commander and assemble the response team
D. Schedule a post-incident review for next week
E. Assess the scope of data exposure (how many users, what type of PII)
F. Update the guardrail's documentation

**Answer: B, C, E**
During a SEV-1 incident, immediate priorities are containment (B), assembling the response team (C), and assessing scope (E). Root cause analysis (A), scheduling the post-incident review (D), and updating documentation (F) come later. In a data exposure incident, every minute of delay means more users potentially affected.

---

### Question 6 (Multiple Choice)

An organization runs guardrails on 100% of AI requests. The guardrail system costs $50,000/month in compute. Leadership asks for cost reduction without reducing safety. Which approach is MOST appropriate?

A. Reduce guardrail coverage to 50% of requests randomly
B. Implement layered evaluation — run cheap rule-based checks first and only invoke expensive ML classifiers when needed
C. Remove the least-triggered guardrail to save resources
D. Lower all classification thresholds to reduce processing time

**Answer: B**
Layered evaluation is the standard cost optimization approach. Most requests are benign and can be cleared by fast, cheap checks (regex, keyword matching, schema validation). Expensive checks (ML classifiers, LLM-as-judge) are only invoked when cheap checks are inconclusive. This maintains 100% coverage while dramatically reducing average cost per evaluation. Random sampling (A) creates gaps. Removing guardrails by trigger frequency (C) may remove important defenses against rare but high-impact threats. Lowering thresholds (D) increases false negatives.

---

### Question 7 (Scenario-Based)

A guardrail team discovers the following situation during a quarterly audit:
- There are 3 separate keyword blocklists maintained by different team members
- Two of the blocklists overlap by 60%
- One blocklist hasn't been updated in 14 months
- There is no documentation for why specific words are on any blocklist
- Each blocklist adds 15ms of latency

What is the BEST course of action?

A. Keep all three blocklists since more checking means more safety
B. Consolidate into a single, documented blocklist, remove outdated entries, and verify the merged list against current threat patterns
C. Delete all keyword blocklists and rely entirely on ML-based classification
D. Assign one person to own all three lists but keep them separate

**Answer: B**
This is classic guardrail debt. The correct approach is to consolidate overlapping lists, remove outdated entries, document the rationale for each entry, and verify against current threats. This reduces latency (one check instead of three), eliminates maintenance confusion, and ensures the blocklist is current. Keeping all three (A) wastes resources and adds unnecessary latency. Removing keyword-based checks entirely (C) eliminates a fast, cheap defense layer. Assigning ownership without consolidation (D) doesn't fix the underlying problems.

---

### Question 8 (Multiple Choice)

After deploying a guardrail update via canary deployment to 5% of traffic, you observe that the canary's block rate is 3x higher than the main deployment. What should you do?

A. Immediately roll back the canary — the increased block rate indicates a misconfiguration
B. Investigate the increase before making a decision — determine whether the canary is catching previously-missed threats or generating false positives
C. Expand the canary to 100% since a higher block rate means better security
D. Wait 24 hours to see if the block rate normalizes

**Answer: B**
A higher block rate is not inherently good or bad. The canary might be catching threats the previous version missed (which is good), or it might be generating false positives (which is bad). You need to examine the specific blocks to determine which case applies before deciding to roll back or proceed. Automatic rollback (A) might discard a genuine improvement. Expanding immediately (C) is reckless without understanding the cause. Waiting passively (D) delays understanding the impact.
