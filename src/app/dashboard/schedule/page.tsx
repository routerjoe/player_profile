'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { Profile, ScheduleEntry } from '@/lib/types';
import { getDraft, saveDraft } from '@/lib/dashboard/storage';
import { profile as sampleProfile } from '@/lib/sample/profile';

type Issue = { path: string; message: string };

const field = 'block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-cool)]';
const label = 'text-sm font-medium text-slate-700';
const group = 'space-y-2';
const section = 'card p-5 space-y-4';
const sectionTitle = 'text-base font-semibold text-slate-800';
const btn = 'inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-[var(--accent-cool)]';
const btnPrimary = `${btn} bg-[var(--brand-green)] text-white hover:bg-[var(--brand-green-dark)]`;
const btnGhost = `${btn} border border-slate-300 hover:bg-slate-50 text-slate-800`;

export default function DashboardSchedulePage() {
  const [form, setForm] = useState<Profile>(() =>
    getDraft() ?? { ...sampleProfile, schedule: sampleProfile.schedule ?? [] },
  );
  const [valid, setValid] = useState(true);
  const [errors, setErrors] = useState<Issue[] | undefined>(undefined);

  useEffect(() => {
    const persisted = getDraft();
    if (persisted) setForm({ ...persisted, schedule: persisted.schedule ?? [] });
  }, []);

  // Persist and validate on change
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

  const rows: ScheduleEntry[] = form.schedule ?? [];

  function updateRow(index: number, patch: Partial<ScheduleEntry>) {
    setForm((prev) => {
      const next = [...(prev.schedule ?? [])];
      next[index] = { ...next[index], ...patch } as ScheduleEntry;
      return { ...prev, schedule: next };
    });
  }

  function addRow() {
    setForm((prev) => {
      const next = [...(prev.schedule ?? [])];
      next.push({ date: '', opponent: '', location: '', result: '', link: '' });
      return { ...prev, schedule: next };
    });
  }

  function removeRow(index: number) {
    setForm((prev) => {
      const next = [...(prev.schedule ?? [])];
      next.splice(index, 1);
      return { ...prev, schedule: next };
    });
  }

  return (
    <div className="space-y-6">
      <div className={section}>
        <h2 className={sectionTitle}>Schedule</h2>

        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-8">
            <thead>
              <tr className="text-left text-sm text-slate-500">
                <th className="pr-4">Date</th>
                <th className="pr-4">Opponent</th>
                <th className="pr-4">Location</th>
                <th className="pr-4">Result</th>
                <th className="pr-4">Link</th>
                <th className="w-16"></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-sm text-slate-500 py-2">
                    No games yet. Add your first entry.
                  </td>
                </tr>
              ) : null}

              {rows.map((row, i) => {
                const base = `schedule.${i}`;
                return (
                  <tr key={i} className="align-top">
                    <td className="pr-4">
                      <div className={group}>
                        <input
                          className={field}
                          type="date"
                          value={row.date ?? ''}
                          onChange={(e) => updateRow(i, { date: e.target.value })}
                        />
                        {errorMap.get(`${base}.date`)?.map((m, k) => (
                          <p key={k} className="text-xs text-red-600">{m}</p>
                        ))}
                      </div>
                    </td>
                    <td className="pr-4">
                      <div className={group}>
                        <input
                          className={field}
                          value={row.opponent ?? ''}
                          onChange={(e) => updateRow(i, { opponent: e.target.value })}
                          placeholder="e.g. Central HS"
                        />
                        {errorMap.get(`${base}.opponent`)?.map((m, k) => (
                          <p key={k} className="text-xs text-red-600">{m}</p>
                        ))}
                      </div>
                    </td>
                    <td className="pr-4">
                      <div className={group}>
                        <input
                          className={field}
                          value={row.location ?? ''}
                          onChange={(e) => updateRow(i, { location: e.target.value })}
                          placeholder="Home / Away / Field name"
                        />
                      </div>
                    </td>
                    <td className="pr-4">
                      <div className={group}>
                        <input
                          className={field}
                          value={row.result ?? ''}
                          onChange={(e) => updateRow(i, { result: e.target.value })}
                          placeholder="e.g. W 6–2"
                        />
                      </div>
                    </td>
                    <td className="pr-4">
                      <div className={group}>
                        <input
                          className={field}
                          value={row.link ?? ''}
                          onChange={(e) => updateRow(i, { link: e.target.value })}
                          placeholder="Optional link (e.g. game recap)"
                        />
                      </div>
                    </td>
                    <td className="pt-2">
                      <button
                        className={btnGhost}
                        onClick={() => removeRow(i)}
                        aria-label={`Remove schedule row ${i + 1}`}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-3">
          <button className={btnPrimary} onClick={addRow}>Add Game</button>
          <span className="text-sm text-slate-500">Validation and persistence run automatically.</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm">
          {valid ? (
            <span className="text-green-700">Draft validated and saved</span>
          ) : (
            <span className="text-red-700">Some fields are invalid — see inline messages</span>
          )}
        </div>
      </div>
    </div>
  );
}