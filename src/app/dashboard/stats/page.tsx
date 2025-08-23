'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Profile, Stat } from '@/lib/types';
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

export default function DashboardStatsPage() {
  const [form, setForm] = useState<Profile>(() => getDraft() ?? { ...sampleProfile, stats: sampleProfile.stats ?? [] });
  const [valid, setValid] = useState(true);
  const [errors, setErrors] = useState<Issue[] | undefined>(undefined);

  useEffect(() => {
    const persisted = getDraft();
    if (persisted) setForm({ ...persisted, stats: persisted.stats ?? [] });
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

  const stats: Stat[] = form.stats ?? [];

  function updateRow(index: number, patch: Partial<Stat>) {
    setForm((prev) => {
      const next = [...(prev.stats ?? [])];
      next[index] = { ...next[index], ...patch } as Stat;
      return { ...prev, stats: next };
    });
  }

  function addRow() {
    setForm((prev) => {
      const next = [...(prev.stats ?? [])];
      next.push({ label: '', value: '' });
      return { ...prev, stats: next };
    });
  }

  function removeRow(index: number) {
    setForm((prev) => {
      const next = [...(prev.stats ?? [])];
      next.splice(index, 1);
      return { ...prev, stats: next };
    });
  }

  return (
    <div className="space-y-6">
      <div className={section}>
        <h2 className={sectionTitle}>Stats</h2>

        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-8">
            <thead>
              <tr className="text-left text-sm text-slate-500">
                <th className="pr-4">Label</th>
                <th className="pr-4">Value</th>
                <th className="pr-4">Season</th>
                <th className="pr-4">Notes</th>
                <th className="w-16"></th>
              </tr>
            </thead>
            <tbody>
              {stats.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-sm text-slate-500 py-2">No stats yet. Add your first stat.</td>
                </tr>
              ) : null}

              {stats.map((row, i) => {
                const base = `stats.${i}`;
                return (
                  <tr key={i} className="align-top">
                    <td className="pr-4">
                      <div className={group}>
                        <input
                          className={field}
                          value={row.label ?? ''}
                          onChange={(e) => updateRow(i, { label: e.target.value })}
                          placeholder="e.g. Exit Velo"
                        />
                        {errorMap.get(`${base}.label`)?.map((m, k) => (
                          <p key={k} className="text-xs text-red-600">{m}</p>
                        ))}
                      </div>
                    </td>
                    <td className="pr-4">
                      <div className={group}>
                        <input
                          className={field}
                          value={row.value ?? ''}
                          onChange={(e) => updateRow(i, { value: e.target.value })}
                          placeholder="e.g. 68 mph"
                        />
                        {errorMap.get(`${base}.value`)?.map((m, k) => (
                          <p key={k} className="text-xs text-red-600">{m}</p>
                        ))}
                      </div>
                    </td>
                    <td className="pr-4">
                      <div className={group}>
                        <input
                          className={field}
                          value={row.season ?? ''}
                          onChange={(e) => updateRow(i, { season: e.target.value })}
                          placeholder="e.g. 2024"
                        />
                      </div>
                    </td>
                    <td className="pr-4">
                      <div className={group}>
                        <input
                          className={field}
                          value={row.notes ?? ''}
                          onChange={(e) => updateRow(i, { notes: e.target.value })}
                          placeholder="Optional notes"
                        />
                      </div>
                    </td>
                    <td className="pt-2">
                      <button className={btnGhost} onClick={() => removeRow(i)} aria-label={`Remove stat ${i + 1}`}>
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
          <button className={btnPrimary} onClick={addRow}>Add Stat</button>
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