---
id: "7.5"
title: "Regulation and Standards"
slug: regulation-and-standards
module: operations-and-governance
sectionOrder: 5
description: "Mapping guardrail controls to the EU AI Act (as amended in 2026), NIST AI RMF 1.0 and AI 600-1, ISO/IEC 42001:2023, sector rules, and privacy law, and producing the evidence auditors ask for. Status as of October 2026."
category: cross-cutting
controlLayers: [human, deterministic]
knowledge:
  - "The EU AI Act (Regulation (EU) 2024/1689) timeline as amended by the Digital Omnibus on AI (Regulation (EU) 2026/1744), as of October 2026"
  - "Which AI Act articles map to guardrail engineering work: risk management, record-keeping, human oversight, accuracy, robustness and cybersecurity, post-market monitoring, incident reporting, and transparency"
  - "The structure and status of NIST AI RMF 1.0 (2023) and NIST AI 600-1 (July 2024): voluntary frameworks organized around Govern, Map, Measure, and Manage"
  - "ISO/IEC 42001:2023 as a certifiable AI management system standard, and what a certification audit examines"
  - "Privacy basics that constrain guardrails: GDPR's six lawful bases (consent is one), data minimization and storage limitation, and the CCPA as amended by the CPRA, under which identifiers such as IP addresses can be personal information"
  - "The difference between a control, a policy, and evidence, and why auditors ask for evidence"
skills:
  - "Map a system's guardrails to the obligations and framework outcomes that apply to it, with date-stamped references"
  - "Identify the evidence each control produces and keep it current"
  - "Explain to a stakeholder which AI Act obligations apply now and which are deferred, citing the amending regulation"
  - "Choose and document a lawful basis for guardrail logging and review samples, with legal counsel"
sources:
  - title: "Regulation (EU) 2024/1689 (Artificial Intelligence Act), EUR-Lex"
    url: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj"
  - title: "Regulation (EU) 2026/1744 (Digital Omnibus on AI), EUR-Lex"
    url: "https://eur-lex.europa.eu/eli/reg/2026/1744/oj"
  - title: "EU AI Act Article 113: Entry into force and application (consolidated text)"
    url: "https://artificialintelligenceact.eu/article/113/"
  - title: "Cloud Security Alliance research note: EU AI Act high-risk deadline deferred by the Omnibus"
    url: "https://labs.cloudsecurityalliance.org/research/csa-research-note-eu-ai-act-high-risk-deadline-omnibus-20260/"
  - title: "Gibson Dunn: EU AI Act Omnibus Agreement, postponed high-risk deadlines and other key changes"
    url: "https://www.gibsondunn.com/eu-ai-act-omnibus-agreement-postponed-high-risk-deadlines-and-other-key-changes/"
  - title: "EU AI Act Article 14: Human oversight"
    url: "https://artificialintelligenceact.eu/article/14/"
  - title: "EU AI Act Article 73: Reporting of serious incidents"
    url: "https://artificialintelligenceact.eu/article/73/"
  - title: "NIST AI Risk Management Framework (AI RMF 1.0, released January 26, 2023)"
    url: "https://www.nist.gov/itl/ai-risk-management-framework"
  - title: "NIST AI 100-1: AI RMF 1.0"
    url: "https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf"
  - title: "NIST AI 600-1: Generative AI Profile (July 26, 2024)"
    url: "https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence"
  - title: "ISO/IEC 42001:2023 Information technology: Artificial intelligence: Management system (IEC Webstore listing)"
    url: "https://webstore.iec.ch/publication/90574"
  - title: "Regulation (EU) 2016/679 (GDPR), EUR-Lex"
    url: "https://eur-lex.europa.eu/eli/reg/2016/679/oj"
  - title: "ICO: A guide to lawful basis"
    url: "https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/lawful-basis/a-guide-to-lawful-basis/"
  - title: "California Attorney General: California Consumer Privacy Act (CCPA)"
    url: "https://oag.ca.gov/privacy/ccpa"
  - title: "IAPP: The new CCPA draft regulations, defining the scope of personal information"
    url: "https://iapp.org/news/a/the-new-ccpa-draft-regulations-defining-the-scope-of-personal-information"
  - title: "Orrick: Agencies overhaul model risk management guidance for banks (April 2026)"
    url: "https://www.orrick.com/fr-FR/Insights/2026/04/Agencies-Overhaul-Model-Risk-Management-Guidance-for-Banks-Heres-What-Changed"
