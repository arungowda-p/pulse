import { NextRequest, NextResponse } from 'next/server';
import { evaluateFlag } from '../../../../../lib/flags-store';

export async function GET(
  request: NextRequest,
  { params }: { params: { projectSlug: string; flagKey: string } },
) {
  const environmentId =
    request.nextUrl.searchParams.get('environmentId') || undefined;
  const clientId =
    request.nextUrl.searchParams.get('clientId') || undefined;

  const result = await evaluateFlag(
    params.projectSlug,
    params.flagKey,
    environmentId,
    clientId,
  );

  if (!result) {
    return NextResponse.json(
      { error: 'Flag not found', key: params.flagKey },
      { status: 404 },
    );
  }

  return NextResponse.json(result);
}
