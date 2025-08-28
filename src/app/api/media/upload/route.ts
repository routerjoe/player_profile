import { randomUUID } from 'crypto';
import { getSessionFromRequest } from '@/lib/users/session';
import { urlForUpload, absolutePathForUrl, saveFileFromBuffer } from '@/lib/photos/fs';

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

    // Derive extension from MIME or filename
    const type = (file.type || '').toLowerCase();
    let ext = '';
    if (type.includes('/')) ext = type.split('/')[1] || '';
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