import { NextRequest, NextResponse } from 'next/server';
import { updateClient, deleteClient } from '../../../../../../../../lib/client-store';
import { requireAuth, requireProjectAccess } from '../../../../../../../../lib/auth';

export async function PATCH(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ slug: string; envSlug: string; clientId: string }> },
) {
  const { slug, clientId } = await params;
  const auth = await requireAuth(request, ['ADMIN', 'PROJECT_ADMIN']);
  if (auth instanceof NextResponse) return auth;

  if (auth.role === 'PROJECT_ADMIN') {
    const accessCheck = await requireProjectAccess(request, slug);
    if (accessCheck instanceof NextResponse) return accessCheck;
  }

  const body = await request.json();
  const client = await updateClient(clientId, body);
  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }
  return NextResponse.json(client);
}

export async function DELETE(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ slug: string; envSlug: string; clientId: string }> },
) {
  const { slug, clientId } = await params;
  const auth = await requireAuth(request, ['ADMIN', 'PROJECT_ADMIN']);
  if (auth instanceof NextResponse) return auth;

  if (auth.role === 'PROJECT_ADMIN') {
    const accessCheck = await requireProjectAccess(request, slug);
    if (accessCheck instanceof NextResponse) return accessCheck;
  }

  const deleted = await deleteClient(clientId);
  if (!deleted) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
}
