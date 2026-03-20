'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { AuthUser } from '../types/flag';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  PROJECT_ADMIN: 'Project Admin',
  CLIENT_ADMIN: 'Client Admin',
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  PROJECT_ADMIN: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  CLIENT_ADMIN: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
};

export function AuthNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const isLoginPage = pathname === '/login';

  useEffect(() => {
    if (isLoginPage) return;

    let cancelled = false;
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setUser(data);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, [isLoginPage, pathname]);

  if (isLoginPage || !user) return null;

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 shadow-sm">
            <svg
              className="h-4 w-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
              />
            </svg>
          </div>
          <span className="text-lg font-bold text-slate-900">Pulse</span>
        </button>

        <div className="flex items-center gap-3">
          {(user.role === 'ADMIN' || user.role === 'PROJECT_ADMIN') && (
            <button
              onClick={() => router.push('/admin')}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                pathname === '/admin'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }`}
            >
              Users
            </button>
          )}

          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-slate-900">
                {user.username}
              </p>
            </div>
            <span
              className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${ROLE_COLORS[user.role] || 'bg-slate-100 text-slate-500'}`}
            >
              {ROLE_LABELS[user.role] || user.role}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
