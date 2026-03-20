import { NextRequest, NextResponse } from 'next/server';
import { getUserByLogin } from '../../../../lib/user-store';
import { verifyPassword, createToken, setAuthCookie, type AuthUser } from '../../../../lib/auth';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { login, password } = body as { login?: string; password?: string };

  if (!login || !password) {
    return NextResponse.json(
      { error: 'Username/email and password are required' },
      { status: 400 },
    );
  }

  const user = await getUserByLogin(login.trim().toLowerCase());
  if (!user) {
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 },
    );
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 },
    );
  }

  const authUser: AuthUser = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role as AuthUser['role'],
  };

  const token = await createToken(authUser);
  const response = NextResponse.json(authUser);
  setAuthCookie(response, token);
  return response;
}
