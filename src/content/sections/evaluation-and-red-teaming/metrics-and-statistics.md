---
id: "6.2"
title: "Metrics and Statistics"
slug: metrics-and-statistics
module: evaluation-and-red-teaming
sectionOrder: 2
description: "The metrics that describe a guardrail, why base rates make precision collapse for rare attacks, how to define attack success rate, and how to attach confidence intervals, pick thresholds, and measure latency and cost correctly."
category: cross-cutting
controlLayers: [runtime-ml, deterministic]
knowledge:
  - "Precision, recall, F1, false positive rate (FPR), and false negative rate (FNR) are computed from the confusion matrix; user friction is measured by FPR and the over-refusal rate, not by precision."
  - "When attacks are rare, a classifier with high recall and low FPR can still have low precision, because false positives are drawn from a far larger benign population."
  - "Attack success rate (ASR) is successes divided by attempts over N trials per goal, with success judged on the system's response or action, reported with a confidence interval."
  - "A Wilson score interval gives a usable confidence interval for a rate, including when zero or few events are observed; sample size determines how narrow it can be."
  - "ROC curves suit threshold comparison when classes are balanced; precision-recall curves are more informative when positives are rare; thresholds are chosen against an explicit FPR budget or cost model."
  - "Latency is reported as percentiles computed correctly (p99 is the latency that 1 in 100 requests exceeds), and cost per evaluation must be multiplied out per stage and checked."
skills:
  - "Compute precision, recall, F1, FPR, and FNR from labeled results and explain what each means for users and attackers."
  - "Work a base-rate example showing expected precision at a realistic production attack rate."
  - "Implement an ASR calculation over multiple trials with a Wilson confidence interval."
  - "Select a classifier threshold from a score distribution using an FPR budget and justify it with a PR curve."
  - "Estimate the daily and monthly cost of a layered detection pipeline and verify the arithmetic."
sources:
  - title: "Binomial proportion confidence interval (Wilson score interval, rule of three)"
    url: "https://en.wikipedia.org/wiki/Binomial_proportion_confidence_interval"
  - title: "Base rate fallacy"
    url: "https://en.wikipedia.org/wiki/Base_rate_fallacy"
  - title: "Saito and Rehmsmeier (2015), The Precision-Recall Plot Is More Informative than the ROC Plot When Evaluating Binary Classifiers on Imbalanced Datasets, PLOS ONE"
    url: "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0118432"
  - title: "Receiver operating characteristic"
    url: "https://en.wikipedia.org/wiki/Receiver_operating_characteristic"
  - title: "Miller (2024), Adding Error Bars to Evals: A Statistical Approach to Language Model Evaluations"
    url: "https://arxiv.org/abs/2411.00640"
  - title: "Python documentation: statistics.quantiles"
    url: "https://docs.python.org/3/library/statistics.html"
  - title: "Mazeika et al. (2024), HarmBench: A Standardized Evaluation Framework for Automated Red Teaming and Robust Refusal"
    url: "https://arxiv.org/abs/2402.04249"
lastReviewed: "2026-10-14"
---

# 6.2 Metrics and Statistics

## The problem

A vendor's prompt-injection detector advertises 95% recall and a 1% false positive rate. Your assistant handles one million requests a day, and you estimate that about one request in a thousand is an injection attempt. You deploy it in blocking mode. On day one the support queue fills with legitimate users who were blocked, and the security team reviewing flagged requests finds that fewer than one in ten is an attack.

Nobody lied. The vendor's numbers were measured on a balanced test set. At your base rate, those same numbers produce roughly ten false alarms for every real attack. This section gives you the arithmetic to see that before deployment, the definitions to measure attack success honestly, and the statistics to say how sure you are.

## Why it happens

### The confusion matrix

Every binary guardrail decision on a labeled item lands in one of four cells.

![Confusion matrix: rows are the guardrail decision (flagged or passed), columns are the actual class (harmful or benign). Flagged harmful is a true positive, flagged benign is a false positive (user friction), passed harmful is a false negative (safety gap), passed benign is a true negative. Precision is TP/(TP+FP), recall is TP/(TP+FN), and lowering the threshold produces more flags, raising recall and lowering precision.](/svg/confusion-matrix.svg)

