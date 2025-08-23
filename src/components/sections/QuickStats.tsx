import React from 'react';
import { Profile } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/Card';
import { SectionHeading } from '@/components/ui/SectionHeading';

interface Props {
  profile: Profile;
}

/**
 * QuickStats
 * Responsive carded tiles for key stat numerals.
 * - Uses tokens for colors and spacing
 * - Keyboard and screen-reader friendly (aria-labels)
 */
export function QuickStats({ profile }: Props) {
  const stats = profile.stats ?? [];
  if (!stats.length) return null;

  return (
    <section className="space-y-4">
      <SectionHeading as="h2" subtitle="Recent measurables and on-field indicators">
        Quick Stats
      </SectionHeading>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <Card key={`${s.label}-${i}`} className="p-0">
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-wide text-slate-500">{s.label}</p>
              <p
                className="mt-2 text-2xl font-semibold text-[var(--brand-green)]"
                aria-label={`${s.label} value`}
              >
                {s.value}
              </p>
              {s.season ? (
                <p className="mt-1 text-xs text-slate-500" aria-label="season">
                  {s.season}
                </p>
              ) : null}
              {s.notes ? (
                <p className="mt-2 text-xs text-slate-500">{s.notes}</p>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}