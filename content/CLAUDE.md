# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with content in this directory.

Also refer to the root [AGENTS.md](../AGENTS.md) for project-wide context.

## Content Structure

- `modules/README.md` — Training program overview (landing page for the training nav)
- `modules/module-{1-6}-*.md` — Six training modules, one per exam domain
- `competency-matrix.md` — Exhaustive knowledge areas and skills per domain
- `exam-blueprint.md` — Exam structure, question types, detailed objectives, scoring methodology
- `question-bank.json` — All exam questions, consumed by the exam engine at runtime

All content is version 1.0.

## How Content Is Consumed

All Markdown files are fetched at runtime by `js/training.js` and rendered client-side via `js/markdown.js` — a custom Markdown renderer (not a library). It supports: headings (h1-h4), bold/italic/code inline, links, unordered/ordered lists, code blocks, tables, blockquotes, and horizontal rules. **No HTML is supported in Markdown files** — raw HTML tags will render as text.

## Question Bank Format

`question-bank.json` structure:
- `version` — integer version number
- `examSize` — total scored questions per exam (75)
- `domainDistribution` — object mapping domain number to question count (must sum to `examSize`)
- `domains[]` — array of domain objects, each containing:
  - `domain` — integer 1-6
  - `name` — display name
  - `count` — number of questions selected from this domain (must match `domainDistribution`)
  - `questions[]` — pool of questions for that domain

Each question:
- `id` — unique integer (currently 1-75, sequential across domains)
- `domain` — integer 1-6
- `type` — `"mc"` (single answer) or `"ms"` (multiple select)
- `question` — the question text (may contain `\n` for scenario-based questions)
- `correct` — array of 0-based option indices (single element for `mc`, multiple for `ms`)
- `options` — array of answer strings (prefixed with "A. ", "B. ", etc.)
- `explanation` — shown after exam review, not during the exam

The exam engine shuffles both question order and option order per attempt, remapping `correct` indices accordingly. The question pool should be larger than `domainDistribution` counts to provide variety across attempts. **Current state: the pool has exactly 75 questions (pool size = exam size), so every attempt uses all questions. The pool needs to be expanded for production use.**

## Certification Domains and Weights

| Domain | Weight | Exam Questions | Bank Pool | Module Review Qs |
|--------|--------|---------------|-----------|-----------------|
| 1. AI Fundamentals & Failure Modes | 15% | 11 | 11 | 11 |
| 2. Guardrail Architecture & Design | 25% | 19 | 19 | 18 |
| 3. Guardrail Implementation | 20% | 15 | 15 | 12 |
| 4. Policy, Compliance & Governance | 15% | 11 | 11 | 10 |
| 5. Testing & Red Teaming | 15% | 11 | 11 | 10 |
| 6. Operations & Observability | 10% | 8 | 8 | 8 |
| **Total** | **100%** | **75** | **75** | **69** |

## Training Module Structure

Each module follows the same structure:
1. Header with domain weight and estimated study time
2. Learning objectives
3. Numbered sections matching the competency matrix sub-sections (e.g., Module 2 has sections 2.1-2.6)
4. Sub-sections within each section (e.g., 2.1.1, 2.1.2)
5. Key Takeaways (numbered summary)
6. Review Questions with answers and explanations

Review questions use the same three types as the exam: multiple choice, multiple select (states how many to choose), and scenario-based. Answers include the correct letter(s) and an explanation paragraph.

## Cross-Reference Integrity

These values must stay consistent across all documents:
- Domain names, numbers, and weights — appear in `exam-blueprint.md`, `competency-matrix.md`, `modules/README.md`, all module headers, and `question-bank.json`
- Exam parameters (75 scored + 5 pilot, 120 min, 70% pass, 3-year recert) — appear in `exam-blueprint.md`, `modules/README.md`, and referenced in module content
- Competency matrix sub-section numbering (e.g., 1.1, 1.2, 1.3) maps 1:1 to module section numbering and exam blueprint objectives
- Question `domain` field in `question-bank.json` must match the domain the question appears under

## Content Conventions

- Modules build sequentially — Module 1 concepts are referenced in later modules
- Content is vendor-agnostic — teaches patterns and architectural thinking, not product-specific configuration
- Key topics that distinguish this cert: MCP/tool integration protocols, identity delegation, prompt injection nuance (direct vs indirect), agentic system guardrails
- Code examples use pseudocode or generic syntax, not vendor-specific SDKs
- Tables are used heavily for tradeoff comparisons and classification breakdowns
- Exam has 75 scored + 5 pilot questions, 120 min, 70% passing score, 3-year recertification

## Git

Never include "Co-Authored-By" or any AI attribution in commit messages.
