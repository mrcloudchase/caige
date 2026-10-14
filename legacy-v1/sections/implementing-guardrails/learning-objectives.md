---
title: "Learning Objectives"
slug: "learning-objectives"
module: "implementing-guardrails"
sectionOrder: 0
description: "What you will be able to do after completing the Implementing Guardrails module."
---

## Domain 4: Implementing Guardrails — Learning Objectives

After completing this module, you will be able to:

- **Select the right detection technique for a given guardrail requirement** — choosing between rule-based, ML-based, LLM-as-judge, and embedding-based approaches by evaluating their tradeoffs in latency, cost, accuracy, and maintainability.

- **Build layered detection pipelines** that combine cheap, fast rules with expensive, accurate classifiers — routing inputs through progressively more sophisticated checks so that only ambiguous cases reach the most costly layer.

- **Evaluate detection accuracy using precision, recall, and F1** and tune classification thresholds to balance false positives (blocking legitimate users) against false negatives (missing harmful content) for a given risk profile.

- **Enforce structured output from AI models** using JSON schema validation, Pydantic models, and constrained decoding — and implement retry logic that recovers from malformed outputs without degrading user experience.

- **Compare constrained generation with post-hoc validation** and choose the right enforcement strategy based on whether you control the model, what latency budget you have, and how critical correctness is.

- **Implement PII detection pipelines** using regex patterns for structured PII (SSNs, emails, phone numbers), NER models for unstructured PII (names, addresses), and purpose-built PII detectors — applying the right sensitivity level for the use case.

- **Apply redaction, masking, and tokenization strategies** to sensitive data, understanding when each approach is appropriate and how to design data flows that minimize PII exposure to AI models and logging systems.

- **Evaluate guardrail frameworks and tooling** by category — content moderation APIs, guardrail frameworks, observability platforms, and prompt security tools — and make build-vs-buy-vs-open-source decisions based on requirements, risk, and engineering capacity.

- **Integrate guardrails at the SDK level, proxy level, or gateway level** and articulate the architectural tradeoffs of each approach for different deployment scenarios.

- **Write defensive system prompts** that establish clear behavioral boundaries, use few-shot examples to demonstrate refusal behavior, separate instructions from user content, and minimize injection surface area.

- **Structure prompts to reduce adversarial risk** using delimiter-based input isolation, sandwich defense patterns, and chain-of-thought compliance reasoning — and explain why each technique works at a mechanistic level.

- **Manage guardrail configurations as code** with proper version control, testing pipelines, and deployment strategies that treat guardrail rules with the same rigor as application code.

---
