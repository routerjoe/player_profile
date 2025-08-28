'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { PlayerTeams, TeamInfo, SocialPlatform, SocialLink } from '@/lib/teams/types';
import { SOCIAL_PLATFORMS, MAX_SOCIALS_PER_TEAM } from '@/lib/teams/types';
import { isEmail, isHttpUrl } from '@/lib/validate';

type TeamKey = 'school' | 'travel';

type TeamDraft = {
  teamName: string;
  coachName: string;
  coachEmail: string;
  isPublic: boolean;
  socials: SocialLink[];
};

type DraftState = {
  playerId: string;
  school: TeamDraft;
  travel: TeamDraft;
  updatedAt: string;
};

type AddSocialDraft = {
  platform: SocialPlatform;
  handle: string;
  url: string;
};

const teamCardCls = 'rounded-2xl border bg-white p-6 shadow-sm';
const labelCls = 'text-xs font-medium text-gray-600';
const inputCls = 'w-full rounded-lg border px-3 py-2 text-sm';
const toggleRowCls = 'flex items-center gap-2';
const btnPrimary = 'px-3 py-2 rounded-lg bg-black text-white text-sm disabled:opacity-50';
const btnGhost = 'px-2 py-1 rounded-lg text-sm border text-slate-700 hover:bg-slate-100';
const pillCls = 'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium bg-slate-100 text-slate-700';

function deepCloneTeams(t: PlayerTeams): DraftState {
  return JSON.parse(JSON.stringify(t));
}

