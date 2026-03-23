import { NextRequest, NextResponse } from 'next/server';
import { getCorsHeaders } from '../../../lib/cors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const eventName =
    body && typeof body.eventName === 'string' ? body.eventName.trim() : '';
  const projectSlug =
    body && typeof body.projectSlug === 'string' ? body.projectSlug.trim() : '';
  const corsHeaders = await getCorsHeaders(request, projectSlug || undefined);

  if (!eventName) {
    return NextResponse.json(
      { error: 'eventName is required' },
      { status: 400, headers: corsHeaders },
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

  return NextResponse.json({ ok: true }, { status: 202, headers: corsHeaders });
}

export async function OPTIONS(request: NextRequest) {
  const corsHeaders = await getCorsHeaders(request);
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}
