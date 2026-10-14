---
id: "3.6"
title: "Identity and Delegation"
slug: identity-and-delegation
module: security-engineering
sectionOrder: 6
description: "How agents act on behalf of users without becoming confused deputies: delegated versus service credentials, OAuth scopes, short-lived audience-bound tokens, no token passthrough, and authorization enforced by the tool backend."
category: security
controlLayers: [deterministic, human]
knowledge:
  - "A confused deputy is a program with more authority than its caller that can be tricked into using that authority for the caller; an agent with a service credential is one by default."
  - "Delegated (per-user) credentials limit an agent to what the user can do; service credentials need their own per-request authorization of the end user."
  - "OAuth scopes should be minimal and requested incrementally; tokens should be short-lived and audience-bound (RFC 8707 resource indicators)."
  - "The MCP authorization specification forbids token passthrough: an MCP server must accept only tokens issued for itself and must obtain separate tokens for upstream APIs."
  - "Authorization decisions are made by the tool backend from the verified token, never by the model or from model-supplied identity arguments."
  - "Recipient and domain allowlists must compare exact parsed values, not suffixes or substrings."
skills:
  - "Design the credential flow for an agent that acts for many users across several downstream APIs."
  - "Implement token validation in a tool backend that checks signature, issuer, audience, expiry, and scope, and derives identity from the token."
  - "Explain why token passthrough breaks audit and audience boundaries, and use token exchange instead."
  - "Implement an exact-match recipient domain allowlist."
sources:
  - title: "Model Context Protocol Specification (2025-06-18): Authorization"
    url: "https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization"
  - title: "Model Context Protocol: Security Best Practices"
    url: "https://modelcontextprotocol.io/specification/draft/basic/security_best_practices"
  - title: "RFC 8707: Resource Indicators for OAuth 2.0"
    url: "https://www.rfc-editor.org/rfc/rfc8707.html"
  - title: "RFC 8693: OAuth 2.0 Token Exchange"
    url: "https://www.rfc-editor.org/rfc/rfc8693.html"
  - title: "Invariant Labs (2025), GitHub MCP Exploited: Accessing private repositories via MCP"
    url: "https://invariantlabs.ai/blog/mcp-github-vulnerability"
  - title: "OWASP Top 10 for LLM Applications 2025: LLM07 System Prompt Leakage"
    url: "https://genai.owasp.org/llmrisk/llm072025-system-prompt-leakage/"
  - title: "Wikipedia: Confused deputy problem"
    url: "https://en.wikipedia.org/wiki/Confused_deputy_problem"
  - title: "PyJWT documentation: Usage examples"
    url: "https://pyjwt.readthedocs.io/en/stable/usage.html"
lastReviewed: "2026-10-14"
---

# 3.6 Identity and Delegation

## The problem

In the GitHub MCP case from section 3.2, the agent ran with the user's GitHub token ([incident](/incidents/github-mcp-private-repo-leak)). That token could read every private repository the user owned and write to every public one. The user's request was "look at the open issues in this public repo." The agent needed read access to one public repository. It held write access to everything. When an injected issue told it to copy private data into a public pull request, every API call it made was authorized.

The token was not stolen or misused in the usual sense. It was used by a program acting on someone else's instructions, with far more authority than the task needed. This is the confused deputy problem, and agents recreate it by default.

## Why it happens

A **confused deputy** is a program that holds authority from one party and can be induced by another party to use it. The classic example is a compiler that could write to a billing file; a user asked it to write output to that file's path, and it did, using its own permission rather than the user's. An agent is a deputy for whoever writes text it reads. With a powerful credential and an injected instruction, it uses the credential for the attacker.

Three common designs make this worse:

1. **Service credentials with model-chosen identity.** The agent uses one service account for all users, and the tool takes `user_id` as an argument the model fills in. Any user, or any injected document, can get the model to fill in someone else's ID.
2. **Over-broad user tokens.** The agent gets a long-lived personal access token with every scope, because requesting narrow scopes was inconvenient.
3. **Token passthrough.** A middle service (often an MCP server) receives the user's token and forwards it unchanged to downstream APIs. The downstream API cannot tell whether the request came from the user, the MCP server, or an attacker holding a leaked token, and the MCP server cannot enforce its own policy on a token issued for someone else.

The model cannot fix any of this. A model that is told "only access the current user's data" is being asked to enforce an authorization rule it has no reliable way to enforce, against inputs designed to talk it out of it (OWASP LLM07:2025 is explicit that authorization belongs outside the model).

## Control patterns

### 1. Authorization in the tool backend (deterministic)

