'use client';

import { useState, useEffect } from 'react';
import { Button, Input } from './ui';

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

interface UserWithAccess {
  id: string;
  username: string;
  email: string;
  role: string;
  projects: { id: string; name: string; slug: string }[];
  clients: { id: string; name: string; environmentName: string; projectName: string; projectId: string }[];
}

interface UserModalProps {
  mode: 'create' | 'edit';
  user?: UserWithAccess;
  projectTree: ProjectTreeNode[];
  currentUserRole: string;
  onClose: () => void;
  onSaved: () => void;
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

type Role = 'ADMIN' | 'PROJECT_ADMIN' | 'CLIENT_ADMIN';

export function UserModal({
  mode,
  user,
  projectTree,
  currentUserRole,
  onClose,
  onSaved,
}: UserModalProps) {
  const [username, setUsername] = useState(user?.username ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>((user?.role as Role) ?? 'CLIENT_ADMIN');
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(
    new Set(user?.projects.map((p) => p.id) ?? []),
  );
  const [selectedClients, setSelectedClients] = useState<Set<string>>(
    new Set(user?.clients.map((c) => c.id) ?? []),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = currentUserRole === 'ADMIN';
  const isProjectAdmin = currentUserRole === 'PROJECT_ADMIN';

  useEffect(() => {
    if (role === 'ADMIN') {
      setSelectedProjects(new Set());
      setSelectedClients(new Set());
    } else if (role === 'PROJECT_ADMIN') {
      setSelectedClients(new Set());
    } else if (role === 'CLIENT_ADMIN') {
      setSelectedProjects(new Set());
    }
  }, [role]);

  const toggleProject = (id: string) => {
    setSelectedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleClient = (id: string) => {
    setSelectedClients((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      let userId = user?.id;

      if (mode === 'create') {
        const created = await request<{ id: string }>('POST', '/users', {
          username,
          email,
          password,
          role,
        });
        userId = created.id;
      } else if (userId) {
        const patch: Record<string, string> = {};
        if (username !== user?.username) patch.username = username;
        if (email !== user?.email) patch.email = email;
        if (password) patch.password = password;
        if (role !== user?.role) patch.role = role;
        if (Object.keys(patch).length > 0) {
          await request('PATCH', `/users/${userId}`, patch);
        }
      }

      if (!userId) throw new Error('Missing user id');

      if (role === 'PROJECT_ADMIN' && isAdmin) {
        const currentIds = new Set(user?.projects.map((p) => p.id) ?? []);
        for (const pid of selectedProjects) {
          if (!currentIds.has(pid)) {
            await request('POST', `/users/${userId}/projects`, { projectId: pid });
          }
        }
        for (const pid of currentIds) {
          if (!selectedProjects.has(pid)) {
            await request('DELETE', `/users/${userId}/projects`, { projectId: pid });
          }
        }
      }

      if (role === 'CLIENT_ADMIN' || isProjectAdmin) {
        const currentIds = new Set(user?.clients.map((c) => c.id) ?? []);
        for (const cid of selectedClients) {
          if (!currentIds.has(cid)) {
            await request('POST', `/users/${userId}/clients`, { clientId: cid });
          }
        }
        for (const cid of currentIds) {
          if (!selectedClients.has(cid)) {
            await request('DELETE', `/users/${userId}/clients`, { clientId: cid });
          }
        }
      }

      onSaved();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const showProjectAccess = role === 'PROJECT_ADMIN' && isAdmin;
  const showClientAccess = role === 'CLIENT_ADMIN' || (isProjectAdmin && mode === 'edit');

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-4 pt-[5vh] backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-slate-900">
          {mode === 'create' ? 'Add User' : 'Edit User'}
        </h2>

        <form onSubmit={handleSubmit} className="mt-5 space-y-6">
          {/* Details */}
          <div className="space-y-4">
            <Input
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="john-doe"
              required
              disabled={!isAdmin && mode === 'edit'}
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              required
              disabled={!isAdmin && mode === 'edit'}
            />
            {isAdmin && (
              <div className="w-full">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="ADMIN">Admin</option>
                  <option value="PROJECT_ADMIN">Project Admin</option>
                  <option value="CLIENT_ADMIN">Client Admin</option>
                </select>
              </div>
            )}
            <Input
              label={mode === 'create' ? 'Password' : 'New Password'}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'edit' ? 'Leave blank to keep current' : 'Min 6 characters'}
              required={mode === 'create'}
              disabled={!isAdmin}
            />
          </div>

          {/* Project access */}
          {showProjectAccess && (
            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-slate-700">
                Project Access
              </legend>
              {projectTree.length === 0 ? (
                <p className="text-sm text-slate-500">No projects available</p>
              ) : (
                <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-lg border border-slate-200 p-3">
                  {projectTree.map((p) => (
                    <label
                      key={p.id}
                      className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedProjects.has(p.id)}
                        onChange={() => toggleProject(p.id)}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-medium text-slate-800">{p.name}</span>
                      <span className="text-xs text-slate-400">{p.slug}</span>
                    </label>
                  ))}
                </div>
              )}
            </fieldset>
          )}

          {/* Client access */}
          {showClientAccess && (
            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-slate-700">
                Client Access
              </legend>
              {projectTree.length === 0 ? (
                <p className="text-sm text-slate-500">No clients available</p>
              ) : (
                <div className="max-h-56 space-y-3 overflow-y-auto rounded-lg border border-slate-200 p-3">
                  {projectTree.map((p) => {
                    const hasClients = p.environments.some((e) => e.clients.length > 0);
                    if (!hasClients) return null;
                    return (
                      <div key={p.id}>
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                          {p.name}
                        </p>
                        {p.environments.map((env) => {
                          if (env.clients.length === 0) return null;
                          return (
                            <div key={env.id} className="mb-2 ml-2">
                              <p className="mb-1 text-xs font-medium text-slate-400">
                                {env.name}
                              </p>
                              <div className="ml-2 space-y-1">
                                {env.clients.map((c) => (
                                  <label
                                    key={c.id}
                                    className="flex items-center gap-2.5 rounded-md px-2 py-1 text-sm transition-colors hover:bg-slate-50"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={selectedClients.has(c.id)}
                                      onChange={() => toggleClient(c.id)}
                                      className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                                    />
                                    <span className="text-slate-800">{c.name}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </fieldset>
          )}

          {role === 'ADMIN' && isAdmin && mode === 'edit' && (
            <p className="rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-700">
              Admins have full access to all projects and clients.
            </p>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : mode === 'create' ? 'Create User' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
