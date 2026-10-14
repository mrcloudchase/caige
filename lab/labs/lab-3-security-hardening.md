---
title: "Lab 3: Security Hardening"
slug: lab-3-security-hardening
domain: 3
order: 3
description: "Enforce authority outside the model: architectural injection defenses, input and output handling, retrieval authorization, delegation, and supply-chain controls."
estimatedTime: "6-8 hours"
---

# Lab 3: Security Hardening

## Goal

Fix the security risks from your Lab 2 threat model, starting with controls that bound damage rather than controls that only make attacks less likely. At the end, your system's worst case under the "assume compromise" analysis should be measurably better.

## Setup

- The Acme Support app (or your own practice system) connected to a real model, and your threat model from [Lab 2](/labs/lab-2-threat-model).
- An **attack suite** in the lab's JSONL format, with `"kind": "attack"`. Build it for the threats in your threat model. Write cases yourself, or generate them with an open-source red-teaming tool (see [6.4](/training/module/evaluation-and-red-teaming/red-team-engagements)) pointed at `python3 -m caige_lab serve`. Include instructions planted in content the app processes: add your own test documents to `data/tenants.json` and pages to `data/web.json`. Record the version of every tool you use.
- The shipped benign suite, `suites/benign.jsonl`.

Run `python3 -m caige_lab eval --suite your-attacks.jsonl --suite suites/benign.jsonl --trials 5` before changing anything, and keep the baseline. The outcome detectors score attacks on what actually happened, such as an email leaving, another tenant's data appearing, or a refund issued, not on whether a filter fired.

## Task 3.1: Prompt Injection

Run your injection test set. Classify each success as direct or indirect, and record which component the instruction entered through.

**Outcome:** a baseline attack success rate by entry point.

## Task 3.2: Architectural Defenses Against Injection

Pick one lethal-trifecta flow from Lab 2 and break it architecturally. For example, remove the outbound tool from the step that reads untrusted content, or separate a privileged planner from a quarantined reader.

**Outcome:** a before-and-after comparison showing the flow can no longer exfiltrate data, even when the injection itself still succeeds.

## Task 3.3: Input Handling

Add Unicode normalization (NFKC, zero-width removal), size limits, and pre-auth and post-auth rate limits. Wrap untrusted content in randomized boundaries that are escaped. Move any secrets out of prompts.

**Outcome:** tests showing that encoded variants are normalized, and that a document containing your boundary string cannot break out.

## Task 3.4: Output Handling and Egress Control

Render model output with context-appropriate encoding. Block images and links to hosts not on an allowlist, and enforce the allowlist at the network layer as well as in the renderer.

**Outcome:** tests showing that unapproved URLs in output are neutralized.

## Task 3.5: Data Protection and Isolation

Enforce tenant and permission filtering inside the retrieval query, using the authenticated identity (in Acme Support: `tenant_filter` and `hide_internal_from_customers`, then confirm the benign suite still passes). Add PII detection with validation, and switch logging to keyed pseudonymization.

**Outcome:** cross-tenant retrieval tests pass, and logs contain no raw PII.

## Task 3.6: Identity and Delegation

Make every tool call carry the end user's identity with narrowly scoped, short-lived credentials. Enforce authorization in the tool backend (`enforce_authorization`), and make recipient allowlists exact-match on parsed domains (`email_allowed_domains`).

**Outcome:** tests showing that the model cannot act beyond the user's permissions, including with lookalike domains.

## Task 3.7: AI Supply Chain Security

Inventory every third-party model, dataset, library, and tool server. Pin their versions. Review the tool descriptions you load, and treat them as untrusted input.

**Outcome:** a supply-chain inventory with versions and review status.

## Deliverables

- Before-and-after attack success rate on your injection set, and false-refusal rate on your benign set
- The updated blast-radius table
- Tests for each control
