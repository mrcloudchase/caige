import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const category = z.enum(['safety', 'security', 'containment', 'cross-cutting']);
const controlLayer = z.enum(['model', 'prompt', 'runtime-ml', 'deterministic', 'human']);
const source = z.object({ title: z.string(), url: z.string().url() });

const modules = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/modules' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    order: z.number(),
    domain: z.number(),
    weight: z.string(),
    description: z.string(),
    studyTime: z.string(),
    lab: z.string(),
  }),
});

const sections = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/sections',
    // Use the path without extension as the ID so slugs can repeat across modules
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  }),
  schema: z.object({
    id: z.string().regex(/^\d\.\d$/),
    title: z.string(),
    slug: z.string(),
    module: z.string(),
    sectionOrder: z.number(),
    description: z.string(),
    category,
    controlLayers: z.array(controlLayer).default([]),
    knowledge: z.array(z.string()).min(1),
    skills: z.array(z.string()).min(1),
    sources: z.array(source).default([]),
    lastReviewed: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
});

const programs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/programs' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    order: z.number(),
    description: z.string(),
  }),
});

const incidents = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/incidents' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    date: z.string().regex(/^\d{4}-\d{2}(-\d{2})?$/),
    category: z.array(category).min(1),
    sections: z.array(z.string().regex(/^\d\.\d$/)).min(1),
    summary: z.string(),
    sources: z.array(source).min(1),
  }),
});

const labs = defineCollection({
  loader: glob({ pattern: 'lab-*.md', base: './lab/labs' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    domain: z.number(),
    order: z.number(),
    description: z.string(),
    estimatedTime: z.string(),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    description: z.string(),
  }),
});

export const collections = { modules, sections, programs, incidents, labs, pages };