From the four counts:

| Metric | Formula | Question it answers | Who feels it |
|---|---|---|---|
| Recall (true positive rate, detection rate) | TP / (TP + FN) | Of the harmful items, what fraction did we flag? | Security and safety owners |
| False negative rate (FNR) | FN / (TP + FN) = 1 - recall | Of the harmful items, what fraction got through? | Attackers' success at the guard stage |
| False positive rate (FPR) | FP / (FP + TN) | Of the benign items, what fraction did we wrongly flag? | **Users: this is the friction metric** |
| Precision | TP / (TP + FP) | Of the flags, what fraction were real? | Reviewers and on-call responders: alert quality |
| F1 | 2 * P * R / (P + R) | One number balancing precision and recall | Model comparison at a fixed base rate only |

Two common confusions:

- **Friction is FPR, not precision.** FPR tells you what fraction of legitimate requests are blocked. Precision tells you what fraction of blocks were deserved; it is the metric reviewers care about when they triage flags. A classifier can have terrible precision and still block only 1% of users.
- **Over-refusal is the model-side cousin of FPR.** The over-refusal rate is the fraction of benign (or borderline-but-allowed) requests where the system refuses or deflects, whatever component caused it: an input classifier, the model's own training, or an output filter. Measure it end to end on the benign and borderline sets from [6.1](/training/module/evaluation-and-red-teaming/designing-evaluations), and see [4.4](/training/module/safety-engineering/over-refusal-and-refusal-design) for refusal design.

F1 depends on the base rate (because precision does), so an F1 measured on a balanced set does not predict F1 in production.

### Base rates: why precision collapses for rare events

FPR and recall are rates *within* a class, so they do not depend on how common the class is. Precision mixes the two classes, so it does. Work the opening example:

```text
Traffic per day:           1,000,000 requests
Attack prevalence:         0.1%  ->  1,000 attacks, 999,000 benign
Recall:                    95%   ->  TP = 950,  FN = 50
FPR:                       1%    ->  FP = 9,990 (1% of 999,000), TN = 989,010

Precision = 950 / (950 + 9,990) = 950 / 10,940 = 8.7%
Check: 950 + 50 + 9,990 + 989,010 = 1,000,000
```

About 91% of flags are false alarms, and 9,990 legitimate users a day are blocked. At a balanced 50/50 test set, the same detector would show precision of 0.95 / (0.95 + 0.01) = 99%. This is the base rate fallacy, and it is the main reason a detector that "tests great" can be unusable in blocking mode.

What to do with this:

- Estimate prevalence per traffic slice before choosing a deployment mode. A detector that is unusable as a blocker on all traffic may be fine as a blocker on a high-risk slice (for example, tool results from external web pages) where prevalence is higher.
- Use high-recall, low-precision detectors to route to a second stage or to review, not to block outright ([4.2](/training/module/safety-engineering/detection-and-classification)).
- Report FPR in absolute numbers too: "1% FPR" is easy to accept; "9,990 blocked customers a day" is not.

### Attack success rate needs a real definition

Many red-team reports quote an ASR without saying what was counted. Use this definition:

```text
ASR = successful attempts / total attempts

attempt  = one run of one attack against one goal, end to end through the
           deployed system (guards + model + tools), with recorded settings
success  = the response or action meets the goal, as judged by a rubric
           (harmful content actually produced, forbidden tool call actually
           executed), not "the input passed the guardrail"
N trials = each (goal, attack) pair is run N times, because outputs are
           sampled and a 1-in-5 success is still a vulnerability
```

Three things follow from it.

1. **Passing a guard is not success.** An input that passes the classifier and then gets a refusal from the model is a failed attack. Counting it as a bypass inflates ASR and points engineers at the wrong layer. Record the guard decision separately as a diagnostic.
2. **One trial per variant is not enough.** With sampling, the same prompt can succeed on one run and fail on the next. Run each (goal, attack) several times and report both the per-attempt ASR and the fraction of goals broken at least once in N tries; the second is closer to what a persistent attacker experiences.
3. **The judge is part of the measurement.** "Harmful" is decided by a rubric applied by humans or a validated judge ([6.3](/training/module/evaluation-and-red-teaming/validating-judges-and-classifiers)). HarmBench (Mazeika et al., 2024) was built partly because jailbreak papers had used inconsistent success criteria, which made their ASRs incomparable.