export default function TeamsDashboardPage() {
  const [playerId, setPlayerId] = useState<string>('');
  const [orig, setOrig] = useState<DraftState | null>(null);
  const [form, setForm] = useState<DraftState | null>(null);
  const [adding, setAdding] = useState<Record<TeamKey, AddSocialDraft>>({
    school: { platform: 'instagram', handle: '', url: '' },
    travel: { platform: 'instagram', handle: '', url: '' },
  });
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const devHeaders = (): Record<string, string> => {
    if (typeof window === 'undefined') return {};
    const id = window.localStorage.getItem('pp_user_id') || '';
    return id ? { 'x-user-id': id } : {};
    // Note: cookie-based session is primary, x-user-id is dev fallback.
  };

  async function resolvePlayerId(): Promise<string> {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (res.ok) {
        const j = await res.json();
        const id = j?.user?.playerId || j?.user?.id || '';
        if (id) return id;
      }
    } catch {}
    const local = typeof window !== 'undefined' ? window.localStorage.getItem('pp_user_id') || '' : '';
    return local;
  }

  async function load() {
    setLoading(true);
    try {
      const pid = await resolvePlayerId();
      if (!pid) throw new Error('Missing player id');
      setPlayerId(pid);
      const res = await fetch(`/api/players/${encodeURIComponent(pid)}/teams`, {
        credentials: 'include',
        headers: { ...devHeaders(), 'content-type': 'application/json' },
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || 'Failed to fetch teams');
      const data = j as PlayerTeams;
      const draft = deepCloneTeams(data);
      setOrig(draft);
      setForm(draft);
    } catch (e: any) {
      setToast({ type: 'error', message: e?.message ?? 'Failed to load' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setTeamField(team: TeamKey, key: keyof TeamDraft, value: any) {
    setForm((prev) => {
      if (!prev) return prev;
      return { ...prev, [team]: { ...prev[team], [key]: value } };
    });
  }

  const emailIssues = useMemo(() => {
    const issues: Record<TeamKey, string | null> = { school: null, travel: null };
    if (form) {
      if (form.school.coachEmail && !isEmail(form.school.coachEmail)) issues.school = 'Invalid email address';
      if (form.travel.coachEmail && !isEmail(form.travel.coachEmail)) issues.travel = 'Invalid email address';
    }
    return issues;
  }, [form]);

  const patch = useMemo(() => {
    if (!orig || !form) return null;
    const diffTeam = (a: TeamDraft, b: TeamDraft): Partial<TeamDraft> => {
      const p: Partial<TeamDraft> = {};
      if (a.teamName !== b.teamName) p.teamName = b.teamName;
      if (a.coachName !== b.coachName) p.coachName = b.coachName;
      if (a.coachEmail !== b.coachEmail) p.coachEmail = b.coachEmail;
      if (!!a.isPublic !== !!b.isPublic) p.isPublic = !!b.isPublic;
      return p;
    };
    const school = diffTeam(orig.school, form.school);
    const travel = diffTeam(orig.travel, form.travel);
    const out: { school?: Partial<TeamInfo>; travel?: Partial<TeamInfo> } = {};
    if (Object.keys(school).length) out.school = school as any;
    if (Object.keys(travel).length) out.travel = travel as any;
    return out;
  }, [orig, form]);

  const dirty = !!(patch && (patch.school || patch.travel));
  const canSave = !!form && !busy && dirty && !emailIssues.school && !emailIssues.travel;

  async function onSave() {
    if (!form || !patch || !playerId) return;
    if (emailIssues.school || emailIssues.travel) return;
    setBusy(true);
    setToast(null);
    try {
      const res = await fetch(`/api/players/${encodeURIComponent(playerId)}/teams`, {
        method: 'PUT',
        credentials: 'include',
        headers: { ...devHeaders(), 'content-type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || 'Save failed');
      const updated = deepCloneTeams(j as PlayerTeams);
      setOrig(updated);
      setForm(updated);
      setToast({ type: 'success', message: 'Saved changes' });
    } catch (e: any) {
      setToast({ type: 'error', message: e?.message ?? 'Save failed' });
    } finally {
      setBusy(false);
    }
  }

  function onReset() {
    if (orig) setForm(deepCloneTeams(orig));
    setToast(null);
  }

  async function addSocial(team: TeamKey) {
    if (!playerId) return;
    const d = adding[team];
    if (!d.url || !isHttpUrl(d.url)) {
      setToast({ type: 'error', message: 'Enter a valid URL (http/https)' });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/players/${encodeURIComponent(playerId)}/teams/social`, {
        method: 'POST',
        credentials: 'include',
        headers: { ...devHeaders(), 'content-type': 'application/json' },
        body: JSON.stringify({
          team,
          platform: d.platform,
          url: d.url,
          handle: d.handle || undefined,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || 'Add social failed');
      const updated = deepCloneTeams(j as PlayerTeams);
      setOrig(updated);
      setForm(updated);
      setAdding((prev) => ({ ...prev, [team]: { platform: d.platform, handle: '', url: '' } }));
      setToast({ type: 'success', message: 'Social link added' });
    } catch (e: any) {
      setToast({ type: 'error', message: e?.message ?? 'Add social failed' });
    } finally {
      setBusy(false);
    }
  }

  async function deleteSocial(team: TeamKey, socialId: string) {
    if (!playerId) return;
    if (!confirm('Delete this social link?')) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/players/${encodeURIComponent(playerId)}/teams/social/${encodeURIComponent(socialId)}?team=${team}`,
        {
          method: 'DELETE',
          credentials: 'include',
          headers: { ...devHeaders() },
        },
      );
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || 'Delete failed');
      const updated = deepCloneTeams(j as PlayerTeams);
      setOrig(updated);
      setForm(updated);
      setToast({ type: 'success', message: 'Deleted' });
    } catch (e: any) {
      setToast({ type: 'error', message: e?.message ?? 'Delete failed' });
    } finally {
      setBusy(false);
    }
  }

  if (loading || !form) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-wide" style={{ fontFamily: 'var(--font-bebas)' }}>
          Teams
        </h1>
        <p className="text-sm text-slate-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-wide" style={{ fontFamily: 'var(--font-bebas)' }}>
          Teams
        </h1>
        <div className="flex items-center gap-2">
          <button className={btnGhost} onClick={onReset} disabled={busy}>Reset</button>
          <button className={btnPrimary} onClick={onSave} disabled={!canSave}>
            {busy ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TeamCardEditor
          title="School Ball"
          teamKey="school"
          team={form.school}
          setTeamField={setTeamField}
          emailIssue={emailIssues.school}
          socialsLimit={MAX_SOCIALS_PER_TEAM}
          addDraft={adding.school}
          setAddDraft={(d) => setAdding((prev) => ({ ...prev, school: d }))}
          onAdd={() => addSocial('school')}
          onDeleteSocial={(id) => deleteSocial('school', id)}
        />

        <TeamCardEditor
          title="Travel Ball"
          teamKey="travel"
          team={form.travel}
          setTeamField={setTeamField}
          emailIssue={emailIssues.travel}
          socialsLimit={MAX_SOCIALS_PER_TEAM}
          addDraft={adding.travel}
          setAddDraft={(d) => setAdding((prev) => ({ ...prev, travel: d }))}
          onAdd={() => addSocial('travel')}
          onDeleteSocial={(id) => deleteSocial('travel', id)}
        />
      </div>

      <Toast to={toast} onClose={() => setToast(null)} />
    </div>
  );
}

function TeamCardEditor({
  title,
  teamKey,
  team,
  setTeamField,
  emailIssue,
  socialsLimit,
  addDraft,
  setAddDraft,
  onAdd,
  onDeleteSocial,
}: {
  title: string;
  teamKey: TeamKey;
  team: TeamDraft;
  setTeamField: (team: TeamKey, key: keyof TeamDraft, value: any) => void;
  emailIssue?: string | null;
  socialsLimit: number;
  addDraft: AddSocialDraft;
  setAddDraft: (d: AddSocialDraft) => void;
  onAdd: () => void;
  onDeleteSocial: (id: string) => void;
}) {
  const canAdd = addDraft.url && isHttpUrl(addDraft.url) && !!addDraft.platform;
  const addUrlInvalid = !!addDraft.url && !isHttpUrl(addDraft.url);

  return (
    <div className={teamCardCls}>
      <div className={pillCls}>{title}</div>
      <div className="mt-4 grid grid-cols-1 gap-4">
        <div>
          <label className={labelCls}>Team Name</label>
          <input
            className={inputCls}
            placeholder={teamKey === 'school' ? 'Albany HS Lady Falcons' : 'NE Fury Gold 18U'}
            value={team.teamName}
            onChange={(e) => setTeamField(teamKey, 'teamName', e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls}>Coach Name</label>
          <input
            className={inputCls}
            placeholder={teamKey === 'school' ? 'Jane Doe' : 'Chris Smith'}
            value={team.coachName}
            onChange={(e) => setTeamField(teamKey, 'coachName', e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls}>Coach Email</label>
          <input
            className={inputCls}
            type="email"
            placeholder={teamKey === 'school' ? 'coach@albanyhs.edu' : 'coach@nefury.org'}
            value={team.coachEmail}
            onChange={(e) => setTeamField(teamKey, 'coachEmail', e.target.value)}
          />
          {emailIssue ? <p className="text-xs text-red-600 mt-1">{emailIssue}</p> : null}
        </div>

        <div className={toggleRowCls}>
          <input
            id={`${teamKey}-public`}
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300"
            checked={team.isPublic !== false}
            onChange={(e) => setTeamField(teamKey, 'isPublic', e.target.checked)}
          />
          <label htmlFor={`${teamKey}-public`} className="text-sm text-slate-700">Show publicly</label>
        </div>

        <div className="mt-2">
          <div className="text-sm font-medium text-slate-800 mb-2">Social Links</div>
          {Array.isArray(team.socials) && team.socials.length > 0 ? (
            <ul className="space-y-2">
              {team.socials.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 bg-white">
                  <div className="flex items-center gap-2 min-w-0">
                    <SocialIcon platform={s.platform} />
                    <span className="text-sm text-slate-700 truncate">{s.handle || domainFromUrl(s.url)}</span>
                    <a className="text-xs text-slate-500 underline truncate" href={s.url} target="_blank" rel="noopener noreferrer">
                      {s.url}
                    </a>
                  </div>
                  <button className={btnGhost} onClick={() => onDeleteSocial(s.id)}>Delete</button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No social links added.</p>
          )}

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-6 gap-2">
            <div className="sm:col-span-2">
              <label className={labelCls}>Platform</label>
              <select
                className={inputCls}
                value={addDraft.platform}
                onChange={(e) => setAddDraft({ ...addDraft, platform: e.target.value as SocialPlatform })}
              >
                {SOCIAL_PLATFORMS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Handle (optional)</label>
              <input
                className={inputCls}
                value={addDraft.handle}
                onChange={(e) => setAddDraft({ ...addDraft, handle: e.target.value })}
                placeholder="@YourHandle"
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>URL</label>
              <input
                className={inputCls}
                value={addDraft.url}
                onChange={(e) => setAddDraft({ ...addDraft, url: e.target.value })}
                placeholder="https://..."
              />
              {addUrlInvalid ? <p className="text-xs text-red-600 mt-1">Enter a valid http(s) URL</p> : null}
            </div>
            <div className="sm:col-span-6 flex items-end">
              <button
                type="button"
                className={btnPrimary}
                onClick={onAdd}
                disabled={!canAdd || (team.socials?.length ?? 0) >= socialsLimit}
                title={(team.socials?.length ?? 0) >= socialsLimit ? `Max ${socialsLimit} socials` : 'Add'}
              >
                Add
              </button>
              <span className="ml-3 text-xs text-slate-500">
                {(team.socials?.length ?? 0)}/{socialsLimit}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Toast({ to, onClose }: { to: { type: 'success' | 'error'; message: string } | null; onClose: () => void }) {
  useEffect(() => {
    if (!to) return;
    const t = setTimeout(onClose, 2200);
    return () => clearTimeout(t);
  }, [to, onClose]);
  if (!to) return null;
  const bg = to.type === 'success' ? 'bg-green-600' : 'bg-red-600';
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`rounded-lg px-4 py-2 text-white shadow-lg ${bg}`}>{to.message}</div>
    </div>
  );
}

// Lightweight icons (no extra lib)
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

function domainFromUrl(u: string): string {
  try {
    const url = new URL(u);
    return url.hostname.replace(/^www\./i, '');
  } catch {
    return u;
  }
}