import { NextRequest, NextResponse } from 'next/server';
import { getAllProjects, createProject } from '../../../lib/project-store';
import { requireAuth } from '../../../lib/auth';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  if (auth.role === 'ADMIN') {
    const projects = await getAllProjects();
    return NextResponse.json(projects);
  }

  const { getAccessibleProjects } = await import('../../../lib/user-store');
  const projects = await getAccessibleProjects(auth.id, auth.role);
  return NextResponse.json(projects);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, ['ADMIN']);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  const result = await createProject(body);

  if ('error' in result) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json(result, { status: 201 });
}
