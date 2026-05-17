import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

export const INTERESTS = [
  'nature',
  'aventure',
  'culture',
  'gastronomie',
  'detente',
  'faune',
  'plages',
  'photographie',
  'vie-nocturne',
  'spiritualite',
] as const;

const lieux = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/lieux' }),
  schema: z.object({
    title: z.string(),
    country: z.string(),
    region: z.string(),
    regionSlug: z.string().optional(),
    type: z.string(),
    image: z.string(),
    description: z.string(),
    lat: z.number(),
    lng: z.number(),
    interests: z.array(z.enum(INTERESTS)),
    duree: z.number(),
    nuits: z.boolean().default(true),
    tier: z.number().int().min(1).max(3).default(2),
  }),
});

const regions = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/regions' }),
  schema: z.object({
    title: z.string(),
    country: z.string(),
    slug: z.string(),
    description: z.string(),
    heroImage: z.string(),
    centerLat: z.number(),
    centerLng: z.number(),
    zoom: z.number().default(8),
  }),
});

const routes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/routes' }),
  schema: z.object({
    title: z.string(),
    country: z.string(),
    slug: z.string(),
    days: z.number(),
    tagline: z.string(),
    description: z.string(),
    heroImage: z.string(),
    interests: z.array(z.enum(INTERESTS)).default([]),
    stops: z.array(z.object({
      slug: z.string(),
      days: z.number(),
    })),
  }),
});

export const collections = { lieux, regions, routes };
