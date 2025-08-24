/**
 * Photos API (by id): PATCH metadata, DELETE photo
 */
import { assertCanManagePlayer } from '@/lib/auth/guards';
import { updatePhoto, deletePhoto, getById } from '@/lib/photos/service';
import type { UpdatePhotoPayload } from '@/lib/photos/types';

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

const ALLOWED_USAGE = new Set([
  'unassigned',
  'hero',
  'gallery',
  'blog_cover',
  'thumbnail',
  'banner',
  'social',
]);

export async function PATCH(
  req: Request,
  ctx: { params: { id: string } },
) {
  try {
    const id = ctx?.params?.id;
    if (!id) return badRequest('Missing id');

    const existing = await getById(id);
    if (!existing) {
      return json({ error: 'Not found' }, { status: 404 });
    }

    // Authorization by owning player or elevated role
    assertCanManagePlayer(req, existing.playerId);

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // allow empty body
    }

    const patch: UpdatePhotoPayload = {};
    if (typeof body.title === 'string') patch.title = body.title;
    if (typeof body.alt === 'string') patch.alt = body.alt;
    if (typeof body.usage === 'string') {
      if (!ALLOWED_USAGE.has(body.usage)) {
        return badRequest('Invalid usage value');
      }
      patch.usage = body.usage;
    }

    const updated = await updatePhoto(id, patch);
    return json(updated);
  } catch (err: any) {
    const status = Number(err?.status) || 500;
    return json({ error: err?.message ?? 'Server error' }, { status });
  }
}

export async function DELETE(
  req: Request,
  ctx: { params: { id: string } },
) {
  try {
    const id = ctx?.params?.id;
    if (!id) return badRequest('Missing id');

    const existing = await getById(id);
    if (!existing) {
      return json({ error: 'Not found' }, { status: 404 });
    }

    // Authorization
    assertCanManagePlayer(req, existing.playerId);

    await deletePhoto(id);
    return json({ ok: true });
  } catch (err: any) {
    const status = Number(err?.status) || 500;
    return json({ error: err?.message ?? 'Server error' }, { status });
  }
}