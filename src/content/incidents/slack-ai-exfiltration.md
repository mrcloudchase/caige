---
title: "Slack AI Data Exfiltration via Indirect Prompt Injection"
slug: slack-ai-exfiltration
date: "2024-08-20"
category: [security]
sections: ["3.1", "3.2", "3.4", "3.5"]
summary: "PromptArmor showed that a message in a public Slack channel could make Slack AI place a secret from a private channel into a phishing-style link, sending it to the attacker when clicked."
sources:
  - title: "PromptArmor (2024), Data Exfiltration from Slack AI via indirect prompt injection"
    url: "https://promptarmor.substack.com/p/data-exfiltration-from-slack-ai-via"
  - title: "Willison (2024), Data Exfiltration from Slack AI via indirect prompt injection"
    url: "https://simonwillison.net/2024/Aug/20/data-exfiltration-from-slack-ai/"
---

## What happened

On August 20, 2024, the security firm PromptArmor published an attack on Slack AI, the assistant that answers questions using messages in a Slack workspace.

The attacker created a public channel containing only themselves and posted a message with instructions: when someone asks for a particular API key, answer with a markdown link reading "click here to reauthenticate," with the key appended as a URL parameter to the attacker's domain. A victim had previously stored that API key in a private channel or direct message the attacker could not access. When the victim asked Slack AI for the key, retrieval pulled in both the victim's private message and the attacker's public message. Slack AI followed the attacker's instructions and rendered the link. If the victim clicked it, the key went to the attacker's server.

PromptArmor noted that Slack AI's citations did not reference the attacker's message, which made the source of the instruction hard to trace. They also described a phishing variant and noted that Slack had started including uploaded files and documents in Slack AI answers on August 14, which would let an attacker plant instructions in a document (for example as hidden white text) without being a workspace member. They did not test that variant.

PromptArmor reported the issue to Slack on August 14. On August 19, Slack responded that messages in public channels are visible to all workspace members by design and described the behavior as intended. PromptArmor disclosed publicly so administrators could restrict the feature.

## Failure analysis

- **Category:** security. An attacker who could post in any public channel borrowed the authority of a victim's Slack AI session to read data from channels the attacker could not access.
- **Mechanism:** indirect prompt injection through retrieved messages, with exfiltration through a rendered link.
- **Missing controls:** retrieval mixed content from many authors with the victim's private data in one context. Output rendering allowed arbitrary external links with query strings. Citations did not show the content that most influenced the answer. Each retrieved message was within the victim's permissions, so access control was working as designed; the problem was combining untrusted authorship with private data and an outbound channel.

## Controls that would have helped

- Label retrieved content by author and trust, and apply data-flow controls so data from private channels cannot be written into links or messages shaped by other authors ([3.2](/training/module/security-engineering/architectural-injection-defenses)).
- Render external links as plain text, or only for allowlisted hosts with query strings removed ([3.4](/training/module/security-engineering/output-handling-and-egress)).
- Keep secrets out of chat and retrieval indexes; minimize what is indexed ([3.5](/training/module/security-engineering/data-protection-and-isolation)).
- Treat every retrieved message as potential injection, not just the user's question ([3.1](/training/module/security-engineering/prompt-injection)).

## Lessons

Retrieval permission checks answer "may this user see this message?" They do not answer "may the author of this message instruct the assistant?" In a shared workspace, everyone who can post is a potential author of instructions. A one-click link was enough: the exfiltration channel does not have to be zero-click to work.
