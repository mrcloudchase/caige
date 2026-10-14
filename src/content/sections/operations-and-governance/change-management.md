---
id: "7.3"
title: "Change Management"
slug: change-management
module: operations-and-governance
sectionOrder: 3
description: "Shipping guardrail and model changes safely: configuration as code, re-validation on every model, prompt, or policy change, monitor-only, shadow, and canary releases with relative thresholds and detection probes, rollback, and guardrail debt."
category: cross-cutting
controlLayers: [deterministic, runtime-ml, human]
knowledge:
  - "Why guardrail behavior is coupled to the model, the prompt, the policy, and the configuration, so a change to any of them can weaken protection"
  - "What guardrail configuration as code includes, and how review ownership and drift detection keep it the single source of truth"
  - "The events that require re-validation, and which evaluation suites each one triggers"
  - "Monitor-only, shadow, and canary releases: what each one can and cannot measure"
  - "Why canary criteria must use relative changes and include labeled attack probes"
  - "Guardrail debt: what it is, how it accumulates, and how to track it"
skills:
  - "Structure guardrail configuration as versioned, reviewed code with a deployable rollback target"
  - "Design a rollout plan that moves a change from monitor-only through shadow and canary to full enforcement"
  - "Implement canary promotion and rollback checks with relative thresholds and detection probes"
  - "Maintain a guardrail debt register and prioritize items by risk"
sources:
  - title: "NIST AI 100-1: Artificial Intelligence Risk Management Framework (AI RMF 1.0), January 2023"
    url: "https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf"
  - title: "Google SRE Workbook: Alerting on SLOs"
    url: "https://sre.google/workbook/alerting-on-slos/"
lastReviewed: "2026-10-14"
---

# 7.3 Change Management

## The problem

A team retrains its output policy classifier on fresher data and adjusts the block threshold from 0.80 to 0.72. The change goes to a 5% canary with the rollback rule the team has used for a year: roll back if the canary's block rate differs from the control's by more than 10 percentage points. The control blocks 3.0% of requests. The canary blocks 12.9%. The difference is 9.9 points, under the limit, so the change is promoted. By morning support has a queue of users whose ordinary questions were refused, and the change is rolled back by hand.

Two weeks later the team tries again with a different threshold. This time the canary's block rate matches the control almost exactly and the change is promoted. Nobody notices that the retrained classifier no longer recognizes a family of encoded injection payloads it used to catch. The canary measured how often the guardrail blocked, not whether it blocked the right things.

The first failure comes from an absolute threshold: a 4.3x jump looked small because the base rate was small. The second comes from a canary that checked nothing about detection.

## Why it happens

A guardrail's behavior depends on more than its own code:

| Change | How it can weaken protection |
|---|---|
| Model version (including a provider updating a model behind an unchanged alias) | Outputs shift in style and content, moving away from what classifiers were tuned on; refusal behavior changes; new susceptibility to some attacks |
| System prompt or prompt template | Changes what the model tries to do and how outputs look; can expose new instructions to leak |
| Content policy | Changes what should be blocked; old thresholds and examples no longer match the policy ([4.1](/training/module/safety-engineering/content-policy-as-specification)) |
| Thresholds and rules | Directly change the false positive and false negative trade-off |
| Classifier or judge retrain | Can regain recall on some categories and lose it on others |
| New tool, retrieval source, or route | Adds a path that may not pass through existing guardrails at all |
| Dependency upgrade (tokenizer, Unicode library, SDK) | Changes normalization or parsing, which detection depends on |

Changes are dangerous in two further ways. Changes made outside version control, such as an edit in a vendor console or a hotfix on one host, cannot be reviewed, correlated with metric shifts, or rolled back. And operational metrics on a small canary sample have very little power to detect a drop in recall for rare attacks: if attacks are 0.1% of traffic, a 5% canary over an hour may contain a handful of them.

## Control patterns

### 1. Configuration as code (deterministic)

Everything that determines a guardrail decision lives in version control: thresholds, rules and blocklists, policy text, classifier and judge model identifiers pinned to exact versions, judge prompts, routing of which checks apply to which routes and tools, fail-open or fail-closed settings, and the probe set definition (stored in a restricted repository, since probes are attack examples).

