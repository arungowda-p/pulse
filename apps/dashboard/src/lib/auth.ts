import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from './prisma';

const SALT_ROUNDS = 10;
const COOKIE_NAME = 'pulse-token';
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'pulse-dev-secret-change-in-production',
);

export type Role = 'ADMIN' | 'PROJECT_ADMIN' | 'CLIENT_ADMIN';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: Role;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createToken(user: AuthUser): Promise<string> {
  return new SignJWT({
    sub: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      id: payload.sub as string,
      username: payload.username as string,
      email: payload.email as string,
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}

export function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

export async function getAuthUser(
  request: NextRequest,
): Promise<AuthUser | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireAuth(
  request: NextRequest,
  allowedRoles?: Role[],
): Promise<AuthUser | NextResponse> {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return user;
}

export async function requireProjectAccess(
  request: NextRequest,
  projectSlug: string,
): Promise<AuthUser | NextResponse> {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (user.role === 'ADMIN') return user;

  const project = await prisma.project.findUnique({
    where: { slug: projectSlug },
    select: { id: true },
  });
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  if (user.role === 'PROJECT_ADMIN') {
    const access = await prisma.userProjectAccess.findUnique({
      where: { userId_projectId: { userId: user.id, projectId: project.id } },
    });
    if (!access) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return user;
  }

  if (user.role === 'CLIENT_ADMIN') {
    const clientAccess = await prisma.userClientAccess.findFirst({
      where: { userId: user.id },
      include: { client: { include: { environment: true } } },
    });
    if (!clientAccess || clientAccess.client.environment.projectId !== project.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return user;
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

export async function requireClientAccess(
  request: NextRequest,
  clientId: string,
): Promise<AuthUser | NextResponse> {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (user.role === 'ADMIN') return user;

  if (user.role === 'PROJECT_ADMIN') {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: { environment: true },
    });
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    const access = await prisma.userProjectAccess.findUnique({
      where: {
        userId_projectId: {
          userId: user.id,
          projectId: client.environment.projectId,
        },
      },
    });
    if (!access) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return user;
  }

  if (user.role === 'CLIENT_ADMIN') {
    const access = await prisma.userClientAccess.findUnique({
      where: { userId_clientId: { userId: user.id, clientId } },
    });
    if (!access) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return user;
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

export function getTokenFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]*)`));
  return match ? match[1] : null;
}
