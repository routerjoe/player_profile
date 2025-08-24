'use client';

import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { Profile } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { LinkButton } from '@/components/ui/Button';
import { getDraft, getRawDraft, subscribe } from '@/lib/dashboard/storage';

interface Props {
  profile: Profile;
  heroUrlOverride?: string;
  frameColor?: string;
  fillColor?: string;
  overlayOpacity?: number;
  overlayEnabled?: boolean;
}

/**
 * Hero
 * Full-bleed card with subtle gradient overlay, player identity, badges, and CTAs.
 * - Uses Next/Image to avoid layout shift
 * - 44×44 tap targets via Button defaults
 * - Visible focus via global focus styles
 */
export function Hero({ profile, heroUrlOverride, frameColor, fillColor, overlayOpacity, overlayEnabled }: Props) {
  const name = `${profile.name.first} ${profile.name.last}`;
  const positions = profile.positions ?? [];
  const classYear = profile.classYear ? `Class of ${profile.classYear}` : undefined;
  const emailHref = profile.contact?.email ? `mailto:${profile.contact.email}` : '#';
  const twitterHandle = profile.twitter?.handle?.replace(/^@/, '') ?? '';
  const twitterHref = twitterHandle ? `https://twitter.com/${twitterHandle}` : '#';

  // Local state so dashboard edits (saved to localStorage) reflect immediately on the public page during dev
  const [heroSrc, setHeroSrc] = useState<string>(heroUrlOverride ?? profile.photos?.active?.heroImage ?? '/hero.svg');
  const [featuredSrc, setFeaturedSrc] = useState<string | undefined>(profile.photos?.active?.featuredAction);
  const cardImage = heroSrc || featuredSrc;


  useEffect(() => {
    // When a canonical server-provided hero is passed, don't override from local draft.
    if (heroUrlOverride) {
      return;
    }

    const apply = (src: any) => {
      try {
        const nextHero = src?.photos?.active?.heroImage;
        const nextFeatured = src?.photos?.active?.featuredAction;
        if (typeof nextHero === 'string' && nextHero) setHeroSrc(nextHero);
        if (typeof nextFeatured === 'string' && nextFeatured) setFeaturedSrc(nextFeatured);
      } catch {
        // ignore malformed draft
      }
    };

    // Initial load from either last-valid or raw draft
    try {
      const valid = getDraft();
      const raw = getRawDraft<any>();
      apply((valid ?? raw) as any);
    } catch {
      // ignore — falls back to server-provided profile
    }

    // Live updates across tabs/when draft changes
    const unsub = subscribe((raw, valid) => apply((valid ?? raw) as any));
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heroUrlOverride]);

  // Effective theme values (from server props only to keep SSR/CSR consistent)
  const effectiveFill = fillColor ?? 'white';
  const effectiveOverlayEnabled = overlayEnabled ?? true;
  const effectiveOverlayOpacity = typeof overlayOpacity === 'number' ? overlayOpacity : undefined;

  return (
    <section
      className="relative overflow-hidden rounded-2xl min-h-[320px] md:min-h-[360px] lg:pr-[28rem] ring-1 ring-black/10 border-2"
      style={{ backgroundColor: effectiveFill, borderColor: frameColor }}
    >
      {/* Gradient overlay on top of fill */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 hero-overlay"
          style={
            {
              ['--hero-overlay-opacity' as any]:
                effectiveOverlayEnabled === false
                  ? 0
                  : effectiveOverlayOpacity !== undefined
                  ? effectiveOverlayOpacity
                  : undefined,
            } as React.CSSProperties
          }
        />
      </div>

      {/* Content */}
      <div className="relative z-10 p-6 md:p-10 lg:p-14">
        <h1 className="heading-xl text-white drop-shadow-sm">{name}</h1>
        <div className="mt-3 flex flex-wrap gap-2">
          {classYear ? <Badge variant="brand">{classYear}</Badge> : null}
          {positions.map((p) => (
            <Badge key={p} variant="outline">{p}</Badge>
          ))}
          {profile.location?.city || profile.location?.state ? (
            <Badge variant="neutral">
              {[profile.location?.city, profile.location?.state].filter(Boolean).join(', ')}
            </Badge>
          ) : null}
        </div>

        <div className="mt-6 flex gap-3">
          <LinkButton href={emailHref}>
            Contact
          </LinkButton>
          <LinkButton href={twitterHref} variant="outline" aria-label="Open Twitter profile">
            @{twitterHandle || 'twitter'}
          </LinkButton>
        </div>
      </div>

      {cardImage ? (
        <div className="absolute right-6 top-1/2 -translate-y-1/2 z-20">
          <div
            className="relative w-[26rem] aspect-[3/4] rounded-xl overflow-hidden shadow-2xl ring-1 ring-black/10"
          >
            <img
              src={cardImage}
              alt={`${name} hero`}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}