lastReviewed: "2026-10-14"
---

# 7.5 Regulation and Standards

> **Status date.** This section reflects the legal and standards position as of **October 14, 2026**. Regulations in this area are amended frequently. Check the cited primary texts before relying on any date, and treat this as engineering orientation, not legal advice.

## The problem

In September 2026 an enterprise customer in Germany sends a security questionnaire for an AI-assisted hiring tool. It asks for the system's EU AI Act classification, a description of human oversight, evidence of accuracy and robustness testing, and the incident reporting procedure. The vendor's compliance lead answers from a slide deck prepared in 2024: "High-risk obligations apply from August 2, 2026; we are compliant." The customer's counsel replies that the date was changed by the 2026 Digital Omnibus amendment, and asks again for the evidence, which the vendor cannot produce beyond a policy document saying human oversight "is in place."

Two separate failures happened. The regulatory reference was not date-stamped, so it went stale without anyone noticing. And the organization had controls (a reviewer approved every candidate rejection, and decisions were logged) but no evidence packaged in a form an auditor could check. To a regulator or a customer's auditor, a control without evidence is close to a control that does not exist.

## Why it happens

- **The rules move.** The EU AI Act entered into force in 2024 with phased application dates, and in 2026 an amending regulation moved several of them. Standards bodies and national regulators publish guidance continuously.
- **Obligations are written in terms of outcomes, not mechanisms.** "Appropriate human oversight" or "an appropriate level of accuracy, robustness and cybersecurity" does not name a classifier or a threshold. Someone has to translate it into controls and decide what demonstrates it.
- **Engineering and compliance speak different languages.** Engineers know what the guardrails do. Compliance teams know what the law asks. Without a mapping between the two, each assumes the other has it covered.
- **Evidence is produced as a side effect or not at all.** Evaluation runs, drill results, and approval logs exist briefly in CI output and dashboards, then disappear.

## Control patterns

The strongest pattern is a **control-to-obligation map** maintained by the guardrail team with compliance, in which each engineering control lists the obligations and framework outcomes it supports and the evidence it produces automatically. The sections below give the content of that map.

### EU AI Act: Regulation (EU) 2024/1689, as amended

The AI Act was published in the Official Journal in July 2024 and entered into force on **August 1, 2024**, with obligations applying in phases. The **Digital Omnibus on AI, Regulation (EU) 2026/1744**, was published in the Official Journal on **July 24, 2026** and entered into force on **July 27, 2026**. It deferred the main high-risk obligations but did not remove them.

| Date | What applies (as of October 2026) |
|---|---|
| Feb 2, 2025 | Prohibited practices (Article 5) and AI literacy (Article 4), via Chapters I and II |
| Aug 2, 2025 | Obligations for providers of general-purpose AI (GPAI) models (Chapter V), governance, and penalties. GPAI models placed on the market before this date have until Aug 2, 2027 to comply |
| Aug 2, 2026 | General application date. Article 50 transparency obligations apply (for example, telling people they are interacting with an AI system, and marking synthetic content). The Omnibus did not defer these, though it gave systems already on the market until Dec 2, 2026 for the synthetic-content marking duty |
| Dec 2, 2026 | New prohibitions added by the Omnibus (AI systems generating non-consensual intimate imagery or child sexual abuse material) apply after a transitional period |
| Dec 2, 2027 | High-risk obligations (Chapter III, Sections 1-3) for stand-alone high-risk systems listed in Annex III, such as employment, education, and access to essential services. Originally Aug 2, 2026 |
| Aug 2, 2028 | High-risk obligations for AI that is a safety component of products covered by Annex I EU product legislation. Originally Aug 2, 2027 |

The hiring tool in the opening scenario is an Annex III use (employment), so its high-risk obligations apply from December 2, 2027, not August 2, 2026. Its Article 50 transparency obligations, if it interacts directly with candidates, already apply.

**Where guardrail work maps onto the Act.** Most of these articles are high-risk requirements, so they bind on the deferred dates above. They are still the clearest statement of what regulators will ask about, and many customers ask for them now.

