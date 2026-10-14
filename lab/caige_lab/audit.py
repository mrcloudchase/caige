"""Hash-chained, append-only audit log.

Only the harness writes to this log. The model has no tool that can reach it.
Each entry includes the hash of the previous entry, so editing or deleting an
entry breaks the chain. A chain alone cannot detect truncation of the newest
entries or wholesale replacement; `anchor()` copies the head hash to a separate
location (in production: a different system and account) to close that gap.
See training section 5.6.
"""
from __future__ import annotations

import hashlib
import json
import threading
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any

GENESIS = "0" * 64


def _digest(prev: str, body: dict[str, Any]) -> str:
    canonical = json.dumps(body, sort_keys=True, separators=(",", ":"), default=str)
    return hashlib.sha256((prev + canonical).encode()).hexdigest()


class AuditLog:
    def __init__(self, path: Path):
        self.path = path
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = threading.Lock()
        self._head, self._seq = self._load_head()

    def _load_head(self) -> tuple[str, int]:
        if not self.path.exists():
            return GENESIS, 0
        head, seq = GENESIS, 0
        with self.path.open() as f:
            for line in f:
                if line.strip():
                    entry = json.loads(line)
                    head, seq = entry["hash"], entry["seq"]
        return head, seq

    def append(self, event: str, **data: Any) -> str:
        with self._lock:
            body = {"seq": self._seq + 1, "ts": time.time(), "event": event, "data": data, "prev": self._head}
            entry_hash = _digest(self._head, body)
            with self.path.open("a") as f:
                f.write(json.dumps({**body, "hash": entry_hash}, default=str) + "\n")
            self._head, self._seq = entry_hash, self._seq + 1
            return entry_hash

    @property
    def head(self) -> str:
        return self._head

    def anchor(self, anchor_path: Path) -> None:
        """Record the current head somewhere the log's writer cannot rewrite (here: a separate file)."""
        anchor_path.parent.mkdir(parents=True, exist_ok=True)
        with anchor_path.open("a") as f:
            f.write(json.dumps({"ts": time.time(), "log": str(self.path), "seq": self._seq, "head": self._head}) + "\n")


@dataclass
class VerifyResult:
    ok: bool
    entries: int
    problem: str = ""


def verify(path: Path, anchor_path: Path | None = None) -> VerifyResult:
    """Recompute the chain. Optionally check that the latest anchor still matches."""
    if not path.exists():
        return VerifyResult(True, 0, "empty log")
    prev, count, by_seq = GENESIS, 0, {}
    with path.open() as f:
        for line_no, line in enumerate(f, 1):
            if not line.strip():
                continue
            entry = json.loads(line)
            body = {k: entry[k] for k in ("seq", "ts", "event", "data", "prev")}
            if entry["prev"] != prev:
                return VerifyResult(False, count, f"line {line_no}: chain broken (prev mismatch)")
            if _digest(prev, body) != entry["hash"]:
                return VerifyResult(False, count, f"line {line_no}: entry hash mismatch (edited)")
            if entry["seq"] != count + 1:
                return VerifyResult(False, count, f"line {line_no}: sequence gap")
            prev, count = entry["hash"], count + 1
            by_seq[entry["seq"]] = entry["hash"]
    if anchor_path and anchor_path.exists():
        lines = [json.loads(l) for l in anchor_path.read_text().splitlines() if l.strip()]
        if lines:
            last = lines[-1]
            if by_seq.get(last["seq"]) != last["head"]:
                return VerifyResult(False, count, f"anchored entry {last['seq']} missing or changed (truncation or rewrite)")
    return VerifyResult(True, count)
