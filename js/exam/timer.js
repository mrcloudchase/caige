import { state } from './state.js';

export function startTimer(onTimeUp) {
  updateTimerDisplay();
  state.timerInterval = setInterval(() => {
    state.timeRemaining--;
    updateTimerDisplay();
    if (state.timeRemaining <= 0) {
      clearInterval(state.timerInterval);
      onTimeUp();
    }
  }, 1000);
}

export function stopTimer() {
  clearInterval(state.timerInterval);
}

function updateTimerDisplay() {
  const mins = Math.floor(state.timeRemaining / 60);
  const secs = state.timeRemaining % 60;
  const display = document.getElementById('timer-display');
  display.textContent = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
  display.classList.remove('warning', 'critical');
  if (state.timeRemaining <= 300) {
    display.classList.add('critical');
  } else if (state.timeRemaining <= 600) {
    display.classList.add('warning');
  }
}
