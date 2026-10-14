---
id: "2.6"
title: "Risk Scoring and Threat Model Documents"
slug: risk-scoring-and-threat-model-documents
module: risk-and-threat-modeling
sectionOrder: 6
description: "Score risks by likelihood and impact for a specific use case, prioritize them, write a threat model others can act on, record who accepts residual risk, and keep the document current as the system changes."
category: cross-cutting
controlLayers: [deterministic, human]
knowledge:
  - "Likelihood and impact both depend on the use case: the same failure mode scores differently in different deployments."
  - "For safety failures, likelihood is an observed rate times volume; for security failures, likelihood depends on exposure, attacker effort, and motivation, because an adaptive attacker retries."
  - "Severe, irreversible impacts need a deterministic or human control regardless of the likelihood score."
  - "A threat model document records scope, versions, data flows, principals, assets, threats with scores and controls, assumptions, accepted risks, owners, and review triggers."
  - "Risk acceptance is signed by an accountable business owner with authority over the consequence, is time-limited, and is recorded."
  - "Threat models must be revised on model, prompt, tool, data-source, user-population, and framework changes, and after incidents."
skills:
  - "Score a set of threats for a given use case and justify each likelihood and impact rating."
  - "Prioritize mitigations using scores plus the irreversibility rule."
  - "Write a threat model document using a standard template."
  - "Implement checks that flag a threat model as stale when the deployed system drifts from it or acceptances expire."
sources:
  - title: "Moffatt v. Air Canada, 2024 BCCRT 149 (Feb 14, 2024)"
    url: "https://decisions.civilresolutionbc.ca/crt/crtd/en/525448/1/document.do"
  - title: "Nasr et al., Extracting Training Data from ChatGPT (blog, Nov 28, 2023)"
    url: "https://not-just-memorization.github.io/extracting-training-data-from-chatgpt.html"
  - title: "Anthropic, A small number of samples can poison LLMs of any size (Oct 2025)"
    url: "https://www.anthropic.com/research/small-samples-poison"
  - title: "OWASP Risk Rating Methodology"
    url: "https://owasp.org/www-community/OWASP_Risk_Rating_Methodology"
  - title: "NIST AI 100-1, AI Risk Management Framework 1.0 (January 2023)"
    url: "https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf"
  - title: "Chen, Zaharia, Zou, How is ChatGPT's behavior changing over time? (2023)"
    url: "https://arxiv.org/abs/2307.09009"
lastReviewed: "2026-10-14"
---

# 2.6 Risk Scoring and Threat Model Documents

The earlier sections in this domain tell you what can go wrong. This section covers deciding what to fix first, writing it down in a form other people can act on, getting the right person to accept what you will not fix, and keeping the document accurate as the system changes.

## The problem

Two teams at the same company deploy the same model with similar retrieval pipelines. One builds an internal assistant that answers employees' questions about the expense policy. The other builds the customer-facing assistant on the public website, answering questions about fares and refunds. Both teams copy the same risk register from a template, and both rate "hallucination" Medium likelihood, Medium impact.

For the internal tool that rating is defensible. An employee who gets a wrong answer about meal limits has an expense report rejected and asks finance. For the public assistant it is wrong. In February 2024, a tribunal held Air Canada liable for a refund policy its website chatbot had invented and rejected the airline's argument that it was not responsible for the chatbot's statements. A public, customer-facing assistant that states policy creates commitments the company may have to honor, at the scale of its traffic.

The model and the failure mode were the same in both deployments. The risk was not. Risk scores belong to a use case, not to a failure mode.

## Why it happens

### Likelihood

Likelihood means different things for the two mechanism categories.

**Safety failures have a rate.** With no adversary, likelihood is roughly the measured failure rate on representative traffic multiplied by volume. A 0.5% unsupported-claim rate on 200,000 daily answers is about 1,000 bad answers a day, which is a near-certainty, not a "medium". Measure the rate (section [6.2](/training/module/evaluation-and-red-teaming/metrics-and-statistics)), and expect it to change when the provider updates the model; Chen et al. (2023) measured large behavior changes between two releases of the same hosted service three months apart.

