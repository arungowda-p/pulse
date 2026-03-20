'use client';

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-white">
      <div className="flex flex-col items-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        <p className="mt-4 text-sm text-slate-500">Loading...</p>
      </div>
    </div>
  );
}
