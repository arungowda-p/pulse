'use client';

import { ReactNode } from 'react';
import { HiFlag } from 'react-icons/hi2';

interface EmptyStateProps {
  title: string;
  description: string;
  action: ReactNode;
  icon?: ReactNode;
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: EmptyStateProps) {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-8 py-14 text-center shadow-sm">
      <div
        className="mb-5 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-500"
        aria-hidden
      >
        {icon ?? <HiFlag className="h-6 w-6" />}
      </div>
      <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-600">
        {description}
      </p>
      <div className="mt-8 flex justify-center">{action}</div>
    </div>
  );
}
