import { state } from './state.js';
import { escapeHTML } from './utils.js';

export function renderQuestion() {
  const q = state.questions[state.currentIndex];
  document.getElementById('question-number').textContent = 'Question ' + (state.currentIndex + 1) + ' of ' + state.questions.length;
  document.getElementById('domain-label').textContent = 'Domain ' + q.domain + ': ' + q.domainName;
  document.getElementById('question-text').textContent = q.question;

  const optList = document.getElementById('options-list');
  optList.innerHTML = '';

  const isMulti = q.type === 'ms';
  const selected = state.answers[state.currentIndex] || [];

  q.options.forEach((opt, idx) => {
    const li = document.createElement('li');
    li.className = 'option-item' + (selected.includes(idx) ? ' selected' : '');
    const inputType = isMulti ? 'checkbox' : 'radio';
    const checked = selected.includes(idx) ? 'checked' : '';
    li.innerHTML = '<input type="' + inputType + '" name="q' + state.currentIndex + '" ' + checked + '><span class="option-text">' + escapeHTML(opt) + '</span>';
    li.addEventListener('click', (e) => {
      if (e.target.tagName === 'INPUT') return;
      selectOption(idx);
    });
    li.querySelector('input').addEventListener('change', () => selectOption(idx));
    optList.appendChild(li);
  });

  const flagBtn = document.getElementById('flag-btn');
  const flagText = document.getElementById('flag-text');
  if (state.flags.has(state.currentIndex)) {
    flagBtn.classList.add('flagged');
    flagText.textContent = 'Flagged';
  } else {
    flagBtn.classList.remove('flagged');
    flagText.textContent = 'Flag for Review';
  }

  document.getElementById('prev-btn').disabled = state.currentIndex === 0;
  document.getElementById('next-btn').disabled = state.currentIndex === state.questions.length - 1;

  updatePalette();
}

function selectOption(idx) {
  const q = state.questions[state.currentIndex];
  let selected = state.answers[state.currentIndex] || [];

  if (q.type === 'ms') {
    if (selected.includes(idx)) {
      selected = selected.filter(i => i !== idx);
    } else {
      selected = [...selected, idx];
    }
  } else {
    selected = [idx];
  }

  state.answers[state.currentIndex] = selected;
  renderQuestion();
}

export function prevQuestion() {
  if (state.currentIndex > 0) {
    state.currentIndex--;
    renderQuestion();
    scrollToTop();
  }
}

export function nextQuestion() {
  if (state.currentIndex < state.questions.length - 1) {
    state.currentIndex++;
    renderQuestion();
    scrollToTop();
  }
}

function goToQuestion(idx) {
  state.currentIndex = idx;
  renderQuestion();
  scrollToTop();
  if (window.innerWidth <= 768) {
    document.getElementById('side-panel').classList.remove('expanded');
  }
}

function scrollToTop() {
  document.getElementById('question-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function toggleFlag() {
  if (state.flags.has(state.currentIndex)) {
    state.flags.delete(state.currentIndex);
  } else {
    state.flags.add(state.currentIndex);
  }
  renderQuestion();
}

export function buildPalette() {
  const grid = document.getElementById('palette-grid');
  grid.innerHTML = '';
  state.questions.forEach((_, idx) => {
    const box = document.createElement('div');
    box.className = 'palette-box';
    box.textContent = idx + 1;
    box.addEventListener('click', () => goToQuestion(idx));
    grid.appendChild(box);
  });
}

function updatePalette() {
  const boxes = document.getElementById('palette-grid').children;
  for (let i = 0; i < boxes.length; i++) {
    const box = boxes[i];
    box.className = 'palette-box';
    if (i === state.currentIndex) box.classList.add('current');
    if (state.answers[i] && state.answers[i].length > 0) box.classList.add('answered');
    if (state.flags.has(i)) box.classList.add('flagged');
  }
}

export function togglePalette() {
  document.getElementById('side-panel').classList.toggle('expanded');
}
