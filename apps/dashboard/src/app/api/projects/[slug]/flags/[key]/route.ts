import { NextRequest, NextResponse } from 'next/server';
import {
  getFlag,
  updateFlag,
  deleteFlag,
} from '../../../../../../lib/flags-store';

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string; key: string } },
) {
  const flag = await getFlag(params.slug, params.key);
  if (!flag) {
    return NextResponse.json({ error: 'Flag not found' }, { status: 404 });
  }
  return NextResponse.json(flag);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string; key: string } },
) {
  const body = await request.json();
  const flag = await updateFlag(params.slug, params.key, body);
  if (!flag) {
    return NextResponse.json({ error: 'Flag not found' }, { status: 404 });
  }
  return NextResponse.json(flag);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { slug: string; key: string } },
) {
  const deleted = await deleteFlag(params.slug, params.key);
  if (!deleted) {
    return NextResponse.json({ error: 'Flag not found' }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
}
