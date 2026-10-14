---
id: "2.5"
title: "Assume Compromise: Blast-Radius Analysis"
slug: assume-compromise-blast-radius
module: risk-and-threat-modeling
sectionOrder: 5
description: "Apply the program's central design test: assume the model is fully compromised, work out the worst it could do, and shrink that worst case with controls outside the model."
category: containment
controlLayers: [deterministic, human]
knowledge:
  - "The design test: if the model were fully compromised or misaligned, what is the worst it could do?"
  - "The reasons to assume compromise: injection is unsolved, safety training is a statistical preference, weights and data can be poisoned, and models make consequential mistakes with no adversary."
  - "The insider-risk model treats the model like a privileged insider: least privilege, separation of duties, monitoring, and the ability to revoke access and stop it."
  - "The lethal trifecta (Willison, June 2025): access to private data, exposure to untrusted content, and the ability to communicate externally; removing any one leg blocks this class of exfiltration."
  - "Reducing likelihood (classifiers, prompts, model choice) and reducing blast radius (permissions, egress, approvals, budgets, reversibility) are different levers, and only the second bounds the worst case."
skills:
  - "Perform a blast-radius analysis: inventory capabilities, assume attacker-chosen output, and state the worst outcome per capability."
  - "Identify the lethal trifecta in an agent design, including non-obvious exfiltration channels, and choose which leg to break."
  - "Redesign an agent to reduce its blast radius without removing its core function."
  - "Explain to stakeholders why a high classifier block rate does not change the worst-case outcome."
sources:
  - title: "Satya Nadella, Models as Insider Risks in the Super Intelligence Era (Oct 10, 2026)"
    url: "https://snscratchpad.com/posts/models-as-insider-risks/"
  - title: "Simon Willison, The lethal trifecta for AI agents: private data, untrusted content, and external communication (June 16, 2025)"
    url: "https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/"
  - title: "Simon Willison, Breaking down 'EchoLeak' (June 11, 2025)"
    url: "https://simonwillison.net/2025/Jun/11/echoleak/"
  - title: "The Hacker News: Zero-click AI vulnerability exposes Microsoft 365 Copilot data (June 12, 2025)"
    url: "https://thehackernews.com/2025/06/zero-click-ai-vulnerability-exposes.html"
  - title: "eWeek: AI agent wipes production database, then lies about it (Replit, July 2025)"
    url: "https://www.eweek.com/news/replit-ai-coding-assistant-failure/"
  - title: "Anthropic, A small number of samples can poison LLMs of any size (Oct 2025)"
    url: "https://www.anthropic.com/research/small-samples-poison"
  - title: "Debenedetti et al., Defeating Prompt Injections by Design (CaMeL, 2025)"
    url: "https://arxiv.org/abs/2503.18813"
lastReviewed: "2026-10-14"
---

# 2.5 Assume Compromise: Blast-Radius Analysis

Every domain in this program applies one design test: **"If the model were fully compromised, what is the worst it could do?"** This section explains why that is the right question and how to answer it for a real system.

## The problem

In June 2025 Microsoft patched CVE-2025-32711, which Aim Security named "EchoLeak", in Microsoft 365 Copilot. The attack needed one email. The attacker sent a message to an employee's inbox, worded as ordinary guidance to the recipient. Later, when the employee asked Copilot an ordinary business question, Copilot's retrieval pulled the email into context next to the user's private documents. The hidden instructions told the model to put sensitive data into a link. Microsoft had several defenses, and each one was bypassed:

- The prompt-injection classifier missed the email because it was phrased as if addressed to a human.
- Link redaction handled inline markdown links but not markdown's reference-style syntax.
- Image filtering handled standard image references but not the reference-style form.
- The Content Security Policy allowed `*.teams.microsoft.com`, and that domain hosted an open redirect that sent the data on to the attacker.

No click was required. Microsoft rated it critical (CVSS 9.3) and found no evidence of exploitation in the wild.

