import curriculum from '../../data/curriculum.json';

export const EXAM = curriculum.exam;
export const PASS_COUNT = Math.ceil((EXAM.examSize * EXAM.passPercent) / 100);
export const TIME_LIMIT_SECONDS = EXAM.timeLimitMinutes * 60;

export interface SectionRef {
  id: string;
  title: string;
  href: string;
}

export const DOMAINS = curriculum.domains.map(d => ({
  domain: d.domain,
  title: d.title,
  slug: d.slug,
}));

export const SECTIONS: Record<string, SectionRef> = Object.fromEntries(
  curriculum.domains.flatMap(d =>
    d.sections.map(s => [
      s.id,
      { id: s.id, title: s.title, href: `/training/module/${d.slug}/${s.slug}` },
    ])
  )
);
