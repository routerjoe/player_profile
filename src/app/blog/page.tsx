/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import Image from 'next/image';
import { getBlogIndex } from '@/lib/adapters/public/blog';

function normalizeUploadsPath(u: string): string {
  if (!u) return '';
  if (u.startsWith('/public/uploads/')) return u.replace(/^\/public\/uploads\//, '/uploads/');
  if (u.startsWith('public/uploads/')) return u.replace(/^public\/uploads\//, '/uploads/');
  if (u.startsWith('uploads/')) return `/${u}`;
  return u;
}

export const dynamic = 'force-static';
export const revalidate = 300;

export default async function BlogIndexPage() {
  const index = await getBlogIndex();
  const posts = (index.posts ?? [])
    .filter((p) => p.status === 'published')
    .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''));

  return (
    <main id="main" role="main" className="min-h-screen">
      <section className="container max-w-5xl px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <h1 className="heading-xl">Blog</h1>

        {posts.length === 0 ? (
          <p className="text-slate-600">No posts yet.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-6">
            {posts.map((p) => (
              <li key={p.slug} className="card card-hover p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {p.heroImage ? (
                      <Link
                        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-cool)] rounded-md"
                        href={`/blog/${p.slug}`}
                      >
                        <div className="relative w-28 h-16 overflow-hidden rounded-md border border-slate-200 bg-white">
                          {(() => {
                            const hero = normalizeUploadsPath(p.heroImage || '');
                            const isExternal = /^https?:\/\//i.test(hero) || /\.svg($|\?)/i.test(hero);
                            return isExternal ? (
                              <img
                                src={hero}
                                alt={p.title}
                                width={224}
                                height={128}
                                className="w-28 h-16 object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <Image
                                src={hero}
                                alt={p.title}
                                width={224}
                                height={128}
                                sizes="224px"
                                className="w-28 h-16 object-cover"
                                unoptimized
                              />
                            );
                          })()}
                        </div>
                      </Link>
                    ) : null}
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