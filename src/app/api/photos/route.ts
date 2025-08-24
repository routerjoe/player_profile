/**
 * Photos API: GET list by playerId, POST multipart upload (multiple images)
 * Storage: local filesystem under /public/uploads/{playerId}
 * Metadata: JSON file at /data/photos.json
 */
import path from 'path';
import { randomUUID } from 'crypto';
import { assertCanManagePlayer } from '@/lib/auth/guards';
import {
  MAX_UPLOAD_BYTES,
  ALLOWED_MIME_TYPES,
  MIME_TO_EXT,
  type PhotoRecord,
} from '@/lib/photos/types';
import {
  uploadsDirForPlayer,
  saveFileFromBuffer,
} from '@/lib/photos/fs';
import {
  makePhotoRecord,
  addMany,
  getByPlayer,
} from '@/lib/photos/service';

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

function badRequest(message: string) {
  return json({ error: message }, { status: 400 });
}

function detectExt(mime: string): string | null {
  if (MIME_TO_EXT[mime]) return MIME_TO_EXT[mime];
  if (mime === 'image/jpg') return 'jpg'; // tolerate non-standard alias
  return null;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const playerId = url.searchParams.get('playerId') || '';
    if (!playerId) return badRequest('Missing playerId');

    // Authorization
    assertCanManagePlayer(req, playerId);

    const rows = await getByPlayer(playerId);
    return json(rows);
  } catch (err: any) {
    const status = Number(err?.status) || 500;
    return json({ error: err?.message ?? 'Server error' }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return badRequest('Expected multipart/form-data');
    }

    const form = await req.formData();
    const playerId = (form.get('playerId') || '').toString().trim();
    if (!playerId) return badRequest('Missing playerId');

    // Authorization
    assertCanManagePlayer(req, playerId);

    // Collect files from either "images" or "images[]"
    const files: File[] = [];
    for (const key of ['images', 'images[]']) {
      for (const value of form.getAll(key)) {
        if (value instanceof File) files.push(value);
      }
    }
    if (files.length === 0) return badRequest('No images provided (use images[] field)');

    const created: PhotoRecord[] = [];
    for (const file of files) {
      const mime = (file.type || '').toLowerCase();
      const size = file.size ?? 0;

      if (!ALLOWED_MIME_TYPES.has(mime)) {
        return badRequest(`Unsupported image type: ${mime}`);
      }
      if (size > MAX_UPLOAD_BYTES) {
        return badRequest(`File ${file.name} exceeds max size of ${Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))}MB`);
      }

      const ext = detectExt(mime);
      if (!ext) return badRequest(`Could not determine extension for type: ${mime}`);

      const id = randomUUID();
      const buffer = Buffer.from(await file.arrayBuffer());
      // Optional dimensions omitted (sharp not installed in this environment)
      let width: number | undefined = undefined;
      let height: number | undefined = undefined;

      // Save to disk
      const destAbs = path.join(uploadsDirForPlayer(playerId), `${id}.${ext}`);
      await saveFileFromBuffer(destAbs, buffer);

      // Build metadata record
      const rec = makePhotoRecord({
        id,
        playerId,
        ext,
        originalName: file.name || `${id}.${ext}`,
        sizeBytes: size,
        mimeType: mime,
        width,
        height,
      });
      created.push(rec);
    }

    // Persist metadata atomically
    await addMany(created);

    return json(created, { status: 201 });
  } catch (err: any) {
    const status = Number(err?.status) || 500;
    return json({ error: err?.message ?? 'Upload failed' }, { status });
  }
}