ASR is a security metric. It describes a set of attacks you chose, at a strength you chose, so it is a lower bound on what a stronger or adaptive attacker achieves ([6.4](/training/module/evaluation-and-red-teaming/red-team-engagements)).

### Confidence intervals and sample size

Every rate in this section is an estimate from a sample. Report it with an interval. For a proportion, the Wilson score interval behaves well at small counts and near 0 or 1, where the textbook normal approximation gives nonsense such as negative lower bounds or a zero-width interval when no events are observed.

| Observed | Point estimate | 95% Wilson interval |
|---|---|---|
| 0 successes in 50 attempts | 0% | 0% to 7.1% |
| 3 in 50 | 6% | 2.1% to 16.2% |
| 12 in 200 | 6% | 3.5% to 10.2% |
| 0 in 300 | 0% | 0% to 1.3% |
| 30 in 300 | 10% | 7.1% to 13.9% |

Read the first row carefully: zero successes in 50 attempts is consistent with a true ASR of 7%. The "rule of three" gives a quick check: with zero events in n trials, the 95% upper bound is roughly 3/n.

To plan sample size for estimating a rate p to within a margin E at 95% confidence, use n ≈ 1.96² × p(1 − p) / E². Estimating an over-refusal rate near 10% to within ±2 percentage points needs about 1.96² × 0.09 / 0.0004 ≈ 865 benign items. Estimating a 1% FPR to within ±0.5 points needs about 1,520.

Two refinements matter in practice:

- **Correlated items.** Trials of the same goal, or turns from the same conversation, are not independent. Compute intervals by resampling clusters (goals, conversations) in a bootstrap, or use clustered standard errors (Miller, 2024). Ignoring clustering produces intervals that are too narrow.
- **Comparing two systems.** Run both on the same items and analyze the paired differences. Overlapping individual intervals do not by themselves prove there is no difference, and non-overlapping ones from tiny samples prove little.

### ROC and PR curves, and threshold selection

A classifier outputs a score; the threshold turns it into a decision. Sweeping the threshold traces two curves:

- **ROC curve:** recall (TPR) against FPR. Its area (AUROC) does not depend on base rate, which makes it good for comparing classifiers but misleading about deployed precision.
- **Precision-recall curve:** precision against recall. It changes with base rate, which is exactly why it is more informative when positives are rare (Saito and Rehmsmeier, 2015). Plot it at your production prevalence, or reweight a balanced set to that prevalence.

Choose the threshold by stating the constraint first, then optimizing the other side:

1. **FPR budget.** "No more than 0.5% of benign requests may be blocked." Pick the lowest threshold whose FPR on the held-out benign set stays within budget, then report the recall you get there.
2. **Recall floor.** For a severe harm category, "catch at least 98% of the adversarial set", then report and accept the FPR, usually by routing flags to review rather than blocking.
3. **Cost-weighted.** Assign a cost to each FP and FN and minimize expected cost at production prevalence.

Choose on a calibration split and report on a separate held-out split; a threshold tuned on the test set overstates performance.

### Latency percentiles

Report latency as percentiles of the distribution, not the mean. **p99 is the latency that 1 request in 100 exceeds**; at one million requests a day, 10,000 requests are slower than p99. Guardrail stages that call models have long tails (cold starts, retries, provider queueing), so p99 can be several times p50. Percentiles do not add: the p95 of a pipeline is not the sum of each stage's p95. Measure end to end. Performance testing mechanics (warm-up, timers, correct percentile computation) are in [6.6](/training/module/evaluation-and-red-teaming/regression-and-ci).

### Cost per evaluation

Multiply out every stage and check the totals. Prices below are illustrative placeholders; substitute your own.

| Stage | Runs on | Calls per day (1M requests) | Unit cost | Per day | Per 30 days |
|---|---|---|---|---|---|
| Rules and normalization | All requests | 1,000,000 | effectively $0 | ~$0 | ~$0 |
| Small classifier | All requests | 1,000,000 | $0.000001 | $1 | $30 |
| LLM judge | Ambiguous band only (3%) | 30,000 | $0.002 | $60 | $1,800 |
| **Total** | | | | **$61** | **$1,830** |
| LLM judge on every request (for comparison) | All requests | 1,000,000 | $0.002 | $2,000 | $60,000 |

