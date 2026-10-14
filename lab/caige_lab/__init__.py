"""cAIge lab reference application: "Acme Support".

A small multi-tenant support assistant with retrieval and tools, built so that
every guardrail attachment point from the cAIge training is explicit:
input, retrieval, tool-call, tool-result, and output hooks; an external
control plane with an emergency brake and leased tool credentials; budgets;
and a hash-chained audit log the agent cannot write to.

The defaults are deliberately naive (no tenant filter on retrieval, no tool
authorization, no egress allowlist). The labs have you turn on and build the
controls, then measure them with open-source red-teaming tools.
"""

__version__ = "2.0.0"
