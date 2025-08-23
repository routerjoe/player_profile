'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { BlogIndex, BlogPost } from '@/lib/types';
import {
  getBlogIndex as getDraftIndex,
  saveBlogIndex,
  upsertPost,
  removePost,
  exportBlogIndex,
  importBlogIndex,
  subscribeBlogIndex,
  slugify,
} from '@/lib/dashboard/blogStorage';
import { blog as sampleBlog } from '@/lib/sample/blog';
import { MediaPicker } from '@/components/dashboard/MediaPicker';

type Issue = { path: string; message: string };

const field =
  'block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-cool)]';
const area =
  'block w-full min-h-[220px] rounded-lg border border-slate-300 bg-white p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--accent-cool)]';
const label = 'text-sm font-medium text-slate-700';
const section = 'card p-5 space-y-4';
const sectionTitle = 'text-base font-semibold text-slate-800';
const btn =
  'inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-[var(--accent-cool)]';
const btnPrimary = `${btn} bg-[var(--brand-green)] text-white hover:bg-[var(--brand-green-dark)]`;
const btnGhost = `${btn} border border-slate-300 hover:bg-slate-50 text-slate-800`;
const badge = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset';
const badgeDraft = `${badge} text-slate-700 ring-slate-300 bg-slate-50`;
const badgeScheduled = `${badge} text-amber-800 ring-amber-200 bg-amber-50`;
const badgePublished = `${badge} text-green-800 ring-green-200 bg-green-50`;

