'use client';

import React from 'react';
import DashboardPhotosPage from '@/app/dashboard/photos/page';
import DashboardHighlightsPage from '@/app/dashboard/highlights/page';

export default function DashboardMediaPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1
          className="text-2xl font-semibold tracking-wide"
          style={{ fontFamily: 'var(--font-bebas)' }}
        >
          Media
        </h1>
      </div>

      <div className="space-y-10">
        <section className="space-y-4">
          <DashboardPhotosPage />
        </section>
        <section className="space-y-4">
          <DashboardHighlightsPage />
        </section>
      </div>
    </div>
  );
}