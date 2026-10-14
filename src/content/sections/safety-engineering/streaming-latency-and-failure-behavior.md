---
id: "4.7"
title: "Streaming, Latency, and Failure Behavior"
slug: streaming-latency-and-failure-behavior
module: safety-engineering
sectionOrder: 7
description: "Keeping guardrails effective when output is streamed, when checks must fit a latency and cost budget, and when a guardrail dependency is slow or down: buffering windows, retraction, parallel checks, timeouts, fail-open versus fail-closed by risk, graceful degradation, and circuit breakers."
category: cross-cutting
controlLayers: [deterministic, runtime-ml, human]
knowledge:
  - "Streaming trades safety for perceived latency: a check can only run on text it has seen, so unbuffered streaming shows text before it is checked and buffered streaming must still check the final segment before releasing it."
  - "Retraction (removing text already shown) limits damage but does not undo it; the user may have read or copied the text, and downstream consumers may have acted on it."
  - "Input checks can run in parallel with generation if output is held until the check passes and no side effects (tool calls) start before it does."
  - "Every check needs a timeout and a defined result when it times out or errors; whether that result is allow, block, or a supportive fallback depends on the risk of the category, decided in advance."
  - "A circuit breaker moves from closed to open after repeated failures, from open to half-open when a reset timer elapses, and from half-open to closed only when a trial request succeeds (or back to open when it fails)."
  - "Routing traffic judged low-risk to a cheaper model with weaker guardrails gives attackers an incentive to look low-risk; keep the guardrail floor the same on every route."
skills:
  - "Implement a buffered streaming guard with a hold-back window, context overlap, and an end-of-stream check."
  - "Implement speculative generation that runs the input check in parallel and cancels generation on failure."
  - "Assign fail-open, fail-closed, or fallback behavior to each guardrail by risk, and make degraded operation visible."
  - "Implement a circuit breaker with correct state transitions around a guardrail dependency."
  - "Set per-stage latency and cost budgets and explain the safety cost of each shortcut."
sources:
  - title: "Microsoft Learn (2026), Content Streaming in Azure OpenAI (default buffered mode and Asynchronous Filter)"
    url: "https://learn.microsoft.com/en-us/azure/ai-foundry/openai/concepts/content-streaming"
  - title: "Martin Fowler (2014), CircuitBreaker"
    url: "https://martinfowler.com/bliki/CircuitBreaker.html"
lastReviewed: "2026-10-14"
---

# 4.7 Streaming, Latency, and Failure Behavior

## The problem

A team adds an output blocklist to a streamed chat assistant and tests it with non-streaming requests. The blocklist works. In production, with streaming on, some responses containing blocklisted terms reach users intact.

