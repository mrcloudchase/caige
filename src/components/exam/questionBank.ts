import type { Question, QuestionBank } from './types';
import { shuffle } from './utils';

let cachedBank: QuestionBank | null = null;

export async function loadQuestionBank(): Promise<QuestionBank> {
  if (cachedBank) return cachedBank;
  const resp = await fetch('/data/question-bank.json');
  if (!resp.ok) throw new Error('Failed to load question bank');
  cachedBank = await resp.json();
  return cachedBank!;
}

export function selectQuestions(bank: QuestionBank): Question[] {
  const dist = bank.domainDistribution;
  const selected: Question[] = [];

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

export function prepareQuestions(bank: QuestionBank): Question[] {
  const selected = selectQuestions(bank);

  return selected.map((q, idx) => {
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
      optionMap: shuffledOptionIndices,
    };
  });
}
