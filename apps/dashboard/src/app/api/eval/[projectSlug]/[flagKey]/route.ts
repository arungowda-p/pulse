import { NextRequest, NextResponse } from 'next/server';
import { evaluateFlag } from '../../../../../lib/flags-store';
import { getCorsHeaders } from '../../../../../lib/cors';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectSlug: string; flagKey: string }> },
) {
  const { projectSlug, flagKey } = await params;
  const corsHeaders = await getCorsHeaders(request, projectSlug);
  const environmentId =
    request.nextUrl.searchParams.get('environmentId') || undefined;
  const clientId =
    request.nextUrl.searchParams.get('clientId') || undefined;

  const result = await evaluateFlag(
    projectSlug,
    flagKey,
    environmentId,
    clientId,
  );

  if (!result) {
    return NextResponse.json(
      { error: 'Flag not found', key: flagKey },
      { status: 404, headers: corsHeaders },
    );
  }

  return NextResponse.json(result, { headers: corsHeaders });
}
