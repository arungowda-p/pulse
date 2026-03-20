import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/auth';
import { getProjectTree } from '../../../../lib/user-store';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, ['ADMIN', 'PROJECT_ADMIN']);
  if (auth instanceof NextResponse) return auth;

  const tree = await getProjectTree(auth.id, auth.role);
  return NextResponse.json(tree);
}
