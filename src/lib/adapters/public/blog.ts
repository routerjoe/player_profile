import { BlogIndex, BlogPost } from '@/lib/types';
import { BlogIndexSchema, BlogPostSchema } from '@/lib/validation/blog';
import { blog as sampleBlog } from '@/lib/sample/blog';

/**
 * getBlogIndex()
 * Load blog index via env-configured JSON URL or fall back to local sample.
 * Validates and returns typed BlogIndex using Zod.
 */
export async function getBlogIndex(): Promise<BlogIndex> {
  const url = process.env.NEXT_PUBLIC_BLOG_JSON_URL;

  const validateIndex = (data: unknown): BlogIndex => {
    const parsed = BlogIndexSchema.safeParse(data);
    if (!parsed.success) {
      const first = parsed.error.issues?.[0];
      console.warn(
        '[getBlogIndex] Validation failed:',
        first?.path?.join('.') ?? '',
        first?.message ?? parsed.error.message,
      );
      throw parsed.error;
    }
    return parsed.data;
  };

  if (url) {
    try {
      const res = await fetch(url, { next: { revalidate: 60 } });
      if (!res.ok) {
        console.warn('[getBlogIndex] Non-OK response', res.status, res.statusText);
        return validateIndex(sampleBlog);
      }
      const json = await res.json();
      return validateIndex(json);
    } catch (err) {
      console.warn('[getBlogIndex] Fetch failed, falling back to sample', err);
      return validateIndex(sampleBlog);
    }
  }

  return validateIndex(sampleBlog);
}

/**
 * getBlogPost(slug)
 * Fetch a single post by slug from the blog index. Returns null if not found.
 */
export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  const index = await getBlogIndex();
  const post = index.posts.find((p) => p.slug === slug);
  if (!post) return null;

  const parsed = BlogPostSchema.safeParse(post);
  if (!parsed.success) {
    const first = parsed.error.issues?.[0];
    console.warn(
      '[getBlogPost] Validation failed:',
      first?.path?.join('.') ?? '',
      first?.message ?? parsed.error.message,
    );
    return null;
  }
  return parsed.data;
}