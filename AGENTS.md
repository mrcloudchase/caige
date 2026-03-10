# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

cAIge (Certified AI Guardrail Engineer) — a vendor-agnostic AI certification platform at caige.org. Built with Astro, React islands, Tailwind CSS 4, and TypeScript. Deployed via GitHub Actions to GitHub Pages from the `mrcloudchase/caige` repo.

## Development

```bash
npm install          # install dependencies
npm run dev          # start dev server (localhost:4321)
npm run build        # production build -> dist/
npm run preview      # preview production build
```

Node 22 (see `.nvmrc`). No test framework currently.

## Git

Never include "Co-Authored-By" or any AI attribution in commit messages.

## Architecture

Astro static site with React islands for the exam engine. Content collections for training material. Zero client-side JS on content pages — React only loads on `/exam`.

### Directory Structure

```
src/
  pages/              — Astro page routes
    index.astro       — Landing page
    exam.astro        — Exam page (loads React ExamApp)
    training/
      index.astro     — Redirects to /training/overview
      [slug].astro    — Program pages (overview, competency-matrix, exam-blueprint)
      module/
        [slug].astro  — Module landing pages (prerequisites, ai-fundamentals, etc.)
        [module]/
          [section].astro — Section pages within a module
  layouts/
    BaseLayout.astro  — HTML shell, head, Header, optional Footer
    TrainingLayout.astro — BaseLayout + sidebar + prev/next nav
  components/
    Header.astro      — Site header with nav links and optional timer
    Footer.astro      — Site footer
    training/
      TrainingSidebar.astro — Sidebar nav querying content collections
      PrevNext.astro   — Prev/next module navigation
    exam/              — React components (client:load island)
      ExamApp.tsx      — Top-level exam orchestrator
      types.ts         — TypeScript interfaces
      useExamState.ts  — useReducer hook for exam state
      questionBank.ts  — Fetch and select questions
      certificate.ts   — Canvas PNG certificate generator
      (+ IntroScreen, ExamScreen, QuestionPanel, OptionItem,
         SidePanel, PaletteBox, ResultsScreen, ConfirmModal, Timer)
  content/
    modules/           — 7 markdown files with Zod-validated frontmatter
    sections/          — Section markdown files organized by module slug subdirectory
    programs/          — 3 markdown files (overview, competency-matrix, exam-blueprint)
  content.config.ts    — Zod schemas for modules, sections, and programs collections
  styles/
    global.css         — Tailwind 4 import + theme tokens + shared styles
    landing.css        — Landing page styles
    training.css       — Training page + prose content styles
    exam.css           — Exam engine styles
public/
  CNAME               — caige.org
  svg/                 — 14 SVG diagrams
  data/
    question-bank.json — Exam questions
```

### Data Flow

- Content collections (`src/content/`) are the source of truth for training content. Frontmatter defines metadata (title, slug, order, domain, weight).
- `src/content.config.ts` defines Zod schemas validated at build time.
- `public/data/question-bank.json` holds exam questions, fetched at runtime by the React exam engine.
- Theme tokens defined as CSS custom properties in `src/styles/global.css`.

### Content Collections

Three collections defined in `src/content.config.ts`:
- **modules**: 7 files (prerequisites + 6 domain modules). Schema: title, slug, order, description, domain?, weight?, studyTime?
- **sections**: Files in `sections/{module-slug}/`, one per topic. Schema: title, slug, module (parent module slug), sectionOrder, description. Module ordering is resolved at build time from the parent module's `order` field — sections do NOT store module order.
- **programs**: 3 files (overview, competency-matrix, exam-blueprint). Schema: title, slug, order, description

Pages use `getCollection()` and `render()` from `astro:content` to query and render entries.

### Exam Engine

React island loaded only on `/exam` via `client:load`. State managed via `useReducer` in `useExamState.ts`. Key flow:
1. IntroScreen: name input → load question bank → prepare (shuffle questions + options, remap correct indices)
2. ExamScreen: question panel + side palette, timer countdown via useEffect
3. Submit: confirm modal → score computation → ResultsScreen with domain breakdown
4. Certificate: canvas-based PNG generation for passing scores

### URL Structure

```
/                                         → Landing page
/training                                 → Redirects to /training/overview
/training/overview                        → Program overview
/training/competency-matrix               → Competency matrix
/training/exam-blueprint                  → Exam blueprint
/training/module/prerequisites            → Prerequisites
/training/module/ai-fundamentals          → Module 1
/training/module/guardrail-architecture   → Module 2
/training/module/guardrail-implementation → Module 3
/training/module/policy-compliance        → Module 4
/training/module/testing-red-teaming      → Module 5
/training/module/operations-observability → Module 6
/exam                                     → Exam engine
```

## Conventions

- No inline `onclick` handlers — React event handlers in components
- Content pages are static HTML with zero client JS
- Exam options are shuffled per attempt; `correct` indices are remapped
- Exam: 75 scored + 5 pilot questions, 120 min, 70% pass threshold
- CSS custom properties use `--color-*` prefix (e.g., `--color-accent`, `--color-bg`)
- SVG images referenced in markdown use absolute paths (`/svg/filename.svg`)
