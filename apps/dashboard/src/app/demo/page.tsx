'use client';

import Link from 'next/link';
import { usePulseFlag, usePulseFlags } from '@pulse/sdk/react';

export default function DemoPage() {
  const options = {
    baseUrl: typeof window === 'undefined' ? '' : window.location.origin,
    projectSlug: 'pulse-demo',
    context: {
      environmentId: 'production',
    },
    defaultValue: false,
    autoRefreshMs: 2000,
  };

  const {
    value: checkoutOn,
    loading,
    connected,
    error,
    track,
  } = usePulseFlag('new-checkout', options);
  const { flags } = usePulseFlags(options);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="w-full px-4 py-10 sm:px-6 lg:px-8 xl:px-10">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight">
            Pulse SDK playground
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Live flag evaluation using <code>@pulse/sdk/react</code> with SSE.
          </p>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-slate-600">Flag:</span>
              <code className="rounded bg-slate-200 px-2 py-0.5 font-mono text-xs">
                new-checkout
              </code>
              <span className="text-slate-400">=</span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  checkoutOn
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {loading ? 'Loading...' : checkoutOn ? 'ON' : 'OFF'}
              </span>
            </div>

            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <span
                className={`h-2 w-2 rounded-full ${
                  connected ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
              {connected ? 'SSE connected' : 'SSE reconnecting'}
            </div>

            {error ? (
              <p className="mt-2 text-xs text-red-600">Error: {error}</p>
            ) : null}
          </div>

          <div className="mt-6">
            <h2 className="text-sm font-semibold text-slate-700">All flags</h2>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">
              {JSON.stringify(flags, null, 2)}
            </pre>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() =>
                track('playground_cta_clicked', { page: 'playground' })
              }
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
            >
              Track Demo Event
            </button>
            <Link
              href="/"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Open dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
