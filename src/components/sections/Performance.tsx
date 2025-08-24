import React from 'react';
import type { Profile } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/Card';
import { SectionHeading } from '@/components/ui/SectionHeading';

interface Props {
  profile: Profile;
}

/**
 * Performance
 * Simple tabular/card layout that lists performance measurables
 * captured in profile.performance (metric, value, unit, measuredAt, notes, source).
 */
export function Performance({ profile }: Props) {
  const rows = profile.performance ?? [];
  if (!rows.length) return null;

  return (
    <section className="space-y-4">
      <SectionHeading as="h2" subtitle="Latest combine and training measurables">
        Performance
      </SectionHeading>

      <Card>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-8">
              <thead>
                <tr className="text-left text-sm text-slate-500">
                  <th className="pr-6">Metric</th>
                  <th className="pr-6">Value</th>
                  <th className="pr-6">Measured At</th>
                  <th className="pr-6">Notes</th>
                  <th className="pr-6">Source</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={`${r.metric}-${i}`} className="align-top">
                    <td className="pr-6">
                      <div className="text-sm text-slate-800">{r.metric}</div>
                    </td>
                    <td className="pr-6">
                      <div className="text-sm text-[var(--brand-green)] font-semibold">
                        {r.value} {r.unit}
                      </div>
                    </td>
                    <td className="pr-6">
                      <div className="text-sm text-slate-600">
                        {r.measuredAt}
                      </div>
                    </td>
                    <td className="pr-6">
                      <div className="text-sm text-slate-600">
                        {r.notes || '—'}
                      </div>
                    </td>
                    <td className="pr-6">
                      <div className="text-sm text-slate-600">
                        {r.source || '—'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}