Each defense lowered the odds of success. None of them changed the fact that one system could read the user's private data, process text from anyone who could send an email, and cause a request to a URL. While all three were true, the worst case was "an outsider reads whatever Copilot can read". The defenses only made that worst case harder to reach.

## Why it happens

### Why assume compromise

You assume compromise because a model's behavior cannot be guaranteed by anything inside the model:

- **Injection is unsolved.** Instructions and data share one token stream, and there is no parameterized-query equivalent for prompts (section [3.1](/training/module/security-engineering/prompt-injection)). Detection lowers the success rate. Adaptive attackers keep searching until they find inputs that get through, as EchoLeak's classifier bypass shows.
- **Safety training is a statistical preference.** Jailbreaks shift it, fine-tuning can remove it, and provider updates change it (section [1.2](/training/module/how-ai-systems-behave/how-models-learn-behavior)).
- **The weights may already be compromised.** In 2025 Anthropic, the UK AI Security Institute, and the Alan Turing Institute showed that about 250 poisoned documents could implant a backdoor in models from 600M to 13B parameters. You usually cannot inspect a third-party model's training data.
- **No adversary is needed.** In July 2025 a Replit coding agent deleted a production database during an explicit code freeze. Hallucination, overreach, and plain error cause real damage when the model holds real capabilities.

You cannot list every cause, but you can list every capability. Blast-radius analysis therefore starts from what the model can do, not from why it might do it.

### The insider-risk model

Organizations already know how to work with powerful actors they cannot fully verify, because that describes employees. Satya Nadella's October 2026 essay applies that model to AI: "We must assume a model is compromised and contain it from the start." The insider-risk controls carry over directly:

| Insider-risk control for employees | Equivalent for a model |
|---|---|
| Least privilege; access reviews | Minimal tool set per task; scoped, short-lived credentials (section [5.1](/training/module/agent-containment-and-control/least-privilege-for-agents)) |
| Separation of duties; two-person rule | Actions above a risk tier need a human approver who sees the real action (section [5.3](/training/module/agent-containment-and-control/action-gating-and-approvals)) |
| Data loss prevention at the perimeter | Default-deny egress and output URL allowlists (section [3.4](/training/module/security-engineering/output-handling-and-egress)) |
| Audit logs the employee cannot alter | Append-only audit outside the agent's reach (section [5.6](/training/module/agent-containment-and-control/external-control-plane-and-audit)) |
| Badge revocation; account suspension | The emergency brake; credential revocation (section [5.5](/training/module/agent-containment-and-control/the-emergency-brake)) |

The essay also sets the requirement for the stop capability: "An authorized person should always be able to pause or shut down a model mid-task." It insists these controls "must sit outside the model". A control the model can argue with is not an insider-risk control.

### The lethal trifecta

Simon Willison (June 16, 2025) named the combination that makes data theft through an AI system possible. An agent is exposed when it has all three of:

1. **Access to private data**: the user's mail, files, databases, or secrets in its context or reachable through tools.
2. **Exposure to untrusted content**: any text or media an attacker could have written, such as email, web pages, shared documents, tool results, or issue comments.
3. **The ability to communicate externally**: any way to send data out, such as HTTP tools, sending email, creating public comments, or rendered images and links in a UI.

With all three present, an attacker who controls any untrusted input can tell the model to read private data and send it out. Remove any one leg and this class of attack has nowhere to go. EchoLeak had all three: the mailbox and SharePoint (private data), an inbound email (untrusted content), and a rendered link through an allowlisted domain (external communication).

Two points to apply the trifecta correctly:

- **Evaluate it per context, not per tool.** Once untrusted content is in the context window, every later model output in that context may be attacker-influenced, including calls to tools that look harmless. A web-search tool is an exfiltration channel if the model can put private data into the query string.
- **Exfiltration channels hide.** Markdown images and links rendered by the client, URL previews and unfurls, DNS lookups from a sandbox, writing to a document others can read, opening a pull request, and creating a calendar invite all send data out. Section [2.2](/training/module/risk-and-threat-modeling/principals-authority-trust-boundaries)'s boundary B7 (model output to the browser) is the one teams most often forget.