function toComma(list?: string[]) {
  return list?.join(', ') ?? '';
}
function fromComma(s: string): string[] {
  return s
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

function toLocalDateTime(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, '0');
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}
function fromLocalDateTime(local: string | undefined): string | undefined {
  if (!local) return undefined;
  const d = new Date(local);
  if (isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

function statusBadge(status: BlogPost['status']) {
  switch (status) {
    case 'published':
      return <span className={badgePublished}>Published</span>;
    case 'scheduled':
      return <span className={badgeScheduled}>Scheduled</span>;
    default:
      return <span className={badgeDraft}>Draft</span>;
  }
}

export default function DashboardBlogPage() {
  const [index, setIndex] = useState<BlogIndex>({ posts: [] });
  const [selectedSlug, setSelectedSlug] = useState<string>('');
  const [draft, setDraft] = useState<BlogPost | null>(null);
  const [errors, setErrors] = useState<Issue[] | undefined>(undefined);
  const [status, setStatus] = useState<string | null>(null);
  const [importText, setImportText] = useState('');
  const [importResult, setImportResult] = useState<{ ok: boolean; issues?: Issue[] } | null>(null);

  // Load initial index from localStorage (or seed with sample)
  useEffect(() => {
    let existing = getDraftIndex();
    if (!existing) {
      saveBlogIndex(sampleBlog);
      existing = sampleBlog;
    }
    setIndex(existing);
    setSelectedSlug(existing.posts[0]?.slug ?? '');
    setDraft(existing.posts[0] ?? null);

    // Subscribe to external changes (another tab)
    const unsub = subscribeBlogIndex((raw, valid) => {
      if (valid) {
        setIndex(valid);
        if (selectedSlug) {
          const p = valid.posts.find((x) => x.slug === selectedSlug) ?? null;
          setDraft(p);
        }
      }
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const posts = useMemo(() => {
    const copy = [...(index.posts ?? [])];
    copy.sort((a, b) => {
      const aKey = a.publishedAt ?? a.scheduledAt ?? '';
      const bKey = b.publishedAt ?? b.scheduledAt ?? '';
      return bKey.localeCompare(aKey);
    });
    return copy;
  }, [index]);

  const select = (slug: string) => {
    setSelectedSlug(slug);
    const p = index.posts.find((x) => x.slug === slug) ?? null;
    setDraft(p);
    setErrors(undefined);
    setStatus(null);
  };

  function newPost() {
    const base = slugify('untitled');
    let unique = base;
    let counter = 1;
    const slugs = new Set(index.posts.map((p) => p.slug));
    while (slugs.has(unique)) {
      unique = `${base}-${counter++}`;
    }
    const p: BlogPost = {
      slug: unique,
      title: 'Untitled Post',
      summary: '',
      content: '',
      heroImage: '',
      tags: [],
      scheduledAt: undefined,
      publishedAt: undefined,
      status: 'draft',
      tweetOnPublish: false,
    };
    const res = upsertPost(p);
    if (res.valid && res.index) {
      setIndex(res.index);
      select(p.slug);
      setStatus('Created new post (draft)');
    } else {
      setErrors(res.errors);
    }
  }

  function delPost(slug: string) {
    const res = removePost(slug);
    if (res.valid && res.index) {
      setIndex(res.index);
      const next = res.index.posts[0]?.slug ?? '';
      select(next);
      setStatus('Post removed');
    }
  }

  // Save draft update for current post
  function save(p: BlogPost | null) {
    if (!p) return;
    const res = upsertPost(p);
    if (res.valid && res.index) {
      setIndex(res.index);
      setErrors(undefined);
      setStatus('Draft saved');
    } else {
      setErrors(res.errors);
      setStatus(null);
    }
  }

  async function publish(p: BlogPost | null) {
    if (!p) return;
    const payload: BlogPost = {
      ...p,
      status: 'published',
      publishedAt: new Date().toISOString(),
    };
    const res = upsertPost(payload);
    if (res.valid && res.index) {
      setIndex(res.index);
      setDraft(payload);
      setErrors(undefined);
      setStatus('Post published');

      if (payload.tweetOnPublish) {
        try {
          const text = `${payload.title} /blog/${payload.slug}`;
          const r = await fetch('/api/twitter/post', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ text, slug: payload.slug, title: payload.title }),
          });
          const j = await r.json();
          if (r.ok) {
            setStatus(`Post published • Tweet sent (${j?.id ?? 'ok'})`);
          } else {
            setStatus(`Post published • Tweet failed: ${j?.error ?? 'Unknown error'}`);
          }
        } catch (e: any) {
          setStatus(`Post published • Tweet failed: ${e?.message ?? 'Unknown error'}`);
        }
      }
    } else {
      setErrors(res.errors);
      setStatus(null);
    }
  }

  // Import/export helpers
  function onImport() {
    const res = importBlogIndex(importText);
    if (res.valid) {
      const idx = getDraftIndex();
      if (idx) {
        setIndex(idx);
        const slug = idx.posts[0]?.slug ?? '';
        select(slug);
      }
      setImportResult({ ok: true });
    } else {
      setImportResult({ ok: false, issues: res.errors });
    }
  }

  // Draft setters
  function set<K extends keyof BlogPost>(key: K, value: BlogPost[K]) {
    if (!draft) return;
    const next = { ...draft, [key]: value } as BlogPost;
    setDraft(next);
    save(next);
  }

  const errorMap = useMemo(() => {
    const map = new Map<string, string[]>();
    if (errors) {
      for (const e of errors) {
        const arr = map.get(e.path) ?? [];
        arr.push(e.message);
        map.set(e.path, arr);
      }
    }
    return map;
  }, [errors]);

  return (
    <div className="min-h-screen">
      <div className="container max-w-7xl px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: posts list */}
        <aside className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">Posts</h2>
            <button className={btnPrimary} onClick={newPost} aria-label="New post">
              New Post
            </button>
          </div>
          <ul className="space-y-2">
            {posts.map((p) => (
              <li key={p.slug} className={`rounded-lg border ${selectedSlug === p.slug ? 'border-[var(--accent-cool)]' : 'border-slate-200'} bg-white p-3`}>
                <button
                  className="block text-left w-full"
                  onClick={() => select(p.slug)}
                  title={p.title}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium truncate">{p.title || p.slug}</div>
                    {statusBadge(p.status)}
                  </div>
                  <div className="text-xs text-slate-500 truncate">/{p.slug}</div>
                  <div className="text-[11px] text-slate-500">
                    {p.publishedAt
                      ? `Published: ${new Date(p.publishedAt).toLocaleString()}`
                      : p.scheduledAt
                      ? `Scheduled: ${new Date(p.scheduledAt).toLocaleString()}`
                      : 'Draft'}
                  </div>
                </button>
                <div className="mt-2 flex items-center justify-end gap-2">
                  <a
                    className={btnGhost}
                    href={`/blog/${p.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Preview
                  </a>
                  <button className={btnGhost} onClick={() => delPost(p.slug)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {/* Import/Export */}
          <div className={section}>
            <h3 className={sectionTitle}>Import / Export</h3>
            <div className="space-y-2">
              <label className={label}>Export JSON</label>
              <textarea className={area} readOnly value={exportBlogIndex(true)} />
            </div>
            <div className="space-y-2">
              <label className={label}>Import JSON</label>
              <textarea
                className={area}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="{ ... }"
              />
              <div className="flex items-center gap-2">
                <button className={btnPrimary} onClick={onImport}>Validate & Import</button>
              </div>
              {importResult?.ok === false && importResult.issues ? (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 space-y-2">
                  <p className="text-sm font-medium text-red-800">Validation issues</p>
                  <ul className="list-disc pl-5 text-sm text-red-700 space-y-1">
                    {importResult.issues.map((i, k) => (
                      <li key={k}>
                        <code>{i.path || '(root)'}</code> — {i.message}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {importResult?.ok === true ? (
                <div className="rounded-md border border-green-200 bg-green-50 p-2 text-sm text-green-800">
                  Import successful
                </div>
              ) : null}
            </div>
          </div>
        </aside>

        {/* Right: editor */}
        <section className="lg:col-span-2 space-y-6">
          <div className={section}>
            <h2 className={sectionTitle}>Post Editor</h2>

            {!draft ? (
              <p className="text-slate-600">Select a post from the left or create a new one.</p>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={label}>Title</label>
                    <input
                      className={field}
                      value={draft.title}
                      onChange={(e) => set('title', e.target.value)}
                      placeholder="My post title"
                    />
                    {errorMap.get('title')?.map((m, i) => (
                      <p key={i} className="text-xs text-red-600">{m}</p>
                    ))}
                  </div>
                  <div>
                    <label className={label}>Slug</label>
                    <div className="flex gap-2">
                      <input
                        className={field + ' flex-1'}
                        value={draft.slug}
                        onChange={(e) => set('slug', slugify(e.target.value))}
                        placeholder="url-safe-slug"
                      />
                      <button
                        className={btnGhost}
                        type="button"
                        onClick={() => set('slug', slugify(draft.title || 'untitled'))}
                      >
                        Generate
                      </button>
                    </div>
                    {errorMap.get('slug')?.map((m, i) => (
                      <p key={i} className="text-xs text-red-600">{m}</p>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={label}>Summary</label>
                  <input
                    className={field}
                    value={draft.summary ?? ''}
                    onChange={(e) => set('summary', e.target.value)}
                    placeholder="Optional short summary"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={label}>Hero Image</label>
                    <MediaPicker
                      value={draft.heroImage ?? ''}
                      onChange={(url) => set('heroImage', url)}
                    />
                  </div>
                  <div>
                    <label className={label}>Tags (comma-separated)</label>
                    <input
                      className={field}
                      value={toComma(draft.tags)}
                      onChange={(e) => set('tags', fromComma(e.target.value))}
                      placeholder="news, training, recap"
                    />
                  </div>
                </div>

                <div>
                  <label className={label}>Content (Markdown)</label>
                  <textarea
                    className={area}
                    value={draft.content}
                    onChange={(e) => set('content', e.target.value)}
                    placeholder="# Heading&#10;&#10;Your content here..."
                  />
                  {errorMap.get('content')?.map((m, i) => (
                    <p key={i} className="text-xs text-red-600">{m}</p>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={label}>Status</label>
                    <select
                      className={field}
                      value={draft.status}
                      onChange={(e) => set('status', e.target.value as BlogPost['status'])}
                    >
                      <option value="draft">Draft</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="published">Published</option>
                    </select>
                  </div>
                  <div>
                    <label className={label}>Scheduled At</label>
                    <input
                      type="datetime-local"
                      className={field}
                      value={toLocalDateTime(draft.scheduledAt)}
                      onChange={(e) => set('scheduledAt', fromLocalDateTime(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className={label}>Published At</label>
                    <input
                      type="datetime-local"
                      className={field}
                      value={toLocalDateTime(draft.publishedAt)}
                      onChange={(e) => set('publishedAt', fromLocalDateTime(e.target.value))}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-[var(--brand-green)] focus:ring-[var(--accent-cool)]"
                      checked={!!draft.tweetOnPublish}
                      onChange={(e) => set('tweetOnPublish', e.target.checked)}
                    />
                    Tweet on publish (stub)
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <button className={btnPrimary} onClick={() => save(draft)}>Save Draft</button>
                  <button className={btnGhost} onClick={() => publish(draft)}>Publish</button>
                  <a
                    className={btnGhost}
                    href={`/blog/${draft.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Preview
                  </a>
                </div>

                {status ? (
                  <div className="text-sm text-slate-600">{status}</div>
                ) : null}
              </div>
            )}
          </div>

          {/* Live preview */}
          {draft ? (
            <div className={section}>
              <h3 className={sectionTitle}>Live Preview</h3>
              <div className="space-y-3">
                <div className="text-2xl font-bold tracking-wide" style={{ fontFamily: 'var(--font-bebas)' }}>
                  {draft.title}
                </div>
                <div className="text-xs text-slate-500">/{draft.slug} {statusBadge(draft.status)}</div>
                {draft.heroImage ? (
                  <img
                    src={draft.heroImage}
                    alt={draft.title}
                    className="w-full h-48 object-cover rounded-xl border border-slate-200 bg-white"
                  />
                ) : null}
                {draft.summary ? <p className="text-sm text-slate-700">{draft.summary}</p> : null}
                <pre className="whitespace-pre-wrap text-sm text-slate-800">{draft.content}</pre>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}