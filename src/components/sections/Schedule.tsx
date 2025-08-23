import React from 'react';
import { Profile } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/Card';
import { SectionHeading } from '@/components/ui/SectionHeading';

interface Props {
  profile: Profile;
}

/**
 * Schedule
 * Accessible table for Date | Opponent | Result | Link
 * - Uses semantic table structure with caption and scope
 * - Mobile-friendly via overflow-x auto wrapper
 */
export function Schedule({ profile }: Props) {
  const rows = profile.schedule ?? [];
  if (!rows.length) return null;

  return (
    <section className="space-y-4">
      <SectionHeading as="h2" subtitle="Upcoming and recent games">
        Schedule
      </SectionHeading>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Game schedule</caption>
              <thead className="text-left text-slate-500 uppercase tracking-wide text-xs">
                <tr className="border-b border-slate-100">
                  <th scope="col" className="py-3 px-4">Date</th>
                  <th scope="col" className="py-3 px-4">Opponent</th>
                  <th scope="col" className="py-3 px-4">Location</th>
                  <th scope="col" className="py-3 px-4">Result</th>
                  <th scope="col" className="py-3 px-4">Link</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((g, i) => (
                  <tr key={`${g.date}-${g.opponent}-${i}`} className="border-b last:border-0 border-slate-100">
                    <td className="py-3 px-4 whitespace-nowrap">{g.date}</td>
                    <td className="py-3 px-4">{g.opponent}</td>
                    <td className="py-3 px-4">{g.location ?? '-'}</td>
                    <td className="py-3 px-4">
                      {g.result ? (
                        <span className="text-[var(--brand-green)] font-medium">{g.result}</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {g.link ? (
                        <a
                          href={g.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-600 hover:text-cyan-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-cool)] rounded"
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
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