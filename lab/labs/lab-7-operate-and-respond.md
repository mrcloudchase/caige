---
title: "Lab 7: Operate and Respond"
slug: lab-7-operate-and-respond
domain: 7
order: 7
description: "Monitor guardrails in production, run an incident drill that includes pulling the brake, manage a change safely, and pass a release gate."
estimatedTime: "3-4 hours"
---

# Lab 7: Operate and Respond

## Goal

Run your practice system the way a production team would: monitor it, respond to an incident, ship a change safely, and document the decision to release.

## Setup

The Acme Support app from [Lab 6](/labs/lab-6-red-team-and-measure), with its run directories (`runs/<run_id>/`: audit log, traces, outbox). You need a teammate for Task 7.2, or a scripted scenario.

## Task 7.1: Monitoring and Alerting

Build a dashboard of block rate, refusal rate, latency, errors, and cost. Add alerts on relative change from a baseline, and set up a governed, access-controlled sample store for review.

**Outcome:** the dashboard, and one alert that fires on injected synthetic traffic.

## Task 7.2: Incident Response and Disclosure

Run a tabletop drill. A teammate reports that one of your Lab 6 findings has reappeared in production. Contain it using the options from the training, including pulling the brake. Use the audit log to determine impact, and draft a disclosure notice.

**Outcome:** a timeline, the containment decision, and the draft notice.

## Task 7.3: Change Management

Ship a model or prompt change through a canary or shadow rollout. Use relative thresholds and labeled attack probes, and rehearse a rollback.

**Outcome:** the rollout record and the rollback evidence.

## Task 7.4: Release Gates and Documentation

Write go/no-go criteria for your system, a one-page system card, and a risk-acceptance record that names who owns each accepted risk and who holds the authority to stop the system.

**Outcome:** the release package.

## Task 7.5: Regulation and Standards

Map your evidence from Labs 2-7 to the [cAIge AI Deployment Standard](/standard) and to one external framework (the NIST AI RMF, ISO/IEC 42001, or the EU AI Act).

**Outcome:** a control-to-evidence table.

## Deliverables

- The dashboard and alert evidence
- The incident drill record, including the brake pull
- The change rollout record
- The release package and standards mapping
