import React from 'react';
import Image from 'next/image';
import { Profile } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { SectionHeading } from '@/components/ui/SectionHeading';

interface Props {
  profile: Profile;
}

/**
 * Highlights
 * Responsive grid of video thumbnails linking to provider URLs (YouTube, Hudl, etc.).
 * - Lazy loads by default (Next/Image)
 * - No layout shift via fixed aspect ratio container
 * - External links open in new tab with rel noopener
 */
export function Highlights({ profile }: Props) {
  const clips = profile.highlights ?? [];
  if (!clips.length) return null;

  return (
    <section className="space-y-4">
      <SectionHeading as="h2" subtitle="Selected game clips and skills videos">
        Highlights
      </SectionHeading>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {clips.map((h, i) => {
          const thumb = h.thumbnailUrl || '/hero.svg';
          const title = h.title || 'Highlight';
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
                  <Image
                    src={thumb}
                    alt={title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition group-hover:scale-[1.02]"
                  />
                  <div className="absolute inset-0 ring-1 ring-black/5" />
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