'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Button,
  Badge,
  Toggle,
  Table,
  TableContainer,
} from '../../../components/ui';
import { PageHeader } from '../../../components/PageHeader';
import { FlagModal } from '../../../components/FlagModal';
import { ClientModal } from '../../../components/ClientModal';
import { EnvironmentModal } from '../../../components/EnvironmentModal';
import { ConfirmModal } from '../../../components/ConfirmModal';
import {
  HiPlus,
  HiArrowLeft,
  HiPencilSquare,
  HiTrash,
  HiArrowPath,
} from 'react-icons/hi2';
import type {
  Project,
  Environment,
  Client,
  Flag,
  FlagWithOverrides,
} from '../../../types/flag';

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

export default function ProjectDashboard() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = params.slug;

  const [project, setProject] = useState<Project | null>(null);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [flags, setFlags] = useState<FlagWithOverrides[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeEnv, setActiveEnv] = useState<'project' | string>('project');
  const [activeClient, setActiveClient] = useState<'env' | string>('env');

  const [flagModal, setFlagModal] = useState<'create' | Flag | null>(null);
  const [clientModal, setClientModal] = useState(false);
  const [envModal, setEnvModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'flag' | 'env' | 'client';
    id: string;
    label: string;
  } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [busyActions, setBusyActions] = useState<Set<string>>(new Set());

  const markBusy = (key: string) =>
    setBusyActions((prev) => new Set(prev).add(key));
  const clearBusy = (key: string) =>
    setBusyActions((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });

  const selectedEnv =
    activeEnv !== 'project'
      ? environments.find((e) => e.id === activeEnv)
      : null;

  const loadCore = useCallback(async () => {
    setLoading(true);
    try {
      const [p, envs, f] = await Promise.all([
        request<Project>('GET', `/projects/${slug}`),
        request<Environment[]>('GET', `/projects/${slug}/environments`),
        request<FlagWithOverrides[]>('GET', `/projects/${slug}/flags`),
      ]);
      setProject(p);
      setEnvironments(envs);
      setFlags(f);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  const loadClients = useCallback(async () => {
    if (!selectedEnv) {
      setClients([]);
      return;
    }
    try {
      const c = await request<Client[]>(
        'GET',
        `/projects/${slug}/environments/${selectedEnv.slug}/clients`,
      );
      setClients(c);
    } catch {
      setClients([]);
    }
  }, [slug, selectedEnv]);

  useEffect(() => {
    loadCore();
  }, [loadCore]);

  useEffect(() => {
    setActiveClient('env');
    loadClients();
  }, [loadClients]);

  const reload = () => {
    loadCore();
    loadClients();
  };

  /* ── Toggle logic ─────────────────────────────────────── */

  const handleToggle = async (flag: FlagWithOverrides) => {
    const actionKey = `toggle-${flag.key}`;
    markBusy(actionKey);
    try {
      if (activeEnv === 'project') {
        const updated = await request<Flag>(
          'PATCH',
          `/projects/${slug}/flags/${flag.key}`,
          { on: !flag.on },
        );
        setFlags((prev) =>
          prev.map((f) =>
            f.key === flag.key ? { ...f, on: updated.on } : f,
          ),
        );
      } else if (activeClient === 'env') {
        const envId = activeEnv;
        const envOv = flag.envOverrides.find(
          (o) => o.environmentId === envId,
        );
        const currentValue = envOv ? envOv.on : flag.on;
        await request(
          'PUT',
          `/projects/${slug}/flags/${flag.key}/env-overrides/${envId}`,
          { on: !currentValue },
        );
        reload();
      } else {
        const clientId = activeClient;
        const clientOv = flag.overrides.find(
          (o) => o.clientId === clientId,
        );
        const envOv = flag.envOverrides.find(
          (o) => o.environmentId === activeEnv,
        );
        const currentValue = clientOv
          ? clientOv.on
          : envOv
            ? envOv.on
            : flag.on;
        await request(
          'PUT',
          `/projects/${slug}/flags/${flag.key}/overrides/${clientId}`,
          { on: !currentValue },
        );
        reload();
      }
    } finally {
      clearBusy(actionKey);
    }
  };

  const handleResetEnvOverride = async (
    flagKey: string,
    envId: string,
  ) => {
    const actionKey = `reset-${flagKey}`;
    markBusy(actionKey);
    try {
      await request(
        'DELETE',
        `/projects/${slug}/flags/${flagKey}/env-overrides/${envId}`,
      );
      reload();
    } finally {
      clearBusy(actionKey);
    }
  };

  const handleResetClientOverride = async (
    flagKey: string,
    clientId: string,
  ) => {
    const actionKey = `reset-${flagKey}`;
    markBusy(actionKey);
    try {
      await request(
        'DELETE',
        `/projects/${slug}/flags/${flagKey}/overrides/${clientId}`,
      );
      reload();
    } finally {
      clearBusy(actionKey);
    }
  };

  /* ── CRUD handlers ────────────────────────────────────── */

  const handleFlagSave = async (payload: {
    key?: string;
    name: string;
    description?: string;
    on?: boolean;
  }) => {
    if (flagModal === 'create' && payload.key) {
      await request('POST', `/projects/${slug}/flags`, {
        key: payload.key,
        name: payload.name,
        description: payload.description ?? '',
      });
    } else if (typeof flagModal === 'object' && flagModal?.key) {
      await request('PATCH', `/projects/${slug}/flags/${flagModal.key}`, {
        name: payload.name,
        description: payload.description ?? '',
        on: payload.on,
      });
    }
    setFlagModal(null);
    reload();
  };

  const handleDeleteFlag = (key: string) => {
    setDeleteConfirm({ type: 'flag', id: key, label: key });
  };

  const handleEnvSave = async (payload: { name: string }) => {
    await request('POST', `/projects/${slug}/environments`, payload);
    setEnvModal(false);
    reload();
  };

  const handleDeleteEnv = (envId: string) => {
    const env = environments.find((e) => e.id === envId);
    if (!env) return;
    setDeleteConfirm({ type: 'env', id: envId, label: env.name });
  };

  const handleClientSave = async (payload: { name: string }) => {
    if (!selectedEnv) return;
    await request(
      'POST',
      `/projects/${slug}/environments/${selectedEnv.slug}/clients`,
      payload,
    );
    setClientModal(false);
    loadClients();
  };

  const handleDeleteClient = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return;
    setDeleteConfirm({ type: 'client', id: clientId, label: client.name });
  };

  const executeDelete = async () => {
    if (!deleteConfirm) return;
    setDeleteLoading(true);
    try {
      if (deleteConfirm.type === 'flag') {
        await request('DELETE', `/projects/${slug}/flags/${deleteConfirm.id}`);
        reload();
      } else if (deleteConfirm.type === 'env') {
        const env = environments.find((e) => e.id === deleteConfirm.id);
        if (env) {
          await request('DELETE', `/projects/${slug}/environments/${env.slug}`);
          if (activeEnv === deleteConfirm.id) setActiveEnv('project');
          reload();
        }
      } else if (deleteConfirm.type === 'client') {
        if (selectedEnv) {
          await request(
            'DELETE',
            `/projects/${slug}/environments/${selectedEnv.slug}/clients/${deleteConfirm.id}`,
          );
          if (activeClient === deleteConfirm.id) setActiveClient('env');
          loadClients();
        }
      }
      setDeleteConfirm(null);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setDeleteLoading(false);
    }
  };

  /* ── Value resolution ─────────────────────────────────── */

  const resolveValue = (
    flag: FlagWithOverrides,
  ): { value: boolean; source: 'project' | 'env' | 'client' } => {
    if (activeEnv === 'project') {
      return { value: flag.on, source: 'project' };
    }

    const envOv = flag.envOverrides.find(
      (o) => o.environmentId === activeEnv,
    );
    const envValue = envOv ? envOv.on : flag.on;
    const hasEnvOverride = !!envOv;

    if (activeClient === 'env') {
      return {
        value: envValue,
        source: hasEnvOverride ? 'env' : 'project',
      };
    }

    const clientOv = flag.overrides.find(
      (o) => o.clientId === activeClient,
    );
    if (clientOv) {
      return { value: clientOv.on, source: 'client' };
    }
    return {
      value: envValue,
      source: hasEnvOverride ? 'env' : 'project',
    };
  };

  /* ── Render ───────────────────────────────────────────── */

  if (loading && !project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-white">
        <div className="flex flex-col items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <p className="mt-4 text-sm text-slate-500">
            Loading project...
          </p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-white">
        <p className="text-slate-500">Project not found.</p>
      </div>
    );
  }

  const isProjectTab = activeEnv === 'project';
  const isEnvDefault = activeClient === 'env';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <button
          onClick={() => router.push('/')}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-indigo-600"
        >
          <HiArrowLeft className="h-4 w-4" />
          All projects
        </button>

        <PageHeader
          title={project.name}
          description={`Slug: ${slug}`}
          actions={
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="md"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                leftIcon={<HiPlus className="h-4 w-4 shrink-0" />}
                onClick={() => setEnvModal(true)}
              >
                Add env
              </Button>
              {selectedEnv && (
                <Button
                  variant="outline"
                  size="md"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                  leftIcon={<HiPlus className="h-4 w-4 shrink-0" />}
                  onClick={() => setClientModal(true)}
                >
                  Add client
                </Button>
              )}
              <Button
                size="md"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-500"
                leftIcon={<HiPlus className="h-4 w-4 shrink-0" />}
                onClick={() => setFlagModal('create')}
              >
                Add flag
              </Button>
            </div>
          }
        />

        {/* Environment tabs */}
        <div className="mb-3">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Environment
          </label>
          <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
            <TabButton
              active={isProjectTab}
              onClick={() => setActiveEnv('project')}
            >
              Project Defaults
            </TabButton>
            {environments.map((env) => (
              <div
                key={env.id}
                className="group relative flex items-center"
              >
                <TabButton
                  active={activeEnv === env.id}
                  onClick={() => setActiveEnv(env.id)}
                >
                  {env.name}
                </TabButton>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteEnv(env.id);
                  }}
                  className="absolute -right-0.5 -top-0.5 hidden rounded-full bg-red-500 p-0.5 text-white shadow-sm group-hover:block"
                  aria-label={`Delete ${env.name}`}
                >
                  <svg
                    className="h-2.5 w-2.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Client tabs (only when an environment is selected) */}
        {!isProjectTab && (
          <div className="mb-6">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Client
            </label>
            <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
              <TabButton
                active={isEnvDefault}
                onClick={() => setActiveClient('env')}
                variant="secondary"
              >
                Env Default
              </TabButton>
              {clients.map((c) => (
                <div
                  key={c.id}
                  className="group relative flex items-center"
                >
                  <TabButton
                    active={activeClient === c.id}
                    onClick={() => setActiveClient(c.id)}
                    variant="secondary"
                  >
                    {c.name}
                  </TabButton>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClient(c.id);
                    }}
                    className="absolute -right-0.5 -top-0.5 hidden rounded-full bg-red-500 p-0.5 text-white shadow-sm group-hover:block"
                    aria-label={`Delete ${c.name}`}
                  >
                    <svg
                      className="h-2.5 w-2.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {isProjectTab && <div className="mb-6" />}

        {/* Flag table */}
        {flags.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-8 py-14 text-center shadow-sm">
            <p className="text-lg font-semibold text-slate-900">
              No flags yet
            </p>
            <p className="mt-2 max-w-sm text-sm text-slate-600">
              Create your first flag to start toggling features.
            </p>
            <div className="mt-6">
              <Button
                size="md"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-500"
                leftIcon={<HiPlus className="h-4 w-4 shrink-0" />}
                onClick={() => setFlagModal('create')}
              >
                Add flag
              </Button>
            </div>
          </div>
        ) : (
          <TableContainer>
            <Table>
              <Table.Header>
                <Table.HeaderRow>
                  <Table.HeadCell>Key</Table.HeadCell>
                  <Table.HeadCell>Name</Table.HeadCell>
                  <Table.HeadCell>Status</Table.HeadCell>
                  <Table.HeadCell align="right">Actions</Table.HeadCell>
                </Table.HeaderRow>
              </Table.Header>
              <Table.Body>
                {flags.map((flag) => {
                  const { value, source } = resolveValue(flag);
                  const showSourceBadge = !isProjectTab;
                  const sourceLabel =
                    source === 'client'
                      ? 'Custom'
                      : source === 'env'
                        ? isEnvDefault
                          ? 'Custom'
                          : 'Inherited (env)'
                        : 'Inherited';
                  const isCustom =
                    source === 'client' ||
                    (source === 'env' && isEnvDefault);

                  return (
                    <Table.Row key={flag.key}>
                      <Table.Cell>
                        <code className="rounded bg-indigo-50 px-2 py-1 font-mono text-xs font-medium text-indigo-700">
                          {flag.key}
                        </code>
                      </Table.Cell>
                      <Table.Cell className="font-medium text-slate-900">
                        {flag.name}
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex items-center gap-2">
                          <Badge variant={value ? 'on' : 'off'}>
                            {value ? 'On' : 'Off'}
                          </Badge>
                          {showSourceBadge && (
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                isCustom
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {sourceLabel}
                            </span>
                          )}
                        </div>
                      </Table.Cell>
                      <Table.Cell align="right">
                        <div className="flex flex-row items-center justify-end gap-2">
                          <Toggle
                            checked={value}
                            label={`Toggle ${flag.key}`}
                            loading={busyActions.has(`toggle-${flag.key}`)}
                            onClick={() => handleToggle(flag)}
                          />
                          {/* Reset env override */}
                          {!isProjectTab &&
                            isEnvDefault &&
                            source === 'env' && (
                              <button
                                type="button"
                                disabled={busyActions.has(`reset-${flag.key}`)}
                                onClick={() =>
                                  handleResetEnvOverride(
                                    flag.key,
                                    activeEnv,
                                  )
                                }
                                title="Reset to project default"
                                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {busyActions.has(`reset-${flag.key}`) ? (
                                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                                ) : (
                                  <HiArrowPath className="h-3.5 w-3.5" />
                                )}
                              </button>
                            )}
                          {/* Reset client override */}
                          {!isProjectTab &&
                            !isEnvDefault &&
                            source === 'client' && (
                              <button
                                type="button"
                                disabled={busyActions.has(`reset-${flag.key}`)}
                                onClick={() =>
                                  handleResetClientOverride(
                                    flag.key,
                                    activeClient,
                                  )
                                }
                                title="Reset to environment value"
                                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {busyActions.has(`reset-${flag.key}`) ? (
                                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                                ) : (
                                  <HiArrowPath className="h-3.5 w-3.5" />
                                )}
                              </button>
                            )}
                          {/* Edit / delete only on project tab */}
                          {isProjectTab && (
                            <>
                              <button
                                type="button"
                                onClick={() => setFlagModal(flag)}
                                aria-label={`Edit ${flag.key}`}
                                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
                              >
                                <HiPencilSquare className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteFlag(flag.key)
                                }
                                aria-label={`Delete ${flag.key}`}
                                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                              >
                                <HiTrash className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table>
          </TableContainer>
        )}
      </div>

      {flagModal !== null && (
        <FlagModal
          mode={flagModal === 'create' ? 'create' : 'edit'}
          flag={typeof flagModal === 'object' ? flagModal : undefined}
          onClose={() => setFlagModal(null)}
          onSave={handleFlagSave}
        />
      )}

      {envModal && (
        <EnvironmentModal
          onClose={() => setEnvModal(false)}
          onSave={handleEnvSave}
        />
      )}

      {clientModal && (
        <ClientModal
          onClose={() => setClientModal(false)}
          onSave={handleClientSave}
        />
      )}

      {deleteConfirm && (
        <ConfirmModal
          title={
            deleteConfirm.type === 'flag'
              ? 'Delete Flag'
              : deleteConfirm.type === 'env'
                ? 'Delete Environment'
                : 'Delete Client'
          }
          message={
            deleteConfirm.type === 'flag'
              ? `Delete flag "${deleteConfirm.label}" and all its overrides? This action cannot be undone.`
              : deleteConfirm.type === 'env'
                ? `Delete environment "${deleteConfirm.label}" and all its clients and overrides? This action cannot be undone.`
                : `Delete client "${deleteConfirm.label}" and all its flag overrides? This action cannot be undone.`
          }
          confirmLabel={
            deleteConfirm.type === 'flag'
              ? 'Delete Flag'
              : deleteConfirm.type === 'env'
                ? 'Delete Environment'
                : 'Delete Client'
          }
          loading={deleteLoading}
          onConfirm={executeDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
  variant = 'primary',
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}) {
  const activeClass =
    variant === 'primary'
      ? 'bg-indigo-600 text-white shadow-sm'
      : 'bg-teal-600 text-white shadow-sm';
  const inactiveClass =
    'text-slate-600 hover:bg-slate-100 hover:text-slate-900';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
        active ? activeClass : inactiveClass
      }`}
    >
      {children}
    </button>
  );
}
