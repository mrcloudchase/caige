# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with content in this directory.

Also refer to the root [AGENTS.md](../../AGENTS.md) for project-wide context.

## Content Structure

- `programs/overview.md` — Training program overview
- `programs/competency-matrix.md` — Exhaustive knowledge areas and skills per domain
- `programs/exam-blueprint.md` — Exam structure, question types, detailed objectives, scoring methodology
- `modules/prerequisites.md` — Required AI Foundations prerequisite knowledge (not directly tested on exam)
- `modules/module-{1-6}-*.md` — Six training modules, one per exam domain
- `sections/{module-slug}/*.md` — Section content files organized by parent module

All content is version 1.0. All files have YAML frontmatter validated by Zod schemas in `src/content.config.ts`.

## Frontmatter

### Modules
```yaml
title: string       # Display title
slug: string        # URL slug (used in /training/module/[slug])
order: number       # Sort order (0=prerequisites, 1-6=modules)
description: string # Short description
domain?: number     # Exam domain number (1-6, absent for prerequisites)
weight?: string     # Domain weight (e.g. "15%", absent for prerequisites)
studyTime?: string  # Estimated study time (e.g. "3-4 hours")
```

### Sections
```yaml
title: string       # Display title
slug: string        # URL slug (used in /training/module/[module]/[slug])
module: string      # Parent module slug (must match a module's slug field)
sectionOrder: number # Sort order within the module (0=learning-objectives, etc.)
description: string # Short description
```

Module ordering is resolved at build time from the parent module's `order` field — sections do NOT store module order.

### Programs
```yaml
title: string       # Display title
slug: string        # URL slug (used in /training/[slug])
order: number       # Sort order (0=overview, 1=competency-matrix, 2=exam-blueprint)
description: string # Short description
```

## How Content Is Consumed

Markdown files are rendered at build time by Astro's built-in markdown pipeline (remark/rehype). Standard markdown features are fully supported including HTML in markdown. SVG diagrams are referenced as images using absolute paths: `![alt text](/svg/filename.svg)`.

## Question Bank Format

Located at `public/data/question-bank.json` (served as a static file, fetched at runtime by the exam engine).

Structure:
- `version` — integer version number
- `examSize` — total scored questions per exam (75)
- `domainDistribution` — object mapping domain number to question count (must sum to `examSize`)
- `domains[]` — array of domain objects with `domain`, `name`, `count`, and `questions[]`

Each question: `id`, `domain`, `type` ("mc"/"ms"), `question`, `correct` (array of indices), `options`, `explanation`.

## Cross-Reference Integrity

These values must stay consistent across all documents:
- Domain names, numbers, and weights
- Exam parameters (75 scored + 5 pilot, 120 min, 70% pass)
- Competency matrix sub-section numbering maps 1:1 to module sections and exam blueprint objectives

## Git

Never include "Co-Authored-By" or any AI attribution in commit messages.
