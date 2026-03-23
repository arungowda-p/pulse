import { NextRequest, NextResponse } from 'next/server';
import { getFlagsForProject } from '../../../../lib/flags-store';

function resolveFlagValue(
  flag: {
    key: string;
    on: boolean;
    overrides: { clientId: string; on: boolean }[];
    envOverrides: { environmentId: string; on: boolean }[];
  },
  environmentId?: string,
  clientId?: string,
): boolean {
  if (clientId) {
    const clientOverride = flag.overrides.find((o) => o.clientId === clientId);
    if (clientOverride) return clientOverride.on;
  }

  if (environmentId) {
    const envOverride = flag.envOverrides.find(
      (o) => o.environmentId === environmentId,
    );
    if (envOverride) return envOverride.on;
  }

  return flag.on;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectSlug: string }> },
) {
  const { projectSlug } = await params;
  const environmentId =
    request.nextUrl.searchParams.get('environmentId') || undefined;
  const clientId = request.nextUrl.searchParams.get('clientId') || undefined;

  const flags = await getFlagsForProject(projectSlug);
  const evaluated = Object.fromEntries(
    flags.map((flag) => [
      flag.key,
      resolveFlagValue(flag, environmentId, clientId),
    ]),
  );

  return NextResponse.json({
    projectSlug,
    flags: evaluated,
  });
}
