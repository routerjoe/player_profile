'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useState } from 'react';
import { getDraft } from '@/lib/dashboard/storage';
import HelpPanel from '@/components/dashboard/HelpPanel';

const tabs = [
  { href: '/dashboard/profile', label: 'Profile' },
  { href: '/dashboard/athletics', label: 'Athletics' }, // Stats + Performance + Teams + Schedule
  { href: '/dashboard/media', label: 'Media' },         // Photos + Highlights
  { href: '/dashboard/blog', label: 'Blog' },
  { href: '/dashboard/settings', label: 'Settings' },
];

function TabLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname?.startsWith(href);
  return (
    <Link
      href={href}
      className={[
        'px-3 py-2 rounded-lg text-sm font-medium transition',
        active
          ? 'bg-[var(--brand-green)] text-white'
          : 'text-slate-700 hover:bg-slate-100',
      ].join(' ')}
    >
      {label}
    </Link>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [pubMsg, setPubMsg] = useState<string | null>(null);
  const [pubErr, setPubErr] = useState<string | null>(null);

  async function signOut() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    window.location.href = '/login';
  }

  async function publish() {
    setPubMsg(null);
    setPubErr(null);
    try {
      const devUserId = typeof window !== 'undefined' ? window.localStorage.getItem('pp_user_id') || '' : '';
      const draft = getDraft();
      if (!draft) {
        setPubErr('No valid draft to publish. Fix validation errors.');
        return;
      }
      const res = await fetch('/api/profile', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'content-type': 'application/json',
          ...(devUserId ? { 'x-user-id': devUserId } : {}),
        },
        body: JSON.stringify(draft),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Publish failed');

      setPubMsg('Published');
      setTimeout(() => setPubMsg(null), 1500);

      // Optionally nudge public page
      try {
        const id = devUserId;
        const ts = Date.now();
        const url = id ? `/?playerId=${encodeURIComponent(id)}&ts=${ts}` : `/?ts=${ts}`;
        await fetch(url, { cache: 'no-store', credentials: 'include' });
      } catch {}
    } catch (e: any) {
      setPubErr(e?.message ?? 'Publish failed');
    }
  }

  return (
    <div className="min-h-screen">
      <header className="border-b bg-white">
        <div className="container max-w-7xl py-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-wide" style={{ fontFamily: 'var(--font-bebas)' }}>
            Dashboard
          </h1>
          <div className="flex items-center gap-3">
            <nav className="flex flex-wrap gap-2">
              {tabs.map((t) => (
                <TabLink key={t.href} href={t.href} label={t.label} />
              ))}
            </nav>
            <button
              onClick={publish}
              className="px-3 py-2 rounded-lg text-sm font-medium border border-slate-300 text-slate-700 hover:bg-slate-100"
              aria-label="Publish profile to site"
            >
              Publish
            </button>
            <button
              onClick={() => {
                try {
                  const id = typeof window !== 'undefined' ? window.localStorage.getItem('pp_user_id') || '' : '';
                  const ts = Date.now();
                  const href = id ? `/?playerId=${encodeURIComponent(id)}&ts=${ts}` : `/?ts=${ts}`;
                  window.open(href, '_blank', 'noopener,noreferrer');
                } catch {}
              }}
              className="px-3 py-2 rounded-lg text-sm font-medium border border-slate-300 text-slate-700 hover:bg-slate-100"
              aria-label="View site"
            >
              View site
            </button>
            <button
              onClick={signOut}
              className="px-3 py-2 rounded-lg text-sm font-medium border border-slate-300 text-slate-700 hover:bg-slate-100"
              aria-label="Sign out"
            >
              Sign out
            </button>
            {pubMsg ? <span className="text-sm text-green-700">{pubMsg}</span> : null}
            {pubErr ? <span className="text-sm text-red-600">{pubErr}</span> : null}
          </div>
        </div>
      </header>

      <main className="container max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <HelpPanel />
        {children}
      </main>
    </div>
  );
}