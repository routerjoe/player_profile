'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

const tabs = [
  { href: '/dashboard/profile', label: 'Profile' },
  { href: '/dashboard/stats', label: 'Stats' },
  { href: '/dashboard/highlights', label: 'Highlights' },
  { href: '/dashboard/schedule', label: 'Schedule' },
  { href: '/dashboard/performance', label: 'Performance' },
  { href: '/dashboard/photos', label: 'Photos' },
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
  return (
    <div className="min-h-screen">
      <header className="border-b bg-white">
        <div className="container max-w-7xl py-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-wide" style={{ fontFamily: 'var(--font-bebas)' }}>
            Dashboard
          </h1>
          <nav className="flex flex-wrap gap-2">
            {tabs.map((t) => (
              <TabLink key={t.href} href={t.href} label={t.label} />
            ))}
          </nav>
        </div>
      </header>

      <main className="container max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}