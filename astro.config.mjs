import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://caige.org',
  output: 'static',
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    shikiConfig: { theme: 'github-dark' },
  },
  redirects: {
    '/training': '/training/overview',
    '/exam': '/practice-exam',
    // v1.0 module URLs
    '/training/module/ai-foundations': '/training/module/how-ai-systems-behave',
    '/training/module/understanding-failure-modes': '/training/module/risk-and-threat-modeling',
    '/training/module/architecting-guardrails': '/training/module/security-engineering',
    '/training/module/implementing-guardrails': '/training/module/safety-engineering',
    '/training/module/validating-guardrails': '/training/module/evaluation-and-red-teaming',
  },
});
