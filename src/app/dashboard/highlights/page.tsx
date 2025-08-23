'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { Profile, Highlight } from '@/lib/types';
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

export default function DashboardHighlightsPage() {
  const [form, setForm] = useState<Profile>(() =>
    getDraft() ?? { ...sampleProfile, highlights: sampleProfile.highlights ?? [] },
  );
  const [valid, setValid] = useState(true);
  const [errors, setErrors] = useState<Issue[] | undefined>(undefined);

  useEffect(() => {
    const persisted = getDraft();
    if (persisted) setForm({ ...persisted, highlights: persisted.highlights ?? [] });
  }, []);

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

  const highlights: Highlight[] = form.highlights ?? [];

  function updateRow(index: number, patch: Partial<Highlight>) {
    setForm((prev) => {
      const next = [...(prev.highlights ?? [])];
      next[index] = { ...next[index], ...patch } as Highlight;
      return { ...prev, highlights: next };
    });
  }

  function addRow() {
    setForm((prev) => {
      const next = [...(prev.highlights ?? [])];
      next.push({ title: '', videoUrl: '' });
      return { ...prev, highlights: next };
    });
  }

  function removeRow(index: number) {
    setForm((prev) => {
      const next = [...(prev.highlights ?? [])];
      next.splice(index, 1);
      return { ...prev, highlights: next };
    });
  }

  return (
    <div className="space-y-6">
      <div className={section}>
        <h2 className={sectionTitle}>Highlights</h2>

        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-8">
            <thead>
              <tr className="text-left text-sm text-slate-500">
                <th className="pr-4">Title</th>
                <th className="pr-4">Video URL</th>
                <th className="pr-4">Thumbnail URL</th>
                <th className="pr-4">Date</th>
                <th className="pr-4">Featured</th>
                <th className="pr-4">Notes</th>
                <th className="w-16"></th>
              </tr>
            </thead>
            <tbody>
              {highlights.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-sm text-slate-500 py-2">
                    No highlights yet. Add your first highlight.
                  </td>
                </tr>
              ) : null}

              {highlights.map((row, i) => {
                const base = `highlights.${i}`;
                return (
                  <tr key={i} className="align-top">
                    <td className="pr-4">
                      <div className={group}>
                        <input
                          className={field}
                          value={row.title ?? ''}
                          onChange={(e) => updateRow(i, { title: e.target.value })}
                          placeholder="e.g. Line-drive double to the gap"
                        />
                      </div>
                    </td>
                    <td className="pr-4">
                      <div className={group}>
                        <input
                          className={field}
                          value={row.videoUrl ?? ''}
                          onChange={(e) => updateRow(i, { videoUrl: e.target.value })}
                          placeholder="https://..."
                        />
                        {errorMap.get(`${base}.videoUrl`)?.map((m, k) => (
                          <p key={k} className="text-xs text-red-600">{m}</p>
                        ))}
                      </div>
                    </td>
                    <td className="pr-4">
                      <div className={group}>
                        <input
                          className={field}
                          value={row.thumbnailUrl ?? ''}
                          onChange={(e) => updateRow(i, { thumbnailUrl: e.target.value })}
                          placeholder="Optional thumbnail URL"
                        />
                        {errorMap.get(`${base}.thumbnailUrl`)?.map((m, k) => (
                          <p key={k} className="text-xs text-red-600">{m}</p>
                        ))}
                      </div>
                    </td>
                    <td className="pr-4">
                      <div className={group}>
                        <input
                          className={field}
                          type="date"
                          value={row.date ?? ''}
                          onChange={(e) => updateRow(i, { date: e.target.value })}
                        />
                      </div>
                    </td>
                    <td className="pr-4">
                      <div className="h-10 flex items-center">
                        <input
                          aria-label="Featured"
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-[var(--brand-green)] focus:ring-[var(--accent-cool)]"
                          checked={!!row.isFeatured}
                          onChange={(e) => updateRow(i, { isFeatured: e.target.checked })}
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
                      <button className={btnGhost} onClick={() => removeRow(i)} aria-label={`Remove highlight ${i + 1}`}>
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
          <button className={btnPrimary} onClick={addRow}>Add Highlight</button>
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