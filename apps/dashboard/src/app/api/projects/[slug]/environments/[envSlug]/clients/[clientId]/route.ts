import { NextRequest, NextResponse } from 'next/server';
import { updateClient, deleteClient } from '../../../../../../../../lib/client-store';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string; envSlug: string; clientId: string } },
) {
  const body = await request.json();
  const client = await updateClient(params.clientId, body);
  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }
  return NextResponse.json(client);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { slug: string; envSlug: string; clientId: string } },
) {
  const deleted = await deleteClient(params.clientId);
  if (!deleted) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
}
