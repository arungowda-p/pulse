'use client';

import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <header className="mb-8 rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm sm:px-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-1.5 text-slate-600 sm:text-base">{description}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
}
