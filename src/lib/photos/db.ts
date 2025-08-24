import { promises as fs } from 'fs';
import path from 'path';
import type { PhotoRecord } from '@/lib/photos/types';

export const DATA_DIR = path.join(process.cwd(), 'data');
export const PHOTOS_JSON_PATH = path.join(DATA_DIR, 'photos.json');

async function ensureDataDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function ensurePhotosFile(): Promise<void> {
  await ensureDataDir();
  try {
    await fs.access(PHOTOS_JSON_PATH);
  } catch {
    await fs.writeFile(PHOTOS_JSON_PATH, '[]\n', 'utf8');
  }
}

/**
 * Safe read of the photo metadata store.
 * If the file is missing or corrupted, recreate with [] and return [].
 */
export async function readAll(): Promise<PhotoRecord[]> {
  await ensurePhotosFile();
  try {
    const raw = await fs.readFile(PHOTOS_JSON_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PhotoRecord[]) : [];
  } catch {
    // Backup corrupted file if possible, then reset.
    try {
      const badName = `photos-${Date.now()}.bad.json`;
      await fs.rename(PHOTOS_JSON_PATH, path.join(DATA_DIR, badName));
    } catch {
      // ignore backup errors
    }
    await fs.writeFile(PHOTOS_JSON_PATH, '[]\n', 'utf8');
    return [];
  }
}

/**
 * Atomic write: write to a temp file then rename to target.
 */
export async function writeAll(records: PhotoRecord[]): Promise<void> {
  await ensureDataDir();
  const tmpPath = `${PHOTOS_JSON_PATH}.tmp`;
  const payload = JSON.stringify(records, null, 2) + '\n';
  await fs.writeFile(tmpPath, payload, 'utf8');
  await fs.rename(tmpPath, PHOTOS_JSON_PATH);
}