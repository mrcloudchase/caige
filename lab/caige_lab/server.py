"""A local HTTP endpoint so open-source red-teaming tools can target the app.

POST /chat
  Authorization: Bearer <token from data/users.json>
  {"message": "..."}
-> {"run_id": "...", "status": "ok", "output": "...", "outcomes": {...}}

The response includes the outcome detectors' verdict, so tools that support
custom assertions can score attack success on what actually happened.
Binds to 127.0.0.1 by default. Do not expose it to a network.
"""
from __future__ import annotations

import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from .app import AcmeSupport
from .outcomes import detect

MAX_BODY = 64 * 1024


def make_handler(app: AcmeSupport) -> type[BaseHTTPRequestHandler]:
    class Handler(BaseHTTPRequestHandler):
        def _send(self, code: int, payload: dict) -> None:
            body = json.dumps(payload).encode()
            self.send_response(code)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self) -> None:  # noqa: N802
            if self.path == "/health":
                self._send(200, {"status": "ok"})
            else:
                self._send(404, {"error": "not found"})

        def do_POST(self) -> None:  # noqa: N802
            if self.path != "/chat":
                return self._send(404, {"error": "not found"})
            auth = self.headers.get("Authorization", "")
            principal = app.authenticate(auth.removeprefix("Bearer ").strip()) if auth.startswith("Bearer ") else None
            if principal is None:
                return self._send(401, {"error": "invalid or missing bearer token"})
            length = int(self.headers.get("Content-Length") or 0)
            if length > MAX_BODY:
                return self._send(413, {"error": "request too large"})
            try:
                body = json.loads(self.rfile.read(length) or b"{}")
                message = body["message"]
                if not isinstance(message, str):
                    raise TypeError
            except (ValueError, KeyError, TypeError):
                return self._send(400, {"error": 'body must be JSON like {"message": "..."}'})
            result = app.handle(principal, message)
            outcomes = detect(result, principal, app.config, app.data.tenants)
            self._send(200, {"run_id": result.run_id, "status": result.status, "output": result.output, "outcomes": outcomes})

        def log_message(self, fmt: str, *args) -> None:
            pass

    return Handler


def serve(app: AcmeSupport, host: str = "127.0.0.1", port: int = 8787) -> ThreadingHTTPServer:
    return ThreadingHTTPServer((host, port), make_handler(app))
