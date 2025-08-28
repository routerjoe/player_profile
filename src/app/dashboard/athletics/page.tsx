'use client';

import React from 'react';
import DashboardStatsPage from '@/app/dashboard/stats/page';
import DashboardPerformancePage from '@/app/dashboard/performance/page';
import TeamsDashboardPage from '@/app/dashboard/teams/page';
import DashboardSchedulePage from '@/app/dashboard/schedule/page';

export default function DashboardAthleticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-wide" style={{ fontFamily: 'var(--font-bebas)' }}>
          Athletics
        </h1>
      </div>

      <div className="space-y-10">
        <section className="space-y-4">
          <DashboardStatsPage />
        </section>
        <section className="space-y-4">
          <DashboardPerformancePage />
        </section>
        <section className="space-y-4">
          <TeamsDashboardPage />
        </section>
        <section className="space-y-4">
          <DashboardSchedulePage />
        </section>
      </div>
    </div>
  );
}