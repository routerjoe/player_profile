'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { Profile, GalleryImage } from '@/lib/types';
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

export default function DashboardPhotosPage() {
  const [form, setForm] = useState<Profile>(() => {
    const d = getDraft() ?? sampleProfile;
    return {
      ...d,
      photos: {
        active: { heroImage: d.photos?.active?.heroImage ?? '', featuredAction: d.photos?.active?.featuredAction ?? '' },
        gallery: d.photos?.gallery ?? [],
      },
    };
  });
  const [valid, setValid] = useState(true);
  const [errors, setErrors] = useState<Issue[] | undefined>(undefined);

  useEffect(() => {
    const persisted = getDraft();
    if (persisted) {
      setForm({
        ...persisted,
        photos: {
          active: {
            heroImage: persisted.photos?.active?.heroImage ?? '',
            featuredAction: persisted.photos?.active?.featuredAction ?? '',
          },
          gallery: persisted.photos?.gallery ?? [],
        },
      });
    }
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

  const gallery: GalleryImage[] = form.photos?.gallery ?? [];

  function setActive(patch: Partial<NonNullable<Profile['photos']>['active']>) {
    setForm((prev) => ({
      ...prev,
      photos: {
        active: { ...(prev.photos?.active ?? {}), ...patch },
        gallery: prev.photos?.gallery ?? [],
      },
    }));
  }

  function updateRow(index: number, patch: Partial<GalleryImage>) {
    setForm((prev) => {
      const next = [...(prev.photos?.gallery ?? [])];
      next[index] = { ...next[index], ...patch } as GalleryImage;
      return { ...prev, photos: { active: prev.photos?.active, gallery: next } };
    });
  }

  function addRow() {
    setForm((prev) => {
      const next = [...(prev.photos?.gallery ?? [])];
      next.push({ url: '', alt: '' });
      return { ...prev, photos: { active: prev.photos?.active, gallery: next } };
    });
  }

  function removeRow(index: number) {
    setForm((prev) => {
      const next = [...(prev.photos?.gallery ?? [])];
      next.splice(index, 1);
      return { ...prev, photos: { active: prev.photos?.active, gallery: next } };
    });
  }

  return (
    <div className="space-y-6">
      <div className={section}>
        <h2 className={sectionTitle}>Active Photos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={group}>
            <label className={label}>Hero Image URL</label>
            <input
              className={field}
              value={form.photos?.active?.heroImage ?? ''}
              onChange={(e) => setActive({ heroImage: e.target.value })}
              placeholder="/path-or-https-url"
            />
            {errorMap.get('photos.active.heroImage')?.map((m, i) => (
              <p key={i} className="text-xs text-red-600">{m}</p>
            ))}
          </div>
          <div className={group}>
            <label className={label}>Featured Action URL</label>
            <input
              className={field}
              value={form.photos?.active?.featuredAction ?? ''}
              onChange={(e) => setActive({ featuredAction: e.target.value })}
              placeholder="/path-or-https-url"
            />
            {errorMap.get('photos.active.featuredAction')?.map((m, i) => (
              <p key={i} className="text-xs text-red-600">{m}</p>
            ))}
          </div>
        </div>
      </div>

      <div className={section}>
        <h2 className={sectionTitle}>Gallery</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-8">
            <thead>
              <tr className="text-left text-sm text-slate-500">
                <th className="pr-4">Image URL</th>
                <th className="pr-4">Alt Text</th>
                <th className="w-16"></th>
              </tr>
            </thead>
            <tbody>
              {gallery.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-sm text-slate-500 py-2">No gallery images. Add your first image.</td>
                </tr>
              ) : null}

              {gallery.map((row, i) => {
                const base = `photos.gallery.${i}`;
                return (
                  <tr key={i} className="align-top">
                    <td className="pr-4">
                      <div className={group}>
                        <input
                          className={field}
                          value={row.url ?? ''}
                          onChange={(e) => updateRow(i, { url: e.target.value })}
                          placeholder="https://..."
                        />
                        {errorMap.get(`${base}.url`)?.map((m, k) => (
                          <p key={k} className="text-xs text-red-600">{m}</p>
                        ))}
                      </div>
                    </td>
                    <td className="pr-4">
                      <div className={group}>
                        <input
                          className={field}
                          value={row.alt ?? ''}
                          onChange={(e) => updateRow(i, { alt: e.target.value })}
                          placeholder="Describe the image"
                        />
                        {errorMap.get(`${base}.alt`)?.map((m, k) => (
                          <p key={k} className="text-xs text-red-600">{m}</p>
                        ))}
                      </div>
                    </td>
                    <td className="pt-2">
                      <button className={btnGhost} onClick={() => removeRow(i)} aria-label={`Remove image ${i + 1}`}>
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
          <button className={btnPrimary} onClick={addRow}>Add Image</button>
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