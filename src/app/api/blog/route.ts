import { promises as fs } from 'fs';
import path from 'path';
import { BlogIndex } from '@/lib/types';
import { BlogIndexSchema } from '@/lib/validation/blog';
import { getSession } from '@/lib/auth/guards';

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

const DATA_DIR = path.join(process.cwd(), 'data');
const BLOG_JSON_PATH = path.join(DATA_DIR, 'blog.json');

async function ensureDataDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readBlogIndex(): Promise<BlogIndex | null> {
  try {
    const raw = await fs.readFile(BLOG_JSON_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    const z = BlogIndexSchema.safeParse(parsed);
    if (!z.success) return null;
    return z.data;
  } catch {
    return null;
  }
}

async function writeBlogIndex(index: BlogIndex): Promise<void> {
  await ensureDataDir();
  const tmp = `${BLOG_JSON_PATH}.tmp`;
  const payload = JSON.stringify(index, null, 2) + '\n';
  await fs.writeFile(tmp, payload, 'utf8');
  await fs.rename(tmp, BLOG_JSON_PATH);
}

// GET /api/blog - return current blog index from data/blog.json (404 if missing/invalid)
export async function GET() {
  try {
    const data = await readBlogIndex();
    if (!data) return json({ error: 'Not found' }, { status: 404 });
    return json(data, { status: 200 });
  } catch (e: any) {
    return json({ error: e?.message ?? 'Failed to read blog' }, { status: 500 });
  }
}

// POST /api/blog - replace blog index (requires login); body is BlogIndex
export async function POST(req: Request) {
  try {
    const sess = getSession(req);
    if (!sess.userId) return json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => null);
    const parsed = BlogIndexSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues?.[0];
      return json(
        {
          error: 'Validation failed',
          path: first?.path?.join('.') ?? '',
          message: first?.message ?? parsed.error.message,
        },
        { status: 400 },
      );
    }

    await writeBlogIndex(parsed.data);
    return json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return json({ error: e?.message ?? 'Failed to write blog' }, { status: 500 });
  }
}