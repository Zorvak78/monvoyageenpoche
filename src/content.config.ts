import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const lieux = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/lieux' }),
  schema: z.object({
    title: z.string(),
    country: z.string(),
    region: z.string(),
    type: z.string(),
    image: z.string(),
    description: z.string(),
    lat: z.number(),
    lng: z.number(),
    interests: z.array(z.enum(['nature', 'aventure', 'culture', 'detente', 'gastronomie'])),
    duree: z.number().describe('Durée recommandée sur place en jours'),
    nuits: z.boolean().default(true).describe('Lieu où l\'on dort, ou simple étape'),
  }),
});

export const collections = { lieux };
