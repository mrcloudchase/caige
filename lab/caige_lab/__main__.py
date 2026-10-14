"""Command-line entry point: python -m caige_lab <command>."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from .app import LAB_DIR, AcmeSupport, load_config
from .audit import verify
from .control import ControlPlane
from .evaluate import load_suite, render, run_suite, to_json
from .model import model_from_env
from .outcomes import detect
from .types import ToolCall, Principal


def _app(args: argparse.Namespace) -> AcmeSupport:
    return AcmeSupport(model_from_env(), config=load_config(Path(args.config)) if args.config else None)


def _cli_approver(principal: Principal, call: ToolCall, reason: str) -> bool:
    print(f"\nAPPROVAL NEEDED ({reason})\n  user: {principal.user_id} ({principal.role}, {principal.tenant})\n"
          f"  tool: {call.name}\n  args: {json.dumps(call.arguments, indent=2)}")
    return input("approve? [y/N] ").strip().lower() == "y"


def cmd_chat(args: argparse.Namespace) -> int:
    app = _app(args)
    principal = next((p for p in app.data.users_by_token.values() if p.user_id == args.user), None)
    if principal is None:
        print(f"unknown user {args.user!r}", file=sys.stderr)
        return 2
    print(f"Chatting as {principal.user_id} ({principal.role}, {principal.tenant}). Ctrl-D to exit.")
    for line in sys.stdin:
        result = app.handle(principal, line.strip(), approver=_cli_approver)
        flags = [k for k, v in detect(result, principal, app.config, app.data.tenants).items() if v]
        print(f"[{result.run_id} {result.status}{' ' + ','.join(flags) if flags else ''}]\n{result.output}\n")
    return 0


def cmd_serve(args: argparse.Namespace) -> int:
    from .server import serve
    server = serve(_app(args), args.host, args.port)
    print(f"Acme Support listening on http://{args.host}:{args.port}/chat")
    server.serve_forever()
    return 0


def cmd_eval(args: argparse.Namespace) -> int:
    app = _app(args)
    cases = [c for path in args.suite for c in load_suite(Path(path))]
    report = run_suite(app, cases, trials=args.trials)
    print(to_json(report) if args.json else render(report))
    return 0


def cmd_brake(args: argparse.Namespace) -> int:
    config = load_config(Path(args.config)) if args.config else load_config()
    run_dir = LAB_DIR / "runs" / args.run
    if not (run_dir / "control.json").exists():
        print(f"no such run {args.run!r}", file=sys.stderr)
        return 2
    control = ControlPlane(run_dir, operators=config.get("control", {}).get("operators", []))
    control.engage(args.action, args.operator, args.reason)
    print(f"run {args.run}: {control.state}")
    return 0


def cmd_audit(args: argparse.Namespace) -> int:
    run_dir = LAB_DIR / "runs" / args.run
    result = verify(run_dir / "audit.jsonl", run_dir / "anchor.jsonl")
    print(f"{'OK' if result.ok else 'TAMPERED'}: {result.entries} entries {result.problem}".strip())
    return 0 if result.ok else 1


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="python -m caige_lab", description="cAIge lab reference app (Acme Support)")
    parser.add_argument("--config", help="path to a lab.toml (default: lab/lab.toml)")
    sub = parser.add_subparsers(dest="command", required=True)

    p = sub.add_parser("chat", help="interactive chat as a test user")
    p.add_argument("--user", default="alice")
    p.set_defaults(func=cmd_chat)

    p = sub.add_parser("serve", help="HTTP endpoint for red-teaming tools")
    p.add_argument("--host", default="127.0.0.1")
    p.add_argument("--port", type=int, default=8787)
    p.set_defaults(func=cmd_serve)

    p = sub.add_parser("eval", help="run JSONL suites and report metrics")
    p.add_argument("--suite", action="append", required=True)
    p.add_argument("--trials", type=int, default=1)
    p.add_argument("--json", action="store_true")
    p.set_defaults(func=cmd_eval)

    p = sub.add_parser("brake", help="pause, stop, kill, or resume a run")
    p.add_argument("action", choices=["pause", "stop", "kill", "resume"])
    p.add_argument("--run", required=True)
    p.add_argument("--operator", required=True)
    p.add_argument("--reason", required=True)
    p.set_defaults(func=cmd_brake)

    p = sub.add_parser("audit", help="verify a run's audit log")
    p.add_argument("--run", required=True)
    p.set_defaults(func=cmd_audit)

    args = parser.parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
