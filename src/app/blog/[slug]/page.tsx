/* eslint-disable @next/next/no-img-element, react/no-danger */
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getBlogPost, getBlogIndex } from '@/lib/adapters/public/blog';

export const dynamic = 'force-static';
export const revalidate = 300;

export async function generateStaticParams() {
  const index = await getBlogIndex();
  const posts = (index.posts ?? [])
    .filter((p: any) => p.status === 'published' && typeof p.slug === 'string' && p.slug.length > 0)
    .map((p: any) => ({ slug: p.slug }));
  return posts;
}

/**
 * Minimal, safe-ish Markdown rendering to support images in post content without extra deps.
 * - Escapes HTML first to avoid script injection
 * - Supports ![alt](src "title") and [text](href "title")
 * - Auto-embeds bare image URLs (http(s) or /uploads/...) into <img>
 * - Allows only http(s) and /uploads/ URLs; everything else downgraded to "#"
 */
function escapeHtml(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) => {
    switch (c) {
      case '&':
        return '&#38;';
      case '<':
        return '&#60;';
      case '>':
        return '&#62;';
      case '"':
        return '&#34;';
      case "'":
        return '&#39;';
      default:
        return c;
    }
  });
}

function normalizeUploadsPath(u: string): string {
  if (u.startsWith('/public/uploads/')) return u.replace(/^\/public\/uploads\//, '/uploads/');
  if (u.startsWith('public/uploads/')) return u.replace(/^public\/uploads\//, '/uploads/');
  if (u.startsWith('uploads/')) return `/${u}`;
  return u;
}

function sanitizeUrl(href: string): string {
  const trimmed = normalizeUploadsPath(String(href || '').trim());
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('/uploads/')) {
    return escapeHtml(trimmed);
  }
  return '#';
}

function mdToHtml(md: string): string {
  if (!md) return '';
  const paragraphs = String(md).split(/\n{2,}/);
  const out: string[] = [];

  const imageRE = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g;
  const linkRE = /\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g;
  // Allow http(s), /uploads, /public/uploads, and also 'uploads/...'
  const bareImgRE =
    /(^|\s)(https?:\/\/\S+\.(?:png|jpe?g|gif|webp|svg)|\/?(?:public\/)?uploads\/\S+\.(?:png|jpe?g|gif|webp|svg))(?!\S)/gi;

  for (let para of paragraphs) {
    let html = escapeHtml(para.trim());

    // Images first to avoid matching as links
    html = html.replace(imageRE, (_m, alt, src, title) => {
      const a = escapeHtml(alt || '');
      const s = sanitizeUrl(src || '');
      const t = title ? ` title="${escapeHtml(title)}"` : '';
      return `<img src="${s}" alt="${a}"${t} class="max-w-full h-auto rounded-md border border-slate-200" />`;
    });

    // Links
    html = html.replace(linkRE, (_m, text, href, title) => {
      const txt = escapeHtml(text || '');
      const h = sanitizeUrl(href || '');
      const t = title ? ` title="${escapeHtml(title)}"` : '';
      const external = /^https?:\/\//i.test(h);
      const target = external ? ' target="_blank" rel="noopener noreferrer nofollow"' : '';
      return `<a href="${h}"${t}${target}>${txt}</a>`;
    });

    // Bare image URLs
    html = html.replace(bareImgRE, (_m, pre, url) => {
      const s = sanitizeUrl(url || '');
      return `${pre}<img src="${s}" alt="" class="max-w-full h-auto rounded-md border border-slate-200" />`;
    });

    // Single newlines within a paragraph -> <br/>
    html = html.replace(/\n/g, '<br/>');
    out.push(`<p>${html}</p>`);
  }

  return out.join('');
}

type PageProps = { params: { slug: string } };

export default async function BlogPostPage({ params }: PageProps) {
  const post = await getBlogPost(params.slug);

  if (!post || post.status !== 'published') {
    notFound();
  }

  const published = post.publishedAt ? new Date(post.publishedAt) : null;
  const heroUrl = normalizeUploadsPath(post.heroImage || '');
  const isExternalHero = /^https?:\/\//i.test(heroUrl);
  const isSvgHero = /\.svg($|\?)/i.test(heroUrl);

  return (
    <main id="main" role="main" className="min-h-screen">
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
            <span className="ml-2">• {post.tags.map((t: any) => `#${t}`).join(' ')}</span>
          ) : null}
        </div>

        {post.heroImage ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {/* Local uploads under /public use Next/Image; external/inline SVG fall back to img */}
            {(isExternalHero || isSvgHero) ? (
              <img
                src={heroUrl}
                alt={post.title}
                width={1200}
                height={630}
                className="w-full h-auto object-cover"
              />
            ) : (
              <Image
                src={heroUrl}
                alt={post.title}
                width={1200}
                height={630}
                sizes="(max-width: 1024px) 100vw, 1200px"
                className="w-full h-auto object-cover"
                priority
                unoptimized
              />
            )}
          </div>
        ) : null}

        {post.summary ? <p className="text-base text-slate-700">{post.summary}</p> : null}

        {/* Render post content with minimal Markdown support and safe HTML */}
        <article
          className="prose prose-slate max-w-none"
          dangerouslySetInnerHTML={{ __html: mdToHtml(String(post.content || '')) }}
        />
      </section>
    </main>
  );
}