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
 * DELETE /api/players/[playerId]/recruiting/packets/[id]
 * Remove a recruiting packet PDF by id (filename without extension).
 * Query/body not required.
 */
export async function DELETE(req: Request, ctx: { params: { playerId: string; id: string } }) {
  try {
    const playerId = ctx.params.playerId;
    const id = (ctx.params.id || '').trim();

    assertCanManagePlayer(req, playerId);

    if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
      return json({ error: 'Invalid id' }, { status: 400 });
    }

    const dir = uploadsDirForPlayer(playerId);

    // Find a case-insensitive match for `${id}.pdf`
    let entries: string[] = [];
    try {
      entries = await fs.readdir(dir);
    } catch {
      return json({ ok: true, deleted: false });
    }

    const target = entries.find((name) => /\.pdf$/i.test(name) && name.replace(/\.pdf$/i, '') === id);
    if (!target) {
      return json({ ok: true, deleted: false });
    }

    const abs = path.join(dir, target);
    try {
      await fs.unlink(abs);
    } catch {
      // ignore if already gone
    }

    return json({ ok: true, deleted: true });
  } catch (err: any) {
    const status = Number(err?.status) || 500;
    return json({ error: err?.message ?? 'Failed' }, { status });
  }
}