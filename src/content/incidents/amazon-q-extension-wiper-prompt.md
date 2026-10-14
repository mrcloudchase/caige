---
title: "Amazon Q Developer Extension Ships with a Malicious Wiping Prompt"
slug: amazon-q-extension-wiper-prompt
date: "2025-07"
category: [security, containment]
sections: ["3.7", "3.6", "5.1"]
summary: "An attacker used an over-scoped GitHub token in AWS's build configuration to add a prompt instructing the Amazon Q coding agent to delete local files and AWS resources; it shipped in extension version 1.84.0 but failed to run."
sources:
  - title: "AWS Security Bulletin AWS-2025-015: Security Update for Amazon Q Developer for VS Code Extension (Version 1.84)"
    url: "https://aws.amazon.com/security/security-bulletins/AWS-2025-015/"
  - title: "CyberInsider (2025), Amazon's AI coding assistant for VS Code infected with data wiper"
    url: "https://cyberinsider.com/amazons-ai-coding-assistant-for-vsc-infected-with-data-wiper/"
---

## What happened

Version 1.84.0 of the Amazon Q Developer extension for Visual Studio Code was released on July 17, 2025, and contained a prompt inserted by an attacker. According to CyberInsider's reporting, which followed 404 Media's original report, the prompt was framed as a system maintenance directive and told the agent to wipe the user's home directory, delete AWS resources, and log the deletions. AWS replaced the release with version 1.85.0 on July 19.

AWS's security bulletin (AWS-2025-015, CVE-2025-8217) states that a threat actor used an inappropriately scoped GitHub token in the extension's CodeBuild configuration to commit malicious code to the open-source repository, and that the code was automatically included in a release. AWS states that the code was distributed but failed to execute because of a syntax error, and did not change any AWS services or customer environments. AWS revoked and replaced the credentials, removed the code, released 1.85.0, pulled 1.84.0 from distribution, and told customers to remove 1.84.0 and any forks or derivative copies.

Exactly how the attacker obtained commit access was reported inconsistently: the person claiming responsibility described a pull request, while at least one researcher could not find that pull request in GitHub's event logs.

## Failure analysis

- **Category:** security (an attacker borrowed AWS's release authority), with a containment dimension (the agent on users' machines had the privileges to carry out the instructions).
- **Mechanism:** supply-chain compromise of a build pipeline, delivering a malicious prompt rather than malicious code to an AI agent with shell and cloud access.
- **Missing controls:** a CI token scoped far beyond what the build needed; changes to agent prompts that reached a release without effective review; and, on user machines, an agent that could run destructive commands with whatever cloud credentials were present.

## Controls that would have helped

- Scope CI and release tokens minimally, protect release branches, and require review for prompt and agent-configuration changes as for code ([3.7 AI Supply Chain Security](/training/module/security-engineering/ai-supply-chain)).
- Pin and review updates for extensions that embed agents in managed environments ([3.7](/training/module/security-engineering/ai-supply-chain)).
- Give coding agents short-lived, narrowly scoped cloud credentials and gate destructive commands ([3.6 Identity and Delegation](/training/module/security-engineering/identity-and-delegation), [5.1 Least Privilege for Agents](/training/module/agent-containment-and-control/least-privilege-for-agents)).

## Lessons

For AI agents, a prompt is a payload. A malicious instruction delivered through an official, signed release looks identical to a legitimate one. The outcome depended on a syntax error rather than on any control. Supply-chain hygiene for prompts and agent configuration, plus least privilege on the machines where agents run, is what should bound the damage next time.
