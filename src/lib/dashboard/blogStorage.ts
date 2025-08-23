import { BlogIndex, BlogPost } from '@/lib/types';
import { BlogIndexSchema, BlogPostSchema } from '@/lib/validation/blog';

const KEY_BLOG_RAW = 'pp:blog:draft:raw';
const KEY_BLOG_LAST_VALID = 'pp:blog:draft:lastValid';

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function read(key: string): any | null {
  if (!canUseStorage()) return null;
  const s = window.localStorage.getItem(key);
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function write(key: string, value: any): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getRawBlogIndex<T = any>(): T | null {
  return read(KEY_BLOG_RAW);
}
export function setRawBlogIndex(value: any): void {
  write(KEY_BLOG_RAW, value);
}

export function getBlogIndex(): BlogIndex | null {
  const raw = getRawBlogIndex();
  if (raw) {
    const parsed = BlogIndexSchema.safeParse(raw);
    if (parsed.success) return parsed.data;
  }
  const lastValid = read(KEY_BLOG_LAST_VALID);
  return lastValid ?? null;
}

export function saveBlogIndex(value: any): {
  valid: boolean;
  errors?: Array<{ path: string; message: string }>;
} {
  setRawBlogIndex(value);
  const parsed = BlogIndexSchema.safeParse(value);
  if (parsed.success) {
    write(KEY_BLOG_LAST_VALID, parsed.data);
    return { valid: true };
  }
  const errors = parsed.error.issues.map((i) => ({
    path: i.path.join('.'),
    message: i.message,
  }));
  return { valid: false, errors };
}

export function upsertPost(post: any): {
  valid: boolean;
  errors?: Array<{ path: string; message: string }>;
  index?: BlogIndex;
} {
  // Validate individual post first for clearer errors
  const postParsed = BlogPostSchema.safeParse(post);
  if (!postParsed.success) {
    const errors = postParsed.error.issues.map((i) => ({
      path: i.path.join('.'),
      message: i.message,
    }));
    return { valid: false, errors };
  }

  const current = (getRawBlogIndex() ?? getBlogIndex() ?? { posts: [] }) as BlogIndex;
  const posts = Array.isArray(current.posts) ? [...current.posts] : [];
  const i = posts.findIndex((p) => p.slug === postParsed.data.slug);
  if (i >= 0) posts[i] = { ...posts[i], ...postParsed.data };
  else posts.push(postParsed.data);

  const next: BlogIndex = { posts };
  const saved = saveBlogIndex(next);
  return { ...saved, index: saved.valid ? next : undefined };
}

export function removePost(slug: string): {
  valid: boolean;
  index?: BlogIndex;
} {
  const current = (getRawBlogIndex() ?? getBlogIndex() ?? { posts: [] }) as BlogIndex;
  const posts = Array.isArray(current.posts) ? current.posts.filter((p) => p.slug !== slug) : [];
  const next: BlogIndex = { posts };
  const saved = saveBlogIndex(next);
  return { valid: saved.valid, index: saved.valid ? next : undefined };
}

export function exportBlogIndex(preferValid = true): string {
  const data = preferValid ? getBlogIndex() ?? getRawBlogIndex() : getRawBlogIndex() ?? getBlogIndex();
  return JSON.stringify(data ?? { posts: [] }, null, 2);
}

export function importBlogIndex(json: string): {
  valid: boolean;
  errors?: Array<{ path: string; message: string }>;
} {
  try {
    const obj = JSON.parse(json);
    return saveBlogIndex(obj);
  } catch (e: any) {
    return { valid: false, errors: [{ path: '', message: e?.message ?? 'Invalid JSON' }] };
  }
}

export function subscribeBlogIndex(callback: (raw: any, valid: BlogIndex | null) => void): () => void {
  if (!canUseStorage()) return () => {};
  const handler = (e: StorageEvent) => {
    if (e.key === KEY_BLOG_RAW || e.key === KEY_BLOG_LAST_VALID) {
      callback(getRawBlogIndex(), getBlogIndex());
    }
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}

// Utilities
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}