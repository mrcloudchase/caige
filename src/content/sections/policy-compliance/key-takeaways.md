---
title: "Key Takeaways"
slug: "key-takeaways"
module: "policy-compliance"
moduleOrder: 4
sectionOrder: 5
description: "Section 5 of the policy compliance module."
---

1. Four major frameworks matter for guardrail engineers: NIST AI RMF (voluntary best practices), EU AI Act (legally binding in the EU), ISO 42001 (certifiable management standard), and OWASP Top 10 for LLMs (technical security risks).

2. The EU AI Act's risk-based classification (prohibited, high-risk, limited, minimal) determines what guardrails are legally required. High-risk systems face the strictest requirements.

3. Translating policies to guardrails requires decomposing policy statements into atomic requirements, classifying each as input/output/system-level, selecting detection approaches, and documenting the mapping.

4. Policies are often ambiguous. The guardrail engineer's role includes identifying ambiguities and working with stakeholders to resolve them.

5. Documentation serves auditors, engineering teams, and leadership — each needs different levels of detail.

6. Guardrails can introduce bias. Content classifiers may disproportionately flag content from certain groups. Testing across demographics is essential.

7. Transparency about guardrails must balance user trust with security. Disclose that guardrails exist and their general purpose. Do not disclose specific detection methods or thresholds.

8. Global deployments require locale-aware guardrails that account for cultural, linguistic, and legal differences.

---
