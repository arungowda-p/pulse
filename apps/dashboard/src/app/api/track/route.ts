import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const eventName =
    body && typeof body.eventName === 'string' ? body.eventName.trim() : '';
  const projectSlug =
    body && typeof body.projectSlug === 'string' ? body.projectSlug.trim() : '';

  if (!eventName) {
    return NextResponse.json(
      { error: 'eventName is required' },
      { status: 400 },
    );
  }

  // MVP tracking sink. Replace with durable storage/queue later.
  console.info('[track]', {
    eventName,
    projectSlug: projectSlug || undefined,
    context: body?.context ?? null,
    data: body?.data ?? null,
    ts: Date.now(),
  });

  return NextResponse.json({ ok: true }, { status: 202 });
}