The tool backend (the API, MCP server, or function the agent calls) decides what is allowed, using identity from a verified token. The model supplies only the parameters of the request, never the identity of who is asking. If a tool takes `customer_id`, the backend checks that the token's subject may access that customer, every call.

### 2. Delegated, per-user credentials (deterministic)

When the agent acts for a user, it should use a credential that represents that user, so the downstream system applies the user's own permissions. The agent can then do no more than the user can. That is the floor, not the goal: users have far more authority than any single task needs.

Use service credentials only for operations that are genuinely the service's own (writing to its own queue, reading public reference data), and still authorize the end user on each request.

### 3. Minimal, incremental scopes (deterministic)

Request the narrowest scopes the current task needs, and step up when a privileged operation is first attempted. The MCP security best practices describe this pattern: start with a minimal scope set, issue targeted `WWW-Authenticate` scope challenges for privileged operations, and avoid wildcard or omnibus scopes. A task-scoped token that can read one repository would have made the GitHub case harmless.

### 4. Short-lived, audience-bound tokens (deterministic)

- **Audience-bound**: the token names the one resource server it is for. The MCP authorization specification (2025-06-18) requires clients to send the RFC 8707 `resource` parameter identifying the target MCP server, and requires servers to validate that tokens were issued specifically for them. If every server checks the audience, a token for the calendar server cannot be replayed at the file server.
- **Short-lived**: the specification says authorization servers should issue short-lived access tokens, and must rotate refresh tokens for public clients. Minutes, not days.

### 5. No token passthrough; use token exchange (deterministic)

The MCP specification says servers must not accept tokens that were not explicitly issued for them, and must not pass through the token they received from the client to upstream APIs. If an MCP server needs to call an upstream API on the user's behalf, it acts as an OAuth client to that API and uses a separate token issued for it.

OAuth 2.0 Token Exchange (RFC 8693) is the standard way to get that separate token. The MCP server presents the token it received and asks the authorization server for a new one with the upstream API as the audience and a narrower scope. RFC 8693 distinguishes delegation from impersonation: with delegation, the issued token can carry an `act` claim naming the agent, so the downstream API and the audit log see "agent X acting for user Y," not just "user Y."

### 6. Consent and the MCP proxy confused deputy (deterministic and human)

The MCP security best practices describe a specific confused deputy: an MCP proxy server that uses one static client ID with a third-party authorization server, allows dynamic client registration, and relies on the third party's consent cookie. An attacker registers a client with their own redirect URI, sends the user a link, the third party skips consent because the cookie exists, and the authorization code ends up with the attacker. The required mitigation is per-client consent at the MCP server before forwarding to the third party, exact redirect URI matching, and a validated `state` parameter.

### 7. Human approval for consequential delegated actions (human)

For actions the user would not expect from the request (sending externally, deleting, paying), require confirmation that shows the actual parameters (Domain 5, section 5.3). Approval does not replace scoping; it catches what scoping allowed but the user did not intend.

## Implementation

### Tool backend: identity from the token, not from the model

```python
import jwt
from jwt import PyJWKClient

ISSUER = "https://auth.example.com"
THIS_RESOURCE = "https://files-mcp.example.com"   # our canonical URI (audience)
_jwks = PyJWKClient(f"{ISSUER}/.well-known/jwks.json")


class Forbidden(Exception):
    pass


def verify_bearer(auth_header: str | None, required_scope: str) -> dict:
    if not auth_header or not auth_header.startswith("Bearer "):
        raise Forbidden("missing bearer token")
    token = auth_header.removeprefix("Bearer ")
    key = _jwks.get_signing_key_from_jwt(token).key
    try:
        claims = jwt.decode(
            token,
            key,
            algorithms=["RS256"],            # never accept "none" or HS* here
            audience=THIS_RESOURCE,          # reject tokens issued for others
            issuer=ISSUER,
            options={"require": ["exp", "iat", "iss", "aud", "sub"]},
        )
    except jwt.InvalidTokenError as exc:
        raise Forbidden("invalid token") from exc
    if required_scope not in claims.get("scope", "").split():
        raise Forbidden(f"missing scope {required_scope}")
    return claims


def read_file_tool(auth_header: str | None, file_id: str, acl) -> bytes:
    """The model supplies file_id. Identity comes only from the token."""
    claims = verify_bearer(auth_header, required_scope="files:read")
    if not acl.can_read(subject=claims["sub"], file_id=file_id):
        raise Forbidden("not permitted")     # same error whether or not it exists
    return acl.load(file_id)
```

