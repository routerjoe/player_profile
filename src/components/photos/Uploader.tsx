'use client';

import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  MAX_UPLOAD_BYTES,
  ALLOWED_MIME_TYPES,
  type PhotoRecord,
} from '@/lib/photos/types';

type QueueItem = {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
};

export interface UploaderProps {
  playerId: string;
  onUploaded?: (created: PhotoRecord[]) => void;
  className?: string;
  // Optional: extra headers (e.g., x-user-role)
  headers?: Record<string, string>;
}

const ACCEPT = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
].join(',');

export function Uploader(props: UploaderProps) {
  const { playerId, onUploaded, className, headers } = props;
  const [isDragOver, setIsDragOver] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const maxMb = useMemo(() => Math.round(MAX_UPLOAD_BYTES / (1024 * 1024)), []);

  const addFilesToQueue = useCallback((files: FileList | File[]) => {
    const items: QueueItem[] = [];
    for (const f of Array.from(files)) {
      items.push({
        id: crypto.randomUUID(),
        file: f,
        status: 'pending',
      });
    }
    setQueue((prev) => [...prev, ...items]);
  }, []);

  const onSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    addFilesToQueue(files);
    // reset input so re-selecting same file works
    e.currentTarget.value = '';
  }, [addFilesToQueue]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFilesToQueue(e.dataTransfer.files);
    }
  }, [addFilesToQueue]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);
  const onDragLeave = useCallback(() => setIsDragOver(false), []);

  async function uploadOne(file: File): Promise<PhotoRecord[]> {
    // client-side validation
    const mime = (file.type || '').toLowerCase();
    const size = file.size ?? 0;
    if (!ALLOWED_MIME_TYPES.has(mime)) {
      throw new Error(`Unsupported image type: ${mime || 'unknown'}`);
    }
    if (size > MAX_UPLOAD_BYTES) {
      throw new Error(`File too large. Max ${maxMb}MB`);
    }

    const form = new FormData();
    form.set('playerId', playerId);
    form.append('images[]', file);

    const res = await fetch('/api/photos', {
      method: 'POST',
      body: form,
      credentials: 'include',
      headers: {
        // Dev header-based auth: treat user as the player by default
        'x-user-id': playerId,
        ...(headers || {}),
      },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error || `Upload failed (${res.status})`);
    }
    const created = await res.json() as PhotoRecord[];
    return created;
  }

  async function startUpload() {
    // Upload sequentially for predictable per-file progress
    const items = [...queue];
    const results: PhotoRecord[] = [];
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it.status !== 'pending') continue;

      // mark uploading
      items[i] = { ...it, status: 'uploading', error: undefined };
      setQueue([...items]);

      try {
        const created = await uploadOne(it.file);
        results.push(...created);
        // mark done
        items[i] = { ...items[i], status: 'done' };
        setQueue([...items]);
      } catch (e: any) {
        items[i] = { ...items[i], status: 'error', error: e?.message ?? 'Upload failed' };
        setQueue([...items]);
      }
    }

    if (results.length > 0) {
      onUploaded?.(results);
    }
  }

  function clearFinished() {
    setQueue((prev) => prev.filter((q) => q.status !== 'done' && q.status !== 'error'));
  }

  const anyPending = queue.some((q) => q.status === 'pending');
  const anyUploading = queue.some((q) => q.status === 'uploading');
  const canStart = queue.length > 0 && !anyUploading && (anyPending || queue.some((q) => q.status === 'error'));

  return (
    <div className={className}>
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`rounded-2xl border-2 border-dashed p-8 bg-white text-center hover:bg-gray-50 transition ${isDragOver ? 'bg-gray-50' : ''}`}
      >
        <p className="text-sm text-slate-600">Drag and drop images here, or</p>
        <div className="mt-3 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium bg-[var(--brand-green)] text-white hover:bg-[var(--brand-green-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-cool)]"
          >
            Select images
          </button>
          <span className="text-xs text-slate-500">JPEG, PNG, WEBP, AVIF, GIF up to {maxMb}MB each</span>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={onSelect}
        />
      </div>

      {queue.length > 0 && (
        <div className="mt-4 rounded-xl border bg-white p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold">Upload Queue</h4>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!canStart}
                onClick={startUpload}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-cool)] ${canStart ? 'bg-[var(--brand-green)] hover:bg-[var(--brand-green-dark)]' : 'bg-slate-300 cursor-not-allowed'}`}
              >
                {anyUploading ? 'Uploading...' : 'Start Upload'}
              </button>
              <button
                type="button"
                disabled={anyUploading}
                onClick={clearFinished}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium border ${anyUploading ? 'text-slate-400 border-slate-200 cursor-not-allowed' : 'text-slate-700 border-slate-300 hover:bg-slate-50'}`}
              >
                Clear Finished
              </button>
            </div>
          </div>
          <ul className="space-y-2">
            {queue.map((q) => (
              <li key={q.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm text-slate-800">{q.file.name}</p>
                  <p className="text-xs text-slate-500">{Math.round((q.file.size ?? 0) / 1024)} KB</p>
                  {q.error ? <p className="text-xs text-red-600">{q.error}</p> : null}
                </div>
                <div className="flex items-center gap-2">
                  {q.status === 'pending' && (
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">Pending</span>
                  )}
                  {q.status === 'uploading' && (
                    <span className="inline-flex items-center rounded-md bg-blue-100 px-2 py-1 text-xs text-blue-700">Uploading...</span>
                  )}
                  {q.status === 'done' && (
                    <span className="inline-flex items-center rounded-md bg-green-100 px-2 py-1 text-xs text-green-700">Done</span>
                  )}
                  {q.status === 'error' && (
                    <span className="inline-flex items-center rounded-md bg-red-100 px-2 py-1 text-xs text-red-700">Error</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default Uploader;