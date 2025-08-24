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
  const isPdf = /\.pdf(\?|$)/i.test(url);

  return (
    <section className="space-y-4">
      <SectionHeading as="h2" subtitle="Detailed program and player information">
        Recruiting Packet
      </SectionHeading>

      <Card>
        <CardContent>
          {isPdf ? (
            <div className="space-y-3">
              <div className="w-full max-h-[70vh]">
                <iframe
                  src={url}
                  className="w-full h-[70vh] rounded border"
                  title="Recruiting Packet PDF"
                />
              </div>
              <div className="flex justify-end">
                <LinkButton href={url} variant="outline" aria-label="Download recruiting packet" target="_blank" rel="noopener noreferrer">
                  Download
                </LinkButton>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-slate-600">
                Open a detailed packet with current information, measurables, and links.
              </p>
              <LinkButton href={url} variant="outline" aria-label="Open recruiting packet" target="_blank" rel="noopener noreferrer">
                Open
              </LinkButton>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}