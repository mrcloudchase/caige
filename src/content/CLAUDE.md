# CLAUDE.md

Guidance for working with content in this directory. Also read the root [AGENTS.md](../../AGENTS.md) and [docs/style-guide.md](../../docs/style-guide.md).

## Structure

- `programs/`: overview, competency-matrix (intro only; the matrix is generated), exam-blueprint (narrative only; distribution and objectives are generated), glossary.
- `modules/d<N>-<slug>.md`: seven domain landing pages.
- `sections/<domain-slug>/<section-slug>.md`: 43 sections, one per curriculum entry in `src/data/curriculum.json`.
- `incidents/<slug>.md`: incident case studies.
- `pages/`: the deployment standard and the certification pages.

Lab guides live in `lab/labs/` and are loaded into the site as the `labs` collection.

## Frontmatter

Schemas are in `src/content.config.ts`. `npm run validate` checks that content agrees with `curriculum.json`.

### Sections

```yaml
id: "3.4"                        # must match curriculum.json
title: "..."                     # must match curriculum.json
slug: output-handling-and-egress # must match curriculum.json
module: security-engineering     # domain slug
sectionOrder: 4                  # digit after the dot
description: "..."
category: security               # safety | security | containment | cross-cutting
controlLayers: [deterministic]   # model | prompt | runtime-ml | deterministic | human
knowledge: ["..."]               # rendered into the competency matrix
skills: ["..."]                  # rendered into the matrix and exam objectives
sources: [{ title: "...", url: "https://..." }]
lastReviewed: "2026-10-14"       # flagged by validate after 12 months
```

Section bodies follow the skeleton in the style guide. They must include `## Where it breaks`, `## Lab exercise` (linking `/labs/<lab-slug>`), and `## Check your understanding`.

### Modules

`title`, `slug`, `order`, `domain`, `weight` ("15%"), `description`, `studyTime`, `lab`.

### Incidents

`title`, `slug` (same as the file name), `date` (YYYY-MM or YYYY-MM-DD), `category` (list), `sections` (section ids), `summary`, `sources` (at least one).

## Question pools

Pools are in `exam/questions/d<N>.json`, and `scripts/build-question-bank.mjs` merges them into `public/data/question-bank.json`. Each question has these fields:

- `id`, `objective` (section id), `category`;
- `type`: `mc` (4 options, 1 correct) or `ms` (5 options, 2-3 correct, with "(Choose N)" in the question text);
- `question`, `options`, `correct` (indices);
- `explanation`.

Each section needs at least 3 questions, and each pool needs at least twice its domain's exam draw.

## Git

Never include "Co-Authored-By" or any AI attribution in commit messages.
