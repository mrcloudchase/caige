// Merge exam/questions/d<N>.json into public/data/question-bank.json for the practice exam.
// Exam parameters and per-domain question counts come from src/data/curriculum.json.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const curriculum = JSON.parse(readFileSync('src/data/curriculum.json', 'utf8'));
const OUT = 'public/data/question-bank.json';

const domains = curriculum.domains.map(d => {
  const path = `exam/questions/d${d.domain}.json`;
  if (!existsSync(path)) throw new Error(`missing ${path}`);
  const { questions } = JSON.parse(readFileSync(path, 'utf8'));
  return {
    domain: d.domain,
    name: d.title,
    slug: d.slug,
    count: questions.length,
    questions: questions.map(q => ({ ...q, domain: d.domain })),
  };
});

const bank = {
  version: curriculum.version,
  examSize: curriculum.exam.examSize,
  timeLimitMinutes: curriculum.exam.timeLimitMinutes,
  passPercent: curriculum.exam.passPercent,
  domainDistribution: Object.fromEntries(curriculum.domains.map(d => [d.domain, d.examQuestions])),
  domains,
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(bank, null, 2) + '\n');
const total = domains.reduce((n, d) => n + d.count, 0);
console.log(`question bank: ${total} questions across ${domains.length} domains -> ${OUT}`);
