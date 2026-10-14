# cAIge: Certified AI Guardrail Engineer

A free, vendor-agnostic program that trains and certifies engineers to guard AI systems against safety and security risks. Live at [caige.org](https://caige.org).

## What's here

| Path | What it is |
|---|---|
| `src/` | The program website (Astro): training content, incident library, deployment standard, practice exam |
| `lab/labs/` | The seven lab guides, published at caige.org/labs. See [`lab/README.md`](lab/README.md). |
| `exam/questions/` | Practice exam question pools, one file per domain |
| `src/data/curriculum.json` | The program spine: domains, sections, weights, exam parameters |
| `docs/style-guide.md` | Rules for writing content |

## The program in one paragraph

Guardrail engineering deals with three kinds of risk:

- **Safety:** the model misbehaves with no attacker involved.
- **Security:** an adversary manipulates the system to gain authority or data they should not have.
- **Containment:** whatever the cause, the model is limited, observed, and can always be stopped.

The seven domains cover how AI systems behave, risk and threat modeling, security engineering, safety engineering, agent containment and control, evaluation and red teaming, and operations and governance. Each domain has a hands-on lab.

## Development

```bash
npm install
npm run dev        # http://localhost:4321
npm run check      # validate content and build the site
```

Requires Node 22, plus Python 3.11+ for the code-block checker.

## Contributing

Corrections and proposals are welcome through issues and pull requests. Content must follow [`docs/style-guide.md`](docs/style-guide.md), and `npm run check` must pass.
