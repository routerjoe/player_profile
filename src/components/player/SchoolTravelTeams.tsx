import React from 'react';
import { getOrInit } from '@/lib/teams/db';
import type { PlayerTeams, TeamInfo, SocialPlatform } from '@/lib/teams/types';

export async function SchoolTravelTeams({ playerId }: { playerId: string }) {
  const data: PlayerTeams = await getOrInit(playerId);

  const items: Array<{ key: 'school' | 'travel'; title: string; team: TeamInfo }> = [
    { key: 'school', title: 'School Ball', team: data.school },
    { key: 'travel', title: 'Travel Ball', team: data.travel },
  ];

  return (
    <div id="team" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map(({ key, title, team }) => (
          <TeamCard key={key} title={title} team={team} />
        ))}
      </div>
    </div>
  );
}

function hasContent(team: TeamInfo): boolean {
  return Boolean(
    (team.teamName && team.teamName.trim()) ||
      (team.coachName && team.coachName.trim()) ||
      (team.coachEmail && team.coachEmail.trim()) ||
      (Array.isArray(team.socials) && team.socials.length > 0),
  );
}

function TeamCard({ title, team }: { title: string; team: TeamInfo }) {
  if (team.isPublic === false) return null;
  if (!hasContent(team)) return null;

  const socials = Array.isArray(team.socials) ? team.socials : [];

  return (
    <div className="rounded-2xl border p-5 bg-white shadow-sm">
      <div className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium bg-slate-100 text-slate-700">
        {title}
      </div>

      <div className="mt-3 space-y-2 text-sm text-slate-700">
        {team.teamName ? (
          <div className="font-semibold text-slate-900">{team.teamName}</div>
        ) : null}
        {team.coachName ? (
          <div>Coach: {team.coachName}</div>
        ) : null}
        {team.coachEmail ? (
          <div>
            Coach Email:{' '}
            <a
              className="underline decoration-slate-300 hover:decoration-slate-500"
              href={`mailto:${team.coachEmail}`}
            >
              {team.coachEmail}
            </a>
          </div>
        ) : null}
      </div>

      {socials.length > 0 ? (
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          {socials.map((s) => (
            <a
              key={s.id}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
              title={s.handle || s.platform}
            >
              <SocialIcon platform={s.platform} />
              <span className="truncate max-w-[160px]">{s.handle || domainFromUrl(s.url)}</span>
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function domainFromUrl(u: string): string {
  try {
    const url = new URL(u);
    return url.hostname.replace(/^www\./i, '');
  } catch {
    return u;
  }
}

function SocialIcon({ platform }: { platform: SocialPlatform }) {
  const common = 'h-4 w-4 text-slate-700';
  switch (platform) {
    case 'instagram':
      return (
        <svg viewBox="0 0 24 24" className={common} aria-hidden="true">
          <path fill="currentColor" d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm5 3.5a5.5 5.5 0 1 1 0 11.001A5.5 5.5 0 0 1 12 7.5zm0 2a3.5 3.5 0 1 0 .001 7.001A3.5 3.5 0 0 0 12 9.5zm5.25-3a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5z"/>
        </svg>
      );
    case 'x':
      return (
        <svg viewBox="0 0 24 24" className={common} aria-hidden="true">
          <path fill="currentColor" d="M3 3h4.5l5.2 7.3L17 3h4l-7.1 10 7.3 8H16.6l-5.5-7.6L7 21H3l7.5-10.6L3 3z"/>
        </svg>
      );
    case 'facebook':
      return (
        <svg viewBox="0 0 24 24" className={common} aria-hidden="true">
          <path fill="currentColor" d="M13 3h4V7h-3c-.6 0-1 .4-1 1v3h4l-1 4h-3v6h-4v-6H6v-4h3V8a5 5 0 0 1 5-5z"/>
        </svg>
      );
    case 'tiktok':
      return (
        <svg viewBox="0 0 24 24" className={common} aria-hidden="true">
          <path fill="currentColor" d="M14 3h3a6 6 0 0 0 4 4v3a9 9 0 0 1-4-1.1V15a6 6 0 1 1-6-6v3a3 3 0 1 0 3 3V3z"/>
        </svg>
      );
    case 'threads':
      return (
        <svg viewBox="0 0 24 24" className={common} aria-hidden="true">
          <path fill="currentColor" d="M12 2c5.5 0 10 4.5 10 10s-4.5 10-10 10S2 17.5 2 12h4a6 6 0 1 0 6-6V2z"/>
        </svg>
      );
    case 'youtube':
      return (
        <svg viewBox="0 0 24 24" className={common} aria-hidden="true">
          <path fill="currentColor" d="M21.6 7.2a3 3 0 0 0-2.1-2.1C17.9 4.5 12 4.5 12 4.5s-5.9 0-7.5.6A3 3 0 0 0 2.4 7.2 31.1 31.1 0 0 0 1.8 12c0 1.6.1 3.2.6 4.8a3 3 0 0 0 2.1 2.1c1.6.6 7.5.6 7.5.6s5.9 0 7.5-.6a3 3 0 0 0 2.1-2.1c.4-1.6.6-3.2.6-4.8 0-1.6-.2-3.2-.6-4.8zM10 15.5v-7l6 3.5-6 3.5z"/>
        </svg>
      );
    case 'website':
    default:
      return (
        <svg viewBox="0 0 24 24" className={common} aria-hidden="true">
          <path fill="currentColor" d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2zm0 2c1.7 0 3.3.6 4.6 1.6A16 16 0 0 0 12 7a16 16 0 0 0-4.6-1.4A7.9 7.9 0 0 1 12 4zm-6.5 5.1A14 14 0 0 1 12 6.9c2.4 0 4.7.4 6.5 1.2.3.9.5 1.9.5 2.9s-.2 2-.5 2.9A14 14 0 0 1 12 17.1a14 14 0 0 1-6.5-1.2A8 8 0 0 1 5.5 12c0-1 .2-2 .5-2.9zM12 20a8 8 0 0 1-4.6-1.6A16 16 0 0 0 12 17c1.6 0 3.1.2 4.6.6A8 8 0 0 1 12 20z"/>
        </svg>
      );
  }
}