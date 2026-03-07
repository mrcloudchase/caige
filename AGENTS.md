# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

cAIge (Certified AI Guardrail Engineer) — a vendor-agnostic AI certification platform at caigeai.dev. Static site deployed via GitHub Pages from the `mrcloudchase/caige` repo.

## Development

No build step, no package manager, no tests, no linter. To serve locally, double-click `open-site.command` — it starts a Python HTTP server on port 8000 and opens the browser. Verify changes across the three pages: `index.html`, `training.html`, `exam.html`.

## Git

Never include "Co-Authored-By" or any AI attribution in commit messages.

## Architecture

Static site using component-based vanilla JS (ES modules). Three thin HTML shells mount JS components at load time. Designed for eventual React/Next.js migration.

### Data flow

- `js/config.js` is the single source of truth — site name, nav links, training module list. All components read from it.
- `content/question-bank.json` holds exam questions organized by domain with a `domainDistribution` config that controls how many questions are selected per domain.
- Training content lives in `content/modules/*.md` and `content/*.md` as Markdown files, fetched at runtime and rendered client-side by `js/markdown.js`.

### Component pattern

Components are pure functions that return HTML strings. They are inserted via `outerHTML` replacement of placeholder `<div>` elements:

```js
document.getElementById('site-header').outerHTML = SiteHeader({ variant: 'landing' });
```

`SiteHeader` has three variants (`landing`, `training`, `exam`) producing different markup for each page. `SiteFooter` is only used on the landing page.

### Exam modules (`js/exam/`)

Eight ES modules with strict separation:
- `state.js` — shared mutable state object (single instance, imported by all other exam modules)
- `question-bank.js` — fetches and caches `question-bank.json`, selects questions per domain distribution
- `index.js` — orchestrator: prepares exam (shuffles questions AND options), wires all event listeners, manages screen transitions via DOM `style.display`
- `ui.js` — renders current question, palette, handles navigation
- `scoring.js` — computes results and renders the results screen
- `certificate.js` — generates a PNG certificate on a canvas element
- `timer.js` — countdown timer with warning/critical CSS classes
- `utils.js` — `shuffle()` and `escapeHTML()` helpers

### CSS split

Each HTML page loads `css/styles.css` (shared reset, variables, buttons, logo) plus one page-specific file (`landing.css`, `training.css`, or `exam.css`). CSS variables are defined in `:root` in `styles.css`.

## Conventions

- No inline `onclick` handlers — all event binding in JS
- No inline styles except rare one-offs in HTML (e.g., domain bar widths)
- Question options are shuffled per exam attempt; `correct` indices are remapped accordingly in `index.js`
- Exam has 75 scored + 5 pilot questions, 120 min, 70% pass threshold — these numbers appear in both HTML and JS
