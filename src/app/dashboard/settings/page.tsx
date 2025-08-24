'use client';

import React, { useEffect, useState } from 'react';
import { resetDraft } from '@/lib/dashboard/storage';

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
      </section>
    </div>
  );
}