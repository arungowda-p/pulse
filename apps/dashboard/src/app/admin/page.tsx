'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../../components/ui';
import { PageHeader } from '../../components/PageHeader';
import { UserModal } from '../../components/UserModal';
import { ConfirmModal } from '../../components/ConfirmModal';
import {
  HiPlus,
  HiArrowLeft,
  HiMagnifyingGlass,
  HiPencilSquare,
  HiTrash,
  HiChevronDown,
  HiChevronRight,
} from 'react-icons/hi2';
import type { AuthUser } from '../../types/flag';

interface UserWithAccess {
  id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  projects: { id: string; name: string; slug: string }[];
  clients: {
    id: string;
    name: string;
    environmentName: string;
    projectName: string;
    projectId: string;
  }[];
}

interface ProjectTreeNode {
  id: string;
  name: string;
  slug: string;
  environments: {
    id: string;
    name: string;
    slug: string;
    clients: { id: string; name: string }[];
  }[];
}

const API = '/api';

async function request<T>(method: string, path: string, body?: object): Promise<T> {
  const opts: RequestInit = { method, headers: {} };
  if (body) {
    (opts.headers as Record<string, string>)['Content-Type'] = 'application/json';
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

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  PROJECT_ADMIN: 'Project Admin',
  CLIENT_ADMIN: 'Client Admin',
};

const ROLE_BADGE: Record<string, string> = {
  ADMIN: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  PROJECT_ADMIN: 'bg-teal-50 text-teal-700 border-teal-200',
  CLIENT_ADMIN: 'bg-amber-50 text-amber-700 border-amber-200',
};

type ViewMode = 'table' | 'by-project';

export default function AdminPage() {
  const router = useRouter();
  const [me, setMe] = useState<AuthUser | null>(null);
  const [users, setUsers] = useState<UserWithAccess[]>([]);
  const [projectTree, setProjectTree] = useState<ProjectTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [modal, setModal] = useState<'create' | UserWithAccess | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; username: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [meData, userData, treeData] = await Promise.all([
        request<AuthUser>('GET', '/auth/me'),
        request<UserWithAccess[]>('GET', '/users'),
        request<ProjectTreeNode[]>('GET', '/projects/tree'),
      ]);
      setMe(meData);
      setUsers(userData);
      setProjectTree(treeData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        ROLE_LABELS[u.role]?.toLowerCase().includes(q) ||
        u.projects.some((p) => p.name.toLowerCase().includes(q)) ||
        u.clients.some((c) => c.name.toLowerCase().includes(q)),
    );
  }, [users, search]);

  const byProject = useMemo(() => {
    const map = new Map<string, { project: ProjectTreeNode; users: UserWithAccess[] }>();

    for (const p of projectTree) {
      map.set(p.id, { project: p, users: [] });
    }

    for (const u of filtered) {
      if (u.role === 'ADMIN') {
        for (const entry of map.values()) {
          if (!entry.users.find((eu) => eu.id === u.id)) {
            entry.users.push(u);
          }
        }
        continue;
      }
      for (const proj of u.projects) {
        const entry = map.get(proj.id);
        if (entry && !entry.users.find((eu) => eu.id === u.id)) {
          entry.users.push(u);
        }
      }
      for (const cl of u.clients) {
        const entry = map.get(cl.projectId);
        if (entry && !entry.users.find((eu) => eu.id === u.id)) {
          entry.users.push(u);
        }
      }
    }

    return Array.from(map.values()).filter((e) => e.users.length > 0);
  }, [filtered, projectTree]);

  const toggleProject = (projectId: string) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  };

  const expandAll = () =>
    setExpandedProjects(new Set(byProject.map((e) => e.project.id)));
  const collapseAll = () => setExpandedProjects(new Set());

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await request('DELETE', `/users/${deleteTarget.id}`);
      setDeleteTarget(null);
      loadData();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  const isAdmin = me?.role === 'ADMIN';

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <p className="mt-4 text-sm text-slate-500">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <button
          onClick={() => router.push('/')}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-indigo-600"
        >
          <HiArrowLeft className="h-4 w-4" />
          Back to Projects
        </button>

        <PageHeader
          title="User Management"
          description="Manage users and their access to projects and clients."
          actions={
            isAdmin ? (
              <Button
                size="md"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-500"
                leftIcon={<HiPlus className="h-4 w-4 shrink-0" />}
                onClick={() => setModal('create')}
              >
                Add User
              </Button>
            ) : undefined
          }
        />

        {/* Search + View toggle */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-sm">
            <HiMagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search users, projects, clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Users
            </button>
            <button
              onClick={() => setViewMode('by-project')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === 'by-project'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              By Project
            </button>
          </div>
        </div>

        {/* Table view */}
        {viewMode === 'table' && (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {filtered.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <p className="text-lg font-semibold text-slate-900">
                  {search ? 'No matching users' : 'No users yet'}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {search
                    ? 'Try a different search term.'
                    : 'Create the first user to get started.'}
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    <th className="px-5 py-3 font-semibold text-slate-600">User</th>
                    <th className="px-5 py-3 font-semibold text-slate-600">Role</th>
                    <th className="px-5 py-3 font-semibold text-slate-600">Access</th>
                    <th className="px-5 py-3 text-right font-semibold text-slate-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((u) => (
                    <UserRow
                      key={u.id}
                      user={u}
                      isAdmin={isAdmin}
                      isSelf={u.id === me?.id}
                      onEdit={() => setModal(u)}
                      onDelete={() => setDeleteTarget({ id: u.id, username: u.username })}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Grouped by project view — collapsible */}
        {viewMode === 'by-project' && (
          <div className="space-y-3">
            {byProject.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
                <p className="text-lg font-semibold text-slate-900">No users found</p>
                <p className="mt-1 text-sm text-slate-500">
                  {search ? 'Try a different search term.' : 'Assign users to projects or clients.'}
                </p>
              </div>
            ) : (
              <>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={expandAll}
                    className="text-xs font-medium text-indigo-600 transition-colors hover:text-indigo-500"
                  >
                    Expand all
                  </button>
                  <span className="text-xs text-slate-300">|</span>
                  <button
                    onClick={collapseAll}
                    className="text-xs font-medium text-indigo-600 transition-colors hover:text-indigo-500"
                  >
                    Collapse all
                  </button>
                </div>

                {byProject.map(({ project, users: projectUsers }) => {
                  const isExpanded = expandedProjects.has(project.id);
                  const totalClients = project.environments.reduce(
                    (n, e) => n + e.clients.length,
                    0,
                  );
                  return (
                    <div
                      key={project.id}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                    >
                      <button
                        type="button"
                        onClick={() => toggleProject(project.id)}
                        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-slate-50/60"
                      >
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <HiChevronDown className="h-4 w-4 text-slate-400" />
                          ) : (
                            <HiChevronRight className="h-4 w-4 text-slate-400" />
                          )}
                          <div>
                            <h3 className="text-sm font-semibold text-slate-800">
                              {project.name}
                            </h3>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {project.environments.length} env
                              {project.environments.length !== 1 ? 's' : ''}
                              {' · '}
                              {totalClients} client{totalClients !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                          {projectUsers.length} user{projectUsers.length !== 1 ? 's' : ''}
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="border-t border-slate-100">
                          <table className="w-full text-left text-sm">
                            <tbody className="divide-y divide-slate-100">
                              {projectUsers.map((u) => (
                                <UserRow
                                  key={u.id}
                                  user={u}
                                  isAdmin={isAdmin}
                                  isSelf={u.id === me?.id}
                                  onEdit={() => setModal(u)}
                                  onDelete={() =>
                                    setDeleteTarget({ id: u.id, username: u.username })
                                  }
                                  scopeProjectId={project.id}
                                />
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>

      {modal !== null && (
        <UserModal
          mode={modal === 'create' ? 'create' : 'edit'}
          user={modal === 'create' ? undefined : modal}
          projectTree={projectTree}
          currentUserRole={me?.role ?? 'CLIENT_ADMIN'}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            loadData();
          }}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete User"
          message={`Are you sure you want to delete "${deleteTarget.username}"? This will remove all their project and client access. This action cannot be undone.`}
          confirmLabel="Delete User"
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

function UserRow({
  user,
  isAdmin,
  isSelf,
  onEdit,
  onDelete,
  scopeProjectId,
}: {
  user: UserWithAccess;
  isAdmin: boolean;
  isSelf: boolean;
  onEdit: () => void;
  onDelete: () => void;
  scopeProjectId?: string;
}) {
  const clientsForScope = scopeProjectId
    ? user.clients.filter((c) => c.projectId === scopeProjectId)
    : user.clients;

  return (
    <tr className="group transition-colors hover:bg-slate-50/60">
      <td className="px-5 py-3.5">
        <p className="font-medium text-slate-900">{user.username}</p>
        <p className="mt-0.5 text-xs text-slate-500">{user.email}</p>
      </td>
      <td className="px-5 py-3.5">
        <span
          className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${
            ROLE_BADGE[user.role] || 'bg-slate-100 text-slate-600'
          }`}
        >
          {ROLE_LABELS[user.role] || user.role}
        </span>
      </td>
      <td className="max-w-xs px-5 py-3.5">
        {user.role === 'ADMIN' ? (
          <span className="text-xs font-medium text-indigo-600">Full access</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {!scopeProjectId &&
              user.projects.map((p) => (
                <span
                  key={p.id}
                  className="inline-block rounded-md bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700"
                >
                  {p.name}
                </span>
              ))}
            {clientsForScope.map((c) => (
              <span
                key={c.id}
                className="inline-block rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700"
                title={`${c.projectName} / ${c.environmentName}`}
              >
                {c.name}
                {!scopeProjectId && (
                  <span className="ml-1 text-amber-500">({c.environmentName})</span>
                )}
              </span>
            ))}
            {user.projects.length === 0 && clientsForScope.length === 0 && (
              <span className="text-xs text-slate-400">No access assigned</span>
            )}
          </div>
        )}
      </td>
      <td className="px-5 py-3.5 text-right">
        <div className="flex items-center justify-end gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
            aria-label={`Edit ${user.username}`}
          >
            <HiPencilSquare className="h-3.5 w-3.5" />
          </button>
          {isAdmin && !isSelf && (
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              aria-label={`Delete ${user.username}`}
            >
              <HiTrash className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
