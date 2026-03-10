import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const modules = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/modules' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    order: z.number(),
    description: z.string(),
    domain: z.number().optional(),
    weight: z.string().optional(),
    studyTime: z.string().optional(),
  }),
});

const sections = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/sections',
    generateId: ({ entry }) => {
      // Use full path without extension as ID to avoid duplicates
      // e.g. "ai-fundamentals/learning-objectives.md" -> "ai-fundamentals/learning-objectives"
      return entry.replace(/\.md$/, '');
    },
  }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    module: z.string(),
    sectionOrder: z.number(),
    description: z.string(),
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

export const collections = { modules, sections, programs };
