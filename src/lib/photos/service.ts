import path from 'path';
import { readAll, writeAll } from '@/lib/photos/db';
import type { PhotoRecord, PhotoUsage, UpdatePhotoPayload } from '@/lib/photos/types';
import { urlForUpload, absolutePathForUrl } from '@/lib/photos/fs';
import { deleteFileIfExists } from '@/lib/photos/fs';

/**
 * Strip extension from a filename.
 */
export function stripExt(name: string): string {
  const i = name.lastIndexOf('.');
  if (i <= 0) return name;
  return name.slice(0, i);
}

/**
 * Construct a PhotoRecord from saved file metadata.
 * Caller is responsible for actually saving the file bytes to disk.
 */
export function makePhotoRecord(params: {
  id: string;
  playerId: string;
  ext: string; // without dot, e.g. 'jpg'
  originalName: string;
  sizeBytes: number;
  mimeType: string;
  width?: number;
  height?: number;
}): PhotoRecord {
  const { id, playerId, ext, originalName, sizeBytes, mimeType, width, height } = params;
  const url = urlForUpload(playerId, id, ext);
  const now = new Date().toISOString();
  return {
    id,
    playerId,
    url,
    originalName,
    title: stripExt(originalName),
    alt: '',
    usage: 'unassigned',
    width,
    height,
    sizeBytes,
    mimeType,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Return a single record by id.
 */
export async function getById(id: string): Promise<PhotoRecord | undefined> {
  const all = await readAll();
  return all.find((r) => r.id === id);
}

/**
 * Get photos for a player, newest first.
 */
export async function getByPlayer(playerId: string): Promise<PhotoRecord[]> {
  const all = await readAll();
  return all
    .filter((r) => r.playerId === playerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Append many new records to the store atomically.
 */
export async function addMany(recordsToAdd: PhotoRecord[]): Promise<void> {
  if (recordsToAdd.length === 0) return;
  const all = await readAll();
  all.push(...recordsToAdd);
  await writeAll(all);
}

/**
 * Update a photo's metadata (title/alt/usage). Enforces hero uniqueness per player.
 */
export async function updatePhoto(
  id: string,
  patch: UpdatePhotoPayload,
): Promise<PhotoRecord> {
  const all = await readAll();
  const idx = all.findIndex((r) => r.id === id);
  if (idx < 0) {
    throw Object.assign(new Error('Not found'), { status: 404 });
  }

  const now = new Date().toISOString();
  const current = all[idx];
  const next: PhotoRecord = {
    ...current,
    ...(patch.title !== undefined ? { title: patch.title } : {}),
    ...(patch.alt !== undefined ? { alt: patch.alt } : {}),
    ...(patch.usage !== undefined ? { usage: patch.usage as PhotoUsage } : {}),
    updatedAt: now,
  };

  // If setting to hero, ensure uniqueness per player: unset any other hero.
  if (patch.usage === 'hero') {
    for (let i = 0; i < all.length; i++) {
      const r = all[i];
      if (r.playerId === current.playerId && r.id !== id && r.usage === 'hero') {
        all[i] = { ...r, usage: 'unassigned', updatedAt: now };
      }
    }
  }

  all[idx] = next;
  await writeAll(all);
  return next;
}

/**
 * Delete a photo by id. Also removes the file from disk (ignored if missing).
 */
export async function deletePhoto(id: string): Promise<PhotoRecord> {
  const all = await readAll();
  const idx = all.findIndex((r) => r.id === id);
  if (idx < 0) {
    throw Object.assign(new Error('Not found'), { status: 404 });
  }
  const rec = all[idx];

  // Remove disk file (ignore if missing)
  try {
    const abs = absolutePathForUrl(rec.url);
    await deleteFileIfExists(abs);
  } catch {
    // ignore
  }

  all.splice(idx, 1);
  await writeAll(all);
  return rec;
}

/**
 * Get the hero photo for a given player, if any.
 */
export async function getHeroPhoto(playerId: string): Promise<PhotoRecord | undefined> {
  const all = await readAll();
  return all.find((r) => r.playerId === playerId && r.usage === 'hero');
}