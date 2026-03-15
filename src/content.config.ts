import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const destinations = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/destinations' }),
  schema: z.object({
    title: z.string(),
    country: z.string(),
    description: z.string(),
    heroImage: z.string(),
    duration: z.string(),
    budget: z.string(),
    bestPeriod: z.string(),
    timezone: z.string().optional(),
    language: z.string().optional(),
    currency: z.string().optional(),
    categories: z.array(z.string()),
    publishDate: z.coerce.date(),
    featured: z.boolean().default(false),
    cardImage: z.string().optional(),
    excerpt: z.string().optional(),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    heroImage: z.string(),
    tags: z.array(z.string()),
    publishDate: z.coerce.date(),
    author: z.string().default('Mon Voyage en Poche'),
    featured: z.boolean().default(false),
    relatedDestination: z.string().optional(),
  }),
});

export const collections = { destinations, blog };