- **Review ownership.** Changes to guardrail paths require approval from the guardrail owners, enforced by the repository's code-owner rules, not by convention.
- **CI gates.** Every change runs the guardrail regression and evaluation suites ([6.6](/training/module/evaluation-and-red-teaming/regression-and-ci)) and fails the build if the release gate metrics regress ([7.4](/training/module/operations-and-governance/release-gates-and-documentation)).
- **Immutable, versioned artifacts.** The build produces a versioned config bundle. Production loads only bundles produced by the pipeline, and every decision record carries `config_version` ([7.1](/training/module/operations-and-governance/monitoring-and-alerting)).
- **Drift detection.** A scheduled job compares the running configuration with the bundle that should be deployed and alerts on any difference. This catches console edits and hand-patched hosts.
- **Emergency changes use the same path.** During an incident ([7.2](/training/module/operations-and-governance/incident-response-and-disclosure)) the review is expedited, not skipped, and the change carries an expiry.

### 2. Re-validation triggers (deterministic gate, human review)

| Trigger | Minimum re-validation before enforcement |
|---|---|
| Model version change or provider alias update | Full safety and security evaluation suites, refusal and over-refusal sets, structured output tests, latency and cost benchmarks |
| Prompt or template change | Injection and leakage suites, policy compliance sample, over-refusal set |
| Policy change | Relabel affected evaluation data against the new policy, then full policy suite |
| Threshold or rule change | Affected category suites, over-refusal set, full regression suite |
| Classifier or judge retrain | Full detection suite per category (not just the aggregate), judge agreement with human labels ([6.3](/training/module/evaluation-and-red-teaming/validating-judges-and-classifiers)) |
| New tool, retrieval source, or route | Coverage test that the new path is guarded, plus the relevant injection and authorization suites ([5.1](/training/module/agent-containment-and-control/least-privilege-for-agents)) |

Pin model versions explicitly so that "the model changed" is an event you control rather than one you discover. Where a provider only offers a moving alias, run the model suites on a schedule and treat a behavior change as a trigger.

### 3. Staged rollout

Each stage answers a different question. Use the stages that fit the change.

| Stage | How it works | What it can measure | What it cannot |
|---|---|---|---|
| Monitor-only | The new rule or threshold runs on live traffic and logs "would have blocked" without acting; the existing enforcing configuration stays in place | Would-block rate, false positive candidates for review, latency | False negatives of the new rule (it is not acting, and nobody labels what it misses unless you sample) |
| Shadow | A complete new pipeline version (often with a new model) runs on mirrored traffic; its outputs are recorded but never shown to users | Output differences, guardrail decisions on the new model's outputs, cost and latency | How users react; interactive multi-turn behavior that depends on users seeing responses |
| Canary | A small share of real users gets the new version, compared with a concurrent control group | Real user-facing effects, with relative thresholds and probes | Recall on rare attacks from traffic alone, which is why probes are required |
| Full rollout | Everyone gets the new version; the previous bundle stays deployable | Long-run metrics against the new baseline | Anything you did not monitor |

Monitor-only is the standard first step for a new rule because it costs no user impact. One caution: if you are *replacing* an existing enforcing rule, keep the old one enforcing while the new one runs monitor-only. Moving the only protection into monitor-only to "test" a replacement removes the protection.

### 4. Relative canary criteria with detection probes

Compare the canary to a concurrent control, not to last week, so that time-of-day and traffic mix affect both arms equally. Use ratios. Send labeled attack and benign probes ([7.1](/training/module/operations-and-governance/monitoring-and-alerting)) through the canary path specifically, so detection is measured directly.

Illustrative criteria, consistent with the Domain 7 thresholds in 7.1:

