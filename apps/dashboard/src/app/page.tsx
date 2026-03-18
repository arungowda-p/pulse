'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../components/ui';
import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';
import { ProjectModal } from '../components/ProjectModal';
import { HiPlus, HiFolder, HiFlag, HiServerStack } from 'react-icons/hi2';
import type { ProjectWithCounts } from '../types/flag';

const API = '/api';

async function request<T>(
  method: string,
  path: string,
  body?: object,
): Promise<T> {
  const opts: RequestInit = { method, headers: {} };
  if (body) {
    (opts.headers as Record<string, string>)['Content-Type'] =
      'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(API + path, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export default function ProjectListPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const list = await request<ProjectWithCounts[]>('GET', '/projects');
      setProjects(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreate = async (payload: { name: string }) => {
    await request('POST', '/projects', payload);
    setModal(false);
    loadProjects();
  };

  const handleDelete = async (slug: string) => {
    if (!confirm(`Delete project "${slug}" and all its flags, clients, and overrides?`))
      return;
    try {
      await request('DELETE', `/projects/${slug}`);
      loadProjects();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <PageHeader
          title="Projects"
          description="Each project contains feature flags, environments, and clients."
          actions={
            projects.length > 0 ? (
              <Button
                size="md"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                leftIcon={<HiPlus className="h-4 w-4 shrink-0" />}
                onClick={() => setModal(true)}
              >
                New project
              </Button>
            ) : undefined
          }
        />

        <main>
          {loading ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-16 shadow-sm">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
              <p className="mt-4 text-sm text-slate-500">
                Loading projects...
              </p>
            </div>
          ) : projects.length === 0 ? (
            <EmptyState
              title="No projects yet"
              description="Create your first project to start managing feature flags across clients."
              icon={<HiFolder className="h-6 w-6" />}
              action={
                <Button
                  size="lg"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-base font-medium text-white shadow-sm transition-colors hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  leftIcon={<HiPlus className="h-4 w-4 shrink-0" />}
                  onClick={() => setModal(true)}
                >
                  Create project
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {projects.map((p) => (
                <div
                  key={p.id}
                  className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm transition-colors hover:border-indigo-200 hover:bg-indigo-50/30 cursor-pointer"
                  onClick={() => router.push(`/projects/${p.slug}`)}
                >
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-700">
                      {p.name}
                    </h3>
                    <div className="mt-1.5 flex items-center gap-4 text-sm text-slate-500">
                      <span className="inline-flex items-center gap-1.5">
                        <HiFlag className="h-3.5 w-3.5" />
                        {p._count.flags} flag{p._count.flags !== 1 ? 's' : ''}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <HiServerStack className="h-3.5 w-3.5" />
                        {p._count.environments} env
                        {p._count.environments !== 1 ? 's' : ''}
                      </span>
                      <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-500">
                        {p.slug}
                      </code>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(p.slug);
                    }}
                    className="ml-4 rounded-lg p-2 text-slate-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                    aria-label={`Delete ${p.name}`}
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {modal && (
        <ProjectModal
          onClose={() => setModal(false)}
          onSave={handleCreate}
        />
      )}
    </div>
  );
}
