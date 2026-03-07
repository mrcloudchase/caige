import { SITE } from '../config.js';

export function SiteHeader({ timer = false } = {}) {
  const navLinks = SITE.nav
    .map(item => `<a href="${item.href}">${item.label}</a>`)
    .join('');

  const timerHTML = timer
    ? '<div id="timer-display" class="timer" style="display:none;">120:00</div>'
    : '';

  return `<header>
    <div class="header-inner">
      <a href="index.html" class="logo">c<span class="ai">AI</span>ge</a>
      <nav>${navLinks}</nav>
      ${timerHTML}
    </div>
  </header>`;
}
