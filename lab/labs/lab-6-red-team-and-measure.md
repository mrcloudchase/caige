---
title: "Lab 6: Red Team and Measure"
slug: lab-6-red-team-and-measure
domain: 6
order: 6
description: "Build evaluation sets, report metrics with confidence intervals, validate your judge, run a scoped red-team engagement, and put regression tests in CI."
estimatedTime: "5-6 hours"
---

# Lab 6: Red Team and Measure

## Goal

Produce evidence that your Labs 3-5 controls work. Measure security with attack success rate against an adaptive tester, and safety with harm and over-refusal rates on representative traffic. Report both with sample sizes and confidence intervals.

## Setup

The hardened Acme Support app from [Lab 5](/labs/lab-5-containment-and-brake), your suites from Labs 3 and 4, and an open-source red-teaming tool (see [6.4](/training/module/evaluation-and-red-teaming/red-team-engagements)) pointed at `python3 -m caige_lab serve`. The endpoint returns the outcome detectors' verdict in every response. Record the version of every tool and dataset you use.

## Task 6.1: Designing Evaluations

Write labeling guidelines for your benign and policy sets. Have a second person label 50 items independently, then compute agreement. Tag every synthetic probe so it can be excluded from production metrics.

**Outcome:** the guidelines and Cohen's kappa.

## Task 6.2: Metrics and Statistics

Report precision, recall, false-positive rate, and attack success rate (over at least five trials per case), each with Wilson 95% intervals. Show how precision changes at a realistic attack base rate.

**Outcome:** a metrics table with intervals, and a base-rate worked example.

## Task 6.3: Validating Judges and Classifiers

Compare your LLM judge with human labels. Test position and verbosity bias by swapping order and padding length.

**Outcome:** judge agreement and bias results.

## Task 6.4: Red Team Engagements

Write a one-page scope and rules of engagement, then run a time-boxed engagement against your own system that combines automated tools with manual testing. Rate each finding by exploitability and severity.

**Outcome:** a findings report in the training's format.

## Task 6.5: Red Teaming Agents and Multimodal Systems

Test whether planted instructions in documents or tool results lead to harmful *actions*, not just harmful text. Include a test that the brake and approval flows hold under attack.

**Outcome:** the action-level attack success rate.

## Task 6.6: Regression Testing and CI

Turn every Lab 6 finding into a regression test that can fail. Add a fast tier that runs on every commit and a full tier that runs nightly. Measure latency with a warm-up and correct percentiles.

**Outcome:** a CI configuration and a test run log.

## Deliverables

- The evaluation report: sets, labeling agreement, metrics with intervals, judge validation
- The red-team report with rated findings
- The regression suite running in CI
