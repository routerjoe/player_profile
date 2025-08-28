import { promises as fs } from 'fs';
import path from 'path';
import { assertCanManagePlayer } from '@/lib/auth/guards';
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
 * GET /api/players/[playerId]/recruiting/packets
 * List locally stored recruiting packet PDFs for a player.
 * Returns: { files: Array<{ id:string; filename:string; url:string; size:number; modifiedAt:string }> }
 */
export async function GET(req: Request, ctx: { params: { playerId: string } }) {
  try {
    const playerId = ctx.params.playerId;
    assertCanManagePlayer(req, playerId);

    const dir = uploadsDirForPlayer(playerId);
    let entries: string[] = [];
    try {
      entries = await fs.readdir(dir);
    } catch {
      // No directory yet -> zero files
      return json({ files: [] });
    }

    const files: Array<{ id: string; filename: string; url: string; size: number; modifiedAt: string }> = [];
    for (const name of entries) {
      // Only PDFs
      if (!/\.pdf$/i.test(name)) continue;
      const abs = path.join(dir, name);
      let st: any = null;
      try {
        st = await fs.stat(abs);
      } catch {
        continue;
      }
      if (!st?.isFile?.()) continue;

      const id = name.replace(/\.pdf$/i, '');
      files.push({
        id,
        filename: name,
        url: `/uploads/${encodeURIComponent(playerId)}/${encodeURIComponent(name)}`,
        size: Number(st.size || 0),
        modifiedAt: new Date(st.mtimeMs || Date.now()).toISOString(),
      });
    }

    // Sort newest first by modified time
    files.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));

    return json({ files });
  } catch (err: any) {
    const status = Number(err?.status) || 500;
    return json({ error: err?.message ?? 'Failed' }, { status });
  }
}