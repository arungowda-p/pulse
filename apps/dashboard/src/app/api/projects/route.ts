import { NextRequest, NextResponse } from 'next/server';
import { getAllProjects, createProject } from '../../../lib/project-store';

export async function GET() {
  const projects = await getAllProjects();
  return NextResponse.json(projects);
}

export async function POST(request: NextRequest) {
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
