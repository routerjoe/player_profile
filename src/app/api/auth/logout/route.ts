import { buildClearSessionCookie } from '@/lib/users/session';

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

export async function POST() {
  const headers = new Headers();
  headers.append('set-cookie', buildClearSessionCookie());
  return json({ ok: true }, { headers });
}