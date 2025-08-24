import { promises as fs } from 'fs';
import path from 'path';

const CWD = process.cwd();
const PUBLIC_DIR = path.join(CWD, 'public');
const UPLOADS_DIR = path.join(PUBLIC_DIR, 'uploads');

/**
 * Ensure a directory exists (recursive).
 */
export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

/**
 * Return absolute uploads dir for a player.
 * Example: /.../public/uploads/{playerId}
 */
export function uploadsDirForPlayer(playerId: string): string {
  return path.join(UPLOADS_DIR, playerId);
}

/**
 * Build a public URL for a given upload file.
 * Example: /uploads/{playerId}/{id}.{ext}
 */
export function urlForUpload(playerId: string, id: string, ext: string): string {
  const safeExt = ext.startsWith('.') ? ext.slice(1) : ext;
  return `/uploads/${encodeURIComponent(playerId)}/${encodeURIComponent(id)}.${safeExt}`;
}

/**
 * Convert a public URL under /public to an absolute filesystem path.
 * Example: /uploads/a/b.jpg -> /.../public/uploads/a/b.jpg
 */
export function absolutePathForUrl(publicUrl: string): string {
  // Strip any leading slash so path.join doesn't discard PUBLIC_DIR.
  const rel = publicUrl.replace(/^\/+/, '');
  return path.join(PUBLIC_DIR, rel);
}

/**
 * Save a Blob (Web/File API) to a destination absolute path.
 * Destination directory is created if needed.
 */
export async function saveFileFromBlob(destAbsPath: string, blob: Blob): Promise<void> {
  const dir = path.dirname(destAbsPath);
  await ensureDir(dir);
  const ab = await blob.arrayBuffer();
  await fs.writeFile(destAbsPath, Buffer.from(ab));
}

/**
 * Save a Buffer to a destination absolute path.
 * Destination directory is created if needed.
 */
export async function saveFileFromBuffer(destAbsPath: string, buffer: Buffer): Promise<void> {
  const dir = path.dirname(destAbsPath);
  await ensureDir(dir);
  await fs.writeFile(destAbsPath, buffer);
}

/**
 * Delete a file if it exists. Ignore errors when the file is already gone.
 */
export async function deleteFileIfExists(destAbsPath: string): Promise<void> {
  try {
    await fs.unlink(destAbsPath);
  } catch {
    // ignore
  }
}