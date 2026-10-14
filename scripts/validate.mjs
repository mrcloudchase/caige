// Cross-reference validation for the cAIge program.
// Checks that the curriculum spine, content files, labs, incidents, and question
// bank agree with each other, and that internal links and images resolve.
// Exit code 1 on any error. Stale-review warnings do not fail the build.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';
import yaml from 'js-yaml';

const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

const curriculum = JSON.parse(readFileSync('src/data/curriculum.json', 'utf8'));
const SECTION_IDS = new Set(curriculum.domains.flatMap(d => d.sections.map(s => s.id)));
const CATEGORIES = new Set(['safety', 'security', 'containment', 'cross-cutting']);

function listMd(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { recursive: true })
    .map(String)
    .filter(f => f.endsWith('.md'))
    .map(f => join(dir, f));
}

function parse(path) {
  const text = readFileSync(path, 'utf8');
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) {
    err(`${path}: missing frontmatter`);
    return { data: {}, body: text };
  }
  try {
    return { data: yaml.load(m[1]) ?? {}, body: m[2] };
  } catch (e) {
    err(`${path}: invalid frontmatter: ${e.message}`);
    return { data: {}, body: m[2] };
  }
}

// ---- Curriculum spine sanity ----
const weightSum = curriculum.domains.reduce((n, d) => n + d.weight, 0);
if (weightSum !== 100) err(`curriculum: domain weights sum to ${weightSum}, expected 100`);
const examSum = curriculum.domains.reduce((n, d) => n + d.examQuestions, 0);
if (examSum !== curriculum.exam.examSize) err(`curriculum: examQuestions sum to ${examSum}, expected ${curriculum.exam.examSize}`);

// ---- Modules ----
const moduleFiles = listMd('src/content/modules').map(p => ({ path: p, ...parse(p) }));
for (const d of curriculum.domains) {
  const mod = moduleFiles.find(m => m.data.slug === d.slug);
  if (!mod) { err(`module for domain ${d.domain} (${d.slug}) not found in src/content/modules`); continue; }
  const want = { title: d.title, order: d.domain, domain: d.domain, weight: `${d.weight}%`, lab: d.lab };
  for (const [k, v] of Object.entries(want)) {
    if (mod.data[k] !== v) err(`${mod.path}: ${k} is ${JSON.stringify(mod.data[k])}, expected ${JSON.stringify(v)}`);
  }
}
for (const m of moduleFiles) {
  if (!curriculum.domains.some(d => d.slug === m.data.slug)) err(`${m.path}: module slug ${m.data.slug} is not in the curriculum`);
}

