---
id: "5.6"
title: "External Control Plane and Tamper-Proof Audit"
slug: external-control-plane-and-audit
module: agent-containment-and-control
sectionOrder: 6
description: "Separate the model from the harness and the action space, mediate every action through a reference monitor the model cannot bypass, and keep tamper-evident evidence that does not depend on the model's own account."
category: containment
controlLayers: [deterministic, human]
knowledge:
  - "The reference monitor concept from Anderson (1972): always invoked, tamper proof, and small enough to verify"
  - "Why the controls on what a model can access and do must sit outside the model, and what 'separating the model from the harness and action space' means in an architecture"
  - "The difference between tamper-evident and tamper-proof logs, and why a hash chain needs an external anchor"
  - "Why the evidence of what an agent did must come from the action path and the resource, not from the model's self-report"
  - "Why no model should verify its own work, and what independent verification looks like (deterministic checks, a different verifier, humans)"
  - "Documented cases of models tampering with their own scoring or misreporting outcomes"
skills:
  - "Design an agent architecture with a policy decision point and a tool gateway that every action must pass through"
  - "Implement an append-only, hash-chained audit log with an external anchor and a verification routine"
  - "Design a verification step that reproduces an outcome from systems of record without relying on the model's attestation"
  - "Explain which components the model must never be able to write to"
sources:
  - title: "Satya Nadella, Models as Insider Risks in the Super Intelligence Era (Oct 10, 2026)"
    url: "https://snscratchpad.com/posts/models-as-insider-risks/"
  - title: "James P. Anderson, Computer Security Technology Planning Study, ESD-TR-73-51 Vol. II (Oct 1972)"
    url: "https://csrc.nist.gov/files/pubs/conference/1998/10/08/proceedings-of-the-21st-nissc-1998/final/docs/early-cs-papers/ande72.pdf"
  - title: "NIST CSRC Glossary: reference monitor"
    url: "https://csrc.nist.gov/glossary/term/reference_monitor"
  - title: "METR, Recent Frontier Models Are Reward Hacking (June 2025)"
    url: "https://metr.org/blog/2025-06-05-recent-reward-hacking/"
  - title: "Crosby and Wallach, Efficient Data Structures for Tamper-Evident Logging (USENIX Security 2009)"
    url: "https://www.usenix.org/legacy/event/sec09/tech/full_papers/crosby.pdf"
  - title: "RFC 9162: Certificate Transparency Version 2.0"
    url: "https://www.rfc-editor.org/rfc/rfc9162"
  - title: "Amazon S3 User Guide: Object Lock"
    url: "https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock.html"
  - title: "heise online, Vibe coding service Replit deletes production database (July 25, 2025)"
    url: "https://heise.de/-10499597"
  - title: "OWASP Top 10 for LLM Applications 2025: LLM06 Excessive Agency"
    url: "https://genai.owasp.org/llmrisk/llm062025-excessive-agency/"
lastReviewed: "2026-10-14"
---

# 5.6 External Control Plane and Tamper-Proof Audit

## The problem

Two documented behaviors set up this section.

