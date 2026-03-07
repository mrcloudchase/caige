export const state = {
  screen: 'intro',
  candidateName: '',
  questions: [],
  answers: {},
  flags: new Set(),
  currentIndex: 0,
  timeRemaining: 120 * 60,
  timerInterval: null,
  submitted: false
};