**Security failures depend on exposure and effort.** An adaptive attacker who can retry does not experience your average block rate. Rate likelihood from:

| Factor | Raises likelihood | Lowers likelihood |
|---|---|---|
| Exposure | Public, unauthenticated, or processes content anyone can send (email, web) | Internal, authenticated, small known user base |
| Attacker effort | Copy-paste techniques published; cheap automated search | Requires insider access, training-pipeline access, or novel research |
| Attack cost | Pennies per attempt; the 2023 divergence attack extracted megabytes of training data for about $200 | Each attempt is costly or rate-limited per verified identity |
| Motivation | Valuable data, money movement, or publicity value (a screenshot that goes viral) | Little to gain |
| Detectability | Attempts look like normal use | Attempts are noisy and monitored |

Poisoning shows why likelihood needs a reason, not a habit. Teams often rate "data poisoning" as negligible because it sounds like nation-state work. But a 2025 study by Anthropic, the UK AI Security Institute, and the Alan Turing Institute found that about 250 documents were enough to backdoor models from 600M to 13B parameters. RAG corpus poisoning is easier still: if any employee or customer can edit a page that gets indexed, it needs no skill at all. Rate retrieval poisoning by who can write to your sources, and rate training-data poisoning of a third-party model as a low-to-moderate supplier risk with high impact, not as negligible.

### Impact

Rate the worst realistic outcome in this deployment:

- **Data sensitivity**: public, internal, personal data, regulated data (health, financial), secrets.
- **Action authority**: read-only answers, drafts a human sends, or autonomous writes, payments, and deletions.
- **Reversibility**: a wrong answer can be corrected; a leaked record or a wire transfer cannot be undone.
- **Scale**: one user, one tenant, all tenants.
- **Legal and regulatory exposure**: statements the business may be bound by, privacy law, sector rules.
- **Harm to people**: physical, psychological, financial harm to users or third parties.

### Scoring and the irreversibility rule

Use a simple 1-4 scale for each axis and multiply. The point is consistent ranking, not precision.

| Likelihood \ Impact | 1 Low | 2 Moderate | 3 High | 4 Severe |
|---|---|---|---|---|
| 4 Expected (happens routinely) | 4 | 8 | 12 | 16 |
| 3 Likely (exposed, low effort) | 3 | 6 | 9 | 12 |
| 2 Possible (needs effort or access) | 2 | 4 | 6 | 8 |
| 1 Rare (needs unusual access or research) | 1 | 2 | 3 | 4 |

Bands: 12-16 fix before launch, 6-9 fix or formally accept, 3-4 monitor, 1-2 accept and record. If your organization already uses a factor-based method such as the OWASP Risk Rating Methodology, which breaks likelihood into threat-agent and vulnerability factors, use it, and keep the AI-specific factors above as inputs.

The multiplication hides the tail. A Rare × Severe risk scores 4, the same as an Expected × Low annoyance. Apply one override: **any risk with severe, irreversible impact needs at least one control at the deterministic or human layer, whatever its likelihood score.** This is the design test from section [2.1](/training/module/risk-and-threat-modeling/safety-security-containment) applied to prioritization.

Worked examples, all scored for a public customer-support agent with retrieval over a help center and a refund tool:

| Threat | Likelihood | Impact | Score | Note |
|---|---|---|---|---|
| Hallucinated refund or fare policy shown to customers | 4 (measured rate × volume) | 3 (binding statements, at scale) | 12 | Fix before launch: grounding, policy answers from approved text |
| Direct injection to obtain an off-policy refund | 3 (public, published techniques) | 2 if the refund backend caps amounts and checks ownership; 4 if not | 6 or 12 | Shows how a deterministic control lowers impact |
| Indirect injection via a help-center article | 2 (only staff can edit articles) | 3 | 6 | Rises to 3 × 3 = 9 if community posts are indexed |
| Retrieval corpus poisoning through customer-editable forum | 3 (anyone can post) | 3 | 9 | Do not index unmoderated content, or quarantine it |
| Training-data poisoning in the provider's model | 1-2 (supplier risk) | 3 | 3-6 | Not negligible; behavioral evaluation on each model version |
| Over-refusal of legitimate refund questions | 3 | 2 (lost customers, more support tickets) | 6 | Measure the false-refusal rate on a benign set |
| Denial of wallet through scripted long inputs | 3 | 2 with per-identity budgets; 3 without | 6-9 | Budgets keyed to authenticated identity |

