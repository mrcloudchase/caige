---
title: "Program Overview"
slug: overview
order: 0
description: "What the cAIge program trains, how it is organized, and how to use it."
---

# cAIge Program Overview

**Certified AI Guardrail Engineer, version 2.0**

A guardrail engineer makes AI systems hard to misuse and safe to run. In practice that means designing, building, testing, and operating the controls that stop an AI application from producing harmful output, being turned against its users or its operator, leaking data, or taking actions nobody authorized. When those controls fail, the guardrail engineer is also the person who can stop the system.

This program trains engineers for that job and certifies that they can do it. It is free, vendor-agnostic, and built around hands-on work on a deliberately vulnerable AI application.

---

## The framework behind the program

AI risk comes from different sources, and each source needs a different kind of control. The program uses three categories throughout:

| Category | The problem | Typical controls |
|---|---|---|
| **Safety** | The model misbehaves without an adversary: harmful or wrong output, sycophancy, over-refusal, overreach. | Content policy, classifiers and judges, grounding checks, refusal design, human review |
| **Security** | An adversary gains or abuses authority, most often by injecting instructions that try to borrow authority they do not hold. | Trust boundaries, privilege separation, retrieval authorization, output handling, egress control |
| **Containment** | Any cause, including ones you cannot diagnose. Treat the model like a powerful insider: limit it, observe it, and keep the ability to stop it. | Least privilege, sandboxing, budgets, action gating, the emergency brake, tamper-proof audit |

Controls are also ranked by where they are enforced, from weakest to strongest: the model itself, the prompt, runtime ML checks, deterministic architecture, and human or operational controls. One question tests every design in the program: **if the model were fully compromised, what is the worst it could do?** Classifiers make failures less frequent. Architecture limits how bad they can get. The full treatment is in [2.1 Safety, Security, and Containment](/training/module/risk-and-threat-modeling/safety-security-containment).

---

## Who it is for

The program targets engineers with roughly one to two years of experience building with AI or ML, including software engineers, ML engineers, security engineers, and platform engineers who are now responsible for AI systems in production. You should be comfortable reading Python, have a working understanding of APIs and web application architecture, and know basic security concepts. You do not need to be a security specialist or an ML researcher.

---

## Domains

| Domain | Weight | Study time |
|---|---|---|
| [1. How AI Systems Behave](/training/module/how-ai-systems-behave) | 10% | 3-4 hours |
| [2. Risk and Threat Modeling](/training/module/risk-and-threat-modeling) | 15% | 4-5 hours |
| [3. Security Engineering](/training/module/security-engineering) | 20% | 7-9 hours |
| [4. Safety Engineering](/training/module/safety-engineering) | 20% | 7-9 hours |
| [5. Agent Containment and Control](/training/module/agent-containment-and-control) | 15% | 5-7 hours |
| [6. Evaluation and Red Teaming](/training/module/evaluation-and-red-teaming) | 12% | 5-6 hours |
| [7. Operations and Governance](/training/module/operations-and-governance) | 8% | 3-4 hours |

Reading time is about 37-48 hours. The labs add roughly 20-30 hours.

---

## How to use the program

1. **Read the [competency matrix](/training/competency-matrix).** It lists everything a cAIge holder knows and can do, section by section. It is generated from the training content, so it always matches.
2. **Study the domains in order.** Domains 1 and 2 give you the model and the vocabulary. Domains 3 to 5 build the controls. Domains 6 and 7 measure and operate them.
3. **Do the lab for each domain.** The [labs](/labs) use Acme Support, a reference AI agent with deliberately naive defaults. You map it, threat-model it, harden it, contain it, measure it, and operate it, using its scoring tool to track attack success and false refusals.
4. **Read the [incident library](/incidents).** Each case is a real failure analyzed with the program's framework.
5. **Take the [practice exam](/practice-exam).** It follows the Associate blueprint and links every missed question back to its section.

---

## Credentials

| Credential | What it shows | Format |
|---|---|---|
| [cAIge Associate](/certifications/associate) | Understands AI guardrail engineering | Proctored knowledge exam, 75 questions |
| [cAIge Professional](/certifications/professional) | Can do the job | Hands-on exam: harden a live system against hidden attack and benign suites |

The [practice exam](/practice-exam) on this site is free and self-administered. It does not award a credential.

---

## Supporting material

- [Competency Matrix](/training/competency-matrix): knowledge and skills for every section
- [Exam Blueprint](/training/exam-blueprint): exam structure, distribution, and objectives
- [Glossary](/training/glossary): terms used across the program
- [cAIge AI Deployment Standard](/standard): a short, public control set for production AI systems

---

## Version history

| Version | Date | Changes |
|---|---|---|
| 2.0 | 2026-10-14 | Rebuilt around safety, security, and containment. Seven domains, new Agent Containment and Control domain, hands-on lab, incident library, deployment standard, regenerated question bank, practice exam with answer review. |
| 1.0 | 2026-03-07 | Initial release. Archived on the `archive/v1.0` branch of the repository. |
