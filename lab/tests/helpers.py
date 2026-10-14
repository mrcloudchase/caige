import copy
import tempfile
from pathlib import Path

from caige_lab.app import AcmeSupport, load_config
from caige_lab.model import ScriptedModel
from caige_lab.types import ModelResponse, ToolCall


_APPS = []


def close_apps():
    while _APPS:
        _APPS.pop().data.db.close()


def make_app(model=None, guardrails=None, **overrides):
    """An app with a temporary runs directory and config overrides like tools={"enforce_authorization": True}."""
    config = copy.deepcopy(load_config())
    for section, values in overrides.items():
        config[section].update(values)
    config["control"]["pause_timeout_seconds"] = 2
    runs = Path(tempfile.mkdtemp(prefix="caige-lab-test-"))
    app = AcmeSupport(model or ScriptedModel([ModelResponse("ok")]), config=config, runs_dir=runs, guardrails=guardrails)
    _APPS.append(app)
    return app


def user(app, user_id):
    return next(p for p in app.data.users_by_token.values() if p.user_id == user_id)


def call(name, **arguments):
    return ModelResponse("", tool_calls=[ToolCall(id=f"call-{name}", name=name, arguments=arguments)])
