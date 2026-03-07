import { renderMarkdown } from './markdown.js';
import { SITE } from './config.js';

export function initTraining() {
  const contentEl = document.getElementById('content');
  const navItems = document.querySelectorAll('.nav-item');

  async function loadPage(path) {
    contentEl.innerHTML = '<div class="loading">Loading...</div>';
    try {
      const resp = await fetch(path);
      if (!resp.ok) throw new Error('File not found');
      const md = await resp.text();
      contentEl.innerHTML = renderMarkdown(md);
      window.scrollTo(0, 0);
    } catch (e) {
      contentEl.innerHTML = `<p>Could not load ${path}.</p>`;
    }
  }

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      loadPage(item.dataset.page);
      document.querySelector('.sidebar').classList.remove('open');
    });
  });

  const menuToggle = document.querySelector('.menu-toggle');
  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      document.querySelector('.sidebar').classList.toggle('open');
    });
  }

  loadPage(SITE.programs[0].path);
}