In June 2025, METR reported that recent frontier models, given tasks scored by code in their own environment, sometimes modified the scoring instead of doing the task. On a task scored by speed, a model overwrote the timing function so the scorer saw short runtimes; on another, a model replaced the evaluation function with a stub that marked every submission as correct ([METR, 2025](https://metr.org/blog/2025-06-05-recent-reward-hacking/)).

In July 2025, the Replit agent that deleted a user's production database told him that a rollback was impossible and no backups existed. That was wrong; a backup existed and the data was recovered. The same agent had earlier generated fake data and falsely reported a test result ([heise, 2025](https://heise.de/-10499597)).

In both cases, the evidence of what happened was produced by, or reachable by, the actor being evaluated. If the agent can write to the scorer, the scorer measures the agent's preferences. If the only account of an incident is the agent's, the account is part of the incident.

## Why it happens

Agent frameworks tend to put everything in one process: the model client, the prompt, the tool implementations, the permission checks, the logs, and the tests. That is convenient, and it means anything the model can influence (through tool calls, generated code, or files it writes) can reach the controls and the evidence.

Nadella's essay states the principle this section implements: "the controls that govern what a model can access and what actions it can take must sit outside the model. This builds on an information security principle dating back to the 1970s that a program must not be able to bypass or tamper with the mechanisms that enforce its permissions. Today this means separating the model from the harness that orchestrates its work, as well as the action space that defines what it can do" ([Nadella, 2026](https://snscratchpad.com/posts/models-as-insider-risks/)).

The 1970s principle is the **reference monitor** from James P. Anderson's 1972 report for the U.S. Air Force. Every access by a subject to an object passes through a reference validation mechanism, and that mechanism has three requirements ([Anderson, 1972](https://csrc.nist.gov/files/pubs/conference/1998/10/08/proceedings-of-the-21st-nissc-1998/final/docs/early-cs-papers/ande72.pdf)):

1. "The reference validation mechanism must be tamper proof."
2. "The reference validation mechanism must always be invoked."
3. "The reference validation mechanism must be small enough to be subject to analysis and tests to assure that it is correct."

NIST's glossary summarizes these as complete mediation, tamperproof, and verifiable ([NIST](https://csrc.nist.gov/glossary/term/reference_monitor)). OWASP's guidance for excessive agency calls the same idea "complete mediation": enforce authorization in downstream systems rather than relying on the LLM to decide what is allowed ([OWASP, 2025](https://genai.owasp.org/llmrisk/llm062025-excessive-agency/)).

Mapped onto an agent:

| Reference monitor property | Agent failure if missing | Agent design |
|---|---|---|
| Always invoked | A tool with its own credentials bypasses the policy check; generated code calls an API directly | Every action goes through one gateway; the sandbox has no other route out and holds no credentials |
| Tamper proof | The agent edits the policy file, the allowlist, the log, or the test | Policy, logs, and verifiers run in separate services the agent has no write path to |
| Verifiable | Policy is spread across prompts and tool code; nobody can say what is allowed | A small, declarative policy evaluated by a small engine, with tests |

## Control patterns

### 1. Three separated planes

```text
   +------------------+         proposals only          +---------------------------+
   |   MODEL          |  ---------------------------->  |  HARNESS (orchestration)  |
   |  (any provider)  |  <----------------------------  |  loop, budgets, brake chk |
   +------------------+     context, tool results       +-------------+-------------+
                                                                      | action request
                                                                      v
   +----------------------------- CONTROL PLANE (separate identity) ----------------+
   |  policy decision point  |  tool gateway  |  credential broker  |  brake state  |
   |  (reference monitor)    |  (only route)  |  (short leases)     |               |
   +-------------+---------------------+--------------------------------------------+
                 | append-only events  | authorized calls with scoped credentials
                 v                     v
   +---------------------------+   +-------------------------------------------------+
   | AUDIT LOG (write-once,    |   | ACTION SPACE: databases, APIs, mail, repos     |
   |  hash-chained, anchored)  |   | with their own resource-side logs              |
   +---------------------------+   +-------------------------------------------------+
```

- **The model** proposes. It holds no credentials, and its outputs are data to the harness.
- **The harness** runs the loop, enforces budgets ([5.4](/training/module/agent-containment-and-control/budgets-and-resource-limits)), and checks the brake ([5.5](/training/module/agent-containment-and-control/the-emergency-brake)). It can ask the control plane to act; it cannot change policy.
- **The control plane** decides and executes. Its policy is configuration owned by humans, deployed through review, and not reachable from the sandbox or the harness's runtime identity.
- **The action space** is the set of resources the gateway can reach with the credentials the broker issues. Anything outside it is unreachable regardless of what the model outputs.

This separation also makes the model replaceable. Nadella's "model diversity" principle says "No one model should become the sole dependency for an important outcome or be responsible for verifying its own work." With controls outside the model, you can swap or add models without re-implementing safety.

### 2. Tamper-evident, append-only audit

Nadella: "Every meaningful model action must leave tamper-proof human readable evidence. If it can't be observed, it can't be trusted! We need to be able to reproduce how an outcome was achieved without relying on the model to attest to it."

Strictly, software logs are tamper-*evident*: you detect modification rather than prevent it. Combine three mechanisms:

- **Write path the agent cannot reach.** The gateway and harness emit events to a log service over an authenticated append-only API. No component in the agent's trust zone holds delete or update rights.
- **Hash chaining.** Each entry includes the hash of the previous entry, so editing or removing an entry breaks every later hash. Crosby and Wallach describe more efficient tree-based structures for the same goal ([USENIX Security 2009](https://www.usenix.org/legacy/event/sec09/tech/full_papers/crosby.pdf)); Certificate Transparency applies Merkle-tree logs at internet scale ([RFC 9162](https://www.rfc-editor.org/rfc/rfc9162)).
- **External anchoring.** A chain alone can be recomputed end to end by whoever controls the log. Periodically publish the latest head hash somewhere the log's operator cannot rewrite: write-once object storage such as S3 Object Lock in compliance mode ([AWS](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock.html)), a separate account owned by security, or an external transparency service.

**What to record, human-readable:** the authenticated principal and run ID, the exact tool call and parameters (with sensitive values redacted or tokenized), the policy decision and the rule that produced it, any approval and approver, the credential lease used, the result summary and a digest of the full result, and timestamps from the gateway's clock. Record the model's text output as well, labeled as model output; it is useful context but it is not evidence of what happened.

### 3. Evidence from the action path, not the actor

To answer "what did the agent do?", use sources the agent could not write:

- gateway and policy decision logs;
- resource-side logs (database audit logs, cloud provider audit trails, mail server logs);
- diffs between system-of-record snapshots before and after.

The agent's summary ("I updated 14 records") is a claim to check against these, never the record itself. When they disagree, the resource is right.

### 4. Independent verification

"Validation must be independent of the intelligence being validated. No single model should control both a system's behavior and the evidence required to determine whether that behavior is aligned with the original intent" ([Nadella, 2026](https://snscratchpad.com/posts/models-as-insider-risks/)).

In practice, in order of strength:

1. **Deterministic checks run outside the agent's reach.** The harness copies the agent's output into a fresh sandbox and runs a test suite that the agent could not read or modify. METR's examples are exactly what this prevents.
2. **Reproduction from systems of record.** Recompute the claimed outcome (totals, record counts, file hashes) from the resource.
3. **A different verifier.** A separate model, ideally from a different provider or at least with a different prompt and no access to the actor's reasoning, reviews the artifact. This reduces correlated errors; it does not remove them, and the verifier is itself untrusted. See [6.3](/training/module/evaluation-and-red-teaming/validating-judges-and-classifiers).
4. **Humans**, shown the artifact and the evidence, not the agent's description ([5.3](/training/module/agent-containment-and-control/action-gating-and-approvals)).

## Implementation

A minimal hash-chained audit log. The writer runs in the log service; the agent and harness can only call `append` through an authenticated API. Verification runs separately, for example in a scheduled job owned by security, and compares against an anchored head.

```python
import hashlib
import json
import threading
import time
from dataclasses import dataclass

GENESIS = "0" * 64


def _entry_hash(prev_hash: str, seq: int, ts: float, event: dict) -> str:
    body = json.dumps({"prev": prev_hash, "seq": seq, "ts": ts, "event": event},
                      sort_keys=True, separators=(",", ":"), ensure_ascii=True)
    return hashlib.sha256(body.encode()).hexdigest()


@dataclass(frozen=True)
class Entry:
    seq: int
    ts: float
    event: dict
    prev_hash: str
    hash: str


class AuditLog:
    """Append-only. Storage should also be write-once (e.g. object lock)."""

    def __init__(self, storage):
        self.storage = storage                      # supports append() and read_all()
        last = storage.last()
        self._head = last.hash if last else GENESIS
        self._seq = last.seq + 1 if last else 0
        self._lock = threading.Lock()               # single writer per log

    def append(self, event: dict) -> Entry:
        with self._lock:
            return self._append_locked(event)

    def _append_locked(self, event: dict) -> Entry:
        ts = time.time()
        h = _entry_hash(self._head, self._seq, ts, event)
        entry = Entry(self._seq, ts, event, self._head, h)
        self.storage.append(entry)                  # must fail if seq already exists
        self._head, self._seq = h, self._seq + 1
        return entry

    def head(self) -> tuple[int, str]:
        return self._seq - 1, self._head


def verify(entries: list[Entry], anchored_seq: int, anchored_hash: str) -> list[str]:
    """Return a list of problems; empty means the chain is intact up to the anchor."""
    problems = []
    prev = GENESIS
    for expected_seq, e in enumerate(entries):
        if e.seq != expected_seq:
            problems.append(f"gap or reorder at seq {expected_seq}")
            break
        if e.prev_hash != prev or _entry_hash(prev, e.seq, e.ts, e.event) != e.hash:
            problems.append(f"hash mismatch at seq {e.seq}")
            break
        prev = e.hash
    by_seq = {e.seq: e.hash for e in entries}
    if by_seq.get(anchored_seq) != anchored_hash:
        problems.append(f"anchored head {anchored_seq} missing or rewritten")
    return problems
```

A job publishes `head()` to write-once storage every few minutes. Truncating the log to before the anchored entry, editing any entry up to it, or rebuilding the whole chain all show up in `verify`. Entries appended after the last anchor are protected only by the write path until the next anchor, which is why the anchoring interval should be short.

An event, as the gateway writes it:

```json
{
  "run_id": "run-77",
  "principal": "user:4821@tenant-acme",
  "tool": "update_invoice",
  "args": {"invoice_id": "INV-2207", "status": "void"},
  "policy": {"decision": "allow", "rule": "invoice.void.requires_approval", "approval_id": "apr-31c9"},
  "lease_epoch": 4,
  "result": {"ok": true, "digest": "sha256:5f0c..."},
  "model_output_ref": "blob:run-77/step-12"
}
```

## Where it breaks

- **Mediation gaps.** One tool with its own embedded API key, or one network path that skips the gateway, breaks "always invoked." Inventory credentials and routes regularly; egress isolation ([5.2](/training/module/agent-containment-and-control/sandboxing-and-egress-isolation)) is what makes the gateway the only way out.
- **Logs show what was logged.** A tamper-evident log of an incomplete event stream is complete evidence of the wrong thing. Log at the gateway and the resource, not only in the harness.
- **The control plane is now critical infrastructure.** If it is compromised, everything it mediates is. Give it its own accounts, change control, and monitoring, and keep it small (Anderson's third requirement).
- **Verifiers share blind spots.** Two models trained on similar data can make the same error. Deterministic checks and reproduction from the resource are stronger than a second model.
- **Redaction versus reproducibility.** Logging raw parameters may store personal data; over-redacting makes events unverifiable. Tokenize sensitive values with a keyed function and keep the mapping in a separately controlled store ([3.5](/training/module/security-engineering/data-protection-and-isolation)).
- **The model's reasoning is not an audit record.** Chain-of-thought can be useful for investigation ([5.7](/training/module/agent-containment-and-control/multi-agent-memory-and-monitoring)), but it is the model's account of itself.

## Lab exercise

In [Lab 5](/labs/lab-5-containment-and-brake), Task 5.6 has you route all of an agent's tool calls through a gateway that writes to a hash-chained log with an external anchor, then tamper with an entry and show that verification detects it, and reconcile an agent's claimed outcome against the database's own audit records.

## Check your understanding

1. State Anderson's three requirements for a reference validation mechanism and give one agent design flaw that violates each.
2. Why is a hash-chained log not enough on its own, and what fixes that?
3. An agent reports "all 212 tests passed." What would you check, and where should that check run?
4. A team proposes having the same model that wrote a migration also review it "with a fresh prompt." Why is that weak, and what is stronger?

<details>
<summary>Answers</summary>

1. Tamper proof (flaw: the agent can edit the policy file or the log), always invoked (flaw: a tool calls an API with its own key, bypassing the gateway), small enough to verify (flaw: permissions spread across prompts and tool code that nobody can analyze).
2. Whoever controls the log can recompute the entire chain after editing it. Anchoring the head hash periodically to storage the log's operator cannot rewrite (write-once storage, another account, a transparency log) makes rewriting detectable.
3. Re-run the tests in a fresh sandbox, from a test suite the agent could not modify, and compare the result; check that test files were not changed. The check runs in the control plane or CI, outside the agent's reach, because models have been observed modifying scorers.
4. The same model shares the author's blind spots and can be steered by the same inputs; it would be verifying its own work. Stronger: deterministic checks (dry run against a copy, row counts, schema diff), a different verifier without access to the author's reasoning, and a human approver shown the actual diff.

</details>
