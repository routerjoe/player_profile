import { z } from 'zod';

export const BlogStatusSchema = z.enum(['draft', 'scheduled', 'published']);

export const BlogPostSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/i, 'Use URL-safe slug (letters, numbers, hyphens)'),
  title: z.string().min(1),
  summary: z.string().optional(),
  content: z.string().min(1), // markdown
  heroImage: z.string().optional(), // allow relative or absolute
  tags: z.array(z.string()).optional(),
  publishedAt: z.string().optional(), // ISO date string
  scheduledAt: z.string().optional(), // ISO date string
  status: BlogStatusSchema,
  tweetOnPublish: z.boolean().optional(),
});

export const BlogIndexSchema = z.object({
  posts: z.array(BlogPostSchema),
});

export type BlogPostFromSchema = z.infer<typeof BlogPostSchema>;
export type BlogIndexFromSchema = z.infer<typeof BlogIndexSchema>;