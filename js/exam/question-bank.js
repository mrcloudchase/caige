import { shuffle } from './utils.js';

let questionBank = null;

export async function loadQuestionBank() {
  if (questionBank) return questionBank;
  const resp = await fetch('content/question-bank.json');
  if (!resp.ok) throw new Error('Failed to load question bank');
  questionBank = await resp.json();
  return questionBank;
}

export function selectQuestions(bank) {
  const dist = bank.domainDistribution;
  const selected = [];

  for (const domainData of bank.domains) {
    const needed = dist[domainData.domain] || 0;
    const pool = [...domainData.questions];
    const shuffled = shuffle(pool);
    const picked = shuffled.slice(0, needed);
    picked.forEach(q => { q.domainName = domainData.name; });
    selected.push(...picked);
  }

  return shuffle(selected);
}
