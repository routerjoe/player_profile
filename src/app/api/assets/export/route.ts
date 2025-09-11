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

async function dirExists(p: string): Promise<boolean> {
  try {
    const s = await fs.stat(p);
    return s.isDirectory();
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  try {
    const sess = getSession(req);
    if (!sess.userId) return json({ error: 'Unauthorized' }, { status: 401 });

    const user = await findUserById(sess.userId);
    const playerId = user?.playerId || sess.userId;
    if (!playerId) return json({ error: 'Unauthorized' }, { status: 401 });

    const baseDir = uploadsDirForPlayer(playerId);
    if (!(await dirExists(baseDir))) {
      return json({ error: 'No assets found' }, { status: 404 });
    }

    const zip = new JSZip();
    const prefix = `uploads/${playerId}`;
    let count = 0;

    async function walk(dir: string, rel: string) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const abs = path.join(dir, entry.name);
        const relPath = rel ? `${rel}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
          await walk(abs, relPath);
        } else if (entry.isFile()) {
          const data = await fs.readFile(abs);
          zip.file(`${prefix}/${relPath}`.replace(/\\/g, '/'), data);
          count++;
        }
      }
    }

    await walk(baseDir, '');

    zip.file(
      'metadata.json',
      JSON.stringify(
        {
          kind: 'player_uploads',
          createdAt: new Date().toISOString(),
          playerId,
          files: count,
          prefix,
          note: 'Files preserved under uploads/{playerId}/',
        },
        null,
        2,
      ),
    );

    const buf: Buffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    // Use a plain Uint8Array for Response body to satisfy TS BodyInit typing
    const body = new Uint8Array(buf);

    return new Response(body, {
      headers: {
        'content-type': 'application/zip',
        'content-disposition': `attachment; filename="assets_${playerId}.zip"`,
        'content-length': String(buf.length),
        'cache-control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (e: any) {
    return json({ error: e?.message ?? 'Export failed' }, { status: 500 });
  }
}