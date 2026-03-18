import { NextRequest, NextResponse } from 'next/server';
import {
  getProject,
  updateProject,
  deleteProject,
} from '../../../../lib/project-store';

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } },
) {
  const project = await getProject(params.slug);
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }
  return NextResponse.json(project);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string } },
) {
  const body = await request.json();
  const project = await updateProject(params.slug, body);
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }
  return NextResponse.json(project);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { slug: string } },
) {
  const deleted = await deleteProject(params.slug);
  if (!deleted) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
}