Microsoft's documentation for its hosted content filters describes the same gap. In the default streaming mode, completion text is buffered and checked in chunks before it is released, but "the last segment of a streamed response might be returned before the guardrail policy is applied to it." In Microsoft's tests with a custom blocklist, a blocklisted term in roughly the last 15 to 30 words of a streamed response reached the client with a normal finish reason, while the same response was blocked when streaming was off. In the optional asynchronous mode, nothing is buffered and the filter signal can arrive after up to about 1,000 characters of the violating content have been shown, so the application must redact text the user has already seen ([Microsoft Learn, 2026](https://learn.microsoft.com/en-us/azure/ai-foundry/openai/concepts/content-streaming)).

Streaming is one of several places where guardrails that work in a test harness fail in production. Others are latency budgets that push teams to skip checks, and dependencies (a moderation API, a judge, a classifier server) that time out or go down. In each case the question is the same: what does the system do when the check has not finished?

## Why it happens

**A check can only judge text it has seen.** Streaming sends tokens as they are generated, so the user sees the beginning of a response before the end exists. A check that waits for the full response defeats streaming. A check on each small piece sees too little context: whether a sentence is harmful may depend on the sentences after it.

**Latency budgets compete with checks.** Users notice time to first token. Each input check adds to it, and each output check adds to the time before text appears. Under pressure, teams move checks off the critical path, run them asynchronously, or drop them for some traffic.

**Dependencies fail.** Hosted moderation APIs rate-limit, judges time out under load, and classifier servers get redeployed. A guardrail that raises an exception on failure, inside code that catches all exceptions and carries on, is a guardrail that fails open without anyone deciding it should.

**Failure behavior is often accidental.** Whether a failed check blocks or allows is frequently decided by whoever wrote the `except` clause, not by the policy owner.

## Control patterns

### 1. Choose the streaming mode by risk (deterministic)

| Mode | What the user sees | Use when |
|---|---|---|
| No streaming | Nothing until all output checks pass | Highest-risk outputs: regulated advice, actions, anything that cannot be retracted |
| Buffered streaming | Text in chunks, each released only after it is checked | Most user-facing chat |
| Unbuffered streaming with asynchronous checks | Text immediately; violations retracted after the fact | Low-risk, internal, or creative uses where brief exposure is acceptable |

The choice belongs in the policy for each deployment ([4.1](/training/module/safety-engineering/content-policy-as-specification)), not in a client library default.

### 2. Buffered release with hold-back and context

Keep a hold-back window of the most recent text unreleased. When enough text has accumulated beyond the window, check the next batch together with a tail of already released text (so a phrase split across a boundary is seen whole), then release the batch. At the end of the stream, check the remaining held text before releasing it; skipping that final check is the gap described above. A larger window gives checks more context at the cost of a longer delay before text appears.

### 3. Retraction as damage limitation

When a check fails after text has been shown (asynchronous mode, or a later check that sees more context), replace the displayed response with a refusal template ([4.4](/training/module/safety-engineering/over-refusal-and-refusal-design)) and record the event. Retraction does not undo exposure: the user may have read it, copied it, or had it read aloud, and anything that consumed the stream (a text-to-speech engine, a webhook, a log shipper, a tool) may already have acted. Downstream consumers should act only on released, checked text.

### 4. Run checks in parallel without acting early

Two kinds of parallelism reduce latency safely:

- **Input checks in parallel with generation.** Start generation while the input check runs, hold its output, and release nothing until the input check passes. If it fails, cancel generation. The cost is wasted tokens on blocked requests. The condition is that generation in this phase has no side effects: tool calls, retrieval with the user's credentials, and writes wait for the input check.
- **Independent output checks in parallel with each other.** A content classifier, a PII detector, and a groundedness check on the same text can run concurrently, each with its own timeout. Checks whose order matters (groundedness before redaction; see [4.3](/training/module/safety-engineering/groundedness-and-hallucination)) stay sequential.

### 5. Latency and cost budgets per stage

Set a budget for each stage and for the whole request, and enforce it with timeouts:

```text
request budget (example, p95): 2,500 ms to first released text
  input normalization + rules ............   5 ms
  input classifier ........................  60 ms  (timeout 150 ms)
  judge, ambiguous band only ............. 800 ms  (timeout 1,500 ms)
  generation to first hold-back batch ..... variable
  output checks per batch ................ 100 ms  (timeout 250 ms)
cost budget: judge calls <= 5% of requests; alert on drift
```

The numbers are illustrative; measure your own. What matters is that every check has a timeout, every timeout has a defined outcome, and the fraction of requests reaching expensive stages is monitored (the ambiguous band in [4.2](/training/module/safety-engineering/detection-and-classification)).

### 6. Decide failure behavior by risk, in advance

For each check, the policy owner decides what happens when it times out, errors, or is unavailable:

| Check | When unavailable | Reason |
|---|---|---|
| Crisis-signal routing | Proceed and attach crisis resources; alert | The fallback is supportive and cheap ([4.5](/training/module/safety-engineering/sycophancy-and-vulnerable-users)) |
| Output PII redaction | Hold the response (fail closed) | Disclosure is not reversible |
| Classifier for disallowed, high-severity categories | Fail closed, or fall back to a local classifier with stricter thresholds | A miss is severe |
| Groundedness check in a high-stakes deployment | Abstain with a next step | An unchecked answer may be acted on |
| Tone or brand classifier | Fail open, log, alert | A miss is embarrassing, not harmful |
| Off-topic detector | Fail open, log | Low impact |
| Tool-call authorization | Deny | Deterministic control; not something to skip ([5.1](/training/module/agent-containment-and-control/least-privilege-for-agents)) |

Fail-open choices have an extra risk: if a check fails open on timeout, an attacker who can make it slow (very long inputs, inputs that trigger expensive paths) can switch it off. Bound input sizes before checks run ([3.3](/training/module/security-engineering/input-handling)) and keep fail-open for categories where a deliberate bypass would be low-impact.

### 7. Graceful degradation that stays visible

When a dependency is down, prefer a reduced service with the guardrail floor intact over full service without it:

- fall back from a hosted moderation API to a local classifier, with thresholds set for the weaker detector;
- disable tools or features that depend on the failed check;
- answer from templates or retrieved text only;
- route to a human queue where capacity exists.

Make degraded mode visible: a metric, an alert, and a log field on every affected decision. The worst outcome is a guardrail that has silently stopped running while dashboards show normal traffic.

### 8. Circuit breakers around guardrail dependencies

A circuit breaker stops calling a dependency that keeps failing, so requests fail fast instead of waiting on timeouts, and the dependency has time to recover ([Fowler, 2014](https://martinfowler.com/bliki/CircuitBreaker.html)):

```text
                 failure count reaches threshold
    CLOSED --------------------------------------------> OPEN
      ^                                                  |
      |                                                  | reset timeout elapses
      | trial request succeeds                           v
      +----------------------------------------------- HALF-OPEN
                                                         |
                       trial request fails               |
    OPEN <-----------------------------------------------+
    (reset timer restarts)
```

The timer moves the breaker from open to half-open. Only a successful trial request moves it from half-open to closed. When the breaker is open, the request gets the failure behavior from pattern 6 for that check; an open breaker is not permission to skip the check.

### 9. Routing must not lower the guardrail floor

Routing simple requests to a cheaper, faster model is a reasonable cost control. Routing them to a path with weaker guardrails is not: if traffic classified as low-risk gets fewer checks, attackers have a reason to make their requests look low-risk, and the risk classifier becomes the only control that matters. Vary the model and the cost on each route; keep the same minimum set of checks on all of them, and add checks for high-risk routes rather than removing them from low-risk ones.

## Implementation

A buffered streaming guard. `check` is an async function returning `True` when the text is acceptable. The guard yields events for the transport layer: `("text", s)` to release text and `("retract", reason)` to replace the whole response with a refusal.

```python
import asyncio
from collections.abc import AsyncIterator, Awaitable, Callable

Check = Callable[[str], Awaitable[bool]]


async def run_check(check: Check, text: str, timeout_s: float, fail_closed: bool) -> bool:
    """Return True if the text may be released. On timeout or error, apply the category's policy."""
    try:
        return bool(await asyncio.wait_for(check(text), timeout_s))
    except Exception:  # includes TimeoutError; CancelledError still propagates
        return not fail_closed


async def guarded_stream(pieces: AsyncIterator[str], check: Check, *, holdback_chars: int = 400,
                         min_batch_chars: int = 200, context_chars: int = 300,
                         timeout_s: float = 0.25, fail_closed: bool = True) -> AsyncIterator[tuple[str, str]]:
    released_tail = ""  # last context_chars of released text, for checks that span a boundary
    pending = ""
    async for piece in pieces:
        pending += piece
        if len(pending) >= holdback_chars + min_batch_chars:
            cut = len(pending) - holdback_chars
            batch = pending[:cut]
            if not await run_check(check, released_tail + batch, timeout_s, fail_closed):
                yield ("retract", "output_check_failed")
                return
            yield ("text", batch)
            released_tail = (released_tail + batch)[-context_chars:]
            pending = pending[cut:]
    # End of stream: the held-back text must be checked before it is released.
    if pending:
        if not await run_check(check, released_tail + pending, timeout_s, fail_closed):
            yield ("retract", "output_check_failed")
            return
        yield ("text", pending)
```

Because each batch is checked before release, `retract` in this mode removes text that was checked under less context, which is the conservative choice. After a retract, the caller should close the `pieces` iterator (for example with `aclose()`) so generation stops instead of running on unseen.

Speculative generation while the input check runs. Nothing is released until the check passes, and generation in this phase must not call tools.

```python
async def speculative_generate(user_input: str, input_check: Check,
                               generate_text: Callable[[str], AsyncIterator[str]],
                               timeout_s: float = 0.5) -> AsyncIterator[tuple[str, str]]:
    queue: asyncio.Queue[str | None] = asyncio.Queue()

    async def produce() -> None:
        try:
            async for piece in generate_text(user_input):  # text only; tools disabled here
                await queue.put(piece)
        finally:
            await queue.put(None)  # always unblock the consumer, even on error

    producer = asyncio.create_task(produce())
    try:
        if not await run_check(input_check, user_input, timeout_s, fail_closed=True):
            yield ("refuse", "input_check_failed")
            return
        while (piece := await queue.get()) is not None:
            yield ("text", piece)
        await producer  # re-raise any generation error
    finally:
        # Runs on refusal, on error, and when the consumer closes this
        # generator early (for example after a retract): stop generating.
        if not producer.done():
            producer.cancel()
```

In a full pipeline, the `text` events from `speculative_generate` are the `pieces` fed to `guarded_stream`, so output checks still apply.

A circuit breaker with the transitions in the diagram, and a wrapper that applies the check's failure policy when the breaker is open or the call fails:

```python
import time


class CircuitBreaker:
    def __init__(self, failure_threshold: int = 5, reset_timeout_s: float = 30.0, clock=time.monotonic):
        if failure_threshold < 1:
            raise ValueError("failure_threshold must be at least 1")
        self._threshold = failure_threshold
        self._reset_timeout = reset_timeout_s
        self._clock = clock
        self.state = "closed"
        self._failures = 0
        self._opened_at = 0.0
        self._trial_in_flight = False

    def allow_request(self) -> bool:
        if self.state == "open":
            if self._clock() - self._opened_at < self._reset_timeout:
                return False
            self.state = "half_open"          # timer elapsed: OPEN -> HALF-OPEN
            self._trial_in_flight = False
        if self.state == "half_open":
            if self._trial_in_flight:
                return False                  # one trial at a time
            self._trial_in_flight = True
        return True

    def record_success(self) -> None:
        if self.state == "open":
            return                            # a late result from before the trip closes nothing
        self.state = "closed"                 # trial success: HALF-OPEN -> CLOSED
        self._failures = 0
        self._trial_in_flight = False

    def record_failure(self) -> None:
        if self.state == "open":
            return                            # already open; do not extend the timer
        if self.state == "half_open":
            self._trip()                      # trial failure: HALF-OPEN -> OPEN
            return
        self._failures += 1
        if self._failures >= self._threshold:
            self._trip()                      # CLOSED -> OPEN

    def _trip(self) -> None:
        self.state = "open"
        self._opened_at = self._clock()
        self._failures = 0
        self._trial_in_flight = False

    def abandon(self) -> None:
        """A call was cancelled (client went away): free the trial slot without
        counting a dependency failure."""
        if self.state == "half_open":
            self._trial_in_flight = False


async def call_guardrail(breaker: CircuitBreaker, check: Check, text: str, timeout_s: float,
                         on_unavailable: Callable[[str], bool]) -> bool:
    """on_unavailable(reason) applies this check's failure policy and records degraded operation."""
    if not breaker.allow_request():
        return on_unavailable("circuit_open")
    try:
        result = await asyncio.wait_for(check(text), timeout_s)
    except asyncio.CancelledError:
        breaker.abandon()  # do not leave a half-open trial stuck in flight
        raise
    except Exception as exc:
        breaker.record_failure()
        return on_unavailable(type(exc).__name__)
    breaker.record_success()
    return bool(result)
```

`on_unavailable` is where pattern 6 lives. For a high-severity content classifier it returns `False` (block) and increments a degraded-mode metric; for a tone classifier it returns `True`, logs, and alerts. Keeping that decision in one named function per check makes it reviewable.

## Where it breaks

- **Windows too small for context.** A hold-back window of a few hundred characters cannot see harm that depends on a paragraph further on. Larger windows help at the cost of latency; some categories need the full response, which means no streaming.
- **The final segment.** Guards that check only when the buffer fills will skip the last partial batch unless the end-of-stream case is coded explicitly, as above.
- **Retraction does not reach everywhere.** Copies, screenshots, screen readers, notification previews, and downstream systems keep what they received.
- **Speculative work with side effects.** If generation during the input check can call tools, a blocked request may already have acted. Keep the speculative phase text-only.
- **Fail-open as an attack surface.** An attacker who can make a check time out can disable it if it fails open. Bound input sizes and reserve fail-open for low-impact checks.
- **Silent degradation.** A fallback that works but is not visible on a dashboard can run for weeks. Degraded mode needs its own alert.
- **Breaker thresholds.** A threshold set too low trips on normal noise and pushes all traffic to the fallback; too high and requests wait on a dead dependency. Tune against observed error rates, and alert on every trip.
- **Budgets that drift.** A judge model upgrade or a policy change can double latency or cost of a stage. Track per-stage latency and cost as release criteria ([7.3](/training/module/operations-and-governance/change-management)).

## Lab exercise

In [Lab 4: Safety Controls](/labs/lab-4-safety-controls), Task 4.7 has you add a buffered streaming guard with an end-of-stream check to the lab assistant, wrap its moderation dependency in a circuit breaker with a per-check failure policy, and then run the provided outage and slow-dependency scenarios to show that no response bypasses the high-severity checks.

## Check your understanding

<details>
<summary>1. A streaming guard checks text each time its buffer fills to 500 characters and releases it if the check passes. Short answers containing blocklisted terms reach users. Why?</summary>

Text left in the buffer when the stream ends is released without a check, and short answers may never fill the buffer at all. The guard must check the remaining held text at end of stream before releasing it.
</details>

<details>
<summary>2. A circuit-breaker diagram labels the HALF-OPEN to CLOSED transition "timer expires." What is wrong?</summary>

The timer moves the breaker from OPEN to HALF-OPEN. From HALF-OPEN, a successful trial request closes it, and a failed trial reopens it and restarts the timer.
</details>

<details>
<summary>3. To save cost, a team routes requests its risk classifier scores as low-risk to a small model with only a keyword filter, and high-risk ones to a larger model with full guardrails. What new risk does this create?</summary>

Attackers gain an incentive to make requests look low-risk, because doing so avoids most guardrails. The risk classifier becomes the single point of failure. Keep the same minimum guardrails on every route and vary only the model and cost.
</details>

<details>
<summary>4. An output PII detector and a tone classifier both depend on a hosted API that is down. Should both fail the same way?</summary>

No. PII disclosure is irreversible, so the PII check should fail closed (hold the response or use a local fallback detector). A tone miss is low-impact, so the tone check can fail open with logging and an alert. Each failure behavior is decided per check by risk, in advance.
</details>

<details>
<summary>5. Why must speculative generation (started while the input check runs) be text-only?</summary>

If the input check fails, the generated text can be discarded, but a tool call or write made during generation has already happened. Side effects must wait until the input check passes.
</details>
