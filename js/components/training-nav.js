import { SITE } from '../config.js';

export function TrainingNav() {
  const programItems = SITE.programs
    .map((item, i) =>
      `<a class="nav-item${i === 0 ? ' active' : ''}" data-page="${item.path}">${item.label}</a>`
    ).join('');

  const moduleItems = SITE.modules
    .map(item =>
      `<a class="nav-item" data-page="${item.path}">
        ${item.label}
        <span class="nav-weight">${item.weight}</span>
      </a>`
    ).join('');

  return `<nav class="sidebar">
    <div class="sidebar-header">
      <h1>c<span>AI</span>ge</h1>
      <p>${SITE.tagline}</p>
    </div>
    <div class="nav-section">Program</div>
    ${programItems}
    <div class="nav-section">Training Modules</div>
    ${moduleItems}
  </nav>`;
}
