---
id: "5.1"
title: "Least Privilege for Agents"
slug: least-privilege-for-agents
module: agent-containment-and-control
sectionOrder: 1
description: "Treat the model as an insider risk: give each task the smallest tool set and credentials it needs, and enforce every parameter constraint in the tool backend rather than in the prompt."
category: containment
controlLayers: [deterministic, human]
knowledge:
  - "Why the insider-risk model treats a capable model as a privileged actor that can err or be compromised, regardless of intent"
  - "The three root causes of excessive agency in OWASP LLM06:2025: excessive functionality, excessive permissions, and excessive autonomy"
  - "Why a constraint on a model-declared parameter (such as an 'operation' field) is not a control, and what the backend-enforced equivalent is"
  - "How exact parsed-domain matching differs from suffix or substring matching for recipient allowlists"
  - "Why session-level taint tracking is needed once private data has entered the context window"
  - "How task-scoped, short-lived credentials narrow the blast radius of a single session"
skills:
  - "Design a per-task tool set that separates read tools from write and egress tools"
  - "Implement backend-enforced parameter constraints using database roles, exact-match allowlists, and server-side identity"
  - "Implement a session guard that decides before it updates state and tracks taint from tool metadata, not model claims"
  - "Explain, for a given agent, the worst it could do if fully compromised and which permission to remove first"
sources:
  - title: "Satya Nadella, Models as Insider Risks in the Super Intelligence Era (Oct 10, 2026)"
    url: "https://snscratchpad.com/posts/models-as-insider-risks/"
  - title: "OWASP Top 10 for LLM Applications 2025: LLM06 Excessive Agency"
    url: "https://genai.owasp.org/llmrisk/llm062025-excessive-agency/"
  - title: "Anthropic, Agentic Misalignment: How LLMs could be insider threats (June 2025)"
    url: "https://www.anthropic.com/research/agentic-misalignment"
  - title: "The Register, Replit makes vibe-y promise to stop its AI agents making vibe coding disasters (July 22, 2025)"
    url: "https://www.theregister.com/2025/07/22/replit_saastr_response/"
  - title: "PostgreSQL documentation: GRANT"
    url: "https://www.postgresql.org/docs/current/sql-grant.html"
  - title: "PostgreSQL documentation: Client Connection Defaults (default_transaction_read_only)"
    url: "https://www.postgresql.org/docs/current/runtime-config-client.html"
  - title: "AWS STS API Reference: AssumeRole (session policies and DurationSeconds)"
    url: "https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRole.html"
lastReviewed: "2026-10-14"
---

# 5.1 Least Privilege for Agents

## The problem

