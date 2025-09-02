/* eslint-disable @next/next/no-img-element */
import React from 'react';
import Image from 'next/image';
import { Profile } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { SectionHeading } from '@/components/ui/SectionHeading';

/**
 * Helpers: safe minimal YouTube ID extraction and thumbnail derivation
 */
function getYouTubeId(u?: string): string | null {
  const s = (u || '').trim();
  if (!s) return null;
  try {
    const url = new URL(s);
    const host = url.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') {
      const part = url.pathname.split('/').filter(Boolean)[0];
      return part || null;
    }
    if (host === 'youtube.com' || host === 'm.youtube.com' || host.endsWith('.youtube.com')) {
      const v = url.searchParams.get('v');
      if (v) return v;
      const parts = url.pathname.split('/').filter(Boolean);
      const iEmbed = parts.indexOf('embed');
      if (iEmbed >= 0 && parts[iEmbed + 1]) return parts[iEmbed + 1];
      const iShorts = parts.indexOf('shorts');
      if (iShorts >= 0 && parts[iShorts + 1]) return parts[iShorts + 1];
    }
  } catch {
    // ignore invalid URL
  }
  return null;
}

function deriveVideoThumb(videoUrl?: string | null): string | null {
  const id = getYouTubeId(videoUrl || undefined);
  if (id) return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  return null;
}

interface Props {
  profile: Profile;
  coverUrl?: string;
}

/**
 * Highlights
 * Responsive grid of video thumbnails linking to provider URLs (YouTube, Hudl, etc.).
 * - Lazy loads by default (Next/Image)
 * - No layout shift via fixed aspect ratio container
 * - External links open in new tab with rel noopener
 */
export function Highlights({ profile, coverUrl }: Props) {
  const clips = profile.highlights ?? [];
  if (!clips.length && !coverUrl) return null;

  const showCover = typeof coverUrl === 'string' && coverUrl.length > 0;
  const isExtCover = showCover ? /^https?:\/\//i.test(coverUrl!) : false;
  const isSvgCover = showCover ? /\.svg($|\?)/i.test(coverUrl!) : false;

  return (
    <section className="space-y-4">
      <SectionHeading as="h2" subtitle="Selected game clips and skills videos">
        Highlights
      </SectionHeading>

      {showCover ? (
        <Card className="overflow-hidden">
          <div className="relative w-full pt-[42%] bg-slate-100">
            {isExtCover || isSvgCover ? (
              <img
                src={coverUrl!}
                alt="Highlights cover"
                className="absolute inset-0 w-full h-full object-cover"
                width={1600}
                height={672}
                loading="lazy"
              />
            ) : (
              <Image
                src={coverUrl!}
                alt="Highlights cover"
                fill
                sizes="(max-width: 768px) 100vw, 100vw"
                className="object-cover"
                priority={false}
              />
            )}
            <div className="absolute inset-0 ring-1 ring-black/5" aria-hidden="true" />
          </div>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {clips.map((h, i) => {
          const thumbRaw = h.thumbnailUrl || deriveVideoThumb(h.videoUrl) || '/hero.svg';
          const thumb = (() => {
            if (!thumbRaw) return '';
            if (thumbRaw.startsWith('/public/uploads/')) return thumbRaw.replace(/^\/public\/uploads\//, '/uploads/');
            if (thumbRaw.startsWith('public/uploads/')) return thumbRaw.replace(/^public\/uploads\//, '/uploads/');
            if (thumbRaw.startsWith('uploads/')) return `/${thumbRaw}`;
            return thumbRaw;
          })();
          const title = h.title || 'Highlight';
          const isExternalThumb = /^https?:\/\//i.test(thumb) || /\.svg($|\?)/i.test(thumb);

          return (
            <Card key={`${title}-${i}`} className="overflow-hidden">
              <a
                href={h.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-cool)] rounded-md"
                aria-label={`Open highlight: ${title}`}
              >
                <div className="relative w-full pt-[56.25%] bg-slate-100">
                  {isExternalThumb ? (
                    <img
                      src={thumb}
                      alt={title}
                      width={640}
                      height={360}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover transition group-hover:scale-[1.02]"
                    />
                  ) : (
                    <Image
                      src={thumb}
                      alt={title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition group-hover:scale-[1.02]"
                    />
                  )}
                  <div className="absolute inset-0 ring-1 ring-black/5" aria-hidden="true" />
                </div>
                <div className="p-4">
                  <p className="text-sm font-medium text-[var(--fg)] line-clamp-2">{title}</p>
                  {h.date ? (
                    <p className="mt-1 text-xs text-slate-500">{h.date}</p>
                  ) : null}
                </div>
              </a>
            </Card>
          );
        })}
      </div>
    </section>
  );
}