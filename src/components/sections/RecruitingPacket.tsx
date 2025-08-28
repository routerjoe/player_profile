import React from 'react';
import { Profile } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/Card';
import { SectionHeading } from '@/components/ui/SectionHeading';

interface Props {
  profile: Profile;
}

/**
 * RecruitingPacket
 * Public site: provide a clear Download action (no inline preview).
 * - Renders only when profile.recruitingPacket.url is set
 * - Uses a primary-style anchor button with download attribute
 * - For cross-origin URLs, browsers may ignore "download" and open in a new tab
 */
export function RecruitingPacket({ profile }: Props) {
  const url = (profile.recruitingPacket?.url || '').trim();
  if (!url) return null;

  return (
    <section className="space-y-4">
      <SectionHeading as="h2" subtitle="Download the latest program and player packet">
        Recruiting Packet
      </SectionHeading>

      <Card>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-slate-600">
              Download a PDF with current information, measurables, and links.
            </p>
            <a
              href={url}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-lg bg-black text-white text-sm"
              aria-label="Download recruiting packet"
            >
              Download PDF
            </a>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}