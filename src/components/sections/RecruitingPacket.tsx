import React from 'react';
import { Profile } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/Card';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { LinkButton } from '@/components/ui/Button';

interface Props {
  profile: Profile;
}

/**
 * RecruitingPacket (optional)
 * Renders only when a URL is provided in profile.recruitingPacket.url
 */
export function RecruitingPacket({ profile }: Props) {
  const url = profile.recruitingPacket?.url;
  if (!url) return null;

  return (
    <section className="space-y-4">
      <SectionHeading as="h2" subtitle="Detailed program and player information">
        Recruiting Packet
      </SectionHeading>

      <Card>
        <CardContent className="flex items-center justify-between gap-4">
          <p className="text-sm text-slate-600">
            Download a printable packet with current information, measurables, and links.
          </p>
          <LinkButton href={url} variant="outline" aria-label="Download recruiting packet" target="_blank" rel="noopener noreferrer">
            Download
          </LinkButton>
        </CardContent>
      </Card>
    </section>
  );
}