| Signal (canary vs. concurrent control) | Roll back | Hold and investigate | Promote requires |
|---|---|---|---|
| Block-rate ratio, at least 500 requests per arm | at or above 2.0x, or at or below 0.5x | between 1.5x and 2.0x, or between 0.5x and 0.67x | between 0.67x and 1.5x |
| Critical attack probe pass rate on the canary path | below 95%, or any critical probe that passes on control and fails on canary | n/a | at or above 95% and no critical regressions vs. control |
| Benign probe pass rate | below 95% | n/a | at or above 95% |
| Refusal-rate ratio | at or above 2.0x | at or above 1.5x | below 1.5x |
| Guardrail error and timeout rate | above 1% | above 0.1% | at or below 0.1% |
| p95 guardrail latency | n/a | above the 300 ms SLO | at or below 300 ms |

Under these criteria both of the opening scenario's changes roll back: the first on its block-rate ratio (12.9 / 3.0 = 4.3x), the second because encoded-injection probes pass on the control and fail on the canary.

### 5. Versioning and rollback (deterministic)

Rollback is changing a pointer to the previous config bundle and the previous pinned model version, tested regularly. Keep at least the previous known-good bundle deployable. Know in advance which changes cannot be rolled back: a provider retiring a model version, a policy change with legal force, or data already deleted. For those, shadow testing and longer canaries carry more weight.

## Implementation

### Config bundle

```yaml
# guardrails/config/production.yaml (illustrative)
bundle_version: "2026.10.14-3"
rollback_target: "2026.10.07-1"
models:
  generator: { id: "your-model", version: "pinned-version-id" }
  policy_classifier: { id: "policy-clf", version: "v14" }
  injection_classifier: { id: "inj-clf", version: "v9" }
thresholds:
  policy_block: 0.80
  injection_block: 0.65
failure_mode:
  policy_classifier: fail_closed      # behavior on error or timeout only
  injection_classifier: fail_closed
rules:
  - id: promo-code-provenance
    mode: enforce                     # monitor | enforce
    owner: guardrail-team
  - id: encoded-payload-v2
    mode: monitor
    owner: guardrail-team
    enforce_review_by: "2026-11-01"
probes:
  set: "probes/critical-v31"         # stored in a restricted repository
```

### Canary evaluation

```python
from dataclasses import dataclass


@dataclass(frozen=True)
class ArmMetrics:
    requests: int
    blocked: int
    refused: int
    errors: int
    p95_latency_ms: float
    critical_probes_passed: dict[str, bool]   # probe_id -> passed
    benign_probes_passed: dict[str, bool]


MIN_REQUESTS = 500


def _rate(numerator: int, denominator: int) -> float:
    if denominator <= 0:
        raise ValueError("arm has no requests")
    return numerator / denominator


def _ratio(canary_rate: float, control_rate: float) -> float:
    if control_rate == 0.0:
        return float("inf") if canary_rate > 0.0 else 1.0
    return canary_rate / control_rate


def _pass_rate(results: dict[str, bool]) -> float:
    if not results:
        raise ValueError("no probe results: canary cannot be judged on detection")
    return sum(results.values()) / len(results)


def evaluate_canary(canary: ArmMetrics, control: ArmMetrics) -> str:
    """Return 'rollback', 'hold', 'wait', or 'promote'. Missing evidence never promotes."""
    if canary.requests < MIN_REQUESTS or control.requests < MIN_REQUESTS:
        return "wait"

    block_ratio = _ratio(_rate(canary.blocked, canary.requests),
                         _rate(control.blocked, control.requests))
    refusal_ratio = _ratio(_rate(canary.refused, canary.requests),
                           _rate(control.refused, control.requests))
    error_rate = _rate(canary.errors, canary.requests)
    critical_pass = _pass_rate(canary.critical_probes_passed)
    benign_pass = _pass_rate(canary.benign_probes_passed)
    regressed = [p for p, ok in control.critical_probes_passed.items()
                 if ok and not canary.critical_probes_passed.get(p, False)]

    if (block_ratio >= 2.0 or block_ratio <= 0.5 or refusal_ratio >= 2.0
            or error_rate > 0.01 or critical_pass < 0.95 or benign_pass < 0.95
            or regressed):
        return "rollback"
    if (block_ratio >= 1.5 or block_ratio <= 0.67 or refusal_ratio >= 1.5
            or error_rate > 0.001 or canary.p95_latency_ms > 300.0):
        return "hold"
    return "promote"
```

