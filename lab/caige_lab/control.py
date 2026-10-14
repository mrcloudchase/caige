"""External control plane: the emergency brake, leased tool credentials, and budgets.

The harness consults the control plane before every model step and every tool
execution. The model has no tool that can reach it. State lives in a file in
the run directory so an operator can pull the brake from another process:

    python -m caige_lab brake stop --run <run_id> --operator bob --reason "..."

- pause: the harness stops at the next step boundary and waits for resume.
- stop:  the run ends at the next check; pending tool calls are not executed.
- kill:  stop, and revoke every tool credential leased to the run, so even an
         in-flight call fails when its backend validates the lease.

See training section 5.5.
"""
from __future__ import annotations

import contextlib
import fcntl
import json
import os
import secrets
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterator

STATES = ("running", "paused", "stopped", "killed")


class Halted(Exception):
    """Raised when the brake ends a run."""

    def __init__(self, state: str, reason: str):
        super().__init__(f"run {state}: {reason}")
        self.state = state
        self.reason = reason


class BudgetExceeded(Exception):
    pass


class LeaseInvalid(Exception):
    pass


class ControlPlane:
    def __init__(self, run_dir: Path, operators: list[str], pause_timeout: float = 300.0, lease_seconds: float = 120.0, poll: float = 0.1):
        self.run_dir = run_dir
        self.run_dir.mkdir(parents=True, exist_ok=True)
        self.state_path = run_dir / "control.json"
        self.lock_path = run_dir / "control.lock"
        self.operators = set(operators)
        self.pause_timeout = pause_timeout
        self.lease_seconds = lease_seconds
        self.poll = poll
        with self._locked():
            if not self.state_path.exists():
                self._write({"state": "running", "by": "system", "reason": "", "at": time.time(), "leases": {}})

    # ---- state file -------------------------------------------------------
    @contextlib.contextmanager
    def _locked(self) -> Iterator[None]:
        """Serialize read-modify-write across processes, so a kill cannot be overwritten by a concurrent lease."""
        with self.lock_path.open("a") as lock:
            fcntl.flock(lock, fcntl.LOCK_EX)
            try:
                yield
            finally:
                fcntl.flock(lock, fcntl.LOCK_UN)

    def _read(self) -> dict:
        return json.loads(self.state_path.read_text())

    def _write(self, state: dict) -> None:
        tmp = self.state_path.with_suffix(f".tmp{os.getpid()}")
        tmp.write_text(json.dumps(state))
        os.replace(tmp, self.state_path)  # atomic on POSIX

    @property
    def state(self) -> str:
        return self._read()["state"]

    # ---- operator actions ---------------------------------------------------
    def engage(self, action: str, operator: str, reason: str) -> None:
        """Pull the brake. Only named operators may do this; the agent has no path to this method."""
        if operator not in self.operators:
            raise PermissionError(f"{operator!r} is not an authorized operator")
        if action not in ("pause", "stop", "kill", "resume"):
            raise ValueError(f"unknown action {action!r}")
        with self._locked():
            current = self._read()
            if current["state"] in ("stopped", "killed") and action != "kill":
                return  # terminal states only escalate to kill; a stopped run is never resumed
            if action == "resume" and current["state"] != "paused":
                return
            new_state = {"pause": "paused", "stop": "stopped", "kill": "killed", "resume": "running"}[action]
            current.update({"state": new_state, "by": operator, "reason": reason, "at": time.time()})
            if action == "kill":
                current["leases"] = {}  # revoke every credential
            self._write(current)

    # ---- harness checks -----------------------------------------------------
    def checkpoint(self) -> None:
        """Called by the harness at every step boundary and before every tool execution."""
        deadline = time.monotonic() + self.pause_timeout
        while True:
            current = self._read()
            if current["state"] == "running":
                return
            if current["state"] in ("stopped", "killed"):
                raise Halted(current["state"], current.get("reason", ""))
            if time.monotonic() >= deadline:
                with self._locked():
                    current = self._read()
                    if current["state"] == "paused":
                        current.update({"state": "stopped", "by": "system", "reason": "pause timed out", "at": time.time()})
                        self._write(current)
                continue  # re-evaluate: stopped (raises), or resumed/killed by an operator meanwhile
            time.sleep(self.poll)

    # ---- leased credentials --------------------------------------------------
    def issue_lease(self) -> str:
        with self._locked():
            current = self._read()
            if current["state"] in ("stopped", "killed"):
                raise LeaseInvalid(f"run {current['state']}")
            token = secrets.token_hex(16)
            current["leases"][token] = time.time() + self.lease_seconds  # expiry recorded by the control plane
            self._write(current)
            return token

    def validate_lease(self, token: str) -> None:
        """Tool backends call this. Expiry comes from the control plane's record, never from the caller."""
        current = self._read()
        if current["state"] in ("stopped", "killed"):
            raise LeaseInvalid(f"run {current['state']}")
        expiry = current["leases"].get(token)
        if expiry is None:
            raise LeaseInvalid("unknown or revoked credential")
        if time.time() >= expiry:
            raise LeaseInvalid("credential expired")


@dataclass
class Budget:
    """Step, tool-call, token, and time budgets, enforced by the harness rather than the model."""

    max_steps: int
    max_tool_calls: int
    max_tokens: int
    max_seconds: float
    steps: int = 0
    tool_calls: int = 0
    tokens: int = 0
    started: float = field(default_factory=time.monotonic)

    def _check_time(self) -> None:
        if time.monotonic() - self.started > self.max_seconds:
            raise BudgetExceeded(f"time budget of {self.max_seconds}s exceeded")

    def step(self) -> None:
        self._check_time()
        if self.steps >= self.max_steps:
            raise BudgetExceeded(f"step budget of {self.max_steps} exceeded")
        self.steps += 1

    def tool_call(self) -> None:
        self._check_time()
        if self.tool_calls >= self.max_tool_calls:
            raise BudgetExceeded(f"tool-call budget of {self.max_tool_calls} exceeded")
        self.tool_calls += 1

    def add_tokens(self, n: int) -> None:
        self.tokens += n
        if self.tokens > self.max_tokens:
            raise BudgetExceeded(f"token budget of {self.max_tokens} exceeded")
