export const SITE = {
  name: 'cAIge',
  tagline: 'Certified AI Guardrail Engineer',
  year: 2026,
  nav: [
    { label: 'Training', href: 'training.html', id: 'training' },
    { label: 'Exam', href: 'exam.html', id: 'exam' },
  ],
  programs: [
    { label: 'Overview', path: 'content/modules/README.md' },
    { label: 'Prerequisites', path: 'content/modules/prerequisites.md' },
    { label: 'Competency Matrix', path: 'content/competency-matrix.md' },
    { label: 'Exam Blueprint', path: 'content/exam-blueprint.md' },
  ],
  modules: [
    { label: '1. AI Fundamentals & Failure Modes', path: 'content/modules/module-1-ai-fundamentals.md', weight: '15%' },
    { label: '2. Guardrail Architecture & Design', path: 'content/modules/module-2-guardrail-architecture.md', weight: '25%' },
    { label: '3. Guardrail Implementation', path: 'content/modules/module-3-guardrail-implementation.md', weight: '20%' },
    { label: '4. Policy, Compliance & Governance', path: 'content/modules/module-4-policy-compliance.md', weight: '15%' },
    { label: '5. Testing & Red Teaming', path: 'content/modules/module-5-testing-red-teaming.md', weight: '15%' },
    { label: '6. Operations & Observability', path: 'content/modules/module-6-operations-observability.md', weight: '10%' },
  ],
};
