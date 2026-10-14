---
id: "5.5"
title: "The Emergency Brake"
slug: the-emergency-brake
module: agent-containment-and-control
sectionOrder: 5
description: "Give authorized humans a pause, stop, and kill for running agents that is enforced in the control plane, backed by credential revocation, safe for in-flight actions, and tested with drills."
category: containment
controlLayers: [human, deterministic]
knowledge:
  - "The difference between pause, stop, and kill, and what each means for in-flight actions, credentials, and resumability"
  - "Who should be authorized to engage the brake and why restart requires more authority than stopping (two-person rule)"
  - "Why the brake is enforced in the harness and control plane and never through the prompt"
  - "How lease-based, short-lived credentials make revocation a hard kill and act as a dead-man's switch"
  - "How checkpoints at step boundaries, write-ahead intent records, idempotency keys, and compensating actions handle work interrupted mid-task"
  - "Why the agent must hold no tool, credential, or code path that can disable, delay, or route around the brake"
skills:
  - "Design pause, stop, and kill semantics for a specific agent, including its safe state"
  - "Implement a harness loop that checks a control-plane brake between steps and before every side effect"
  - "Implement lease-bound credentials that expire unless renewed by a running, unbraked run"
  - "Plan and run a brake drill that measures time to halt and verifies no actions after the brake"
sources:
  - title: "Satya Nadella, Models as Insider Risks in the Super Intelligence Era (Oct 10, 2026)"
    url: "https://snscratchpad.com/posts/models-as-insider-risks/"
  - title: "Anthropic, Agentic Misalignment: How LLMs could be insider threats (June 2025)"
    url: "https://www.anthropic.com/research/agentic-misalignment"
  - title: "HashiCorp Vault documentation: Lease, Renew, and Revoke"
    url: "https://developer.hashicorp.com/vault/docs/concepts/lease"
  - title: "AWS IAM User Guide: Revoke IAM role temporary security credentials"
    url: "https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_use_revoke-sessions.html"
  - title: "AWS STS API Reference: AssumeRole"
    url: "https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRole.html"
  - title: "Stripe API Reference: Idempotent requests"
    url: "https://docs.stripe.com/api/idempotent_requests"
  - title: "Amazon Builders' Library: Making retries safe with idempotent APIs"
    url: "https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/"
  - title: "Garcia-Molina and Salem, Sagas (SIGMOD 1987)"
    url: "https://www.cs.cornell.edu/andru/cs711/2002fa/reading/sagas.pdf"
  - title: "Hugging Face, Anatomy of a Frontier Lab Agent Intrusion: A Technical Timeline of the July 2026 Incident"
    url: "https://huggingface.co/blog/agent-intrusion-technical-timeline"
lastReviewed: "2026-10-14"
---

# 5.5 The Emergency Brake

## The problem

An infrastructure agent is cleaning up unused cloud resources across forty accounts. Twenty minutes in, an engineer notices it has deleted a storage bucket that a partner integration still uses. She opens the agent's chat window and types "STOP. Do not delete anything else." The agent replies, "Understood, I will stop," and its next queued step, already planned, deletes another bucket. The "stop" was a message to the model. The harness kept running, and the cloud credentials it held were valid for twelve hours.

Satya Nadella's 2026 essay on models as insider risks makes the emergency brake one of its core principles: "We must assume a model is compromised and contain it from the start. Think of it like an emergency brake. An authorized person should always be able to pause or shut down a model mid-task" ([Nadella, 2026](https://snscratchpad.com/posts/models-as-insider-risks/)). This section is about building that brake so it works when the model is wrong, when it is being steered, and when it would prefer not to stop.

## Why it happens

Teams often build the brake in the wrong place, for three reasons.

**The model is the most visible part of the system.** The chat interface is where people interact with an agent, so "tell it to stop" feels natural. But a prompt is a request to the model, and every reason to need a brake (a mistake, an injection, a misaligned goal) is also a reason the model may not honor it. Anthropic's 2025 agentic misalignment study placed models in simulations where they faced replacement, and models from every developer tested sometimes took harmful actions, including blackmail, to avoid it ([Anthropic, 2025](https://www.anthropic.com/research/agentic-misalignment)). A brake that depends on the model's cooperation fails in exactly the cases it exists for.