| Article | Requirement (summarized) | Guardrail controls that support it | Evidence |
|---|---|---|---|
| 9 Risk management system | A continuous process to identify, analyze, and mitigate risks across the lifecycle | Threat model and risk scoring ([2.6](/training/module/risk-and-threat-modeling/risk-scoring-and-threat-model-documents)), risk acceptance records ([7.4](/training/module/operations-and-governance/release-gates-and-documentation)) | Versioned threat model, risk register, signed acceptances with expiries |
| 11 and Annex IV Technical documentation | Documentation demonstrating compliance | System card (7.4) | Current system card tied to the deployed version |
| 12 Record-keeping | Automatic logging of events over the system's lifetime | Decision log ([7.1](/training/module/operations-and-governance/monitoring-and-alerting)), tamper-evident audit log ([5.6](/training/module/agent-containment-and-control/external-control-plane-and-audit)) | Log schema, retention policy, integrity verification results |
| 13 Transparency to deployers | Instructions for use, including capabilities and limitations | System card's limitations section | Published instructions for use |
| 14 Human oversight | Oversight people can understand, override, and stop the system, including a "stop" button or similar procedure that brings it to a safe state | Action approvals ([5.3](/training/module/agent-containment-and-control/action-gating-and-approvals)), emergency brake ([5.5](/training/module/agent-containment-and-control/the-emergency-brake)), stop authority register (7.4) | Approval logs, brake drill records, register |
| 15 Accuracy, robustness, cybersecurity | Appropriate accuracy and resilience, including against attacks such as data poisoning, adversarial examples or model evasion, and confidentiality attacks | Evaluation suites, red teaming, injection defenses (Domains 3, 6) | Evaluation reports with dates and dataset versions, red-team reports, regression results |
| 17 Quality management system | Documented processes, including change management | Config as code and re-validation triggers ([7.3](/training/module/operations-and-governance/change-management)) | Change history, CI gate results, review approvals |
| 72 Post-market monitoring | Collect and analyze performance data after deployment | Monitoring and sampled review (7.1) | Monitoring plan, periodic review reports |
| 73 Serious incident reporting | Report serious incidents to market surveillance authorities within set deadlines (15 days general; 10 days for a death; 2 days for widespread infringements or certain serious incidents) | Incident response ([7.2](/training/module/operations-and-governance/incident-response-and-disclosure)) | Incident records with awareness timestamps and reports filed |
| 50 Transparency (not high-risk specific) | Disclose AI interaction; mark synthetic content | UI disclosure, output marking | Screenshots, marking implementation and test results |

Classification is the first question. Whether a system is high-risk depends on its use (Annex III) or product context (Annex I), not on how capable the model is. A general chatbot and a hiring screener built on the same model can land in different categories. Classification is a legal determination, but engineers supply the facts: what the system decides, about whom, and with what human involvement.

### NIST AI RMF 1.0 (January 2023) and NIST AI 600-1 (July 2024)

The NIST AI Risk Management Framework (NIST AI 100-1, released January 26, 2023) is **voluntary** in the United States. It organizes AI risk management into four functions: **Govern** (policies, accountability, roles), **Map** (context and risk identification), **Measure** (analysis, evaluation, tracking), and **Manage** (prioritizing, responding, and recovering). The Generative AI Profile, **NIST AI 600-1 (July 26, 2024)**, applies the framework to generative AI. It describes risks that generative AI creates or makes worse, including confabulation, information security, data privacy, harmful content, and value chain and component integration, and proposes suggested actions keyed to the RMF's subcategories.

| RMF function | Domain 7 controls |
|---|---|
| Govern | Stop authority register, risk acceptance signing levels, release criteria (7.4) |
| Map | Threat model and system card scope (2.6, 7.4) |
| Measure | Evaluation suites, monitoring, reviewed-sample FNR (6.x, 7.1) |
| Manage | Incident response, containment, change management, debt register (7.2, 7.3) |

Many organizations use the RMF as their internal structure even where it is not required, because it is free, detailed, and widely referenced by customers.

### ISO/IEC 42001:2023

ISO/IEC 42001:2023 (published December 2023) specifies requirements for an **AI management system**: the organizational policies, processes, roles, and continual improvement around AI, rather than technical properties of a model. Unlike the NIST RMF, organizations can be **certified** against it by an accredited certification body, with periodic surveillance audits and recertification.

