import { randomUUID } from 'crypto';
import { getSessionFromRequest } from '@/lib/users/session';
import { urlForUpload, absolutePathForUrl, saveFileFromBuffer } from '@/lib/photos/fs';
import { ALLOWED_MIME_TYPES as IMAGE_ALLOWED, MIME_TO_EXT as IMAGE_MIME_TO_EXT } from '@/lib/photos/types';

/**
 * Use the standard Web Response instead of NextResponse to avoid
 * package export alias resolution issues in some environments.
 */
const json = (data: any, init: ResponseInit = {}) =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...(init.headers || {}),
    },
  });

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Configurable size limit (MB) for uploads; default 100MB
const MEDIA_MAX_UPLOAD_MB = Number(process.env.MEDIA_MAX_UPLOAD_MB || '100');
const MEDIA_MAX_UPLOAD_BYTES = MEDIA_MAX_UPLOAD_MB * 1024 * 1024;

// Allowed video MIME types for highlights uploads
const ALLOWED_VIDEO_MIME = new Set<string>(['video/mp4', 'video/quicktime', 'video/webm']);

// Map video MIME -> extension
const VIDEO_MIME_TO_EXT: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
};

// Additional non-image/video types allowed for general media (e.g., Recruiting Packet PDFs)
const ADDITIONAL_ALLOWED_MIME = new Set<string>(['application/pdf']);

/**
 * Media upload API (local)
 * Accepts multipart/form-data with a "file" field and writes to /public/uploads/{playerId}/{id}.{ext}
 * Returns a public URL under /uploads/... which can be embedded (e.g., PDF in Recruiting Packet).
 */
export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return json({ error: 'Expected multipart/form-data' }, { status: 400 });
    }

    const form = await req.formData();
    const file = form.get('file');
    const alt = form.get('alt')?.toString() || '';

    if (file instanceof File) {
      const size = file.size ?? 0;
      if (size > MEDIA_MAX_UPLOAD_BYTES) {
        return json({ error: `File too large. Max ${MEDIA_MAX_UPLOAD_MB}MB` }, { status: 413 });
      }
    }

    if (!(file instanceof File)) {
      return json({ error: 'Missing file field' }, { status: 400 });
    }

    // Resolve playerId from session (preferred), dev header fallback, else 'demo'
    const sess = getSessionFromRequest(req);
    let playerId = (sess?.playerId || sess?.sub || '').toString();
    if (!playerId) {
      const devId = req.headers.get('x-user-id') || '';
      playerId = devId || 'demo';
    }

    // Derive extension from MIME or filename, validate type
    const type = (file.type || '').toLowerCase();

    // Validate allowed types (images, selected videos, or additional allowed like PDF)
    let allowed = false;
    if (type.startsWith('image/')) {
      allowed = IMAGE_ALLOWED.has(type);
    } else if (type.startsWith('video/')) {
      allowed = ALLOWED_VIDEO_MIME.has(type);
    } else if (type) {
      allowed = ADDITIONAL_ALLOWED_MIME.has(type);
    } else {
      // if browser didn't send a type, allow as best-effort
      allowed = true;
    }
    if (!allowed) {
      return json({ error: `Unsupported file type: ${type || 'unknown'}` }, { status: 400 });
    }

    // Map MIME -> extension
    let ext = '';
    if (type) {
      if (VIDEO_MIME_TO_EXT[type]) {
        ext = VIDEO_MIME_TO_EXT[type];
      } else if (IMAGE_MIME_TO_EXT[type]) {
        ext = IMAGE_MIME_TO_EXT[type];
      } else if (type.includes('/')) {
        ext = type.split('/')[1] || '';
      }
    }
    if (!ext) {
      const name = file.name || '';
      const i = name.lastIndexOf('.');
      if (i >= 0) ext = name.slice(i + 1);
    }
    ext = (ext || 'bin').toLowerCase().replace(/^jpeg$/, 'jpg');

    const id = randomUUID();
    const publicUrl = urlForUpload(playerId, id, ext);
    const absPath = absolutePathForUrl(publicUrl);

    // Write file bytes to disk
    const buf = Buffer.from(await file.arrayBuffer());
    await saveFileFromBuffer(absPath, buf);

    return json({
      url: publicUrl,
      alt,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString(),
      provider: 'local',
    });
  } catch (err: any) {
    return json({ error: err?.message ?? 'Upload failed' }, { status: 500 });
  }
}