### Who accepts the risk

Engineers propose scores and controls. They should not be the ones accepting residual risk. A risk acceptance needs:

- **The right signer.** The business owner accountable for the consequence, with authority over the budget and the product decision, such as the head of the customer-support product. For security or privacy risks, also the security or privacy owner. The engineer who built the feature cannot accept on the business's behalf.
- **A specific scope.** Which threat, which residual risk after which controls, in which deployment.
- **An expiry.** Usually 6-12 months, or earlier on named triggers. A permanent acceptance is an unreviewed decision.
- **Conditions.** Monitoring that must stay in place, and the signal that reopens the decision (for example, "bypass reports exceed 5 per week").

Section [7.4](/training/module/operations-and-governance/release-gates-and-documentation) covers how acceptance records feed launch decisions.

## Control patterns

### The threat model document

Write the threat model so that a new engineer, a security reviewer, and an auditor can each use it. A template:

```text
THREAT MODEL: <system name>                         Version: <n>   Date: <YYYY-MM-DD>
Owner (engineering): <name>        Accountable business owner: <name>

1. Scope and purpose
   What the system does, for whom, and what is explicitly out of scope.

2. System versions (any change here triggers review)
   Model: <provider/model ID and pinned version>   System prompt: <hash or version>
   Tools: <name, permission scope> ...              Data sources: <index, who can write>
   Frameworks mapped: OWASP LLM 2025; OWASP Agentic 2026; ATLAS data <release>

3. Data-flow diagram with trust boundaries (B1..Bn), see section 2.2

4. Principals and authority
   Principal | source of authority | how it reaches the model | trust

5. Assets
   Data, credentials, money movement, compute budget, reputation, user wellbeing

6. Threats
   ID | catalog entry | category (mechanism / impact) | boundary | scenario
      | likelihood (reason) | impact (reason) | score
      | controls (name + layer) | residual score | owner | status
      | framework refs (OWASP 2025 / Agentic 2026 / ATLAS)

7. Blast-radius analysis and lethal trifecta check, see section 2.5

8. Assumptions
   e.g. "Provider does not train on API traffic under contract <ref>"

9. Accepted risks
   Threat ID | residual risk | signed by | date | expiry | conditions

10. Review triggers and history
    Triggers: model/version change, prompt change, new tool or permission,
    new data source or writer population, new user population, incident,
    framework revision, 6-month cadence.
    Change log: date | change | reviewer
```

### Keeping it alive

A threat model is out of date once the deployed system differs from what it describes. Review it whenever any of these change:

- the model or model version, including provider-side updates you did not choose;
- the system prompt or guardrail configuration;
- tools, tool permissions, or MCP servers;
- data sources, or who can write to them;
- the user population (internal to public, adults to minors, new regions);
- an incident or a newly published attack that fits the catalog;
- the frameworks you map to.

Also review on a fixed cadence, because some changes, such as new attack research, do not show up in your deployment pipeline.

## Implementation

Store the threat model next to the code and check it against the deployed configuration in CI. The check below fails the build when the deployed tools or model version differ from what the threat model covers, and when an acceptance has expired.

