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
  const [uploading, setUploading] = useState<number | null>(null);
  const [uploadPct, setUploadPct] = useState<Record<number, number>>({});

  async function uploadVideo(index: number, file: File) {
    setUploading(index);
    setUploadPct((p) => ({ ...p, [index]: 0 }));
    const fd = new FormData();
    fd.append('file', file);
    fd.append('alt', highlights[index]?.title || `highlight-${index + 1}`);

    await new Promise<void>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/media/upload', true);
      xhr.withCredentials = true;
      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable) {
          const pct = Math.round((evt.loaded / evt.total) * 100);
          setUploadPct((p) => ({ ...p, [index]: pct }));
        }
      };
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          setUploading(null);
          try {
            const data = JSON.parse(xhr.responseText || '{}');
            if (xhr.status >= 200 && xhr.status < 300 && data?.url) {
              updateRow(index, { videoUrl: data.url });
            } else {
              // eslint-disable-next-line no-console
              console.error('Upload failed', data?.error || xhr.statusText);
            }
          } catch (err) {
            // eslint-disable-next-line no-console
            console.error('Upload failed', err);
          }
          resolve();
        }
      };
      xhr.send(fd);
    });
  }

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
                        <div className="flex gap-2">
                          <input
                            className={field + ' flex-1'}
                            value={row.videoUrl ?? ''}
                            onChange={(e) => updateRow(i, { videoUrl: e.target.value })}
                            placeholder="https://..."
                          />
                          <label className="px-3 py-2 rounded-lg text-sm font-medium border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer">
                            {uploading === i ? 'Uploading...' : 'Upload'}
                            <input
                              type="file"
                              accept="video/*"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) uploadVideo(i, f);
                                e.currentTarget.value = '';
                              }}
                            />
                          </label>
                        </div>
                        <div className="mt-2">
                          {uploading === i ? (
                            (uploadPct[i] ?? 0) > 0 && (uploadPct[i] ?? 0) < 100 ? (
                              <div>
                                <div className="h-2 bg-slate-200 rounded">
                                  <div
                                    className="h-2 bg-[var(--brand-green)] rounded"
                                    style={{ width: `${uploadPct[i] ?? 0}%` }}
                                  />
                                </div>
                                <div className="text-[10px] text-slate-500 mt-1">{uploadPct[i] ?? 0}%</div>
                              </div>
                            ) : (
                              <div className="h-2 bg-slate-200 rounded overflow-hidden">
                                <div className="h-2 bg-[var(--brand-green)] animate-pulse w-1/3" />
                              </div>
                            )
                          ) : null}
                        </div>
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