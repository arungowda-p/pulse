import { NextRequest, NextResponse } from 'next/server';
import {
  setEnvOverride,
  removeEnvOverride,
} from '../../../../../../../../lib/flags-store';

export async function PUT(
  request: NextRequest,
  {
    params,
  }: { params: { slug: string; key: string; environmentId: string } },
) {
  const body = await request.json();
  const result = await setEnvOverride(
    params.slug,
    params.key,
    params.environmentId,
    !!body.on,
  );
  if (!result) {
    return NextResponse.json(
      { error: 'Flag or environment not found' },
      { status: 404 },
    );
  }
  return NextResponse.json(result);
}

export async function DELETE(
  _request: NextRequest,
  {
    params,
  }: { params: { slug: string; key: string; environmentId: string } },
) {
  const removed = await removeEnvOverride(
    params.slug,
    params.key,
    params.environmentId,
  );
  if (!removed) {
    return NextResponse.json(
      { error: 'Override not found' },
      { status: 404 },
    );
  }
  return new NextResponse(null, { status: 204 });
}
