# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this content directory.

Also refer to the root [AGENTS.md](../AGENTS.md) for project-wide context.

## Content Structure

- `modules/README.md` — Training program overview (landing page for the training nav)
- `modules/module-{1-6}-*.md` — Six training modules, one per exam domain
- `competency-matrix.md` — Exhaustive knowledge areas and skills per domain
- `exam-blueprint.md` — Exam structure, question types, detailed objectives, scoring methodology
- `question-bank.json` — All exam questions, consumed by the exam engine at runtime

## How Content Is Consumed

All Markdown files are fetched at runtime by `js/training.js` and rendered client-side via `js/markdown.js` — a custom Markdown renderer (not a library). It supports: headings (h1-h4), bold/italic/code inline, links, unordered/ordered lists, code blocks, tables, blockquotes, and horizontal rules. **No HTML is supported in Markdown files** — raw HTML tags will render as text.

## Question Bank Format

`question-bank.json` structure:
- `domainDistribution` — how many questions to select per domain (must sum to 75)
- `domains[]` — array of domain objects, each containing:
  - `domain` — integer 1-6
  - `name` — display name
  - `questions[]` — pool of questions for that domain

Each question:
- `id` — unique integer
- `domain` — integer 1-6
- `type` — `"mc"` (single answer) or `"ms"` (multiple select)
- `correct` — array of 0-based option indices (single element for `mc`, multiple for `ms`)
- `options` — array of answer strings (prefixed with "A. ", "B. ", etc.)
- `explanation` — not shown during exam, for reference only

The exam engine shuffles both question order and option order per attempt, remapping `correct` indices accordingly. The question pool must be larger than `domainDistribution` counts to provide variety.

## Certification Domains and Weights

| Domain | Weight | Questions |
|--------|--------|-----------|
| 1. AI Fundamentals & Failure Modes | 15% | 11 |
| 2. Guardrail Architecture & Design | 25% | 19 |
| 3. Guardrail Implementation | 20% | 15 |
| 4. Policy, Compliance & Governance | 15% | 11 |
| 5. Testing & Red Teaming | 15% | 11 |
| 6. Operations & Observability | 10% | 8 |

## Content Conventions

- Modules build sequentially — Module 1 concepts are referenced in later modules
- Each module ends with review questions (multiple choice, multiple select, scenario-based) with explanations
- Content is vendor-agnostic — teaches patterns and architectural thinking, not product-specific configuration
- Key topics that distinguish this cert: MCP/tool integration protocols, identity delegation, prompt injection nuance (direct vs indirect), agentic system guardrails
- Exam has 75 scored + 5 pilot questions, 120 min, 70% passing score, 3-year recertification

## Git

Never include "Co-Authored-By" or any AI attribution in commit messages.