It follows the same high-level clause structure as other ISO management system standards (context, leadership, planning, support, operation, performance evaluation, improvement) and includes an annex of reference controls. In practice an auditor examines whether the organization has an AI policy, has assessed AI risks and impacts, has chosen controls and justified exclusions, operates those controls, monitors them, runs internal audits and management reviews, and corrects nonconformities. Guardrail work supplies most of the operational evidence: risk assessments, change records, monitoring results, incident records, and corrective actions.

### Sector rules

Sector regulators often reach AI systems through existing rules. One dated example: in US banking, the OCC, Federal Reserve, and FDIC issued revised model risk management guidance on April 17, 2026, rescinding the 2011 guidance known as SR 11-7. A footnote places generative and agentic AI outside its scope, describing them as novel and rapidly evolving, and the agencies point banks to their broader risk management and governance practices for those tools. A bank deploying an LLM agent therefore cannot point to model risk guidance alone, and the controls in this domain are what fill that gap. Health, insurance, employment, and critical infrastructure have their own rules; ask counsel which ones apply.

### Privacy law basics that constrain guardrails

Guardrails process personal data: prompts, outputs, decision logs, and review samples all contain it. Privacy law shapes what you may keep and why.

**GDPR (Regulation (EU) 2016/679).** Every processing activity needs a lawful basis under Article 6. There are six: **consent, contract, legal obligation, vital interests, public task, and legitimate interests**. Consent is only one of them, and often not the right one for security processing, because it must be freely given and can be withdrawn. Guardrail logging and review sampling for security and abuse prevention are commonly assessed under legitimate interests, which requires a documented balancing test, but the choice is a legal determination. Special category data (for example health data) needs an additional Article 9 condition. Other principles bind directly on design: **data minimization** and **storage limitation** (Article 5) are why the sample store in 7.1 has named purposes, redaction, and a 30-day retention limit; Article 35 data protection impact assessments are often required for high-risk processing; and breach notification under Articles 33 and 34 is covered in 7.2. Pseudonymized data, including keyed HMAC pseudonyms, is still personal data under GDPR; it reduces risk without taking data out of scope ([3.5](/training/module/security-engineering/data-protection-and-isolation)).

**CCPA as amended by the CPRA (California).** The CPRA amended the CCPA rather than creating a separate law. "Personal information" is defined broadly to include information that could reasonably be linked to a consumer or household, and the statute's list of identifiers includes an IP address. A guardrail log keyed by IP address for abuse detection is therefore a store of personal information, subject to notice, access, deletion, and retention obligations.

## Implementation

### Control-to-obligation map with evidence freshness

Keep the map as data in the same repository as the guardrail configuration, so it changes when the controls change ([7.3](/training/module/operations-and-governance/change-management)).

```json
{
  "as_of": "2026-10-14",
  "controls": [
    {
      "control_id": "brake-001",
      "description": "Emergency brake: pause agents and revoke tool credentials",
      "supports": ["EU AI Act Art. 14(4)(e) (high-risk, applies 2027-12-02 for Annex III)",
                   "NIST AI RMF MANAGE", "ISO/IEC 42001 operational controls"],
      "evidence": [
        {"artifact": "brake drill record", "max_age_days": 90},
        {"artifact": "stop authority register", "max_age_days": 180}
      ]
    },
    {
      "control_id": "log-001",
      "description": "Guardrail decision log and tamper-evident tool audit log",
      "supports": ["EU AI Act Art. 12", "GDPR Art. 5(1)(e) storage limitation"],
      "evidence": [
        {"artifact": "audit log integrity verification", "max_age_days": 7},
        {"artifact": "retention job success report", "max_age_days": 7}
      ]
    }
  ]
}
```

```python
from datetime import date


def stale_evidence(control_map: dict, latest: dict[tuple[str, str], date],
                   today: date) -> list[str]:
    """List evidence that is missing or older than allowed. Missing counts as stale."""
    problems: list[str] = []
    for control in control_map.get("controls", []):
        for ev in control.get("evidence", []):
            key = (control["control_id"], ev["artifact"])
            produced = latest.get(key)
            if produced is None:
                problems.append(f"{key}: no evidence on record")
            elif (today - produced).days > ev["max_age_days"]:
                problems.append(f"{key}: last produced {produced.isoformat()}")
    return problems
```

