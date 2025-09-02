import { promises as fs } from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { getSession } from '@/lib/auth/guards';
import { findUserById } from '@/lib/users/db';
import { uploadsDirForPlayer } from '@/lib/photos/fs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const json = (data: any, init: ResponseInit = {}) =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...(init.headers || {}),
    },
  });

/**
 * POST /api/assets/import
 * Accepts multipart/form-data with a single "file" (zip) containing files under:
 *   - uploads/{playerId}/...
 *   - or uploads/...
 * Writes all files into /public/uploads/{currentPlayerId}/..., preserving subpaths.
 * Skips metadata.json (handled on client import JSON).
 */
export async function POST(req: Request) {
  try {
    const sess = getSession(req);
    if (!sess.userId) return json({ error: 'Unauthorized' }, { status: 401 });

    const user = await findUserById(sess.userId);
    const playerId = user?.playerId || sess.userId;
    if (!playerId) return json({ error: 'Unauthorized' }, { status: 401 });

    const ctype = req.headers.get('content-type') || '';
    if (!ctype.includes('multipart/form-data')) {
      return json({ error: 'Expected multipart/form-data' }, { status: 400 });
    }

    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return json({ error: 'Missing file' }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const zip = await JSZip.loadAsync(buf);

    const baseUploadsDir = uploadsDirForPlayer(playerId);
    await fs.mkdir(baseUploadsDir, { recursive: true });

    let written = 0;

    const entries = Object.keys(zip.files);
    for (const key of entries) {
      const entry = zip.files[key];
      if (entry.dir) continue;

      // Normalize path
      const norm = key.replace(/\\/g, '/');
      const lower = norm.toLowerCase();

      // Skip top-level metadata if present
      if (lower === 'metadata.json') continue;

      // Determine relative path under uploads/{playerId}
      let relUnderUploads = '';

      if (lower.startsWith(`uploads/${playerId.toLowerCase()}/`)) {
        relUnderUploads = norm.slice(`uploads/${playerId}/`.length);
      } else if (lower.startsWith('uploads/')) {
        // Strip potential other playerId if present
        const after = norm.slice('uploads/'.length);
        const parts = after.split('/');
        if (parts.length > 1) {
          // If first part looks like a player folder, drop it and keep the rest
          relUnderUploads = parts.slice(1).join('/');
        } else {
          // A file directly under uploads/
          relUnderUploads = parts[0];
        }
      } else {
        // Not under uploads/, ignore
        continue;
      }

      if (!relUnderUploads || relUnderUploads.endsWith('/')) continue;

      const destAbs = path.join(baseUploadsDir, relUnderUploads);
      await fs.mkdir(path.dirname(destAbs), { recursive: true });

      const content = await entry.async('nodebuffer');
      await fs.writeFile(destAbs, content);
      written++;
    }

    return json({ ok: true, files: written, playerId });
  } catch (e: any) {
    return json({ error: e?.message ?? 'Import failed' }, { status: 500 });
  }
}