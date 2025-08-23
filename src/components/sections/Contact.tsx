import React from 'react';
import { Profile } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/Card';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { LinkButton } from '@/components/ui/Button';

interface Props {
  profile: Profile;
}

/**
 * Contact + Socials
 * - Primary CTA: mailto
 * - Secondary: Twitter profile
 * - Optional: website link
 */
export function Contact({ profile }: Props) {
  const email = profile.contact?.email;
  const mailto = email ? `mailto:${email}` : '#';
  const twitterHandle = profile.twitter?.handle?.replace(/^@/, '') ?? '';
  const website = profile.contact?.website;

  return (
    <section className="space-y-4">
      <SectionHeading as="h2" subtitle="Reach out for recruiting conversations">
        Contact & Socials
      </SectionHeading>

      <Card>
        <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            {email ? (
              <p className="text-sm text-slate-600">
                Email:&nbsp;
                <a
                  className="underline underline-offset-2 text-cyan-600 hover:text-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-cool)] rounded"
                  href={mailto}
                >
                  {email}
                </a>
              </p>
            ) : (
              <p className="text-sm text-slate-600">Email not provided</p>
            )}
            {twitterHandle ? (
              <p className="text-sm text-slate-600">
                Twitter:&nbsp;
                <a
                  className="underline underline-offset-2 text-cyan-600 hover:text-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-cool)] rounded"
                  href={`https://twitter.com/${twitterHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  @{twitterHandle}
                </a>
              </p>
            ) : null}
            {website ? (
              <p className="text-sm text-slate-600">
                Website:&nbsp;
                <a
                  className="underline underline-offset-2 text-cyan-600 hover:text-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-cool)] rounded"
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {website}
                </a>
              </p>
            ) : null}
          </div>

          <div className="flex gap-3">
            <LinkButton href={mailto}>Email</LinkButton>
            {twitterHandle ? (
              <LinkButton href={`https://twitter.com/${twitterHandle}`} variant="outline" aria-label="Open Twitter profile">
                @{twitterHandle}
              </LinkButton>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}