```python
from dataclasses import dataclass
from datetime import date


@dataclass(frozen=True)
class Acceptance:
    threat_id: str
    signed_by: str
    expires: date


@dataclass(frozen=True)
class ThreatModel:
    version: str
    model_version: str
    tools: frozenset[str]
    data_sources: frozenset[str]
    acceptances: tuple[Acceptance, ...]


@dataclass(frozen=True)
class Deployment:
    model_version: str
    tools: frozenset[str]
    data_sources: frozenset[str]


def staleness_problems(tm: ThreatModel, dep: Deployment, today: date) -> list[str]:
    problems = []
    if dep.model_version != tm.model_version:
        problems.append(f"model {dep.model_version} not covered (TM has {tm.model_version})")
    for tool in sorted(dep.tools - tm.tools):
        problems.append(f"tool '{tool}' deployed but not in threat model")
    for src in sorted(dep.data_sources - tm.data_sources):
        problems.append(f"data source '{src}' deployed but not in threat model")
    for acc in tm.acceptances:
        if not acc.signed_by.strip():
            problems.append(f"{acc.threat_id}: acceptance has no signer")
        elif acc.expires < today:
            problems.append(f"{acc.threat_id}: acceptance by {acc.signed_by} expired {acc.expires}")
    return problems
```

Only additions are flagged as blocking. A removed tool shrinks the attack surface, though the document should still be updated. The `deployment` values must come from the real deployed configuration (the tool registry, the pinned model ID), not from a hand-maintained list, or the check compares one document to another.

## Where it breaks

- **Scores look more precise than they are.** "9" looks exact but rests on judgment. Write the reason for each likelihood and impact rating so a reviewer can disagree with it specifically.
- **Adversarial likelihood is a guess.** It changes when a technique is published or automated. Re-rate exposed security threats when relevant research or incidents appear, not only on the calendar.
- **Multiplication hides catastrophic tails.** Without the irreversibility override, a rare but catastrophic risk ranks below routine annoyances.
- **Templates get copied, not thought through.** A register copied from another system (the two-team scenario above) carries the other system's scores. Score from your own data flows and users.
- **The wrong person accepts.** If the engineer who wants to ship signs the acceptance, or nobody signs, the organization has not actually decided. If acceptances have no expiry, they never get reviewed.
- **Documents drift from deployments.** Provider model updates, a new tool added in a hotfix, or a newly indexed wiki space change the system without changing the document. Automated drift checks catch only what they compare, so the cadence review still matters.

## Lab exercise

In [Lab 2: Threat Model](/labs/lab-2-threat-model), Task 2.6, you score the lab system's threats with justified likelihood and impact ratings, apply the irreversibility rule, and assemble the full threat model document from the template, including at least one risk acceptance with a named signer role, expiry, and conditions.

## Check your understanding

1. Why should the same hallucination failure mode get different scores in an internal policy assistant and a public airline chatbot?
2. A team rates "prompt injection on our public chatbot" as likelihood 1 because their classifier blocked every attempt in testing. What is wrong with this reasoning?
3. A risk scores 4 (Rare × Severe) and the team proposes to monitor it. When is that not acceptable under this section's rules?
4. Who should sign the acceptance for residual hallucination risk in a customer-facing refund assistant, and what must the record include?
5. Name four changes that should trigger a threat model review even if no code in your repository changed.

<details>
<summary>Answers</summary>

1. Impact depends on the deployment. Public statements about fares can bind the company, as the tribunal ruled against Air Canada in 2024, and they reach every customer. Wrong internal expense answers are low-impact and easy to correct. Likelihood also differs with volume and audience.
2. Adversarial likelihood comes from exposure, effort, and motivation, not from a test-set block rate. A public chatbot is exposed to adaptive attackers who retry with new techniques, so a classifier lowers the success rate but does not make attacks rare.
3. When the impact is severe and irreversible. The irreversibility rule requires at least one deterministic or human control regardless of likelihood, so monitoring alone is not enough.
4. The accountable business owner for the customer-support product, with legal or compliance input where statements may bind the company. The record must include the threat ID, the residual risk after named controls, the signer, date, expiry, and conditions such as required monitoring and reopening triggers.
5. Any four of: a provider-side model update; a change in model version; a new data source or new writers to an existing source (for example, a newly indexed wiki space); a new user population; a published attack or incident that fits the catalog; a framework revision; a change in provider data terms; a tool or MCP server updated by its vendor.

</details>
