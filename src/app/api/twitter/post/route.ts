import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Twitter post API (stub)
 * Accepts JSON: { text: string, slug?: string, title?: string }
 * Returns a fake tweet id. Wire to real Twitter integration in a later milestone.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const text = typeof body?.text === 'string' ? body.text : '';
    if (!text || text.length < 3) {
      return NextResponse.json({ error: 'Missing or invalid text' }, { status: 400 });
    }

    const id = `tweet_${Math.random().toString(36).slice(2, 10)}`;
    return NextResponse.json({
      ok: true,
      id,
      text,
      meta: {
        slug: body?.slug ?? null,
        title: body?.title ?? null,
        postedAt: new Date().toISOString(),
        provider: 'stub',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Post failed' },
      { status: 500 },
    );
  }
}