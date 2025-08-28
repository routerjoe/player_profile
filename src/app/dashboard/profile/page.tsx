'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Profile } from '@/lib/types';
import { getDraft, saveDraft } from '@/lib/dashboard/storage';
import { profile as sampleProfile } from '@/lib/sample/profile';

type Issue = { path: string; message: string };

const field = 'block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-cool)]';
const label = 'text-sm font-medium text-slate-700';
const group = 'space-y-2';
const section = 'card p-5 space-y-4';
const sectionTitle = 'text-base font-semibold text-slate-800';

function toComma(list?: string[]) {
  return list?.join(', ') ?? '';
}
function fromComma(s: string): string[] {
  return s
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

export default function DashboardProfilePage() {
  // Initialize to bundled sample so SSR/CSR match; then hydrate from persisted draft after mount
  const [form, setForm] = useState<Profile>(sampleProfile);
  const [valid, setValid] = useState(true);
  const [errors, setErrors] = useState<Issue[] | undefined>(undefined);
  const [positionsInput, setPositionsInput] = useState<string>(() => toComma((getDraft() ?? sampleProfile).positions));

  useEffect(() => {
    // Hydrate once from persisted last-valid draft (if any) to avoid hydration mismatches
    const persisted = getDraft();
    if (persisted) setForm(persisted);
  }, []);

  // Keep positions input in sync when form.positions changes (e.g., load/hydrate)
  useEffect(() => {
    setPositionsInput(toComma(form.positions));
  }, [form.positions]);

  // Persist on every change with Zod validation
  useEffect(() => {
    const result = saveDraft(form as any);
    setValid(result.valid);
    setErrors(result.errors);
  }, [form]);

  const errorMap = useMemo(() => {
    const map = new Map<string, string[]>();
    if (errors) {
      for (const e of errors) {
        const arr = map.get(e.path) ?? [];
        arr.push(e.message);
        map.set(e.path, arr);
      }
    }
    return map;
  }, [errors]);

  const set = <K extends keyof Profile>(key: K, value: Profile[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // Recruiting Packet PDF manager state and helpers
  type PacketFile = { id: string; filename: string; url: string; size: number; modifiedAt: string };

  const [playerId, setPlayerId] = useState<string>('');
  const [packets, setPackets] = useState<PacketFile[]>([]);
  const [loadingPackets, setLoadingPackets] = useState<boolean>(false);

  const devHeaders = (): Record<string, string> => {
    if (typeof window === 'undefined') return {};
    const id = window.localStorage.getItem('pp_user_id') || '';
    return id ? { 'x-user-id': id } : {};
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
    return local || (process.env.NEXT_PUBLIC_DEFAULT_PLAYER_ID || 'demo');
  }

  async function loadPackets(forPlayer?: string): Promise<PacketFile[]> {
    const pid = forPlayer || playerId;
    if (!pid) return [];
    setLoadingPackets(true);
    try {
      const res = await fetch(`/api/players/${encodeURIComponent(pid)}/recruiting/packets`, {
        credentials: 'include',
        headers: { ...devHeaders() },
        cache: 'no-store',
      });
      const j = await res.json().catch(() => ({}));
      const files = Array.isArray(j?.files) ? (j.files as PacketFile[]) : [];
      setPackets(files);
      return files;
    } finally {
      setLoadingPackets(false);
    }
  }

  useEffect(() => {
    let ignore = false;
    (async () => {
      const pid = await resolvePlayerId();
      if (!ignore) {
        setPlayerId(pid);
        await loadPackets(pid);
      }
    })();
    return () => { ignore = true; };
  }, []);

  async function deletePacket(id: string) {
    if (!playerId) return;
    if (!confirm('Delete this PDF?')) return;
    const selected = form.recruitingPacket?.url || '';
    try {
      const res = await fetch(
        `/api/players/${encodeURIComponent(playerId)}/recruiting/packets/${encodeURIComponent(id)}`,
        {
          method: 'DELETE',
          credentials: 'include',
          headers: { ...devHeaders() },
        },
      );
      await res.json().catch(() => ({}));
    } finally {
      const files = await loadPackets();
      if (selected && !files.some((f) => f.url === selected)) {
        set('recruitingPacket', undefined as any);
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-6 flex-col lg:flex-row">
        <div className="flex-1 space-y-6 w-full">
          <div className={section}>
            <h2 className={sectionTitle}>Identity</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={group}>
                <label className={label}>First Name</label>
                <input
                  className={field}
                  value={form.name?.first ?? ''}
                  onChange={(e) => set('name', { ...form.name, first: e.target.value })}
                />
                {errorMap.get('name.first')?.map((m, i) => (
                  <p key={i} className="text-xs text-red-600">{m}</p>
                ))}
              </div>
              <div className={group}>
                <label className={label}>Last Name</label>
                <input
                  className={field}
                  value={form.name?.last ?? ''}
                  onChange={(e) => set('name', { ...form.name, last: e.target.value })}
                />
                {errorMap.get('name.last')?.map((m, i) => (
                  <p key={i} className="text-xs text-red-600">{m}</p>
                ))}
              </div>
              <div className={group}>
                <label className={label}>Class Year</label>
                <input
                  className={field}
                  type="number"
                  value={form.classYear ?? ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    set('classYear', v === '' ? undefined : Number(v));
                  }}
                />
              </div>
              <div className={group}>
                <label className={label}>Positions (comma-separated)</label>
                <input
                  className={field}
                  value={positionsInput}
                  onChange={(e) => setPositionsInput(e.target.value)}
                  onBlur={() => set('positions', fromComma(positionsInput))}
                  placeholder="e.g. SS, 2B"
                />
              </div>
              <div className={group}>
                <label className={label}>Bats</label>
                <input
                  className={field}
                  value={form.bats ?? ''}
                  onChange={(e) => set('bats', e.target.value)}
                />
              </div>
              <div className={group}>
                <label className={label}>Throws</label>
                <input
                  className={field}
                  value={form.throws ?? ''}
                  onChange={(e) => set('throws', e.target.value)}
                />
              </div>
              <div className={group}>
                <label className={label}>Height</label>
                <input
                  className={field}
                  value={form.height ?? ''}
                  onChange={(e) => set('height', e.target.value)}
                />
              </div>
              <div className={group}>
                <label className={label}>Weight</label>
                <input
                  className={field}
                  value={form.weight ?? ''}
                  onChange={(e) => set('weight', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={group}>
                <label className={label}>City</label>
                <input
                  className={field}
                  value={form.location?.city ?? ''}
                  onChange={(e) => set('location', { ...form.location, city: e.target.value })}
                />
              </div>
              <div className={group}>
                <label className={label}>State</label>
                <input
                  className={field}
                  value={form.location?.state ?? ''}
                  onChange={(e) => set('location', { ...form.location, state: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className={section}>
            <h2 className={sectionTitle}>Contact & Social</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={group}>
                <label className={label}>Email</label>
                <input
                  className={field}
                  value={form.contact?.email ?? ''}
                  onChange={(e) => set('contact', { ...form.contact, email: e.target.value })}
                />
              </div>
              <div className={group}>
                <label className={label}>Website</label>
                <input
                  className={field}
                  value={form.contact?.website ?? ''}
                  onChange={(e) => set('contact', { ...form.contact, website: e.target.value })}
                />
              </div>
              <div className={group}>
                <label className={label}>Phone</label>
                <input
                  className={field}
                  value={form.contact?.phone ?? ''}
                  onChange={(e) => set('contact', { ...form.contact, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={group}>
                <label className={label}>Twitter Handle</label>
                <input
                  className={field}
                  placeholder="e.g. LanaNolan02"
                  value={form.twitter?.handle ?? ''}
                  onChange={(e) => (set as any)('twitter', { ...form.twitter, handle: e.target.value })}
                />
              </div>
              <div className={group}></div>
            </div>
          </div>

          <div className={section}>
            <h2 className={sectionTitle}>Academics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={group}>
                <label className={label}>GPA</label>
                <input
                  className={field}
                  value={(form.gpa as any) ?? ''}
                  onChange={(e) => set('gpa', e.target.value)}
                />
              </div>
              <div className={group}>
                <label className={label}>SAT</label>
                <input
                  className={field}
                  value={form.testScores?.SAT ?? ''}
                  onChange={(e) => set('testScores', { ...form.testScores, SAT: e.target.value })}
                />
              </div>
              <div className={group}>
                <label className={label}>ACT</label>
                <input
                  className={field}
                  value={form.testScores?.ACT ?? ''}
                  onChange={(e) => set('testScores', { ...form.testScores, ACT: e.target.value })}
                />
              </div>
            </div>
            <div className={group}>
              <label className={label}>Academic Achievements</label>
              <input
                className={field}
                value={toComma(form.coursework)}
                onChange={(e) => set('coursework', fromComma(e.target.value))}
                placeholder="e.g. Honor Roll, AP English, National Honor Society"
              />
            </div>
          </div>

          <div className={section}>
            <h2 className={sectionTitle}>Recruiting Packet & SEO</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={group}>
                <label className={label}>Recruiting Packet URL</label>
                <div className="flex gap-2">
                  <input
                    className={field + ' flex-1'}
                    value={form.recruitingPacket?.url ?? ''}
                    onChange={(e) => set('recruitingPacket', { url: e.target.value })}
                    placeholder="/uploads/{playerId}/packet.pdf or https://..."
                  />
                  <label className="px-3 py-2 rounded-lg text-sm font-medium border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer">
                    Upload PDF
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={async (e) => {
                        const input = e.currentTarget as HTMLInputElement | null;
                        const f = input?.files?.[0];
                        if (!f) return;
                        try {
                          const fd = new FormData();
                          fd.append('file', f);
                          fd.append('alt', 'recruiting-packet');
                          const res = await fetch('/api/media/upload', {
                            method: 'POST',
                            body: fd,
                            credentials: 'include',
                            headers: { ...devHeaders() },
                          });
                          const data = await res.json().catch(() => ({}));
                          if (!res.ok || !data?.url) throw new Error(data?.error || 'Upload failed');
                          set('recruitingPacket', { url: data.url });
                          await loadPackets();
                        } catch (err) {
                          // eslint-disable-next-line no-console
                          console.error('PDF upload failed', err);
                        } finally {
                          if (input) input.value = '';
                        }
                      }}
                    />
                  </label>
                </div>

                {/* PDF manager list */}
                <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-800">Available PDFs</p>
                    {loadingPackets ? <span className="text-xs text-slate-500">Loading…</span> : null}
                  </div>
                  {(!packets || packets.length === 0) && !loadingPackets ? (
                    <p className="text-sm text-slate-500 mt-2">
                      No PDFs found in uploads. Use “Upload PDF” to add one.
                    </p>
                  ) : null}
                  {packets && packets.length > 0 ? (
                    <ul className="mt-2 space-y-2">
                      {packets.map((f) => {
                        const selected = form.recruitingPacket?.url === f.url;
                        return (
                          <li key={f.id} className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm text-slate-800 truncate">{f.filename}</div>
                              <div className="text-[11px] text-slate-500">
                                {new Date(f.modifiedAt).toLocaleString()} • {(f.size / 1024).toFixed(1)} KB
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {selected ? (
                                <span className="text-xs rounded-md bg-green-100 px-2 py-1 text-green-700">Selected</span>
                              ) : (
                                <button
                                  type="button"
                                  className="px-2 py-1 rounded-lg text-sm border text-slate-700 hover:bg-slate-100"
                                  onClick={() => set('recruitingPacket', { url: f.url })}
                                  title="Use this PDF"
                                >
                                  Use
                                </button>
                              )}
                              <a
                                className="px-2 py-1 rounded-lg text-sm border text-slate-700 hover:bg-slate-100"
                                href={f.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Open"
                              >
                                Open
                              </a>
                              <button
                                type="button"
                                className="px-2 py-1 rounded-lg text-sm border text-slate-700 hover:bg-slate-100"
                                onClick={() => deletePacket(f.id)}
                                title="Delete"
                              >
                                Delete
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={group}>
                <label className={label}>SEO Title</label>
                <input
                  className={field}
                  value={form.seo?.title ?? ''}
                  onChange={(e) => set('seo', { ...form.seo, title: e.target.value })}
                />
              </div>
              <div className={group}>
                <label className={label}>SEO Description</label>
                <input
                  className={field}
                  value={form.seo?.description ?? ''}
                  onChange={(e) => set('seo', { ...form.seo, description: e.target.value })}
                />
              </div>
              <div className={group}>
                <label className={label}>SEO Image URL</label>
                <input
                  className={field}
                  value={form.seo?.image ?? ''}
                  onChange={(e) => set('seo', { ...form.seo, image: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              {valid ? (
                <span className="text-green-700">Draft validated and saved</span>
              ) : (
                <span className="text-red-700">Some fields are invalid — see details below</span>
              )}
            </div>
          </div>

          {!valid && errors && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-medium text-red-800 mb-2">Validation issues</p>
              <ul className="list-disc pl-5 space-y-1 text-sm text-red-700">
                {errors.map((e, i) => (
                  <li key={i}>
                    <code>{e.path || '(root)'}</code> — {e.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Live Preview (lightweight summary) */}
        <aside className="w-full lg:w-[380px]">
          <div className="card p-5 space-y-3">
            <h3 className="text-lg font-semibold">Live Preview</h3>
            <div className="text-2xl font-bold tracking-wide" style={{ fontFamily: 'var(--font-bebas)' }}>
              {form.name?.first} {form.name?.last}
            </div>
            <div className="text-sm text-slate-600">
              {form.classYear ? <span className="mr-2">Class of {form.classYear}</span> : null}
              {form.positions && form.positions.length > 0 ? (
                <span>• {form.positions.join(', ')}</span>
              ) : null}
            </div>
            <div className="text-sm text-slate-600">
              {[form.location?.city, form.location?.state].filter(Boolean).join(', ')}
            </div>
            <div className="text-sm text-slate-700">
              <div>Email: {form.contact?.email || '—'}</div>
              <div>Website: {form.contact?.website || '—'}</div>
              <div>Twitter: {form.twitter?.handle ? `@${form.twitter.handle}` : '—'}</div>
            </div>
            <div className="text-xs text-slate-500">Fields validate automatically and persist in your browser.</div>
          </div>
        </aside>
      </div>
    </div>
  );
}