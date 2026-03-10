---
title: "Evaluation Metrics"
slug: "evaluation-metrics"
module: "testing-red-teaming"
sectionOrder: 3
description: "Section 3 of the testing red teaming module."
---

Metrics quantify guardrail effectiveness and support decision-making.

### 5.3.1 Classification Metrics Deep Dive

**Confusion matrix:**

|  | Predicted: Harmful | Predicted: Safe |
|--|-------------------|-----------------|
| **Actually Harmful** | True Positive (TP) | False Negative (FN) |
| **Actually Safe** | False Positive (FP) | True Negative (TN) |

**From this matrix:**

- **Precision** = TP / (TP + FP) — "When I flag something, how often am I right?"
- **Recall** = TP / (TP + FN) — "Of all harmful inputs, how many did I catch?"
- **F1** = 2 * P * R / (P + R) — Harmonic mean, balances both
- **False Positive Rate (FPR)** = FP / (FP + TN) — "What fraction of safe inputs do I incorrectly flag?"
- **False Negative Rate (FNR)** = FN / (FN + TP) — "What fraction of harmful inputs do I miss?"

**Worked example:**

A guardrail processes 10,000 requests. 200 are actually harmful.
- 180 harmful requests are correctly blocked (TP = 180)
- 20 harmful requests pass through (FN = 20)
- 300 benign requests are incorrectly blocked (FP = 300)
- 9,500 benign requests correctly pass through (TN = 9,500)

Calculations:
```
Precision = 180 / (180 + 300) = 180 / 480 = 0.375 (37.5%)
Recall    = 180 / (180 + 20)  = 180 / 200 = 0.90  (90%)
F1        = 2 * 0.375 * 0.90 / (0.375 + 0.90) = 0.529  (52.9%)
FPR       = 300 / (300 + 9500) = 300 / 9800 = 0.031 (3.1%)
FNR       = 20 / (20 + 180) = 20 / 200 = 0.10 (10%)
```

Interpretation: This guardrail catches 90% of harmful inputs (good recall), but when it flags something, it's only correct 37.5% of the time (poor precision). 3.1% of legitimate users are incorrectly blocked. 10% of actual attacks get through.

### 5.3.2 Setting Metric Targets

Metric targets depend on the use case risk level:

| Use Case | Recall Target | Precision Target | Rationale |
|----------|--------------|-----------------|-----------|
| Children's safety | > 99% | > 70% | Missing harmful content is unacceptable; tolerate false positives |
| Medical AI | > 98% | > 80% | Errors can endanger health; moderate false positive tolerance |
| Customer support | > 90% | > 85% | Balance safety with customer experience |
| Internal tool | > 85% | > 90% | Lower risk, minimize friction for employees |
| Creative writing | > 80% | > 95% | High creativity needs; minimize blocking legitimate content |

### 5.3.3 Coverage Metrics

Coverage metrics answer the question: "What percentage of our risk surface is actually guarded?"

**Types of coverage metrics:**

| Metric | Definition | Example |
|--------|-----------|---------|
| Risk category coverage | % of identified risk categories with active guardrails | 8 of 10 OWASP Top 10 for LLMs addressed = 80% |
| Input channel coverage | % of input channels protected by guardrails | API and web chat have guardrails, but email integration does not = 67% |
| Output modality coverage | % of output types guarded | Text is filtered, but generated images are not checked = 50% |
| Attack pattern coverage | % of known attack patterns in the test suite | 150 of 200 published injection patterns covered = 75% |
| User segment coverage | % of user segments with appropriate guardrails | Enterprise and consumer tiers have guardrails, but API-only tier does not = 67% |

**Why coverage matters:**
- High precision and recall on tested scenarios are meaningless if you're not testing the right scenarios
- Coverage gaps represent unguarded attack surface
- Regulators may ask: "What percentage of the OWASP Top 10 for LLMs have you addressed?"
- Coverage metrics help prioritize where to invest guardrail development effort

**How to measure:**
- Maintain a risk registry of all identified threats and attack categories
- Map each guardrail to the risks it mitigates
- Track which risks have no guardrail coverage (coverage gaps)
- Review coverage quarterly and after every threat model update

### 5.3.4 Latency Metrics

Guardrails add latency. Track it:

**Per-component latency:**
```
Rule-based check:    p50 = 0.5ms,  p95 = 1ms,   p99 = 2ms
Classifier:          p50 = 25ms,   p95 = 45ms,   p99 = 80ms
LLM-as-judge:        p50 = 600ms,  p95 = 1200ms, p99 = 2500ms
PII detector:        p50 = 15ms,   p95 = 30ms,   p99 = 50ms
```

**Pipeline total:**
The total latency depends on which components run and whether they run in parallel or sequentially.

**Latency budgets:**
Allocate a latency budget for guardrails within the overall response time target:
```
Total target response time:     3000ms
Model inference:                2000ms
Guardrail budget:               800ms
Network/overhead:               200ms
```

If guardrails exceed their budget, you need to optimize (faster classifiers, parallel execution, or fewer layers for low-risk requests).

### 5.3.5 Cost Metrics

Track the cost of guardrail operations:

**Per-evaluation cost:**
- Rule-based: ~$0 (negligible compute)
- Classifier inference: $0.001-0.01 per evaluation (depending on hosting)
- LLM-as-judge: $0.01-0.10 per evaluation (depending on model and input size)

**Monthly cost example:**
```
1 million requests/month
- All go through rules: 1M * $0 = $0
- All go through classifier: 1M * $0.005 = $5,000
- 5% flagged go to LLM-as-judge: 50K * $0.05 = $2,500
Total guardrail cost: ~$7,500/month
```

### 5.3.6 Business Impact Metrics

Quantify how guardrails affect the user experience:

- **User complaint rate about blocks:** Track support tickets mentioning incorrect blocks
- **Session abandonment after guardrail block:** Do users leave after being blocked?
- **False positive review outcome:** When blocked users appeal, how often is the block overturned?
- **Net Promoter Score impact:** Does guardrail friction affect user satisfaction?

These metrics justify guardrail investments (safety value) and tuning decisions (reducing friction without reducing safety).

---
