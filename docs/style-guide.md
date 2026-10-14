# cAIge Content Style Guide (v2.0)

This guide applies to everything under `src/content/`, `lab/labs/`, and `exam/questions/`.

## The organizing framework

Every failure mode and every control is placed on two axes.

**Category: where the problem comes from**

- `safety`: the model misbehaves without an adversary (harmful content, hallucination, sycophancy, over-refusal, overreach).
- `security`: an adversary gains or abuses authority (prompt injection, exfiltration, poisoning, authorization failures).
- `containment`: cause-agnostic controls that limit, observe, and stop a model whatever the reason it misbehaves (least privilege, sandboxing, budgets, the emergency brake, tamper-proof audit).
- `cross-cutting`: foundations, evaluation, and operations that serve all three.

**Control layer: where the control is enforced, weakest to strongest**

1. `model`: training and alignment (owned by the provider; understood, not relied on)
2. `prompt`: system prompts, delimiters (a request, not an enforcement)
3. `runtime-ml`: classifiers and LLM judges (probabilistic, can be evaded)
4. `deterministic`: authorization, least privilege, sandboxing, schemas, egress control (the only layer that can guarantee anything)
5. `human`: approvals, the emergency brake, incident response

The design test used throughout: **"If the model were fully compromised, what is the worst it could do?"** Classifiers reduce how often things go wrong. Architecture bounds how bad it can get.

## Section structure

Each section file uses this skeleton, in this order:

1. `## The problem`: open with a concrete scenario or a real, cited incident.
2. `## Why it happens`: the mechanism, stated precisely.
3. `## Control patterns`: options, ordered by strength, with the control layer named.
4. `## Implementation`: code or configuration where it adds value.
5. `## Where it breaks`: bypasses and limits of each control. Every section must have this.
6. `## Lab exercise`: point to the task in the domain's lab (`/labs/<lab-slug>`, "Task X.Y").
7. `## Check your understanding`: 3 to 5 questions with answers inside a `<details>` element.

Module landing pages contain a short introduction, learning outcomes, and how the domain connects to the others. Do not add a separate "key takeaways" or "learning objectives" section page. Objectives live in frontmatter (`knowledge`, `skills`) and the competency matrix is generated from them.

## Accuracy rules

- **Cite claims.** Any statistic, incident, research result, or regulatory statement needs a source in the frontmatter `sources` list. Verify sources exist. Never invent a URL, paper, case name, or number.
- **No unsupported absolutes.** Do not write "guarantees", "cannot", "always", "never", or "eliminates" unless the control is deterministic and the claim is literally true. Probabilistic controls *reduce* risk.
- **No model names in timeless claims.** Model names may appear only in dated, cited examples ("In 2024, ..."). Code samples use a placeholder such as `MODEL = "your-model"` and a provider-neutral `llm.complete(...)` style interface.
- **Prompt injection is not SQL injection.** Do not imply a parameterized-query equivalent exists for prompts. Delimiters and structured prompts reduce risk; they do not separate instructions from data.
- **The model is untrusted.** Do not show approvers the model's own reasoning as evidence. Do not let a model verify its own work. Do not elevate user-derived content to the system role.
- **Date-stamp versions.** OWASP 2025, NIST AI 600-1 (2024), EU AI Act (Regulation (EU) 2024/1689), and so on.

## Code rules

- Code must be correct for what it claims, secure by default, and fail closed where safety depends on it.
- Every ```python block must parse (`python3 -I scripts/check-code-blocks.py`). Use ```text for pseudocode and diagrams.
- Helper functions that are not shown may be referenced if their name makes their contract obvious, but never hide the security-relevant logic in an unshown helper.
- Watch for these common errors: allowlists that short-circuit a blocklist, suffix or substring matching on domains, unkeyed hashes presented as anonymization, logging raw PII, rate limiting on an unauthenticated identity, missing Unicode normalization, unescaped delimiters, mutable default arguments, divide-by-zero on empty inputs, off-by-one percentiles.

## Voice

- Write for an engineer with one to two years of AI/ML experience. Be direct and concrete.
- Avoid filler: "it is important to note", "in today's landscape", "the key insight", "game-changer", "dramatically", "non-negotiable", "deep dive".
- Do not repeat callouts. If a paragraph already explains why something matters, do not add a box saying so.
- Prefer tables for comparisons and short paragraphs for reasoning.
- Diagrams use ```text blocks with straight ASCII, or existing SVGs in `public/svg/` only where the SVG matches the text exactly.
