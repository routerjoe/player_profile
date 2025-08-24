'use client';

import React, { useCallback, useMemo, useState } from 'react';
import type { PhotoRecord, PhotoUsage } from '@/lib/photos/types';

export interface PhotoTileProps {
  playerId: string;
  photo: PhotoRecord;
  onChanged?: (updated: PhotoRecord) => void;
  onDeleted?: (id: string) => void;
  headers?: Record<string, string>;
}

const usageOptions: Array<{ value: PhotoUsage; label: string }> = [
  { value: 'unassigned', label: 'Unassigned' },
  { value: 'hero', label: 'Hero (Sports Card)' },
  { value: 'gallery', label: 'Gallery' },
  { value: 'blog_cover', label: 'Blog Cover' },
  { value: 'thumbnail', label: 'Thumbnail / Avatar' },
  { value: 'banner', label: 'Banner / Header' },
  { value: 'social', label: 'Social Preview' },
];

export function PhotoTile(props: PhotoTileProps) {
  const { playerId, photo, onChanged, onDeleted, headers } = props;
  const [title, setTitle] = useState(photo.title ?? '');
  const [alt, setAlt] = useState(photo.alt ?? '');
  const [usage, setUsage] = useState<PhotoUsage>(photo.usage ?? 'unassigned');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changed = useMemo(() => {
    return title !== (photo.title ?? '') || alt !== (photo.alt ?? '') || usage !== (photo.usage ?? 'unassigned');
  }, [title, alt, usage, photo]);

  const sizeText = useMemo(() => {
    const bytes = photo.sizeBytes ?? 0;
    if (!bytes) return '';
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${bytes} B`;
  }, [photo.sizeBytes]);

  const dimText = useMemo(() => {
    if (photo.width && photo.height) return `${photo.width}×${photo.height}`;
    return '';
  }, [photo.width, photo.height]);

  const onSave = useCallback(async () => {
    if (!changed || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/photos/${encodeURIComponent(photo.id)}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'content-type': 'application/json',
          'x-user-id': playerId,
          ...(headers || {}),
        },
        body: JSON.stringify({ title, alt, usage }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Save failed (${res.status})`);
      }
      const updated = (await res.json()) as PhotoRecord;
      onChanged?.(updated);
    } catch (e: any) {
      setError(e?.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  }, [changed, saving, photo.id, playerId, headers, title, alt, usage, onChanged]);

  const onDelete = useCallback(async () => {
    if (saving) return;
    const confirmed = window.confirm('Delete this photo permanently? This cannot be undone.');
    if (!confirmed) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/photos/${encodeURIComponent(photo.id)}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'x-user-id': playerId,
          ...(headers || {}),
        },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Delete failed (${res.status})`);
      }
      onDeleted?.(photo.id);
    } catch (e: any) {
      setError(e?.message ?? 'Delete failed');
    } finally {
      setSaving(false);
    }
  }, [saving, photo.id, playerId, headers, onDeleted]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onSave();
      }
    },
    [onSave],
  );

  return (
    <div className="rounded-xl border bg-white p-3 shadow-sm hover:shadow transition">
      <div className="space-y-3">
        <img
          src={photo.url}
          alt={photo.alt || photo.title}
          className="aspect-square w-full object-cover rounded-xl border"
        />

        <div className="grid grid-cols-1 gap-2 text-sm">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={onKeyDown}
              className="block w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-cool)]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Alt Text</label>
            <input
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              onKeyDown={onKeyDown}
              className="block w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-cool)]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Usage</label>
            <select
              value={usage}
              onChange={(e) => setUsage(e.target.value as PhotoUsage)}
              className="block w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-cool)]"
            >
              {usageOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {(sizeText || dimText) && (
            <p className="text-xs text-slate-500">
              {sizeText ? <span>{sizeText}</span> : null}
              {sizeText && dimText ? ' · ' : ''}
              {dimText ? <span>{dimText}</span> : null}
            </p>
          )}
        </div>

        {error ? <p className="text-xs text-red-600">{error}</p> : null}

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSave}
              disabled={!changed || saving}
              className={`inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--accent-cool)] ${
                !changed || saving
                  ? 'bg-slate-300 text-white cursor-not-allowed'
                  : 'bg-[var(--brand-green)] text-white hover:bg-[var(--brand-green-dark)]'
              }`}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={saving}
              className={`inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium border ${
                saving ? 'text-slate-400 border-slate-200 cursor-not-allowed' : 'text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              Delete
            </button>
          </div>

          <a
            href={photo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[var(--brand-green-dark)] hover:underline"
          >
            Open
          </a>
        </div>
      </div>
    </div>
  );
}

export default PhotoTile;