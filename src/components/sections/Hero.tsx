import Image from 'next/image';
import React from 'react';
import { Profile } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { LinkButton } from '@/components/ui/Button';

interface Props {
  profile: Profile;
}

/**
 * Hero
 * Full-bleed card with subtle gradient overlay, player identity, badges, and CTAs.
 * - Uses Next/Image to avoid layout shift
 * - 44×44 tap targets via Button defaults
 * - Visible focus via global focus styles
 */
export function Hero({ profile }: Props) {
  const name = `${profile.name.first} ${profile.name.last}`;
  const positions = profile.positions ?? [];
  const classYear = profile.classYear ? `Class of ${profile.classYear}` : undefined;
  const emailHref = profile.contact?.email ? `mailto:${profile.contact.email}` : '#';
  const twitterHandle = profile.twitter?.handle?.replace(/^@/, '') ?? '';
  const twitterHref = twitterHandle ? `https://twitter.com/${twitterHandle}` : '#';
  const heroSrc = profile.photos?.active?.heroImage ?? '/hero.svg';

  return (
    <section className="relative overflow-hidden rounded-2xl bg-white">
      {/* Image */}
      <div className="absolute inset-0">
        <Image
          src={heroSrc}
          alt={`${name} hero`}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 1280px"
          className="object-cover"
        />
        <div className="absolute inset-0 hero-overlay" />
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
    </section>
  );
}