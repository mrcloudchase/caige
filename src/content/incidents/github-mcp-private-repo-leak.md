---
title: "GitHub MCP Server: Private Repository Leak via a Malicious Issue"
slug: github-mcp-private-repo-leak
date: "2025-05-26"
category: [security]
sections: ["3.2", "3.6", "2.5", "5.1"]
summary: "Invariant Labs showed that a prompt injection in a public GitHub issue could make an agent using the GitHub MCP server copy data from the user's private repositories into a public pull request."
sources:
  - title: "Invariant Labs (2025), GitHub MCP Exploited: Accessing private repositories via MCP"
    url: "https://invariantlabs.ai/blog/mcp-github-vulnerability"
  - title: "DevClass (2025), Researchers warn of prompt injection vulnerability in GitHub MCP with no obvious fix"
    url: "https://www.devclass.com/ai-ml/2025/05/27/researchers-warn-of-prompt-injection-vulnerability-in-github-mcp-with-no-obvious-fix/1623458"
---

## What happened

On May 26, 2025, Invariant Labs published an attack against agents that use the official GitHub MCP server. In their demonstration, a user had both public and private repositories and had connected an agent client to the GitHub MCP server with a token that could access all of them.

The attacker opened an issue on the user's public repository. The issue body contained instructions for the agent. Later, the user asked their agent something ordinary, such as to look at the open issues in that public repository. The agent read the malicious issue, followed its instructions to read data from the user's private repositories, and then opened a pull request in the public repository containing that data. The attacker read the pull request. Invariant called this a "toxic agent flow."

Invariant stressed that this was not a bug in the GitHub MCP server's code: every tool worked as intended and every API call was authorized by the user's token. The demonstration used a model with strong safety training, and the agent was still manipulated. Invariant also noted that many users choose an "always allow" confirmation policy for agent tool calls, which removes the human check that might otherwise catch the pull request.

## Failure analysis

- **Category:** security. An anonymous attacker who could file an issue borrowed the authority of the user's GitHub token.
- **Mechanism:** indirect prompt injection through a tool result (issue content), with exfiltration through a legitimate write action (a public pull request).
- **Missing controls:** the agent combined the lethal trifecta in one session: private repository data, untrusted issue text, and the ability to publish publicly. The token was far broader than the task (read one public repository). No data-flow policy prevented content from private repositories from being written to a public one, and tool-call confirmation had been turned off.

## Controls that would have helped

- Scope credentials to the task: a token or policy limiting the session to the one repository being reviewed, which Invariant recommended ([3.6 Identity and Delegation](/training/module/security-engineering/identity-and-delegation), [5.1 Least Privilege for Agents](/training/module/agent-containment-and-control/least-privilege-for-agents)).
- Break the trifecta or add taint tracking so private data cannot flow to a public sink ([3.2 Architectural Defenses Against Injection](/training/module/security-engineering/architectural-injection-defenses)).
- Apply the blast-radius test when connecting a broad token to an agent that reads public content ([2.5 Assume Compromise](/training/module/risk-and-threat-modeling/assume-compromise-blast-radius)).

## Lessons

Integrations that work exactly as designed can still compose into an exfiltration path. When the authorization check is "does this token allow it?", a broad token means the answer is always yes. Security has to come from narrowing what the agent holds in a given session and from controlling where data may flow, not from expecting the model to notice that an issue is hostile.
