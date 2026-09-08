import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdoc}', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    publishedDate: z.string().or(z.date()),
    author: z.string().default('Finance with Flow'),
    category: z.string().default('featured'),
    featuredImage: z.string().optional(),
    excerpt: z.string().optional(),
    status: z.enum(['published', 'draft']).default('published'),
    isFeatured: z.boolean().default(false),
    relatedPosts: z.array(z.string()).optional(),
  }),
});

const categories = defineCollection({
  loader: glob({ pattern: '**/*.{yaml,yml,json}', base: './src/content/categories' }),
  schema: z.object({
    name: z.string(),
    description: z.string().optional(),
  }),
});

export const collections = { posts, categories };