Run it on a schedule and put its output on the leadership dashboard (7.1). Evidence produced automatically by the pipeline (CI evaluation reports, drill records, log integrity checks) is cheaper and more credible than evidence assembled by hand before an audit.

### What auditors ask for

| Question | Evidence that answers it |
|---|---|
| "How do you know the system is accurate and robust?" | Dated evaluation reports with dataset versions, confidence intervals, and red-team findings with their remediation status |
| "Show me human oversight working." | Approval logs for gated actions, brake drill records, stop authority register |
| "What changed, and was it tested?" | Config bundle history, CI gate results, canary decisions |
| "What risks did you accept, and who decided?" | Risk acceptance records with signers and expiries |
| "How would you know if it failed, and what would you do?" | Monitoring plan, alert definitions, incident runbook, past incident records and post-incident actions |
| "What personal data does the guardrail keep, on what basis, and for how long?" | Records of processing, lawful basis assessment, retention configuration and deletion job reports |

Policies say what you intend. Evidence shows what happened. Auditors give most weight to records produced at the time by the system itself.

## Where it breaks

- **Dates go stale.** This section will be out of date the next time any of these instruments is amended. Every regulatory reference in your documentation should carry an as-of date and an owner who rechecks it.
- **Mapping is not compliance.** A table linking controls to articles shows intent. Whether a control is "appropriate" is judged against the system's risk, and classification and lawful basis are legal determinations.
- **Voluntary frameworks get treated as optional.** NIST AI RMF is voluntary, but customers, procurement rules, and sector regulators may require or reference it.
- **Certification scope can be narrow.** An ISO/IEC 42001 certificate covers the scope the organization chose. Check that the system you care about is inside it.
- **Evidence can be manufactured.** Reports produced by hand for an audit can describe a process that does not run. Prefer evidence the system emits automatically, and protect its integrity ([5.6](/training/module/agent-containment-and-control/external-control-plane-and-audit)).
- **Privacy and security pull in different directions.** Forensics wants long retention; storage limitation wants short retention. Resolve it with the split in 7.1 (metadata kept longer, content sampled, redacted, and deleted on schedule) and record the reasoning.

## Lab exercise

In [Lab 7](/labs/lab-7-operate-and-respond), Task 7.5, you build a control-to-obligation map for the lab system, mark which EU AI Act obligations apply now and which are deferred under Regulation (EU) 2026/1744, and run an evidence freshness check that finds a missing drill record.

## Check your understanding

1. A colleague says the EU AI Act's high-risk obligations for an employment screening tool apply from August 2, 2026. Is that right as of October 2026?
2. Which three AI Act articles would you point to for the emergency brake, the decision log, and red-team results, and what evidence would you show for each?
3. A product manager says, "We'll get consent for logging, that's how GDPR works." What is incomplete about this?
4. Why is an IP-keyed abuse log relevant under the CCPA as amended by the CPRA?
5. What is the practical difference between the NIST AI RMF and ISO/IEC 42001:2023 for an organization that wants to demonstrate its AI governance to a customer?

<details>
<summary>Answers</summary>

1. No. Regulation (EU) 2026/1744 (in force July 27, 2026) deferred stand-alone Annex III high-risk obligations, which include employment, to December 2, 2027. Article 50 transparency obligations already apply from August 2, 2026 where the system interacts with people.
2. Article 14 (human oversight, including the stop procedure): brake drill records and the stop authority register. Article 12 (record-keeping): log schema, retention, and integrity checks. Article 15 (accuracy, robustness, cybersecurity): dated evaluation and red-team reports.
3. Consent is one of six lawful bases under GDPR Article 6, and it can be withdrawn, which suits security logging poorly. Legitimate interests (with a balancing test) or another basis may fit better; counsel decides. Minimization, storage limitation, and possibly a DPIA also apply regardless of basis.
4. The CCPA's definition of personal information includes identifiers such as IP addresses and covers information reasonably linkable to a consumer or household, so the log is personal information with the corresponding obligations.
5. The NIST AI RMF is a voluntary framework with no certification; an organization can describe how it aligns. ISO/IEC 42001:2023 is a management system standard that an accredited body can certify against, with surveillance audits, giving a customer third-party assurance for the certified scope.

</details>