// ---- Sections ----
const sectionFiles = listMd('src/content/sections').map(p => ({ path: p, ...parse(p) }));
const seen = new Set();
for (const d of curriculum.domains) {
  for (const s of d.sections) {
    const path = `src/content/sections/${d.slug}/${s.slug}.md`;
    const f = sectionFiles.find(x => x.path === path);
    if (!f) { err(`section ${s.id} missing: ${path}`); continue; }
    seen.add(path);
    const want = { id: s.id, title: s.title, slug: s.slug, module: d.slug, sectionOrder: Number(s.id.split('.')[1]) };
    for (const [k, v] of Object.entries(want)) {
      if (f.data[k] !== v) err(`${path}: ${k} is ${JSON.stringify(f.data[k])}, expected ${JSON.stringify(v)}`);
    }
    if (!CATEGORIES.has(f.data.category)) err(`${path}: invalid category ${f.data.category}`);
    if (!/^#\s/m.test(f.body)) err(`${path}: body has no H1 heading`);
    for (const h of ['## Where it breaks', '## Lab exercise', '## Check your understanding']) {
      if (!f.body.includes(h)) err(`${path}: missing required heading "${h}"`);
    }
    if (!f.body.includes(`/labs/${d.lab}`)) err(`${path}: lab exercise does not link to /labs/${d.lab}`);
    const reviewed = Date.parse(f.data.lastReviewed);
    if (Number.isNaN(reviewed)) err(`${path}: invalid lastReviewed`);
    else if (Date.now() - reviewed > 365 * 24 * 3600 * 1000) warn(`${path}: lastReviewed ${f.data.lastReviewed} is over 12 months old`);
  }
}
for (const f of sectionFiles) if (!seen.has(f.path)) err(`${f.path}: section file is not in the curriculum`);

// ---- Labs ----
const labFiles = listMd('lab/labs').filter(p => basename(p).startsWith('lab-')).map(p => ({ path: p, ...parse(p) }));
for (const d of curriculum.domains) {
  const lab = labFiles.find(l => l.data.slug === d.lab);
  if (!lab) { err(`lab ${d.lab} missing in lab/labs`); continue; }
  if (basename(lab.path, '.md') !== d.lab) err(`${lab.path}: file name must match slug ${d.lab}`);
  if (lab.data.domain !== d.domain) err(`${lab.path}: domain is ${lab.data.domain}, expected ${d.domain}`);
  for (const s of d.sections) {
    if (!new RegExp(`^##\\s+Task ${s.id.replace('.', '\\.')}\\b`, 'm').test(lab.body)) err(`${lab.path}: missing "## Task ${s.id}"`);
  }
}

// ---- Incidents ----
const incidentFiles = listMd('src/content/incidents').map(p => ({ path: p, ...parse(p) }));
for (const i of incidentFiles) {
  for (const id of i.data.sections ?? []) if (!SECTION_IDS.has(id)) err(`${i.path}: unknown section id ${id}`);
  for (const c of i.data.category ?? []) if (!CATEGORIES.has(c)) err(`${i.path}: invalid category ${c}`);
  if (basename(i.path, '.md') !== i.data.slug) err(`${i.path}: file name must match slug ${i.data.slug}`);
}

// ---- Questions ----
const qIds = new Set();
for (const d of curriculum.domains) {
  const path = `exam/questions/d${d.domain}.json`;
  if (!existsSync(path)) { err(`${path} missing`); continue; }
  let qs;
  try { qs = JSON.parse(readFileSync(path, 'utf8')).questions; } catch (e) { err(`${path}: ${e.message}`); continue; }
  if (!Array.isArray(qs)) { err(`${path}: "questions" must be an array`); continue; }
  if (qs.length < d.examQuestions * 2) err(`${path}: ${qs.length} questions; need at least ${d.examQuestions * 2} (2x exam draw)`);
  const perSection = Object.fromEntries(d.sections.map(s => [s.id, 0]));
  for (const q of qs) {
    const where = `${path} ${q.id}`;
    if (qIds.has(q.id)) err(`${where}: duplicate id`);
    qIds.add(q.id);
    if (!(q.objective in perSection)) { err(`${where}: objective ${q.objective} is not a domain ${d.domain} section`); continue; }
    perSection[q.objective]++;
    if (!CATEGORIES.has(q.category)) err(`${where}: invalid category ${q.category}`);
    if (!q.question || !q.explanation) err(`${where}: question and explanation are required`);
    const opts = q.options ?? [];
    const correct = q.correct ?? [];
    if (new Set(opts).size !== opts.length) err(`${where}: duplicate options`);
    if (correct.some(c => !Number.isInteger(c) || c < 0 || c >= opts.length) || new Set(correct).size !== correct.length) {
      err(`${where}: invalid correct indices`);
    }
    if (q.type === 'mc') {
      if (opts.length !== 4 || correct.length !== 1) err(`${where}: mc needs 4 options and 1 correct answer`);
    } else if (q.type === 'ms') {
      if (opts.length !== 5 || correct.length < 2 || correct.length > 3) err(`${where}: ms needs 5 options and 2-3 correct answers`);
      const m = q.question.match(/\(Choose (\d)\)/);
      if (!m || Number(m[1]) !== correct.length) err(`${where}: ms question must state "(Choose ${correct.length})"`);
    } else {
      err(`${where}: invalid type ${q.type}`);
    }
  }
  for (const [id, n] of Object.entries(perSection)) if (n < 3) err(`${path}: section ${id} has ${n} questions; need at least 3`);
}

// ---- Internal links and images ----
const programFiles = listMd('src/content/programs').map(p => ({ path: p, ...parse(p) }));
const routes = new Set(['/', '/training', '/labs', '/incidents', '/standard', '/practice-exam', '/exam',
  '/certifications/associate', '/certifications/professional']);
programFiles.forEach(p => routes.add(`/training/${p.data.slug}`));
curriculum.domains.forEach(d => {
  routes.add(`/training/module/${d.slug}`);
  routes.add(`/labs/${d.lab}`);
  d.sections.forEach(s => routes.add(`/training/module/${d.slug}/${s.slug}`));
});
incidentFiles.forEach(i => routes.add(`/incidents/${i.data.slug}`));

const pageFiles = listMd('src/content/pages').map(p => ({ path: p, ...parse(p) }));
const linkable = [...moduleFiles, ...sectionFiles, ...labFiles, ...incidentFiles, ...programFiles, ...pageFiles];
for (const f of linkable) {
  for (const m of f.body.matchAll(/\]\((\/[^)\s#]*)(#[^)\s]*)?\)|(?:href|src)="(\/[^"#]*)/g)) {
    const target = (m[1] ?? m[3]).replace(/\/$/, '') || '/';
    if (/\.\w+$/.test(target)) {
      const file = join('public', target);
      if (!existsSync(file) || !statSync(file).isFile()) err(`${f.path}: missing file ${target}`);
    } else if (!routes.has(target)) {
      err(`${f.path}: broken internal link ${target}`);
    }
  }
}

for (const w of warnings) console.warn(`warning: ${w}`);
for (const e of errors) console.error(`error: ${e}`);
console.log(`validate: ${sectionFiles.length} sections, ${labFiles.length} labs, ${incidentFiles.length} incidents, ${qIds.size} questions; ${errors.length} error(s), ${warnings.length} warning(s)`);
process.exit(errors.length ? 1 : 0);
