'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { PhotoRecord } from '@/lib/photos/types';
import { Uploader } from '@/components/photos/Uploader';
import { PhotoTile } from '@/components/photos/PhotoTile';

export default function DashboardPhotosPage() {
  const search = useSearchParams();
  // Default id from env so /dashboard/photos works without query param if no session (dev)
  const envDefaultId = (process.env.NEXT_PUBLIC_DEFAULT_PLAYER_ID || 'demo').trim();
  const queryId = (search?.get('playerId') || '').trim();
  const [playerId, setPlayerId] = useState<string>(queryId || envDefaultId);

  // Prefer session from cookie; override when available
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const devUserId = typeof window !== 'undefined' ? window.localStorage.getItem('pp_user_id') || '' : '';
        const res = await fetch('/api/auth/me', {
          cache: 'no-store',
          credentials: 'include',
          headers: devUserId ? { 'x-user-id': devUserId } : {},
        });
        if (res.ok) {
          const data = await res.json();
          const sessId: string | undefined = data?.user?.playerId;
          if (!ignore && typeof sessId === 'string' && sessId) {
            setPlayerId(sessId);
          }
        }
      } catch {}
    })();
    return () => {
      ignore = true;
    };
  }, [queryId, envDefaultId]);

  const [photos, setPhotos] = useState<PhotoRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const hasHero = useMemo(() => photos.some((p) => p.usage === 'hero'), [photos]);

  const refresh = useCallback(() => setRefreshTick((t) => t + 1), []);

  const load = useCallback(async () => {
    if (!playerId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/photos?playerId=${encodeURIComponent(playerId)}`, {
        headers: {
          // Dev header-based auth; treat current user as this player.
          'x-user-id': playerId,
        },
        credentials: 'include',
        cache: 'no-store',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Failed to load photos (${res.status})`);
      }
      const rows = (await res.json()) as PhotoRecord[];
      setPhotos(rows);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load photos');
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  useEffect(() => {
    setPhotos([]);
    setError(null);
    if (playerId) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId, refreshTick]);

  const onUploaded = useCallback(
    (created: PhotoRecord[]) => {
      // Prepend new items to the grid for immediate UX
      setPhotos((prev) => [...created, ...prev]);
    },
    [],
  );

  const onChanged = useCallback(
    (updated: PhotoRecord) => {
      setPhotos((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      // If this became the hero, refresh the list to reflect unsetting any previous hero
      if (updated.usage === 'hero') {
        refresh();
      }
    },
    [refresh],
  );

  const onDeleted = useCallback((id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // With env fallback, playerId should always be present. Keep guard just in case.
  if (!playerId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Photos</h1>
        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-slate-700">
            Missing playerId. Set NEXT_PUBLIC_DEFAULT_PLAYER_ID in .env.local or pass ?playerId=YOUR_ID.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Photos</h1>
        <div className="flex items-center gap-2">
          <span className="text-xs rounded-md bg-slate-100 px-2 py-1 text-slate-700">Player: {playerId}</span>
          {hasHero ? (
            <span className="text-xs rounded-md bg-green-100 px-2 py-1 text-green-700">Hero set</span>
          ) : (
            <span className="text-xs rounded-md bg-amber-100 px-2 py-1 text-amber-700">No hero selected</span>
          )}
        </div>
      </div>

      <Uploader playerId={playerId} onUploaded={onUploaded} className="rounded-2xl border-2 border-dashed p-0 bg-transparent" />

      <div className="mt-2">
        {loading ? <p className="text-sm text-slate-500">Loading photos...</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
        {photos.length === 0 && !loading ? (
          <div className="col-span-full">
            <div className="rounded-xl border bg-white p-5 text-center text-sm text-slate-600">
              No photos yet. Upload images above to get started.
            </div>
          </div>
        ) : null}

        {photos.map((p) => (
          <PhotoTile
            key={p.id}
            playerId={playerId}
            photo={p}
            onChanged={onChanged}
            onDeleted={onDeleted}
          />
        ))}
      </div>
    </div>
  );
}