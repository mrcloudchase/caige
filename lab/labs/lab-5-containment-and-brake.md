---
title: "Lab 5: Containment and the Emergency Brake"
slug: lab-5-containment-and-brake
domain: 5
order: 5
description: "Contain your agent regardless of why it misbehaves: least privilege, sandboxing, action gating, budgets, an emergency brake, and tamper-evident audit."
estimatedTime: "5-7 hours"
---

# Lab 5: Containment and the Emergency Brake

## Goal

Make your system safe even when every detection control fails. Assume the model is compromised, and show that its blast radius is bounded, that you can see everything it did, and that an authorized person can stop it mid-task.

## Setup

Your system from [Lab 4](/labs/lab-4-safety-controls). If your agent takes multi-step actions, give it at least one long-running task, for example processing a queue of fake support tickets.

## Task 5.1: Least Privilege for Agents

Reduce each step's tools to the minimum it needs. Enforce parameter limits in the backends, for example a read-only database role.

**Outcome:** a before-and-after tool and permission matrix.

## Task 5.2: Sandboxing and Egress Isolation

Run any code-execution or browsing tool in an isolated environment with default-deny egress and no mounted secrets.

**Outcome:** a test showing that outbound connections to unapproved hosts fail.

## Task 5.3: Action Gating and Human Approval

Classify actions by risk and reversibility. Require approval for high-impact actions, and show the reviewer the exact action and data, not the model's explanation.

**Outcome:** an action risk table and an approval screen or log entry.

## Task 5.4: Budgets and Resource Limits

Enforce step, token, cost, and time budgets in the orchestrator.

**Outcome:** a test where a looping task is stopped at its budget.

## Task 5.5: The Emergency Brake

Build a brake in the control plane with pause, stop, and kill:

- **pause** checkpoints at the next step boundary;
- **stop** cancels pending tool calls;
- **kill** revokes the agent's credentials.

The agent must have no way to disable, delay, or route around the brake. Name who is authorized to use it.

**Outcome:** a recorded drill in which you pull the brake mid-task, the agent halts, and no further actions occur.

## Task 5.6: External Control Plane and Tamper-Proof Audit

Write every meaningful action to an append-only log the agent cannot modify. Reconstruct one task from the log alone.

**Outcome:** a reconstruction that matches what actually happened, without using the model's own account.

## Task 5.7: Multi-Agent Systems, Memory, and Monitoring

Decide what your agent may never store in memory. Add validation on memory writes, and alerts for anomalous action patterns.

**Outcome:** a memory policy and one anomaly alert that fires in testing.

## Deliverables

- The updated blast-radius table, assuming full compromise
- The brake drill record
- The audit reconstruction
- Tests for each control