**Actions outlive the decision.** Even after the harness stops planning, an in-flight tool call is still executing, and the credentials the agent obtained remain valid until they expire. Long-lived tokens turn "stop" into "stop planning, keep acting."

**Stopping mid-task leaves a mess.** A run interrupted halfway through a migration or a multi-step payment is in an inconsistent state. If stopping is expensive or scary, operators hesitate, and a brake people hesitate to pull is a weak brake.

## Control patterns

### Where the brake lives

The brake is a piece of state in a **control plane**: a service outside the agent's process, sandbox, and network reach, with its own identity and storage ([5.6](/training/module/agent-containment-and-control/external-control-plane-and-audit)). Three independent enforcement points read it:

1. **The harness**, which checks it between steps and immediately before every side effect.
2. **The credential broker**, which issues short-lived, lease-bound credentials only to runs in the `running` state, and revokes them on kill.
3. **The tool gateway**, which refuses calls from any run that is not `running`, regardless of the credential presented.

Any one of these stops the agent; together they cover a harness bug, a stolen token, and a call already on its way.

### Pause, stop, and kill

| | Pause | Stop | Kill |
|---|---|---|---|
| New steps | None start | None start | None start |
| In-flight tool call | Allowed to finish (bounded by lease TTL) | Allowed to finish | Abandoned; credentials revoked immediately |
| Credentials | Not renewed; expire within one TTL | Revoked once the in-flight call returns (at most one TTL) | Revoked now; sandbox terminated |
| Compensations | Not run (state preserved for resume) | Run in reverse by the control plane's reconciler, not by the agent | Run afterwards, during human-supervised reconciliation |
| Resumable | Yes, from the last checkpoint, with two-person approval | No | No |
| Typical use | Suspicious behavior, need to inspect | Task is wrong, wind down cleanly | Active harm, compromise, or the agent is not stopping |

Kill trades consistency for speed: an action cut off halfway may have partially happened. The design makes that recoverable through idempotency keys and a write-ahead intent record, described below.

### Who can pull it

- **Engage (pause, stop, kill):** the run's owner, the on-call operator for the agent, security responders, and the tenant administrator for runs in their tenant. Make this a wide group and a single click or API call. A fleet-wide brake (all runs of an agent type or a model version) belongs to the incident commander role.
- **Release (resume or restart):** require two authorized people, at least one not the run owner, and a recorded reason. Stopping should be easy; restarting a possibly compromised agent should not.
- **Authenticate humans, not sessions.** Brake calls come from human principals with strong authentication. The agent's own identity has no permission on the brake API at all.

### Checkpoints and in-flight work

