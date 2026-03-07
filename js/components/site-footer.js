import { SITE } from '../config.js';

export function SiteFooter() {
  return `<footer>
    <div class="footer-inner">
      <div class="logo">c<span class="ai">AI</span>ge</div>
      <div class="footer-copy">&copy; ${SITE.year} ${SITE.name}. All rights reserved.</div>
    </div>
  </footer>`;
}
