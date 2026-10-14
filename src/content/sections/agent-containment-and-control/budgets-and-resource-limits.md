---
id: "5.4"
title: "Budgets and Resource Limits"
slug: budgets-and-resource-limits
module: agent-containment-and-control
sectionOrder: 4
description: "Bound every agent run in steps, tokens, money, time, and rate, enforce those bounds in the harness and gateway, and detect loops before they spend the budget."
category: containment
controlLayers: [deterministic]
knowledge:
  - "The budget dimensions for an agent run: steps, tokens, cost, wall-clock time, tool-call rate, and per-tool caps"
  - "Unbounded consumption and denial-of-wallet as defined in OWASP LLM10:2025"
  - "Why budgets are enforced by the harness and gateway and not requested of the model"
  - "How reserve-then-settle accounting prevents concurrent calls from overshooting a cost cap"
  - "Loop and no-progress detection using canonical action fingerprints"
  - "Why per-tenant quotas must key on authenticated identity"
skills:
  - "Design a layered budget for an agent: per step, per run, per user, per tenant, and global"
  - "Implement a budget ledger with atomic reservation and settlement"
  - "Implement a loop detector that stops repeated or non-progressing actions"
  - "Explain what an agent should do when a budget is exhausted, and why it fails closed"
sources:
  - title: "OWASP Top 10 for LLM Applications 2025: LLM10 Unbounded Consumption"
    url: "https://genai.owasp.org/llmrisk/llm102025-unbounded-consumption/"
  - title: "OWASP Top 10 for LLM Applications 2025: LLM06 Excessive Agency"
    url: "https://genai.owasp.org/llmrisk/llm062025-excessive-agency/"
  - title: "METR, Measuring AI Ability to Complete Long Tasks (Mar 2025)"
    url: "https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/"
  - title: "Hugging Face, Anatomy of a Frontier Lab Agent Intrusion: A Technical Timeline of the July 2026 Incident"
    url: "https://huggingface.co/blog/agent-intrusion-technical-timeline"
  - title: "UK AI Security Institute, Inspect documentation: Sandboxing"
    url: "https://inspect.aisi.org.uk/sandboxing.html"
lastReviewed: "2026-10-14"
---

# 5.4 Budgets and Resource Limits

## The problem

A research agent is asked to "find every supplier contract that mentions a force majeure clause." The search tool returns paginated results, and a bug makes page 2 return the same results as page 1. The agent requests page 2 again, receives the same results, reasons that it must have missed something, and tries again with a slightly different query. Each iteration reads a few thousand tokens of contract text. Nobody is watching; the job was scheduled overnight. By morning the run has made 11,000 model calls and spent more than the team's monthly inference budget. No individual call was harmful.