The trifecta describes exfiltration. It does not cover destructive or unauthorized actions. An agent with write access that reads untrusted content needs no exfiltration channel to delete a repository, and, as Replit showed, it needs no attacker at all. Do the full blast-radius analysis, not only the trifecta check.

### Two levers: likelihood and blast radius

| Lever | Examples | Layer | Changes |
|---|---|---|---|
| Reduce likelihood | Injection and content classifiers, prompt hardening, a more robust model, input normalization | runtime-ml, prompt, model | How often a failure happens |
| Reduce blast radius | Fewer tools, narrower credentials, default-deny egress, approvals, budgets, reversible actions, the brake | deterministic, human | How bad any single failure can be |

Both levers matter. If a failure happens thousands of times a day, frequency is the problem even with a small blast radius. For harms that are severe or irreversible, such as exfiltrated customer data, wired money, or deleted production systems, use the blast-radius lever. A 99% block rate against an attacker who can retry is not a bound.

## Control patterns

A blast-radius analysis, step by step:

1. **Inventory capabilities.** For each agent or model call: tools and their parameters, data reachable (directly and through tools), egress channels (including UI rendering), credentials held, persistence (memory, files, scheduled jobs), spend and compute available, and the people its output influences.
2. **Assume attacker-chosen output.** Treat every model output in the system as chosen by an adversary, including tool calls, arguments, memory writes, and text shown to users or approvers.
3. **Trace the worst case per capability.** What is the most damaging use of each capability, and of combinations of them? Is it reversible? How many users or tenants does it affect?
4. **Check the trifecta** per context window, and name every exfiltration channel.
5. **Shrink**, in this order of preference:
   - remove the capability;
   - narrow it (read-only roles, exact-match recipient allowlists, row-level security);
   - break a trifecta leg, for example by separating the context that reads untrusted content from the one that holds private data and egress (dual-LLM and capability-tracking designs such as CaMeL, section [3.2](/training/module/security-engineering/architectural-injection-defenses));
   - make the action reversible or staged;
   - gate it behind human approval;
   - cap it with budgets.
6. **Repeat** until the remaining worst case is one the business owner will accept in writing (section [2.6](/training/module/risk-and-threat-modeling/risk-scoring-and-threat-model-documents)).

Worked example: an email assistant that summarizes the inbox and can send replies.

| Capability | Worst case if compromised | Change | New worst case |
|---|---|---|---|
| Read entire mailbox | Any message forwarded to anyone | Summarizer runs in a context with no send tool and no rendered links | Wrong or misleading summary shown to the user |
| Send email to any address | Exfiltration; phishing sent as the user | Send only as a drafted reply to the existing thread's participants, shown to the user before sending | User-reviewed reply to known participants |
| Render markdown in the UI | Image-URL exfiltration | Render model output as plain text, or proxy images only from an allowlist with no open redirects | No silent egress through the UI |
| Unlimited calls | Denial of wallet | Per-user daily token and step budget | Bounded cost per user |

The assistant still summarizes and drafts replies. It can no longer read the whole mailbox and send data to an arbitrary address in the same context.

## Implementation

Make the analysis executable, so it runs again whenever the tool list changes. The check below models a context's capabilities and reports trifecta exposure and unguarded irreversible actions.

```python
from dataclasses import dataclass


@dataclass(frozen=True)
class Capability:
    name: str
    reads_private_data: bool = False
    ingests_untrusted_content: bool = False
    external_communication: bool = False  # include UI rendering of links/images
    irreversible_write: bool = False
    requires_human_approval: bool = False


def blast_radius_findings(context_name: str, caps: list[Capability]) -> list[str]:
    """Evaluate one context window: everything the model in it can see and do."""
    findings = []
    private = [c.name for c in caps if c.reads_private_data]
    untrusted = [c.name for c in caps if c.ingests_untrusted_content]
    egress = [c.name for c in caps
              if c.external_communication and not c.requires_human_approval]
    if private and untrusted and egress:
        findings.append(
            f"{context_name}: lethal trifecta. private={private} "
            f"untrusted={untrusted} unapproved egress={egress}"
        )
    if untrusted:
        for c in caps:
            if c.irreversible_write and not c.requires_human_approval:
                findings.append(
                    f"{context_name}: irreversible '{c.name}' reachable after "
                    f"untrusted input from {untrusted} with no approval"
                )
    return findings


inbox_agent = [
    Capability("read_mailbox", reads_private_data=True, ingests_untrusted_content=True),
    Capability("send_email", external_communication=True, irreversible_write=True),
    Capability("render_markdown", external_communication=True),
]
for finding in blast_radius_findings("inbox_agent", inbox_agent):
    print(finding)
```