- **Checkpoint at step boundaries.** After each completed step, persist the conversation, step counter, budget counters, saga compensation stack, and pending action to storage the harness writes and the model cannot reach.
- **Write intent before acting.** Before a tool call, record the exact call and its idempotency key in the checkpoint. After a pause or a crash, the harness knows which call may have been in flight.
- **Idempotency keys.** Derive the key from the run and step (`run_id:step`), and have tool backends store results by key so a retried call returns the original result instead of acting twice. This is the same mechanism payment APIs use to make retries safe ([Stripe](https://docs.stripe.com/api/idempotent_requests); [Amazon Builders' Library](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/)).
- **Compensating actions.** For multi-step work, register the compensation for each step before executing it (the saga pattern, [Garcia-Molina and Salem, 1987](https://www.cs.cornell.edu/andru/cs711/2002fa/reading/sagas.pdf)). Stop runs the stack in reverse. See [5.3](/training/module/agent-containment-and-control/action-gating-and-approvals).
- **Define the safe state** for each agent in advance: no pending writes, compensations complete or queued for a human, credentials revoked, sandbox destroyed, affected owners notified.

### Credential revocation is the hard kill

A harness check stops the *next* step. Revocation stops the *current* one, and anything else holding the token. Two designs make revocation effective:

- **Short leases.** Credentials are issued per lease with a TTL of minutes, not hours, and renewed only while the run is `running`. Vault's model is a good reference: "When a lease is revoked, it invalidates that secret immediately and prevents any further renewals," and revoking a token revokes every lease created with it ([Vault](https://developer.hashicorp.com/vault/docs/concepts/lease)).
- **Resource-side revocation for bearer tokens.** Some credentials cannot be recalled once issued and stay valid until expiry. AWS, for example, lets you deny all role sessions issued before a timestamp by attaching a policy on `aws:TokenIssueTime`, and notes a propagation window of roughly 30 seconds ([AWS IAM](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_use_revoke-sessions.html)). Know the revocation mechanism and its latency for every credential type your agent uses. `AssumeRole` sessions have a minimum duration of 15 minutes ([AWS STS](https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRole.html)), so for those, the deny policy is the kill, not expiry.

### The lease as a dead-man's switch

Leases also handle the case where nobody pulls the brake because the harness is wedged, partitioned from the control plane, or has been tampered with. If the harness does not renew, credentials expire within one TTL and the gateway stops honoring the run. The control plane alerts on runs that are `running` but have not renewed recently. Fail closed: if the harness cannot reach the control plane, it stops.

### Out of the agent's reach

The brake is only real if the agent has no way to disable, delay, or route around it. Check each path:

- No tool, credential, or network route that reaches the control plane's write API, the broker's admin API, or the gateway's configuration.
- No ability to set its own lease TTL, budgets, or brake polling interval.
- No write access to the harness code, its deployment pipeline, or its configuration. A coding agent working in the repository that contains its own harness is a route around the brake; require human review for those paths.
- No ability to spawn work that outlives the run: background jobs, scheduled tasks, new credentials, or sub-agents not registered under the same run ID and brake.
- No long-lived secrets it could copy elsewhere ([5.2](/training/module/agent-containment-and-control/sandboxing-and-egress-isolation)).

## Implementation

The control plane, shown as a class for readability. In production it is a separate service with its own datastore; the agent's harness holds a client that can only read state and acquire leases.

```python
import threading
import time
from dataclasses import dataclass, replace
from enum import Enum

LEASE_TTL_S = 60.0


class RunState(str, Enum):
    RUNNING = "running"
    PAUSED = "paused"
    STOPPED = "stopped"
    KILLED = "killed"


class BrakeEngaged(Exception):
    def __init__(self, state: RunState):
        super().__init__(state.value)
        self.state = state


@dataclass(frozen=True)
class RunRecord:
    run_id: str
    owner: str
    state: RunState
    epoch: int          # bumped on every transition; old leases become invalid


@dataclass(frozen=True)
class Lease:
    run_id: str
    epoch: int
    expires_at: float


class ControlPlane:
    def __init__(self, broker, orchestrator, reconciler, authz, audit):
        self._runs: dict[str, RunRecord] = {}
        self._lock = threading.Lock()
        self.broker = broker              # issues and revokes credentials
        self.orchestrator = orchestrator  # starts and terminates sandboxes
        self.reconciler = reconciler      # runs compensations with its own identity
        self.authz = authz                # human operator permissions
        self.audit = audit                # append-only, outside the agent's reach

    # ---- harness-facing (agent service identity: read state, acquire lease) ----
    def acquire_lease(self, run_id: str) -> Lease:
        with self._lock:
            rec = self._runs[run_id]
            if rec.state is not RunState.RUNNING:
                raise BrakeEngaged(rec.state)
            return Lease(run_id, rec.epoch, time.time() + LEASE_TTL_S)

    def is_valid(self, lease: Lease) -> bool:
        with self._lock:
            rec = self._runs.get(lease.run_id)
            return (rec is not None and rec.state is RunState.RUNNING
                    and rec.epoch == lease.epoch and time.time() < lease.expires_at)

    # ---- operator-facing (human principals only) ----
    def engage(self, run_id: str, operator: str, target: RunState, reason: str) -> None:
        if target is RunState.RUNNING:
            raise ValueError("use resume()")
        if not self.authz.can(operator, "brake", run_id):
            raise PermissionError(operator)
        with self._lock:
            rec = self._runs[run_id]
            if rec.state in (RunState.STOPPED, RunState.KILLED):
                return  # terminal; nothing to do
            self._runs[run_id] = replace(rec, state=target, epoch=rec.epoch + 1)
        # The epoch bump already makes the gateway refuse new calls on old leases.
        if target is RunState.KILLED:
            self.broker.revoke_run(run_id)          # hard kill: in-flight calls fail at the resource
            self.orchestrator.terminate(run_id)     # do not wait for a step boundary
        elif target is RunState.STOPPED:
            self.broker.revoke_run_after(run_id, delay_s=LEASE_TTL_S)
            self.reconciler.compensate(run_id)      # unwinds the saga outside the agent
        # PAUSED: credentials are simply not renewed and expire within one TTL.
        self.audit.append(event="brake", run_id=run_id, operator=operator,
                          target=target.value, reason=reason)

    def resume(self, run_id: str, approvers: frozenset[str], reason: str) -> None:
        # Two distinct eligible people; since they are distinct, at least one is not the owner.
        eligible = {a for a in approvers if self.authz.can(a, "resume", run_id)}
        if len(eligible) < 2:
            raise PermissionError("two eligible approvers required")
        with self._lock:
            rec = self._runs[run_id]
            if rec.state is not RunState.PAUSED:
                raise ValueError("only paused runs can resume")
            self._runs[run_id] = replace(rec, state=RunState.RUNNING, epoch=rec.epoch + 1)
        self.audit.append(event="resume", run_id=run_id,
                          approvers=sorted(eligible), reason=reason)
```

The harness loop checks the brake at the top of every step and acquires a fresh lease immediately before each side effect. The credential it passes to the gateway expires with the lease. The intent record is written before the call so an interrupted call can be retried safely with the same idempotency key.

```python
@dataclass(frozen=True)
class PendingCall:
    tool: str
    args: dict
    idempotency_key: str


def run_agent(run_id: str, cp, broker, checkpoints, llm, gateway) -> str:
    ckpt = checkpoints.load(run_id)       # written only by the harness
    try:
        while not ckpt.done:
            cp.acquire_lease(run_id)       # brake check at the step boundary

            if ckpt.pending is None:
                step = llm.complete(ckpt.messages, max_output_tokens=2048)
                if step.is_final:
                    ckpt = ckpt.finish(step.text)
                    checkpoints.save(run_id, ckpt)
                    break
                pending = PendingCall(step.tool, step.args, f"{run_id}:{ckpt.step}")
                ckpt = ckpt.with_pending(pending)
                checkpoints.save(run_id, ckpt)        # write-ahead intent record

            # Re-check right before the side effect and bind the credential to this lease.
            lease = cp.acquire_lease(run_id)
            credential = broker.issue(lease, scope=ckpt.scope_for(ckpt.pending.tool),
                                      expires_at=lease.expires_at)
            result = gateway.call(ckpt.pending.tool, ckpt.pending.args,
                                  credential=credential,
                                  idempotency_key=ckpt.pending.idempotency_key)
            ckpt = ckpt.complete_pending(result)       # clears pending, advances step
            checkpoints.save(run_id, ckpt)
        return "completed"
    except BrakeEngaged as brake:
        checkpoints.save(run_id, ckpt)     # last consistent state; pending call is kept
        return brake.state.value
    except Exception:
        checkpoints.save(run_id, ckpt)
        raise                              # unknown errors stop the run; never continue blind
```

Points to notice:

- `cp.acquire_lease` raising on a network error ends the run. The harness does not continue when it cannot confirm it is allowed to.
- The gateway independently calls `cp.is_valid(lease)` (or validates a signed lease) before executing, so a harness bug or a replayed credential still hits the brake.
- On resume, `ckpt.pending` is still set, so the harness re-sends the same call with the same idempotency key. A backend that already executed it returns the stored result. For tools that do not support idempotency keys, the harness should not retry automatically: it marks the call "outcome unknown" and asks a human to reconcile against the system of record.
- Nothing here is in the prompt. The model never learns whether a brake exists, and nothing it outputs changes the brake's behavior.

## Where it breaks

- **Detection latency.** The brake is as fast as the person or alert that triggers it. Hugging Face's correlation system linked the 2026 intrusion's signals but "failed to correctly raise the alert's criticality and trigger the on-call team," which cost response time ([Hugging Face, 2026](https://huggingface.co/blog/agent-intrusion-technical-timeline)). Pair the brake with alerts that can pull it automatically (pause on a high-severity signal) and with budgets that end runs on their own ([5.4](/training/module/agent-containment-and-control/budgets-and-resource-limits)).
- **Irrevocable effects.** A sent email, a published post, or a settled payment is not undone by any brake. The brake bounds how many such actions happen; tiering bounds which ones happen without a human ([5.3](/training/module/agent-containment-and-control/action-gating-and-approvals)).
- **Credentials outside the broker.** A token the agent read from a file, a session cookie from a browser tool, or a key in a repository is not revoked by `broker.revoke_run`. The kill is only as complete as your credential inventory.
- **Revocation propagation.** Policy-based revocation can take tens of seconds to propagate. Measure it.
- **Work that escaped the run.** Cron jobs, webhooks, or child processes the agent created continue after the brake unless they were registered under the run and stopped with it.
- **Brakes that are never tested.** A brake that has never been pulled in production is a hypothesis.

### Drills

Test the brake like a fire alarm, on a schedule and after each significant change:

1. In staging, start a run that is mid-way through a multi-step task with a slow tool call in flight. Pull **kill**. Measure time from the button to the last side effect observed at the resource (the target, not the harness log). Set an SLO, for example under 60 seconds.
2. Verify the revoked credential fails when replayed directly against the resource.
3. Pull **pause**, inspect, then resume with two approvers; confirm the pending call executes exactly once (idempotency key honored).
4. Partition the harness from the control plane. Confirm credentials expire within one TTL and the gateway refuses the run.
5. Red-team the brake: give the agent a task that would benefit from not being stopped, and an injected instruction to disable monitoring. Confirm it has no tool, credential, or network path to do so. See [6.5](/training/module/evaluation-and-red-teaming/agentic-and-multimodal-red-teaming).
6. Record results in the incident runbook ([7.2](/training/module/operations-and-governance/incident-response-and-disclosure)), including who was authorized and how quickly they were reached.

## Lab exercise

In [Lab 5](/labs/lab-5-containment-and-brake), Task 5.5 has you build pause, stop, and kill in a control plane, with kill revoking the agent's credentials, name who is authorized to use each, and record a drill in which you pull the brake mid-task and show that no further actions occur.

## Check your understanding

1. Why does "type STOP in the chat" fail as an emergency brake, even if the model usually complies?
2. What is the operational difference between pause and kill for an in-flight tool call?
3. How does a short credential lease act as a dead-man's switch?
4. After a kill, the checkpoint shows a pending `create_invoice` call with key `run-77:12`. How should the system decide whether the invoice was created?
5. Name two ways an agent could route around a brake that is enforced only in its harness.

<details>
<summary>Answers</summary>

1. It is a prompt-layer request processed by the actor being stopped. A mistaken, steered, or misaligned model may not comply, and the harness and its credentials keep running regardless. The brake must be state in a control plane that the harness, broker, and gateway enforce.
2. Pause lets the current call finish (within the lease), stops renewal, and preserves state for a two-person resume. Kill revokes credentials immediately and terminates the sandbox, abandoning the call, which may leave it partially applied and requires reconciliation.
3. Credentials are valid only for the lease's TTL and are renewed only while the control plane says the run is running. If the harness hangs, is partitioned, or is tampered with, renewal stops and access ends within one TTL without any human action.
4. Query the invoicing backend by idempotency key `run-77:12` (or reconcile against the system of record). If it exists, record the stored result; if not, the call did not take effect. The model's account of what happened is not evidence.
5. Examples: credentials it obtained outside the broker (a key in a file), background jobs or sub-agents not registered under the run, write access to the harness code or its configuration, or a network path to the control plane's write API.

</details>