There is no `user_id` parameter for the model to fill. The audience check is what turns "valid token" into "valid token for this server." Map `Forbidden` to 401 for token failures and 403 for scope or permission failures, as the MCP specification's error table describes.

### Upstream calls: exchange, do not pass through

```python
TOKEN_EXCHANGE = "urn:ietf:params:oauth:grant-type:token-exchange"
ACCESS_TOKEN_TYPE = "urn:ietf:params:oauth:token-type:access_token"


def upstream_token_for(incoming_token: str, http, client_auth) -> str:
    """Get a separate, narrower token for the upstream API (RFC 8693).
    The incoming token was issued for us and is never forwarded."""
    resp = http.post(
        f"{ISSUER}/oauth/token",
        auth=client_auth,                       # this server's own client credentials
        data={
            "grant_type": TOKEN_EXCHANGE,
            "subject_token": incoming_token,
            "subject_token_type": ACCESS_TOKEN_TYPE,
            "resource": "https://storage-api.example.com",
            "scope": "objects:read",
        },
        timeout=10,
    )
    resp.raise_for_status()
    return resp.json()["access_token"]
```

Whether the authorization server supports token exchange, and what it puts in the `act` claim, depends on the provider. If it does not, the MCP server can use its own client credential for the upstream API, as long as it authorizes the end user itself before every call.

### Exact recipient domain allowlist

```python
import re

ALLOWED_RECIPIENT_DOMAINS = frozenset({"company.com", "subsidiary.company.com"})
_ADDR = re.compile(r"[A-Za-z0-9._%+-]+@([A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+)")


def recipient_allowed(address: str) -> bool:
    """Exact match on the parsed domain. Rejects display names, lists,
    and anything that is not a single bare address."""
    m = _ADDR.fullmatch(address.strip())
    if m is None:
        return False
    domain = m.group(1).lower()
    return domain in ALLOWED_RECIPIENT_DOMAINS
```

`x@company.com.evil.io` parses to the domain `company.com.evil.io`, which is not in the set. A check like `address.endswith("company.com")` accepts `x@evilcompany.com`, and `"company.com" in address` accepts `x@company.com.evil.io`.

## Where it breaks

- **Delegated credentials** still carry all of the user's authority. An injected agent with an administrator's token is an administrator. Narrow scopes per task.
- **Scopes are coarse.** Many APIs offer `repo` rather than "this repository." Where the provider's scopes are too broad, add your own policy layer (for example, one repository per session) in the tool backend.
- **Audience binding** works only if every resource server checks it, and only if the authorization server supports resource indicators. A single server that accepts any valid token from the issuer reopens replay.
- **Short-lived tokens** limit the window after theft but do nothing during it, and refresh tokens extend the window if they are stored carelessly.
- **Token exchange** moves trust to the authorization server's exchange policy. A permissive policy that issues broad upstream tokens for any incoming token gives you passthrough with extra steps.
- **Exact allowlists** stop look-alike domains, not compromised or misused accounts inside allowed domains. They also miss data sent in other ways (links, attachments to allowed recipients who forward them).
- **Human approval** degrades into reflexive clicking; Invariant noted that users often choose "always allow" in agent tool prompts.

## Lab exercise

In [Lab 3: Security Hardening](/labs/lab-3-security-hardening), Task 3.6 has you make every tool call carry the end user's identity with narrowly scoped, short-lived credentials, enforce authorization in the tool backend, and make recipient allowlists exact-match on parsed domains, with tests that include look-alike domains.

## Check your understanding

1. A support agent calls `get_orders(customer_id)` with a service account, and the system prompt says "only look up the current customer's orders." What is the vulnerability and the fix?
2. An MCP server receives a user's access token and forwards it to a downstream storage API. List two problems the MCP specification identifies with this.
3. Why is a token's audience claim checked by the server that receives it, rather than by the client that sends it?
4. A recipient check uses `address.split("@")[-1].endswith("company.com")`. Which address that should be rejected passes it?

<details>
<summary>Answers</summary>

1. The model chooses `customer_id` and the backend trusts it, so any user or injected text can read any customer's orders; the prompt is not enforcement. Derive the customer from the verified token in the backend and authorize each call.
2. Any two of: the server cannot verify the token was meant for it (audience), downstream controls tied to the audience are bypassed, audit logs show the wrong caller, and a stolen token can use the server as a proxy. The specification forbids passthrough; the server must obtain a separate token for the upstream API.
3. Because the receiving server is the party that must refuse tokens meant for others. A malicious or compromised client will not refuse to send them.
4. `x@evilcompany.com` (its domain ends with "company.com"). Compare the parsed domain exactly against a set.

</details>
