'use client';

import React, { useEffect, useState } from 'react';
import { resetDraft } from '@/lib/dashboard/storage';
import { getBlogIndex, importBlogIndex } from '@/lib/dashboard/blogStorage';
import JSZip from 'jszip';

const field =
  'block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-cool)]';
const label = 'text-sm font-medium text-slate-700';
const section = 'card p-5 space-y-4';
const sectionTitle = 'text-base font-semibold text-slate-800';
const btn =
  'inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-[var(--accent-cool)]';
const btnPrimary = `${btn} bg-[var(--brand-green)] text-white hover:bg-[var(--brand-green-dark)]`;
const btnGhost = `${btn} border border-slate-300 hover:bg-slate-50 text-slate-800`;
const btnDanger = `${btn} bg-red-600 text-white hover:bg-red-700`;

export default function DashboardSettingsPage() {
  // Account
  const [me, setMe] = useState<any | null>(null);
  const [accMsg, setAccMsg] = useState<string | null>(null);
  const [accErr, setAccErr] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [socials, setSocials] = useState<{ twitter?: string; instagram?: string; tiktok?: string; youtube?: string; website?: string }>({});
  const [heroFrame, setHeroFrame] = useState<string>('#26A84A');
  const [heroFill, setHeroFill] = useState<string>('#26A84A');
  const [overlayOpacity, setOverlayOpacity] = useState<number>(0.15);
  const [overlayEnabled, setOverlayEnabled] = useState<boolean>(true);

  // Password
  const [curPwd, setCurPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [pwdMsg, setPwdMsg] = useState<string | null>(null);
  const [pwdErr, setPwdErr] = useState<string | null>(null);

  // Reset
  const [resetMsg, setResetMsg] = useState<string | null>(null);

  // Danger Zone: Delete profile/account
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteUser, setDeleteUser] = useState(false);
  const [delMsg, setDelMsg] = useState<string | null>(null);
  const [delErr, setDelErr] = useState<string | null>(null);
  const [delBusy, setDelBusy] = useState(false);

  // Export / Import
  const [exportMsg, setExportMsg] = useState<string | null>(null);
  const [exportErr, setExportErr] = useState<string | null>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [importErr, setImportErr] = useState<string | null>(null);

  const devUserId =
    typeof window !== 'undefined' ? window.localStorage.getItem('pp_user_id') || '' : '';

  useEffect(() => {
    // Load account (cookie session + dev header fallback)
    (async () => {
      try {
        const res = await fetch('/api/auth/me', {
          cache: 'no-store',
          credentials: 'include',
          headers: devUserId ? { 'x-user-id': devUserId } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setMe(data.user);
          setUsername(data.user?.username ?? '');
          setEmail(data.user?.email ?? '');
          setSocials(data.user?.socials ?? {});
          setHeroFrame(data.user?.theme?.heroFrame ?? '#26A84A');
          setHeroFill(data.user?.theme?.heroFill ?? (data.user?.theme?.heroFrame ?? '#26A84A'));
          setOverlayOpacity(
            typeof data.user?.theme?.heroOverlayOpacity === 'number' ? data.user.theme.heroOverlayOpacity : 0.15,
          );
          setOverlayEnabled(data.user?.theme?.heroOverlayEnabled !== false);
        } else {
          // leave UI usable, but show hint
          setAccErr('Unauthorized — please login again.');
        }
      } catch {
        setAccErr('Failed to load account');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Utilities
  function downloadJson(filename: string, data: unknown) {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function resolvePlayerId(): Promise<string> {
    try {
      const res = await fetch('/api/auth/me', {
        credentials: 'include',
        headers: devUserId ? { 'x-user-id': devUserId } : {},
      });
      if (res.ok) {
        const j = await res.json();
        const id = j?.user?.playerId || j?.user?.id || '';
        if (id) return id;
      }
    } catch {}
    return (
      (typeof window !== 'undefined' ? window.localStorage.getItem('pp_user_id') || '' : '') ||
      (process.env.NEXT_PUBLIC_DEFAULT_PLAYER_ID || 'demo')
    );
  }

  async function exportSiteData() {
    setExportErr(null);
    setExportMsg(null);
    try {
      const playerId = await resolvePlayerId();

      // Profile
      const profRes = await fetch('/api/profile', {
        credentials: 'include',
        headers: devUserId ? { 'x-user-id': devUserId } : {},
        cache: 'no-store',
      });
      const prof = await profRes.json().catch(() => ({} as any));

      // Teams
      const teamsRes = await fetch(`/api/players/${encodeURIComponent(playerId)}/teams`, {
        credentials: 'include',
        headers: devUserId ? { 'x-user-id': devUserId } : {},
        cache: 'no-store',
      });
      const teams = await teamsRes.json().catch(() => ({} as any));

      // Photos metadata (not binary)
      const photosRes = await fetch(`/api/photos?playerId=${encodeURIComponent(playerId)}`, {
        credentials: 'include',
        headers: devUserId ? { 'x-user-id': devUserId } : {},
        cache: 'no-store',
      });
      const photos = await photosRes.json().catch(() => []);

      // Blog (from dashboard localStorage)
      const blog = getBlogIndex() ?? { posts: [] };

      const bundle = {
        version: 'pp-site-1',
        exportedAt: new Date().toISOString(),
        playerId,
        profile: prof?.profile ?? null,
        teams: teams ?? null,
        blog,
        photos,
        notes:
          'This export includes metadata and URLs for images/videos. Binary assets under /public/uploads are not embedded.',
      };

      const filename = `player_profile_export_${playerId}_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      downloadJson(filename, bundle);
      setExportMsg('Export ready — JSON downloaded.');
      setTimeout(() => setExportMsg(null), 2000);
    } catch (e: any) {
      setExportErr(e?.message ?? 'Export failed');
    }
  }

  async function importSiteData(file: File) {
    setImportErr(null);
    setImportMsg(null);
    try {
      const text = await file.text();
      const bundle = JSON.parse(text);

      const playerId = await resolvePlayerId();

      // Profile
      if (bundle?.profile) {
        const res = await fetch('/api/profile', {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'content-type': 'application/json',
            ...(devUserId ? { 'x-user-id': devUserId } : {}),
          },
          body: JSON.stringify(bundle.profile),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j?.error || 'Profile import failed');
        }
      }

      // Teams (PUT school/travel core fields)
      if (bundle?.teams) {
        const pick = (t: any) => ({
          teamName: t?.teamName ?? '',
          coachName: t?.coachName ?? '',
          coachEmail: t?.coachEmail ?? '',
          isPublic: t?.isPublic !== false,
        });
        const body = {
          school: pick(bundle.teams.school || {}),
          travel: pick(bundle.teams.travel || {}),
        };
        const res = await fetch(`/api/players/${encodeURIComponent(playerId)}/teams`, {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'content-type': 'application/json',
            ...(devUserId ? { 'x-user-id': devUserId } : {}),
          },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j?.error || 'Teams import failed');
        }

        // (Optional) attempt to restore socials by posting links
        for (const team of ['school', 'travel'] as const) {
          const socials = Array.isArray(bundle?.teams?.[team]?.socials)
            ? bundle.teams[team].socials
            : [];
          for (const s of socials) {
            try {
              await fetch(`/api/players/${encodeURIComponent(playerId)}/teams/social`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                  'content-type': 'application/json',
                  ...(devUserId ? { 'x-user-id': devUserId } : {}),
                },
                body: JSON.stringify({
                  team,
                  platform: s.platform,
                  url: s.url,
                  handle: s.handle,
                }),
              });
            } catch {
              // ignore individual social errors
            }
          }
        }
      }

      // Blog (localStorage draft)
      if (bundle?.blog) {
        const j = JSON.stringify(bundle.blog);
        const result = importBlogIndex(j);
        if (!result.valid) {
          throw new Error('Blog import failed (invalid format)');
        }
      }

      setImportMsg('Import completed (assets not included).');
      setTimeout(() => setImportMsg(null), 2500);
    } catch (e: any) {
      setImportErr(e?.message ?? 'Import failed');
    }
  }

  // Collect local asset URLs (under /uploads) from APIs and local blog/profile
  async function collectLocalAssetPaths(playerId: string): Promise<string[]> {
    const paths = new Set<string>();

    // Photos metadata
    try {
      const res = await fetch(`/api/photos?playerId=${encodeURIComponent(playerId)}`, {
        credentials: 'include',
        headers: devUserId ? { 'x-user-id': devUserId } : {},
        cache: 'no-store',
      });
      if (res.ok) {
        const list: any[] = await res.json();
        for (const p of list) {
          if (typeof p?.url === 'string' && p.url.startsWith('/uploads/')) paths.add(p.url);
        }
      }
    } catch {}

    // Recruiting packets (PDFs)
    try {
      const res = await fetch(`/api/players/${encodeURIComponent(playerId)}/recruiting/packets`, {
        credentials: 'include',
        headers: devUserId ? { 'x-user-id': devUserId } : {},
        cache: 'no-store',
      });
      if (res.ok) {
        const j: any = await res.json();
        for (const f of j?.files || []) {
          if (typeof f?.url === 'string' && f.url.startsWith('/uploads/')) paths.add(f.url);
        }
      }
    } catch {}

    // Profile: highlights videoUrl and hero images if local
    try {
      const res = await fetch('/api/profile', {
        credentials: 'include',
        headers: devUserId ? { 'x-user-id': devUserId } : {},
        cache: 'no-store',
      });
      if (res.ok) {
        const j: any = await res.json();
        const prof = j?.profile || {};
        for (const h of prof?.highlights || []) {
          const v = String(h?.videoUrl || '');
          if (v.startsWith('/uploads/')) paths.add(v);
          const t = String(h?.thumbnailUrl || '');
          if (t.startsWith('/uploads/')) paths.add(t);
        }
        const hero = String(prof?.photos?.active?.heroImage || '');
        if (hero.startsWith('/uploads/')) paths.add(hero);
        const featured = String(prof?.photos?.active?.featuredAction || '');
        if (featured.startsWith('/uploads/')) paths.add(featured);
      }
    } catch {}

    // Blog local drafts: heroImage and images referenced in markdown
    try {
      const blog = getBlogIndex() ?? { posts: [] };
      for (const p of blog.posts || []) {
        const hi = String(p?.heroImage || '');
        if (hi.startsWith('/uploads/')) paths.add(hi);
        const content = String(p?.content || '');
        const matches = content.match(/\/uploads\/[^\s\)\]"']+/g) || [];
        matches.forEach((m) => paths.add(m));
      }
    } catch {}

    return Array.from(paths);
  }

  async function exportAssetsZip() {
    setExportErr(null);
    setExportMsg(null);
    try {
      const playerId = await resolvePlayerId();
      const paths = await collectLocalAssetPaths(playerId);

      if (paths.length === 0) {
        setExportMsg('No local assets found to export.');
        setTimeout(() => setExportMsg(null), 2000);
        return;
      }

      const zip = new JSZip();
      const failures: string[] = [];

      for (const p of paths) {
        const rel = p.replace(/^\//, ''); // e.g., uploads/{playerId}/file.ext
        const url = p.startsWith('http') ? p : `${window.location.origin}${p}`;
        try {
          const res = await fetch(url, { credentials: 'include' });
          if (!res.ok) throw new Error(`${res.status}`);
          const ab = await res.arrayBuffer();
          zip.file(rel, ab);
        } catch {
          failures.push(p);
        }
      }

      // Optional metadata file
      zip.file(
        'metadata.json',
        JSON.stringify(
          { note: 'Asset bundle for /uploads path', files: paths, failed: failures, playerHint: await resolvePlayerId() },
          null,
          2,
        ),
      );

      const blob = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `player_assets_${await resolvePlayerId()}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setExportMsg(failures.length ? `Assets ZIP ready (some files failed: ${failures.length})` : 'Assets ZIP downloaded.');
      setTimeout(() => setExportMsg(null), 2500);
    } catch (e: any) {
      setExportErr(e?.message ?? 'Export assets failed');
    }
  }

  async function exportAssetsZipServer() {
    setExportErr(null);
    setExportMsg(null);
    try {
      const res = await fetch('/api/assets/export', {
        method: 'GET',
        credentials: 'include',
        headers: devUserId ? { 'x-user-id': devUserId } : {},
      });
      if (!res.ok) {
        const j: any = await res.json().catch(() => ({}));
        throw new Error(j?.error || 'Export assets failed');
      }
      const blob = await res.blob();
      if (blob.size === 0) {
        setExportErr('No assets found to export');
        return;
      }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `assets_${await resolvePlayerId()}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setExportMsg('Assets ZIP downloaded.');
      setTimeout(() => setExportMsg(null), 2000);
    } catch (e: any) {
      setExportErr(e?.message ?? 'Export assets failed');
    }
  }

  async function importAssetsZip(file: File) {
    setImportErr(null);
    setImportMsg(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/assets/import', {
        method: 'POST',
        body: fd,
        credentials: 'include',
        headers: devUserId ? { 'x-user-id': devUserId } : {},
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || 'Import assets failed');
      setImportMsg(`Imported ${j?.files ?? 0} files into uploads/${j?.playerId}`);
      setTimeout(() => setImportMsg(null), 2500);
    } catch (e: any) {
      setImportErr(e?.message ?? 'Import assets failed');
    }
  }

  async function deleteEntireProfile() {
    setDelErr(null);
    setDelMsg(null);
    setDelBusy(true);
    try {
      const res = await fetch('/api/profile/delete', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'content-type': 'application/json',
          ...(devUserId ? { 'x-user-id': devUserId } : {}),
        },
        body: JSON.stringify({
          confirm: deleteConfirm,
          deleteUserAccount: deleteUser,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || 'Delete failed');

      setDelMsg('Profile deleted. Signing out...');
      // Attempt logout and redirect
      try {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      } catch {}
      setTimeout(() => {
        window.location.href = '/login';
      }, 1200);
    } catch (e: any) {
      setDelErr(e?.message ?? 'Delete failed');
    } finally {
      setDelBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Account */}
      <section className={section}>
        <h2 className={sectionTitle}>Account</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={label}>Hero Frame Color</label>
            <input
              className={field}
              type="color"
              value={heroFrame}
              onChange={(e) => setHeroFrame(e.target.value)}
              title="Select the outline/frame color used around the hero area"
            />
          </div>
          <div>
            <label className={label}>Hero Fill Color</label>
            <input
              className={field}
              type="color"
              value={heroFill}
              onChange={(e) => setHeroFill(e.target.value)}
              title="Select the hero card fill color"
            />
          </div>
          <div>
            <label className={label}>Hero Overlay Opacity</label>
            <input
              className={field}
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={overlayOpacity}
              onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
            />
            <div className="text-xs text-slate-600 mt-1">Current: {overlayOpacity.toFixed(2)}</div>
          </div>
          <div className="flex items-end">
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-[var(--brand-green)] focus:ring-[var(--accent-cool)]"
                checked={!overlayEnabled}
                onChange={(e) => setOverlayEnabled(!e.target.checked)}
              />
              Disable gradient overlay
            </label>
          </div>
          <div>
            <label className={label}>Username</label>
            <input className={field} value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div>
            <label className={label}>Email</label>
            <input className={field} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className={label}>Twitter</label>
            <input
              className={field}
              value={socials.twitter ?? ''}
              onChange={(e) => setSocials({ ...socials, twitter: e.target.value })}
            />
          </div>
          <div>
            <label className={label}>Instagram</label>
            <input
              className={field}
              value={socials.instagram ?? ''}
              onChange={(e) => setSocials({ ...socials, instagram: e.target.value })}
            />
          </div>
          <div>
            <label className={label}>YouTube</label>
            <input
              className={field}
              value={socials.youtube ?? ''}
              onChange={(e) => setSocials({ ...socials, youtube: e.target.value })}
            />
          </div>
          <div>
            <label className={label}>Website</label>
            <input
              className={field}
              value={socials.website ?? ''}
              onChange={(e) => setSocials({ ...socials, website: e.target.value })}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className={btnPrimary}
            onClick={async () => {
              setAccErr(null);
              setAccMsg(null);
              try {
                const res = await fetch('/api/auth/me', {
                  method: 'PATCH',
                  credentials: 'include',
                  headers: {
                    'content-type': 'application/json',
                    ...(devUserId ? { 'x-user-id': devUserId } : {}),
                  },
                  body: JSON.stringify({
                    username,
                    email,
                    socials,
                    theme: {
                      heroFrame,
                      heroFill,
                      heroOverlayOpacity: overlayOpacity,
                      heroOverlayEnabled: overlayEnabled,
                    },
                  }),
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(data?.error || 'Update failed');

                // Show success
                setAccMsg('Account updated');

                // Bust any incidental caches by prefetching the home page uncached (for this player)
                try {
                  const ts = Date.now();
                  const id = devUserId;
                  const url = id ? `/?playerId=${encodeURIComponent(id)}&ts=${ts}` : `/?ts=${ts}`;
                  await fetch(url, { cache: 'no-store', credentials: 'include' });
                } catch {}

                // Auto-clear success message
                setTimeout(() => setAccMsg(null), 1500);
              } catch (e: any) {
                setAccErr(e?.message ?? 'Update failed');
              }
            }}
          >
            Save Account
          </button>
          <a className={btnGhost} href="/" target="_blank" rel="noreferrer" aria-label="Open public site in a new tab">
            Open site
          </a>
          {accMsg ? <span className="text-sm text-green-700">{accMsg}</span> : null}
          {accErr ? <span className="text-sm text-red-600">{accErr}</span> : null}
        </div>
      </section>

      {/* Change Password */}
      <section className={section}>
        <h2 className={sectionTitle}>Change Password</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={label}>Current Password</label>
            <input className={field} type="password" value={curPwd} onChange={(e) => setCurPwd(e.target.value)} />
          </div>
          <div>
            <label className={label}>New Password</label>
            <input className={field} type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className={btnPrimary}
            onClick={async () => {
              setPwdErr(null);
              setPwdMsg(null);
              try {
                const res = await fetch('/api/auth/password', {
                  method: 'POST',
                  credentials: 'include',
                  headers: {
                    'content-type': 'application/json',
                    ...(devUserId ? { 'x-user-id': devUserId } : {}),
                  },
                  body: JSON.stringify({ currentPassword: curPwd, newPassword: newPwd }),
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(data?.error || 'Change failed');
                setPwdMsg('Password changed');
                setCurPwd('');
                setNewPwd('');
                setTimeout(() => setPwdMsg(null), 1500);
              } catch (e: any) {
                setPwdErr(e?.message ?? 'Change failed');
              }
            }}
          >
            Update Password
          </button>
          {pwdMsg ? <span className="text-sm text-green-700">{pwdMsg}</span> : null}
          {pwdErr ? <span className="text-sm text-red-600">{pwdErr}</span> : null}
        </div>
      </section>

      {/* Export / Import */}
      <section className={section}>
        <h2 className={sectionTitle}>Export / Import Site Data</h2>
        <p className="text-sm text-slate-600">
          Export includes profile, teams, blog drafts, and photo metadata (URLs). Binary assets under
          <code className="mx-1">/public/uploads</code> are not embedded in this JSON export.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button className={btnGhost} onClick={exportSiteData} aria-label="Export site JSON">
            Export JSON
          </button>
          <label className={btnGhost} title="Import a previously exported JSON file">
            Import JSON
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.currentTarget.files?.[0];
                if (f) importSiteData(f);
                e.currentTarget.value = '';
              }}
            />
          </label>

          <button className={btnGhost} onClick={exportAssetsZip} aria-label="Export assets ZIP">
            Export Assets ZIP
          </button>
          <button className={btnGhost} onClick={exportAssetsZipServer} aria-label="Export assets ZIP (server)">
            Export Assets ZIP (server)
          </button>
          <label className={btnGhost} title="Import a ZIP of assets into /uploads/{playerId}">
            Import Assets ZIP
            <input
              type="file"
              accept=".zip,application/zip"
              className="hidden"
              onChange={(e) => {
                const f = e.currentTarget.files?.[0];
                if (f) importAssetsZip(f);
                e.currentTarget.value = '';
              }}
            />
          </label>

          {exportMsg ? <span className="text-sm text-green-700">{exportMsg}</span> : null}
          {exportErr ? <span className="text-sm text-red-600">{exportErr}</span> : null}
          {importMsg ? <span className="text-sm text-green-700">{importMsg}</span> : null}
          {importErr ? <span className="text-sm text-red-600">{importErr}</span> : null}
        </div>
        <p className="text-xs text-slate-500">
          Tip: JSON export/import moves your profile, teams, and blog drafts. Assets ZIP moves files under /uploads.
          After importing, refresh your public page to see updates.
        </p>
      </section>

      {/* Danger Zone */}
      <section className={section}>
        <h2 className={sectionTitle}>Danger Zone</h2>
        <p className="text-sm text-slate-600">
          Reset will clear profile draft data stored in this browser (does not affect server data).
        </p>
        <button
          className={btnDanger}
          onClick={() => {
            const ok = window.confirm('This will clear your local profile draft from this browser. Continue?');
            if (!ok) return;
            resetDraft();
            setResetMsg('Local draft cleared.');
            setTimeout(() => setResetMsg(null), 1500);
          }}
          aria-label="Reset local draft"
        >
          Reset Local Draft
        </button>
        {resetMsg && (
          <div className="text-sm text-slate-600" role="status" aria-live="polite">
            {resetMsg}
          </div>
        )}

        <hr className="my-4" />

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-red-700">Delete Profile and All Data</h3>
          <p className="text-sm text-slate-600">
            This action permanently deletes your uploads, photos metadata, profile, and teams. It cannot be undone.
          </p>

          <label className={label} htmlFor="delete-confirm">Type "delete my profile" to confirm</label>
          <input
            id="delete-confirm"
            className={field}
            placeholder="delete my profile"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            aria-describedby="delete-help"
          />
          <div id="delete-help" className="text-xs text-slate-500">
            Exact phrase required. You will be signed out after deletion if you choose to delete your account.
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-[var(--brand-green)] focus:ring-[var(--accent-cool)]"
              checked={deleteUser}
              onChange={(e) => setDeleteUser(e.target.checked)}
            />
            Also delete my user account
          </label>

          <div className="flex items-center gap-2">
            <button
              className={btnDanger}
              disabled={
                delBusy || deleteConfirm.trim().toLowerCase() !== 'delete my profile'
              }
              onClick={() => {
                const ok = window.confirm('This will permanently delete your profile data. Continue?');
                if (!ok) return;
                deleteEntireProfile();
              }}
              aria-label="Delete profile and data"
            >
              {delBusy ? 'Deleting…' : 'Delete Profile and Data'}
            </button>
            {delMsg ? <span className="text-sm text-green-700">{delMsg}</span> : null}
            {delErr ? <span className="text-sm text-red-600">{delErr}</span> : null}
          </div>
        </div>
      </section>
    </div>
  );
}