import { SITE } from '../config.js';

export function SiteHeader({ variant = 'landing' } = {}) {
  if (variant === 'landing') {
    const navLinks = SITE.nav
      .map(item => `<a href="${item.href}">${item.label}</a>`)
      .join('');
    return `<header>
      <div class="header-inner">
        <div class="logo">c<span class="ai">AI</span>ge</div>
        <nav>${navLinks}</nav>
      </div>
    </header>`;
  }

  if (variant === 'training') {
    return `<div class="top-bar">
      <a href="index.html" class="top-bar-link">Home</a>
      <a href="exam.html" class="top-bar-link">Take Exam</a>
    </div>`;
  }

  if (variant === 'exam') {
    return `<div class="header">
      <a href="index.html" class="logo">cAIge <span>| Exam</span></a>
      <div id="timer-display" class="timer" style="display:none;">120:00</div>
    </div>`;
  }

  return '';
}