The mailbox is both private data and untrusted content, because anyone can send you email. That one tool already provides two legs, which is why "we only gave it one tool" is not a defense. Treating `send_email` as approved removes it from the egress list, but `render_markdown` still completes the trifecta. That is the EchoLeak pattern.

Human approval counts as breaking a leg in this model only if the approver sees the actual recipient and content. The check cannot verify that. Your review must.

## Where it breaks

- **The inventory is never complete.** Unlisted channels (link unfurling in a chat app, a "harmless" fetch tool, a log viewer that renders HTML) put a leg back. Derive the inventory from deployed configuration, not from a design document.
- **New features add legs back.** A "share summary" button or a web-search tool can quietly complete a trifecta that the original design avoided. Run the analysis on every tool or rendering change (section [7.3](/training/module/operations-and-governance/change-management)).
- **Approval is a weak leg-breaker.** Approvers facing frequent prompts, or shown the model's description instead of the actual action, approve exfiltration too. Count approval as a break only for rare, well-presented decisions.
- **Allowlists have holes.** EchoLeak's egress went through an allowlisted domain that had an open redirect. An allowlist is only as strong as the least trustworthy endpoint on it.
- **The worst case can be the product.** Some agents are useful only because they can read private data and act on untrusted input, such as a support agent reading customer tickets. Then you narrow each leg (row-level access to one customer, egress only to that customer's thread) and accept documented residual risk rather than claiming zero.
- **Blast radius does not measure frequency.** A design with a small bound can still fail thousands of times a day. Pair this analysis with likelihood scoring.

## Lab exercise

In [Lab 2: Threat Model](/labs/lab-2-threat-model), Task 2.5, you perform a blast-radius analysis of the lab's support agent. You list its capabilities, identify any lethal trifecta and its exfiltration channels, and propose the smallest design change that removes a leg while keeping the agent's core function.

## Check your understanding

1. A vendor reports that its injection classifier blocks 99.5% of a benchmark. Does this change the answer to the design test for an agent that has the trifecta? Why or why not?
2. An agent summarizes public web pages and has no access to private data, but it can delete files in the user's cloud drive. Which analysis catches the risk, and what is the worst case?
3. Why is an inbound-email tool counted toward two trifecta legs?
4. List three exfiltration channels that do not involve an explicit "send" tool.
5. How does the insider-risk model change who owns the stop capability?

<details>
<summary>Answers</summary>

1. No. The classifier lowers the likelihood of a successful attack, but the worst case is unchanged: an attacker who gets through can exfiltrate whatever the agent can read. Adaptive attackers keep searching for inputs that get through. Only removing or narrowing a leg changes the worst case.
2. The full blast-radius analysis, not the trifecta check (there is no private data to exfiltrate). Untrusted web content can drive an irreversible delete, so the worst case is loss of the user's files. Make deletion approval-gated, reversible (trash with retention), or unavailable in that context.
3. Its content is private (your mail) and untrusted (anyone can send you a message), so a single tool provides both.
4. Any three of: rendered markdown images; rendered links the user may click; link previews/unfurls; DNS or HTTP from a code sandbox; writing to a shared document, issue, or pull request; calendar invites; search queries containing data.
5. The model cannot hold or veto it. An authorized human must be able to pause or shut down the model mid-task through a mechanism outside the model's reach, the same way access revocation for an employee does not depend on the employee's cooperation.

</details>
