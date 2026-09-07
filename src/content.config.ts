import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdoc}', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    publishedDate: z.string().or(z.date()),
    author: z.string().default('Finance with Flow'),
    category: z.string().default('Featured'),
    featuredImage: z.string().optional(),
    excerpt: z.string().optional(),
  }),
});

export const collections = { posts };
