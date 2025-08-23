import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Media upload API (stub)
 * Accepts multipart/form-data with a "file" field and returns a fake remote URL.
 * This is a stub for Milestone E; wire to Supabase/S3 in a later milestone.
 */
export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Expected multipart/form-data' },
        { status: 400 },
      );
    }

    const form = await req.formData();
    const file = form.get('file');
    const alt = form.get('alt')?.toString() || '';

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Missing file field' }, { status: 400 });
    }

    // Stub: pretend we uploaded to remote storage and return a stable URL.
    // In a real implementation, you would stream to Supabase/S3 and return the resulting URL.
    const safeName = encodeURIComponent(file.name || 'upload.bin');
    const url = `https://example-cdn.invalid/uploads/${safeName}`;

    return NextResponse.json({
      url,
      alt,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString(),
      provider: 'stub',
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Upload failed' },
      { status: 500 },
    );
  }
}