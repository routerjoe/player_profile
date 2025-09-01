import React from 'react';
import { Profile } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/Card';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Badge } from '@/components/ui/Badge';
import { SchoolTravelTeams } from '@/components/player/SchoolTravelTeams';
import { getHeadshotPhoto, getHeroPhoto } from '@/lib/photos/service';

interface Props {
  profile: Profile;
  playerId: string;
}

/**
 * Bio & Academics
 * Compact narrative plus academic summary using tokens.
 * - Uses badges for positions
 * - GPA and coursework list in a card
 */
export async function BioAcademics({ profile, playerId }: Props) {
  const fullName = `${profile.name.first} ${profile.name.last}`;
  const positions = profile.positions ?? [];
  const loc = [profile.location?.city, profile.location?.state].filter(Boolean).join(', ');
  const batsThrows = [profile.bats ? `Bats: ${profile.bats}` : null, profile.throws ? `Throws: ${profile.throws}` : null]
    .filter(Boolean)
    .join(' • ');

  const coursework = profile.coursework ?? [];

  // Resolve display image: headshot → hero → placeholder
  const head = await getHeadshotPhoto(playerId).catch(() => undefined);
  let displayUrl = head?.url as string | undefined;
  if (!displayUrl) {
    const hero = await getHeroPhoto(playerId).catch(() => undefined);
    displayUrl = hero?.url;
  }
  displayUrl = displayUrl || '/hero.svg';

  return (
    <section className="space-y-4">
      <SectionHeading as="h2" subtitle="Background and academics">
        Bio & Academics
      </SectionHeading>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Narrative + Headshot (top-left) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-start gap-4">
            <div className="shrink-0">
              <img
                src={displayUrl}
                alt={`${fullName} headshot`}
                width={112}
                height={112}
                className="w-28 h-28 object-cover rounded-xl border"
              />
            </div>
            <div>
              <p className="text-base text-slate-700">
                {fullName}
                {loc ? ` — ${loc}` : ''}. {positions.length ? 'Positions: ' : ''}
                {positions.map((p, i) => (
                  <Badge key={p + i} variant="outline" className="ml-2">{p}</Badge>
                ))}
              </p>
              {batsThrows ? (
                <p className="text-sm text-slate-600">{batsThrows}</p>
              ) : null}
              <p className="text-sm text-slate-600">
                Focused student-athlete with a modern profile. This section is fed by adapters in the next milestone; content here is sample data.
              </p>
            </div>
          </div>
        </div>

        {/* Academics card */}
        <Card>
          <CardContent>
            <p className="text-xs uppercase tracking-wide text-slate-500">Academics</p>
            <div className="mt-2 space-y-2">
              {profile.gpa ? (
                <p className="text-lg font-semibold">
                  GPA:&nbsp;<span className="text-[var(--brand-green)]">{profile.gpa}</span>
                </p>
              ) : null}
              {coursework.length ? (
                <div>
                  <p className="text-sm text-slate-500">Coursework</p>
                  <ul className="mt-1 list-disc pl-5 text-sm text-slate-700">
                    {coursework.map((c, i) => (
                      <li key={c + i}>{c}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4">
        <SchoolTravelTeams playerId={playerId} />
      </div>
    </section>
  );
}