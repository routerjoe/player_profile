import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getBlogPost } from '@/lib/adapters/public/blog';

export const dynamic = 'force-static';

type PageProps = { params: { slug: string } };

export default async function BlogPostPage({ params }: PageProps) {
  const post = await getBlogPost(params.slug);

  if (!post || post.status !== 'published') {
    notFound();
  }

  const published = post.publishedAt ? new Date(post.publishedAt) : null;
  const heroUrl = post.heroImage || '';
  const isExternalHero = /^https?:\/\//i.test(heroUrl);
  const isSvgHero = /\.svg($|\?)/i.test(heroUrl);

  return (
    <main className="min-h-screen">
      <section className="container max-w-3xl px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="heading-xl">{post.title}</h1>
          <Link
            href="/blog"
            className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium border border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[var(--accent-cool)]"
          >
            All posts
          </Link>
        </div>

        <div className="text-sm text-slate-500">
          {published ? published.toLocaleString() : null}
          {post.tags?.length ? (
            <span className="ml-2">• {post.tags.map((t) => `#${t}`).join(' ')}</span>
          ) : null}
        </div>

        {post.heroImage ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {/* Local uploads under /public use Next/Image; external/inline SVG fall back to img to avoid domain/SVG optimization issues */}
            {(isExternalHero || isSvgHero) ? (
              <img
                src={post.heroImage}
                alt={post.title}
                width={1200}
                height={630}
                className="w-full h-auto object-cover"
              />
            ) : (
              <Image
                src={post.heroImage}
                alt={post.title}
                width={1200}
                height={630}
                className="w-full h-auto object-cover"
                priority
              />
            )}
          </div>
        ) : null}

        {post.summary ? <p className="text-base text-slate-700">{post.summary}</p> : null}

        {/* Minimal markdown display: preserve line breaks. A richer renderer can be added later. */}
        <article className="prose prose-slate max-w-none whitespace-pre-wrap">
          {post.content}
        </article>
      </section>
    </main>
  );
}