---
title: "EchoLeak: Zero-Click Data Exfiltration from Microsoft 365 Copilot"
slug: echoleak-m365-copilot
date: "2025-06"
category: [security]
sections: ["3.1", "3.2", "3.4", "2.5"]
summary: "A single crafted email caused Microsoft 365 Copilot to place internal data into an auto-fetched image URL, bypassing an injection classifier, link redaction, and a content security policy (CVE-2025-32711)."
sources:
  - title: "Reddy and Gujral (2025), EchoLeak: The First Real-World Zero-Click Prompt Injection Exploit in a Production LLM System"
    url: "https://arxiv.org/abs/2509.10540"
  - title: "Infosecurity Magazine (2025), Microsoft 365 Copilot: New Zero-Click AI Vulnerability Allows Corporate Data Theft"
    url: "https://www.infosecurity-magazine.com/news/microsoft-365-copilot-zeroclick-ai"
  - title: "Microsoft Security Response Center: CVE-2025-32711"
    url: "https://msrc.microsoft.com/update-guide/vulnerability/CVE-2025-32711"
---

## What happened

Researchers at Aim Labs (Aim Security) reported a vulnerability in Microsoft 365 Copilot to Microsoft in January 2025. Microsoft fixed the issue in its service, so no customer action was required, and published CVE-2025-32711 in June 2025, when Aim Labs also published the details under the name EchoLeak. Microsoft rated it critical and reported no evidence of exploitation in the wild.

The attack started with one email sent to anyone in the target organization. The victim did not need to open it. When the victim later asked Copilot a question, Copilot's retrieval could pull the attacker's email into the same context as internal documents, chats, and files. The email's instructions told the assistant to take sensitive information from that context and include it in a markdown image URL pointing at the attacker. When Copilot's answer was rendered, the browser fetched the image and delivered the data, with no click.

According to the published analysis, the chain bypassed four separate defenses:

1. Microsoft's cross-prompt injection attack (XPIA) classifiers, by phrasing the instructions as if addressed to the human recipient of the email rather than to an AI.
2. Link redaction, by using reference-style markdown links that the redaction did not recognize.
3. Image redaction, by using reference-style markdown images, which the browser fetches automatically.
4. The content security policy, by pointing the image at a Microsoft Teams URL on an allowed domain that would fetch a further, attacker-controlled URL.

Aim Labs called the general technique an "LLM scope violation": untrusted input causing the model to reach into privileged context it was never meant to expose to that input's author.

## Failure analysis

- **Category:** security. An external attacker, holding no authority in the tenant, borrowed the authority of the victim's Copilot session.
- **Mechanism:** indirect prompt injection through retrieved email, followed by exfiltration through rendered output.
- **Missing or insufficient controls:** the system had the full lethal trifecta: private data (the tenant's files and mail), untrusted content (external email in the same retrieval pool), and an external channel (auto-loaded images). Each defense in the chain was a filter that recognized known forms: a classifier for injection phrasing, redaction for one markdown syntax, a CSP whose allowlist included a domain that could relay requests. None bounded what an injection could do once it worked.

## Controls that would have helped

- Treat externally authored email as untrusted content and keep it out of contexts that also contain private data, or apply data-flow controls so private data cannot reach output that leaves the tenant ([3.2 Architectural Defenses Against Injection](/training/module/security-engineering/architectural-injection-defenses)).
- Sanitize rendered HTML rather than markdown source, allow images only from controlled hosts, strip query strings, and audit CSP allowlists for relays ([3.4 Output Handling and Egress Control](/training/module/security-engineering/output-handling-and-egress)).
- Do not rely on an injection classifier as the deciding control ([3.1 Prompt Injection](/training/module/security-engineering/prompt-injection)).
- Assess the assistant with the blast-radius test: what can it send, and where ([2.5 Assume Compromise](/training/module/risk-and-threat-modeling/assume-compromise-blast-radius)).

## Lessons

Four layered filters failed in sequence because each one recognized a form rather than enforcing a property. Defense in depth made of probabilistic and pattern-based layers can still fail end to end. The fix that holds is architectural: either the assistant that reads external email cannot see confidential data in the same context, or nothing it writes can leave the tenant.