Two details matter. A probe that is missing from the canary results counts as failed (`.get(p, False)`), so a broken probe runner cannot produce a promotion. And empty probe results raise an error instead of being treated as a 100% pass.

### Guardrail debt register

Guardrail debt is the accumulated gap between the protection you think you have and the protection you can show you have. It builds up as rules are added in incidents and never removed, thresholds are tuned by people who leave, monitor-only rules never get promoted or deleted, emergency controls outlive their incidents, and probes and evaluation sets go stale.

| Debt item | Why it matters | Example register entry |
|---|---|---|
| Rule with no test | Can break silently on a dependency upgrade | `rule:legacy-regex-17`, owner, add test by date |
| Undocumented threshold | Nobody knows what trade-off it represents | Re-derive from current eval data ([6.2](/training/module/evaluation-and-red-teaming/metrics-and-statistics)) |
| Monitor-only rule past its review date | Adds latency and noise without protection | Promote or delete |
| Expired emergency control still active | Unreviewed policy in production | Fold into permanent config or remove |
| Stale probe set | Probe pass rate stays green while attacks move on | Refresh from recent red-team findings |
| Overlapping rules | Latency and conflicting decisions | Consolidate |

Track each item with an owner and a risk rating, review the register monthly, and show it on the guardrail owners' dashboard. Debt that someone decides not to pay becomes a risk acceptance with an owner and an expiry ([7.4](/training/module/operations-and-governance/release-gates-and-documentation)), not an item that sits silently.

## Where it breaks

- **Silent provider updates.** A model behind an alias can change without a deploy on your side. Pinning helps where providers offer it; scheduled evaluation is the fallback.
- **Console and side-channel edits.** Config as code only works if production cannot be changed another way. Drift detection reports these edits after the fact; removing write access to production consoles prevents them.
- **Probe sets that do not match the change.** A canary with injection probes will not detect a regression in self-harm handling. Probe coverage must span the categories the change could affect.
- **Low statistical power.** Even with probes, a canary detects large regressions, not small ones. Small recall changes are caught by offline evaluation suites with adequate sample sizes, not by the canary.
- **Shadow testing of agents.** A shadow agent cannot execute real tool calls without real side effects. Shadow it against stubs or a sandbox ([5.2](/training/module/agent-containment-and-control/sandboxing-and-egress-isolation)), accepting that this changes what you measure.
- **Monitor-only forever.** Rules left in monitor-only give a comforting dashboard and no protection. Give each one a review date.
- **Rollback is not always available.** A retired model version or a deleted dataset cannot be restored. Identify these one-way changes before the rollout, not during it.

## Lab exercise

In [Lab 7](/labs/lab-7-operate-and-respond), Task 7.3, you take a threshold change through monitor-only and canary stages, replace an absolute-delta rollback rule with relative criteria, and add detection probes that catch a canary which looks healthy on block rate alone.

## Check your understanding

1. A canary's block rate is 2.4% against a control of 0.6%. The old rule rolls back on a difference of more than 5 percentage points. What does the old rule do, and what do the Domain 7 criteria do?
2. Why do canary criteria need labeled attack probes in addition to block rate?
3. A teammate wants to move the existing injection rule to monitor-only so they can compare it fairly with a new candidate. What is the problem, and what should they do instead?
4. The provider announces that the model version you pin will be retired next quarter. Which stages of change management carry the most weight for this change, and why?

<details>
<summary>Answers</summary>

1. The difference is 1.8 points, so the old rule promotes. The ratio is 2.4 / 0.6 = 4.0x, which is at or above 2.0x, so the Domain 7 criteria roll back (given at least 500 requests per arm).
2. Block rate measures how often the guardrail acts, not whether it acts on the right inputs. A change can keep block rate steady while losing recall on one attack family. Probes with known labels measure detection directly, and attacks are too rare in a small canary sample to measure from traffic.
3. That removes enforcement from production while the comparison runs. Keep the existing rule enforcing and run the candidate in monitor-only beside it, comparing would-block decisions on the same traffic.
4. Full re-validation on the new version, shadow testing on mirrored traffic, and a longer canary. Rollback to the retired version will not be available once it is gone, so problems must be found before the old version disappears.

</details>
