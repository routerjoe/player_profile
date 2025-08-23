import Link from 'next/link';
import { getBlogIndex } from '@/lib/adapters/public/blog';

export const dynamic = 'force-static';

export default async function BlogIndexPage() {
  const index = await getBlogIndex();
  const posts = (index.posts ?? [])
    .filter((p) => p.status === 'published')
    .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''));

  return (
    <main className="min-h-screen">
      <section className="container max-w-5xl px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <h1 className="heading-xl">Blog</h1>

        {posts.length === 0 ? (
          <p className="text-slate-600">No posts yet.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-6">
            {posts.map((p) => (
              <li key={p.slug} className="card card-hover p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="text-xl font-semibold">
                      <Link className="hover:underline" href={`/blog/${p.slug}`}>
                        {p.title}
                      </Link>
                    </h2>
                    {p.summary ? (
                      <p className="text-sm text-slate-600">{p.summary}</p>
                    ) : null}
                    <div className="text-xs text-slate-500">
                      {p.publishedAt ? new Date(p.publishedAt).toLocaleString() : null}
                      {p.tags?.length ? (
                        <span className="ml-2">
                          • {p.tags.map((t) => `#${t}`).join(' ')}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <Link
                    className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium border border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[var(--accent-cool)]"
                    href={`/blog/${p.slug}`}
                  >
                    Read
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}