import { state } from './state.js';
import { shuffle } from './utils.js';
import { loadQuestionBank, selectQuestions } from './question-bank.js';
import { startTimer, stopTimer } from './timer.js';
import { renderQuestion, buildPalette, prevQuestion, nextQuestion, toggleFlag, togglePalette } from './ui.js';
import { showResults } from './scoring.js';
import { downloadCertificate } from './certificate.js';

// ============================================================
// PREPARE EXAM — load bank, select by domain, shuffle options
// ============================================================
async function prepareExam() {
  const bank = await loadQuestionBank();
  const selected = selectQuestions(bank);

  state.questions = selected.map((q, idx) => {
    const optionIndices = q.options.map((_, i) => i);
    const shuffledOptionIndices = shuffle(optionIndices);
    const shuffledOptions = shuffledOptionIndices.map(i => q.options[i]);
    const newCorrect = q.correct.map(c => shuffledOptionIndices.indexOf(c));
    return {
      ...q,
      originalId: q.id,
      displayIndex: idx,
      options: shuffledOptions,
      correct: newCorrect,
      optionMap: shuffledOptionIndices
    };
  });
}

// ============================================================
// START EXAM
// ============================================================
async function startExam() {
  const nameInput = document.getElementById('candidate-name');
  const name = nameInput.value.trim();
  if (!name) {
    document.getElementById('name-error').style.display = 'block';
    nameInput.focus();
    return;
  }
  document.getElementById('name-error').style.display = 'none';
  state.candidateName = name;

  const startBtn = document.getElementById('start-btn');
  startBtn.disabled = true;
  startBtn.textContent = 'Loading...';

  try {
    await prepareExam();
  } catch (e) {
    startBtn.disabled = false;
    startBtn.textContent = 'Begin Exam';
    alert('Failed to load exam questions. Please try again.');
    return;
  }

  state.answers = {};
  state.flags = new Set();
  state.currentIndex = 0;
  state.submitted = false;
  state.timeRemaining = 120 * 60;

  document.getElementById('intro-screen').style.display = 'none';
  document.getElementById('exam-screen').style.display = 'block';
  document.getElementById('timer-display').style.display = 'block';

  buildPalette();
  renderQuestion();
  startTimer(submitExam);
}

// ============================================================
// SUBMIT
// ============================================================
function confirmSubmit() {
  const unanswered = state.questions.length - Object.keys(state.answers).filter(k => state.answers[k].length > 0).length;
  const flagged = state.flags.size;
  let msg = 'Are you sure you want to submit your exam? This action cannot be undone.';
  if (unanswered > 0 || flagged > 0) {
    const parts = [];
    if (unanswered > 0) parts.push(unanswered + ' unanswered question' + (unanswered > 1 ? 's' : ''));
    if (flagged > 0) parts.push(flagged + ' flagged question' + (flagged > 1 ? 's' : ''));
    msg = 'You have ' + parts.join(' and ') + '. ' + msg;
  }
  document.getElementById('confirm-msg').textContent = msg;
  document.getElementById('confirm-modal').classList.add('active');
}

function closeModal() {
  document.getElementById('confirm-modal').classList.remove('active');
}

function submitExam() {
  if (state.submitted) return;
  state.submitted = true;
  closeModal();
  stopTimer();
  document.getElementById('timer-display').style.display = 'none';
  document.getElementById('exam-screen').style.display = 'none';
  showResults(downloadCertificate);
}

// ============================================================
// EVENT BINDINGS
// ============================================================
document.getElementById('start-btn').addEventListener('click', startExam);
document.getElementById('flag-btn').addEventListener('click', toggleFlag);
document.getElementById('prev-btn').addEventListener('click', prevQuestion);
document.getElementById('next-btn').addEventListener('click', nextQuestion);
document.getElementById('submit-btn').addEventListener('click', confirmSubmit);
document.getElementById('cancel-btn').addEventListener('click', closeModal);
document.getElementById('confirm-btn').addEventListener('click', submitExam);
document.querySelector('.side-panel-toggle').addEventListener('click', togglePalette);