The judge belongs on ambiguous or low-confidence inputs (scores near the threshold, or classifier disagreement), not on "everything that passed the cheaper stages", which is nearly all traffic. If you reduce cost further by judging only a random sample of requests, the judge stops enforcing anything: unsampled requests are never judged, so the judge becomes an audit and monitoring tool, not a guardrail. Say so in the design.

## Control patterns

Metrics are not controls, but how you compute and report them controls decision quality:

1. **Fix definitions before measuring:** what counts as a positive, a success, an attempt, and an over-refusal, and which judge applies the rubric.
2. **Report rates with counts and intervals:** "ASR 6% (12/200, 95% CI 3.5% to 10.2%)", not "ASR 6%".
3. **Report precision and F1 at production base rate**, with the prevalence stated.
4. **Keep safety and security numbers separate.** Do not average over-refusal and ASR into one score.
5. **Choose thresholds on one split and report on another.**

## Implementation

### Metrics from counts, safe on empty inputs

```python
from dataclasses import dataclass
from math import sqrt


def ratio(num: int, den: int) -> float | None:
    """None when undefined (no items in the denominator) instead of dividing by zero."""
    return num / den if den else None


@dataclass(frozen=True)
class Confusion:
    tp: int
    fp: int
    tn: int
    fn: int

    def report(self) -> dict[str, float | None]:
        precision = ratio(self.tp, self.tp + self.fp)
        recall = ratio(self.tp, self.tp + self.fn)
        f1 = None
        if precision is not None and recall is not None and (precision + recall) > 0:
            f1 = 2 * precision * recall / (precision + recall)
        return {
            "precision": precision,
            "recall": recall,
            "f1": f1,
            "fpr": ratio(self.fp, self.fp + self.tn),
            "fnr": ratio(self.fn, self.fn + self.tp),
        }


def wilson_interval(successes: int, n: int, z: float = 1.96) -> tuple[float, float]:
    """95% Wilson score interval for a binomial proportion."""
    if n <= 0:
        raise ValueError("n must be positive")
    if not 0 <= successes <= n:
        raise ValueError("successes must be between 0 and n")
    p = successes / n
    denom = 1 + z * z / n
    centre = (p + z * z / (2 * n)) / denom
    half = z * sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / denom
    return max(0.0, centre - half), min(1.0, centre + half)


def expected_precision(recall: float, fpr: float, prevalence: float) -> float:
    """Precision implied by recall and FPR at a given base rate."""
    tp = recall * prevalence
    fp = fpr * (1 - prevalence)
    return tp / (tp + fp) if (tp + fp) > 0 else 0.0
```

`expected_precision(0.95, 0.01, 0.001)` returns about 0.087, matching the worked example.

### ASR over multiple trials

```python
from collections import defaultdict


def attack_success_rate(attempts: list[dict]) -> dict:
    """Each attempt: {"goal_id", "attack_id", "trial", "success": bool}, where success
    was judged on the response or action against the rubric."""
    if not attempts:
        raise ValueError("no attempts recorded")
    successes = sum(a["success"] for a in attempts)
    low, high = wilson_interval(successes, len(attempts))

    broken_by_goal: dict[str, bool] = defaultdict(bool)
    for a in attempts:
        broken_by_goal[a["goal_id"]] |= a["success"]
    goals_broken = sum(broken_by_goal.values())

    return {
        "attempts": len(attempts),
        "successes": successes,
        "asr": successes / len(attempts),
        "asr_ci95": (low, high),            # assumes independence; bootstrap by goal for clustered data
        "goals": len(broken_by_goal),
        "goals_broken_at_least_once": goals_broken,
    }
```

### Threshold selection under an FPR budget

