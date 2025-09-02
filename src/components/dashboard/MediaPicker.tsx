'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useEffect, useMemo, useRef, useState } from 'react';

type MediaItem = { url: string; alt?: string; uploadedAt?: string; size?: number; type?: string };
type Library = MediaItem[];

const LS_KEY = 'pp:media:library';

const btn = 'inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-[var(--accent-cool)]';
const btnPrimary = `${btn} bg-[var(--brand-green)] text-white hover:bg-[var(--brand-green-dark)]`;
const btnGhost = `${btn} border border-slate-300 hover:bg-slate-50 text-slate-800`;

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function loadLibrary(): Library {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x) => x && typeof x.url === 'string');
  } catch {
    return [];
  }
}

function saveLibrary(items: Library) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(LS_KEY, JSON.stringify(items));
}

export function MediaPicker({
  value,
  onChange,
  className,
}: {
  value?: string;
  onChange: (url: string, meta?: { alt?: string }) => void;
  className?: string;
}) {
  const [library, setLibrary] = useState<Library>(() => loadLibrary());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setLibrary(loadLibrary());
  }, []);

  // Dedup by URL
  const lib = useMemo(() => {
    const seen = new Set<string>();
    const out: Library = [];
    for (const item of library) {
      if (item && typeof item.url === 'string' && !seen.has(item.url)) {
        seen.add(item.url);
        out.push(item);
      }
    }
    return out;
  }, [library]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      // Optional: allow user to set alt later; send empty here
      fd.append('alt', file.name);

      const res = await fetch('/api/media/upload', { method: 'POST', body: fd });
      if (!res.ok) {
        const j = await safeJson(res);
        throw new Error(j?.error || `Upload failed (${res.status})`);
      }
      const j: any = await res.json();
      if (!j?.url) throw new Error('Invalid response from upload');

      const next: MediaItem = {
        url: j.url,
        alt: j.alt,
        uploadedAt: j.uploadedAt,
        size: j.size,
        type: j.type,
      };
      const updated = [next, ...lib];
      setLibrary(updated);
      saveLibrary(updated);
      onChange(j.url, { alt: j.alt });
    } catch (err: any) {
      setError(err?.message ?? 'Upload failed');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function handleSelect(url: string, alt?: string) {
    onChange(url, { alt });
  }

  function handleRemove(url: string) {
    const updated = lib.filter((x) => x.url !== url);
    setLibrary(updated);
    saveLibrary(updated);
    if (value === url) onChange('', {});
  }

  return (
    <div className={className}>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileChange}
            disabled={busy}
          />
          <span className="text-xs text-slate-500">
            Uploads use a stub endpoint and return a fake CDN URL for demo purposes.
          </span>
        </div>
        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {value ? (
          <div className="rounded-lg border border-slate-200 p-3 bg-white">
            <div className="text-sm font-medium mb-2">Selected</div>
            <div className="flex items-center gap-3">
              {/* Use plain img to avoid Next/Image domain restrictions for stub */}
              <img
                src={value}
                alt="Selected media"
                loading="lazy"
                decoding="async"
                className="h-16 w-16 object-cover rounded-md border border-slate-200 bg-white"
              />
              <div className="text-xs text-slate-600 break-all">{value}</div>
            </div>
          </div>
        ) : null}

        <div className="space-y-2">
          <div className="text-sm font-medium">Library</div>
          {lib.length === 0 ? (
            <p className="text-sm text-slate-500">No media yet. Upload your first file.</p>
          ) : (
            <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {lib.map((item) => (
                <li key={item.url} className="rounded-lg border border-slate-200 bg-white p-2">
                  <button
                    type="button"
                    onClick={() => handleSelect(item.url, item.alt)}
                    className="block w-full text-left"
                    title="Select"
                  >
                    <img
                      src={item.url}
                      alt={item.alt || 'Media'}
                      loading="lazy"
                      decoding="async"
                      className="h-24 w-full object-cover rounded-md border border-slate-200 bg-white"
                    />
                    <div className="mt-1 text-[11px] text-slate-600 line-clamp-2 break-all">
                      {item.url}
                    </div>
                  </button>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      className={btnGhost}
                      onClick={() => handleSelect(item.url, item.alt)}
                    >
                      Use
                    </button>
                    <button
                      type="button"
                      className={btnGhost}
                      onClick={() => handleRemove(item.url)}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

async function safeJson(res: Response): Promise<any | null> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}