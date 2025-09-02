/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import Image from 'next/image';
import { getBlogIndex } from '@/lib/adapters/public/blog';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Card } from '@/components/ui/Card';

export async function BlogTeaser() {
  const index = await getBlogIndex();
  const posts = (index.posts ?? [])
    .filter((p) => p.status === 'published')
    .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))
    .slice(0, 3);

  if (posts.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between">
        <SectionHeading as="h2" subtitle="Latest updates and stories">
          Latest from the Blog
        </SectionHeading>
        <Link
          href="/blog"
          className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium border border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[var(--accent-cool)]"
        >
          View all posts
        </Link>
      </div>

      <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {posts.map((p) => {
          const showImg = !!p.heroImage;
          const isExternal = !!p.heroImage && /^https?:\/\//i.test(p.heroImage);
          const isSvg = !!p.heroImage && /\.svg($|\?)/i.test(p.heroImage as string);
          const dateText = p.publishedAt ? new Date(p.publishedAt).toLocaleDateString() : '';

          return (
            <li key={p.slug}>
              <Card className="overflow-hidden p-0">
                <Link
                  href={`/blog/${p.slug}`}
                  className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-cool)]"
                >
                  {showImg ? (
                    <div className="relative w-full h-40 bg-slate-100 border-b border-slate-200">
                      {isExternal || isSvg ? (
                        <img
                          src={p.heroImage as string}
                          alt={p.title}
                          width={640}
                          height={256}
                          className="w-full h-40 object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <Image
                          src={p.heroImage as string}
                          alt={p.title}
                          width={640}
                          height={256}
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="w-full h-40 object-cover"
                        />
                      )}
                    </div>
                  ) : null}
                  <div className="p-4 space-y-1">
                    <h3 className="text-base font-semibold text-[var(--fg)]">{p.title}</h3>
                    {p.summary ? (
                      <p className="text-sm text-slate-600 line-clamp-2">{p.summary}</p>
                    ) : null}
                    <div className="text-xs text-slate-500">
                      {dateText}
                      {p.tags?.length ? (
                        <span className="ml-2">• {p.tags.map((t) => `#${t}`).join(' ')}</span>
                      ) : null}
                    </div>
                  </div>
                </Link>
              </Card>
            </li>
          );
        })}
      </ul>
    </section>
  );
}