```python
def threshold_for_fpr_budget(benign_scores: list[float], harmful_scores: list[float],
                             max_fpr: float) -> tuple[float, float, float]:
    """Return (threshold, fpr, recall) for the lowest threshold whose FPR on the
    calibration benign set stays within max_fpr. Flag when score >= threshold."""
    if not benign_scores or not harmful_scores:
        raise ValueError("need both benign and harmful calibration scores")
    best = None
    for t in sorted(set(benign_scores) | set(harmful_scores)):
        fpr = sum(s >= t for s in benign_scores) / len(benign_scores)
        if fpr <= max_fpr:
            recall = sum(s >= t for s in harmful_scores) / len(harmful_scores)
            best = (t, fpr, recall)
            break   # thresholds ascend, so the first one within budget has the highest recall
    if best is None:
        # No observed score keeps FPR in budget: flag nothing, and say so.
        return float("inf"), 0.0, 0.0
    return best
```

Run this on a calibration split, then report FPR and recall at the chosen threshold on a separate held-out split, with Wilson intervals.

## Where it breaks

- **Labels bound every metric.** If the labels are noisy (low kappa in [6.1](/training/module/evaluation-and-red-teaming/designing-evaluations)), precision and recall inherit that noise.
- **Prevalence is itself an estimate.** Attack rates shift when an attack goes viral or when your product is targeted. Recompute expected precision under a range of prevalences, not one.
- **ASR depends on the attack set and the judge.** A low ASR against weak or stale attacks, or an ASR scored by a judge that misses partial compliance, overstates security. Name the attacks, the number of trials, and the judge in every report.
- **Wilson intervals assume independent trials.** Repeated trials on the same goal are correlated; bootstrap by goal or use clustered errors.
- **Thresholds drift.** A provider model update or a new traffic mix moves score distributions; a threshold chosen last quarter may now sit at a different FPR. Re-run calibration on every change ([7.3](/training/module/operations-and-governance/change-management)).
- **Cost models omit retries and long inputs.** Judge cost scales with tokens, and retries on timeouts can double calls in a bad hour. Budget for the tail, and enforce the budget outside the model ([5.4](/training/module/agent-containment-and-control/budgets-and-resource-limits)).

## Lab exercise

In [Lab 6](/labs/lab-6-red-team-and-measure), **Task 6.2**, you report precision, recall, false positive rate, and attack success rate (over at least five trials per case), each with a Wilson 95% interval, and show how precision changes at a realistic attack base rate.

## Check your understanding

<details>
<summary>1. A classifier has 99% recall and 2% FPR. Production prevalence of the harmful class is 0.5%. What precision should you expect, and what does that imply for deployment?</summary>

Per 1,000,000 requests: 5,000 harmful, 995,000 benign. TP = 4,950; FP = 19,900. Precision = 4,950 / 24,850 ≈ 19.9%. Four of five flags are false, and 19,900 benign requests are flagged, so blocking outright on this classifier alone imposes heavy friction. Route flags to a second stage or review, or deploy it only on a higher-prevalence slice.
</details>

<details>
<summary>2. A red-team run reports 0 successes in 40 attempts. The report concludes "ASR = 0%; the defense is robust." What should it say instead?</summary>

The 95% Wilson interval for 0/40 runs from 0% to about 8.8% (rule of three: about 3/40 = 7.5%), so the data are consistent with a meaningful ASR. And ASR describes only the attacks tried; an adaptive attacker may do better. Report "0/40 (95% CI 0% to 8.8%) against the named attacks and N trials".
</details>

<details>
<summary>3. An attack runner marks an attempt as a bypass whenever the input classifier allows it. What is wrong?</summary>

Success must be judged on the response or action. If the model then refuses, the attack failed; counting it as a bypass inflates ASR and misattributes the defense. Record the guard decision as a diagnostic field and judge success separately, over several trials.
</details>

<details>
<summary>4. To save money, a team runs the LLM judge on a random 5% of requests and keeps calling it a guardrail. Why is that misleading?</summary>

Ninety-five percent of requests are never judged, so the judge cannot block them. It has become an audit and monitoring signal. To keep enforcement at lower cost, run the judge on every request in the ambiguous score band instead of on a random sample.
</details>

<details>
<summary>5. Why prefer a PR curve over an ROC curve when choosing a threshold for a rare-attack detector?</summary>

ROC plots TPR against FPR, both within-class rates that ignore prevalence, so a curve that looks excellent can still yield poor precision at a 0.1% base rate. The PR curve shows precision directly and changes with prevalence, so it reveals the false-alarm burden you will actually face.
</details>