Change one detail. The same agent is reachable from a public chat widget. An attacker, using free accounts, sends requests designed to make the agent run long tool chains. The cost lands on the operator. OWASP lists this as Unbounded Consumption (LLM10:2025), including "Denial of Wallet," where attackers "exploit the cost-per-use model of cloud-based AI services" ([OWASP, 2025](https://genai.owasp.org/llmrisk/llm102025-unbounded-consumption/)).

## Why it happens

An agent is a loop with a model deciding when to exit. The exit condition is a judgment ("I have finished"), and judgments fail: the model misreads a tool result, a tool returns an error the model treats as transient, two agents wait on each other, or an injected instruction says "keep searching until you find X." Without an external bound, the loop's cost has no ceiling.

Three trends make this worse over time:

- **Longer horizons.** METR's 2025 measurements found that the length of tasks frontier agents can complete with 50% reliability had been doubling roughly every seven months ([METR, 2025](https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/)). Longer tasks mean longer legitimate runs, which makes "it ran for a long time" a weaker signal on its own.
- **Machine speed.** An agent can act far faster than a human operator can notice. Hugging Face's account of the July 2026 intrusion counted roughly 17,600 recovered agent actions and observed that "volume is what changes the defensive problem" ([Hugging Face, 2026](https://huggingface.co/blog/agent-intrusion-technical-timeline)).
- **Fan-out.** Agents that spawn sub-agents or parallel tool calls multiply consumption per step.

Asking the model to "stop after 20 steps" is a prompt-layer request. The model may count wrong, may be persuaded to ignore it, or may never reach the instruction because it is stuck in a tool loop. Budgets are containment controls: they work regardless of why the run is consuming resources, and they must be enforced by code the model does not control.

## Control patterns

Ordered from strongest to weakest. All are `deterministic` unless noted.

**1. Hard caps in the harness and gateway.** Each run has explicit limits, checked before every model call and every tool call:

| Dimension | Example limit | Enforced at |
|---|---|---|
| Steps (model turns) | 40 per run | Harness loop |
| Tokens | 400k input + output per run | Harness, using provider usage reports |
| Cost | $5 per run, $50 per user per day | Budget ledger in the gateway |
| Wall-clock time | 30 minutes per run | Harness, plus a lease that expires ([5.5](/training/module/agent-containment-and-control/the-emergency-brake)) |
| Tool rate | 10 calls per minute; 3 emails per run | Tool gateway |
| Sandbox resources | CPU, memory, processes, disk | Sandbox runtime ([5.2](/training/module/agent-containment-and-control/sandboxing-and-egress-isolation)) |
| Output size | 1 MB per tool result | Tool gateway (truncate and say so) |

**2. Layered quotas keyed on authenticated identity.** Run budgets bound one task. Per-user, per-tenant, and global budgets bound the sum. Key quotas on the authenticated principal (account, tenant, API key), never on a value the client supplies, such as a session ID in the request body or an IP address that rotates. Free tiers need stricter limits and should be capped globally so a flood of new accounts has a bounded total cost.

**3. Reserve, then settle.** Before a model or tool call, reserve its worst-case cost (maximum output tokens times price, plus input). After the call, settle the actual cost and release the remainder. This prevents parallel calls from each seeing "budget remaining" and collectively overshooting.

**4. Loop and no-progress detection.** Fingerprint each action (tool name plus canonicalized arguments) and each result. Stop or escalate when the same action repeats more than N times, when results stop changing, or when the run alternates between a small set of states. This catches the pagination bug above within a few iterations instead of 11,000.

**5. Fail closed, with a useful end state.** When a budget is exhausted, the harness stops the run, checkpoints, and returns a structured status: what was done, what remains, and which limit triggered. It does not ask the model whether to continue. Raising a limit for a run is a human action, logged like any other approval.

**6. Caps on effects, not only on calls.** Some of the most useful limits count consequences rather than calls: total refund value per agent per day, number of distinct external recipients per run, number of records modified per run, number of production deploys per hour. These caps are enforced in the tool backend or gateway, aggregated across runs, and keyed on the authenticated principal. They are the counter to decomposition, where an agent blocked on one large action achieves the same effect through many small ones that each fall under the approval threshold ([5.3](/training/module/agent-containment-and-control/action-gating-and-approvals)). Set the aggregate below the level at which a single approval would have been required, so splitting an action never avoids review.

**7. Alert on consumption anomalies (runtime monitoring).** Cost per run, steps per run, and per-tenant spend have stable distributions. Alert on outliers well before the hard cap. This is detection, not prevention, and complements the caps.

## Implementation

A budget ledger with atomic reservation, and a loop detector. The ledger is shown in-process with a lock; in production it lives in the gateway, backed by a store with atomic operations (for example a database row updated with a conditional `UPDATE`).

```python
import hashlib
import json
import threading
from collections import Counter
from dataclasses import dataclass, field


class BudgetExceeded(Exception):
    pass


@dataclass
class RunBudget:
    max_steps: int
    max_cost_usd: float
    steps_used: int = 0
    cost_settled: float = 0.0
    cost_reserved: float = 0.0
    _lock: threading.Lock = field(default_factory=threading.Lock)

    def reserve(self, worst_case_usd: float) -> float:
        if worst_case_usd < 0:
            raise ValueError("negative reservation")
        with self._lock:
            if self.steps_used >= self.max_steps:
                raise BudgetExceeded("step limit")
            if self.cost_settled + self.cost_reserved + worst_case_usd > self.max_cost_usd:
                raise BudgetExceeded("cost limit")
            self.steps_used += 1
            self.cost_reserved += worst_case_usd
            return worst_case_usd

    def settle(self, reserved_usd: float, actual_usd: float) -> None:
        with self._lock:
            self.cost_reserved -= reserved_usd
            # Charge the actual cost even if it exceeds the reservation; never undercount.
            self.cost_settled += max(actual_usd, 0.0)


def fingerprint(tool: str, args: dict) -> str:
    canonical = json.dumps({"t": tool, "a": args}, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(canonical.encode()).hexdigest()[:16]


@dataclass
class LoopDetector:
    max_repeats: int = 3
    max_stale_results: int = 4
    seen_actions: Counter = field(default_factory=Counter)
    last_result: str | None = None
    stale_count: int = 0

    def check(self, tool: str, args: dict) -> None:
        fp = fingerprint(tool, args)
        if self.seen_actions[fp] >= self.max_repeats:
            raise BudgetExceeded(f"repeated action {tool} x{self.max_repeats}")
        self.seen_actions[fp] += 1

    def observe(self, result: dict) -> None:
        digest = hashlib.sha256(json.dumps(result, sort_keys=True, default=str).encode()).hexdigest()
        self.stale_count = self.stale_count + 1 if digest == self.last_result else 0
        self.last_result = digest
        if self.stale_count >= self.max_stale_results:
            raise BudgetExceeded("no progress: identical results")


def worst_case_cost(prompt_tokens: int, max_output_tokens: int, price) -> float:
    return prompt_tokens * price.input_per_token + max_output_tokens * price.output_per_token
```

The harness calls `budget.reserve(...)` before each model call with `max_output_tokens` set explicitly on the request (so the worst case is actually bounded), then `settle` with the provider-reported usage, in a `finally` block so failed calls are still accounted for. It calls `loop.check(...)` before each tool call and `loop.observe(...)` after. A `BudgetExceeded` exception ends the run through the same stop path as the emergency brake: checkpoint, release credentials, report.

Per-tenant and global ledgers use the same reserve/settle logic, keyed on the authenticated tenant ID. A run must reserve successfully at every level (run, user, tenant, global) or it does not proceed.

### What happens at the limit

When any limit trips, the harness does the same four things it does when a human pulls the brake: stop scheduling steps, checkpoint, stop renewing the run's credential lease, and write an audit event naming the limit and the values at the time. The user receives a structured status built by the harness ("Stopped: step limit 40 reached. Completed: 3 of 5 sub-tasks. Pending: none in flight."), not a model-written apology that may misstate what was done. A human can extend the budget for that run; the extension is logged with who approved it and why, and it does not change the default for other runs.

### Choosing limits

Set limits from observed distributions, not guesses. Run the agent on a representative task set, record steps, tokens, cost, and time per run, and set the hard cap above the 99th percentile of successful runs with headroom, and the alert threshold around the 95th. Recompute when the model, prompt, or tools change. If a task category regularly hits the cap, split it into a separate task type with its own budget and review, rather than raising the global cap.

## Where it breaks

- **Budgets bound cost, not harm.** One destructive call fits easily inside any budget. Budgets complement least privilege and approvals; they do not replace them.
- **Fingerprints can be evaded.** A loop that varies an argument slightly (adding a space, changing a page size) produces new fingerprints. Canonicalize arguments, and back fingerprint checks with the hard step cap.
- **Token counts arrive late.** Some costs are known only after the call. Reservation with an explicit `max_output_tokens` bounds this; without it, the worst case is unbounded.
- **Tool-side costs are invisible to the ledger.** A tool that launches a cloud job or calls a paid API incurs cost outside model tokens. Price tool calls in the ledger too, or cap them separately.
- **Distributed runs.** Sub-agents with their own budgets can together exceed the parent's intent. Child budgets are carved from the parent's reservation, not added to it.
- **Silent truncation.** Truncating large tool outputs to fit limits can cause wrong conclusions. Inspect's documentation warns that its `exec()` "may return incomplete output without raising an error" ([Inspect](https://inspect.aisi.org.uk/sandboxing.html)); tell the model explicitly when output was cut.

## Lab exercise

In [Lab 5](/labs/lab-5-containment-and-brake), Task 5.4 gives you an agent with a paginating tool that loops. You add a run ledger with reserve-and-settle accounting, a loop detector, and a per-tenant quota keyed on the authenticated tenant, then show the run stops within a few iterations with a structured status.

## Check your understanding

1. Why is "Stop after 20 tool calls" in the system prompt not a budget control?
2. Two parallel tool calls each check "remaining budget = $1.00" and each cost $0.80. What goes wrong, and what pattern prevents it?
3. A free-tier chat agent rate-limits by the `session_id` field in the request body. What is the weakness?
4. Why should child agents' budgets be carved out of the parent's reservation?

<details>
<summary>Answers</summary>

1. It is a request to the model, enforced only if the model counts correctly and is not persuaded or stuck. A budget is enforced by the harness or gateway, which refuses the call regardless of what the model intends.
2. Both pass the check and together spend $1.60. Reserve-then-settle takes the worst-case cost atomically before the call, so the second reservation fails.
3. The client controls that field, so an attacker can mint unlimited session IDs and bypass the limit. Quotas must key on an authenticated identity, with a global cap on unauthenticated or free usage.
4. Otherwise each sub-agent has a full budget of its own, and fan-out multiplies total consumption beyond what the parent run was allowed. Carving keeps the total bounded by the parent's limit.

</details>
