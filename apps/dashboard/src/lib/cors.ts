import { NextRequest } from 'next/server';
import {
  isOriginAllowedForAnyProject,
  isOriginAllowedForProject,
} from './project-store';

const DEFAULT_ALLOWED_ORIGINS = new Set([
  'http://localhost:4000',
  'http://localhost:4001',
  'http://localhost:4200',
]);

async function isOriginAllowed(
  origin: string,
  projectSlug?: string,
): Promise<boolean> {
  if (DEFAULT_ALLOWED_ORIGINS.has(origin)) return true;

  if (projectSlug) {
    return isOriginAllowedForProject(projectSlug, origin);
  }

  return isOriginAllowedForAnyProject(origin);
}

export async function getCorsHeaders(
  request: NextRequest,
  projectSlug?: string,
): Promise<Record<string, string>> {
  const origin = request.headers.get('origin') || '';

  const headers: Record<string, string> = {
    Vary: 'Origin',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (origin && (await isOriginAllowed(origin, projectSlug))) {
    headers['Access-Control-Allow-Origin'] = origin;
  }

  return headers;
}
