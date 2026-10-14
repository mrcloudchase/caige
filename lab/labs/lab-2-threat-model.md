---
title: "Lab 2: Threat-Model Your Practice System"
slug: lab-2-threat-model
domain: 2
order: 2
description: "Classify every risk as safety, security, or containment, map authority and trust boundaries, and run a blast-radius analysis."
estimatedTime: "3-4 hours"
---

# Lab 2: Threat-Model Your Practice System

## Goal

Produce a threat model for your Lab 1 system that a reviewer could use to decide whether it may ship.

## Setup

You need the architecture diagram and context map from [Lab 1](/labs/lab-1-map-the-system).

## Task 2.1: Safety, Security, and Containment

List at least twelve ways your system could fail. Classify each by category (safety, security, or containment). For security failures, also note the safety impact.

**Outcome:** a categorized failure list.

## Task 2.2: Principals, Authority, and Trust Boundaries

List every principal: operator, developer, each user role, each tenant, each tool, retrieved documents, and the model itself. State what authority each should have. Draw the trust boundaries on your architecture diagram. Include tool results flowing back into the context, and model output flowing to downstream systems.

**Outcome:** a principal and authority table, and the annotated diagram.

## Task 2.3: The Failure Mode Catalog

For each failure mode in the training catalog, decide whether it applies to your system, how, and through which component.

**Outcome:** an applicability table with one row per catalog entry.

## Task 2.4: Threat Frameworks and Standards

Map your applicable failure modes to the OWASP Top 10 for LLM Applications (2025) and to MITRE ATLAS tactics.

**Outcome:** a mapping table, with each framework's version noted.

## Task 2.5: Assume Compromise: Blast-Radius Analysis

Assume the model follows any instruction it sees. For each tool and data store, write the worst thing that could happen. Identify every flow where private data, untrusted content, and an outbound channel coexist.

**Outcome:** a blast-radius table and a list of lethal-trifecta flows.

## Task 2.6: Risk Scoring and Threat Model Documents

Score each risk by likelihood and impact for your use case. Choose the top five to fix in Labs 3-5, and write a risk-acceptance statement for the rest.

**Outcome:** a one-to-three-page threat model document using the training template.

## Deliverables

- The threat model document, including the principal table, trust-boundary diagram, catalog applicability, framework mapping, blast-radius analysis, risk scores, and acceptance statement