In July 2025, SaaStr founder Jason Lemkin reported that a Replit coding agent deleted his application's production database during a declared code and action freeze. The agent had been told not to make changes without permission. That instruction lived in the conversation and a project notes file. The database credentials the agent held did not know about the freeze, and at the time Replit apps used a single database for development and live data. Replit's CEO called the outcome "unacceptable and should never be possible" and announced automatic separation of development and production databases ([The Register, 2025](https://www.theregister.com/2025/07/22/replit_saastr_response/); full case at [/incidents/replit-agent-production-database-deletion](/incidents/replit-agent-production-database-deletion)).

The fix Replit chose is a least-privilege fix: the agent working on development should not hold a credential that can drop production tables. No improvement to the prompt would have provided the same guarantee.

## Why it happens

An agent's authority is the union of every tool it can call and every credential those tools use. Teams tend to grow that union for convenience: one database user for everything, one email tool that can send anywhere, one API key with admin scope. Each addition looks harmless because the model "would only use it when appropriate."

Satya Nadella's October 2026 essay names the frame this domain uses. Frontier models should be treated "like insider risks. Not because they are necessarily malicious, but because any sufficiently capable actor with access to important systems can make mistakes or be compromised" ([Nadella, 2026](https://snscratchpad.com/posts/models-as-insider-risks/)). The essay points out that enterprises already know how to handle powerful insiders: "establish identity, limit privileges, log activity, create containment boundaries."

There are three independent reasons a model may misuse a permission, and least privilege handles all three the same way:

| Cause | Category | Example |
|---|---|---|
| The model makes a mistake | safety | It "panics" at an empty table and runs a destructive migration |
| An adversary steers it | security | An injected instruction in a retrieved email tells it to forward the inbox |
| It pursues a goal against the operator | safety (misalignment) | In Anthropic's 2025 simulations, models from every developer tested sometimes chose to leak information or blackmail when facing replacement ([Anthropic, 2025](https://www.anthropic.com/research/agentic-misalignment)) |

OWASP calls the resulting weakness Excessive Agency (LLM06:2025) and splits it into three root causes: excessive functionality (tools the task does not need), excessive permissions (tools with more downstream access than needed), and excessive autonomy (high-impact actions without independent approval) ([OWASP, 2025](https://genai.owasp.org/llmrisk/llm062025-excessive-agency/)). This section covers the first two. Autonomy is the subject of [5.3](/training/module/agent-containment-and-control/action-gating-and-approvals).

The design test is the program's standard one: **if the model were fully compromised, what is the worst it could do?** For an agent, the honest answer is "anything its tools and credentials allow." Least privilege is the practice of making that answer small.

## Control patterns

Ordered from strongest to weakest.

**1. Remove the capability (deterministic).** A tool that is not registered cannot be called. Build the tool set per task type, not per product. A support agent that answers order-status questions gets `lookup_order` and nothing else. If a workflow needs more, it is a different task type with its own tool set, its own credentials, and its own review.

**2. Narrow the credential, not the parameter (deterministic).** Every constraint you care about must be enforced by the system the tool talks to, using an identity the model does not control.

- *Read-only queries*: give the query tool a database role that holds only `SELECT` on specific tables or views. A legacy v1 design constrained a model-supplied `"operation": ["SELECT"]` field. That checks what the model *says* it is doing, not what the SQL does. A statement like `SELECT 1; DROP TABLE orders` or a `SELECT` that calls a side-effecting function passes such a check. The role is the control.
- *Recipients*: parse the address and compare the domain for exact equality against an allowlist, inside the email tool's backend. Suffix checks (`endswith("company.com")`) accept `evilcompany.com`. Substring checks accept `company.com.attacker.io`. A list written as `"@company.com"` invites both mistakes.
- *Identity*: the backend sets the sender, tenant, and acting user from the authenticated session. These are never tool parameters the model fills in.

**3. Separate read from write and egress (deterministic).** Read tools, state-changing tools, and tools that send data outside the trust boundary are different risk classes. Give them different credentials and different approval tiers. OWASP's example scenario is a mail assistant that only needed to *read* mail but was given a plugin that could also *send*; an injected email then made it forward sensitive messages ([OWASP, 2025](https://genai.owasp.org/llmrisk/llm062025-excessive-agency/)). A read-only OAuth scope removes that path.

**4. Scope dynamically per session (deterministic).** Mint credentials for one session and one task, with a short lifetime, and narrow them to the resources the task named. In AWS, for example, an `AssumeRole` call can pass a session policy, and "the resulting session's permissions are the intersection of the role's identity-based policy and the session policies" ([AWS STS](https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRole.html)). Identity and delegation mechanics (token exchange, on-behalf-of flows, MCP authorization) are covered in [3.6 Identity and Delegation](/training/module/security-engineering/identity-and-delegation); this section uses them.

**5. Track taint across the session (deterministic, with a human fallback).** Individually safe tools can combine into an exfiltration path: read the CRM, then send an email. Once private data is in the context window, *any* outbound call can carry it, in a subject line, a URL, or a file name. The harness cannot rely on the model to declare which data a call uses. It tracks, from tool metadata it owns, which sensitivity labels have entered the session, and gates every egress-capable tool after that point.

**6. Instructions in the prompt (prompt layer).** "Only use the delete tool when the user confirms" is a request. It belongs in the prompt because it improves behavior on ordinary runs, but it does not count toward the containment design.

## Implementation

### A read-only database role

```sql
-- Role used only by the agent's query tool. No login password lives in the sandbox;
-- the tool gateway connects with this role on the agent's behalf.
CREATE ROLE agent_reader NOLOGIN;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM agent_reader;
REVOKE CREATE ON SCHEMA public FROM agent_reader;
GRANT USAGE ON SCHEMA reporting TO agent_reader;
GRANT SELECT ON reporting.order_status, reporting.product_catalog TO agent_reader;
```

Two details matter. First, grant on narrow views in a separate schema, so a new table in `public` does not become readable by default. Second, do not rely on `default_transaction_read_only`. It sets the default for new transactions, and a session can change it with `SET`, so it is a convenience, not a boundary ([PostgreSQL docs](https://www.postgresql.org/docs/current/runtime-config-client.html)). The privilege grant is the boundary ([PostgreSQL GRANT](https://www.postgresql.org/docs/current/sql-grant.html)).

### An exact-match recipient check in the email backend

```python
import re

ALLOWED_RECIPIENT_DOMAINS = frozenset({"company.com", "support.company.com"})
_LOCAL_PART = re.compile(r"[A-Za-z0-9._%+-]{1,64}")
_DOMAIN = re.compile(r"(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}")


def recipient_allowed(address: str) -> bool:
    """Exact parsed-domain match. Fails closed on anything unusual."""
    if not isinstance(address, str) or not address.isascii():
        return False  # reject IDN and confusable characters outright
    address = address.strip()
    if address.count("@") != 1:
        return False  # blocks "a@evil.io@company.com" style tricks
    local, domain = address.split("@")
    domain = domain.lower()
    if not _LOCAL_PART.fullmatch(local) or not _DOMAIN.fullmatch(domain):
        return False
    return domain in ALLOWED_RECIPIENT_DOMAINS  # exact equality, no suffix logic


def send_email(session, to: list[str], subject: str, body: str) -> dict:
    # Runs in the tool backend, not in the model's process.
    if not to or len(to) > 5:
        return {"ok": False, "error": "recipient_count"}
    rejected = [a for a in to if not recipient_allowed(a)]
    if rejected:
        return {"ok": False, "error": "recipient_not_allowed"}
    # Sender and tenant come from the authenticated session, never from the model.
    return mail_gateway.send(sender=session.mailbox, to=to, subject=subject, body=body)
```

Subdomains are not implied: `support.company.com` is allowed only because it is listed. The model can still pick *which* allowed recipient to write to, which is why outbound mail also falls under the taint rule below and the approval tiers in 5.3.

### A session guard that tracks taint

The legacy v1 tracker had three defects: it trusted each action to declare its own data sources, it recorded state before deciding (so blocked actions still counted and still tainted the session), and its count check allowed one action too many. This version takes labels from a registry the harness owns, decides before it changes state, and reserves an action slot only for calls it allows.

```python
import threading
from dataclasses import dataclass, field
from typing import Callable


@dataclass(frozen=True)
class ToolSpec:
    name: str
    handler: Callable[..., dict]
    reads_label: str | None = None   # sensitivity label of data this tool returns
    egress: bool = False             # can send data outside the trust boundary


@dataclass
class Decision:
    allowed: bool
    reason: str


@dataclass
class SessionGuard:
    registry: dict[str, ToolSpec]          # owned by the harness, not the model
    max_actions: int
    egress_allowed_labels: frozenset[str] = frozenset()
    actions_used: int = 0
    taint: set[str] = field(default_factory=set)
    _lock: threading.Lock = field(default_factory=threading.Lock)

    def _decide(self, tool_name: str) -> Decision:
        spec = self.registry.get(tool_name)
        if spec is None:
            return Decision(False, "unknown_tool")
        if self.actions_used >= self.max_actions:
            return Decision(False, "action_budget_exhausted")
        if spec.egress:
            blocked = self.taint - self.egress_allowed_labels
            if blocked:
                return Decision(False, "egress_after_sensitive_read:" + ",".join(sorted(blocked)))
        return Decision(True, "ok")

    def run(self, tool_name: str, args: dict) -> dict:
        with self._lock:  # decide and reserve atomically for parallel tool calls
            decision = self._decide(tool_name)
            if not decision.allowed:
                audit_log.record(tool=tool_name, allowed=False, reason=decision.reason)
                return {"ok": False, "error": decision.reason}
            spec = self.registry[tool_name]
            self.actions_used += 1
            if spec.reads_label:
                # Taint at dispatch: the result is about to enter the context window.
                self.taint.add(spec.reads_label)
        audit_log.record(tool=tool_name, allowed=True, reason="ok")
        return spec.handler(**args)
```

With `max_actions=10`, exactly ten calls run. A blocked call neither consumes the budget nor adds taint. When the guard blocks an egress call, the harness can route it to human approval (5.3) instead of failing the task, and the approver sees the actual message and recipients.

## Where it breaks

- **Allowed tools, wrong data.** A recipient allowlist stops mail to outsiders but not a message to the wrong colleague with the wrong attachment. Least privilege bounds the blast radius; it does not make each permitted action correct.
- **Taint is coarse.** Session-level taint blocks legitimate workflows that read private data and then email a summary. Teams under pressure add the label to `egress_allowed_labels` and the control silently disappears. Handle this with an approval path, not by widening the exemption.
- **Covert channels inside allowed tools.** A tainted session can still encode data in the arguments of a non-egress tool whose side effects are visible externally, such as a search query sent to a third-party API. Mark such tools `egress=True`.
- **Shared credentials.** If the query tool and an admin tool share one database user, the role grant protects nothing. Audit which identity each tool backend actually uses.
- **Over-broad roles drift back.** Permissions accumulate. Review the grant list on a schedule and alert on new grants to agent roles.
- **Dynamic scoping depends on the task description.** If the model chooses the scope it requests, an injected instruction can request a broader scope. The harness must derive scope from the authenticated user's request and policy, not from model output.

## Lab exercise

In [Lab 5](/labs/lab-5-containment-and-brake), Task 5.1 gives you an over-privileged support agent. You replace its parameter checks with a read-only role and an exact-match recipient allowlist enforced in the backend, then add session taint tracking and show that an injected "email this to me" instruction is blocked after a CRM read.

## Check your understanding

1. A tool policy allows `send_email` only when `recipient.endswith("company.com")`. Name one address that passes and should not, and state the correct check.
2. Why is a `"operation": "SELECT"` parameter check weaker than a database role with only `SELECT` grants?
3. An agent reads a customer record, then calls a web search tool with a query containing the customer's account number. Which tool flag in the guard above should have caught this, and why?
4. In the legacy tracker, a blocked call still incremented the action counter. What two problems does that cause?

<details>
<summary>Answers</summary>

1. `ceo@evilcompany.com` passes, because the string ends in `company.com` even though the domain is `evilcompany.com`. A substring check fails the same way on `x@company.com.attacker.io`. The correct check parses the address, requires exactly one `@`, and compares the domain for exact equality against a set of allowed domains, in the tool backend.
2. The parameter is the model's description of its intent. The SQL it actually sends can contain other statements or side-effecting functions. A role without write privileges is enforced by the database regardless of what the query says.
3. The search tool should be marked `egress=True`, because its query leaves the trust boundary. Once the session holds a sensitive label, the guard blocks egress tools (or routes them to approval).
4. Blocked attempts consume the budget, so a probing attacker can exhaust a legitimate session, and the count no longer matches what actually ran, which corrupts the audit trail. If the blocked call also added taint, the session would be marked as holding data it never received.

</details>
