import { useEffect, useState } from 'react';
import { FlagCard } from './FlagCard';
import { FlagModal } from './FlagModal';
import type { Flag } from './types';

const API = '/api';

async function request<T>(
  method: string,
  path: string,
  body?: object
): Promise<T> {
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

export default function App() {
  const [flags, setFlags] = useState<Flag[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'create' | Flag | null>(null);

  const loadFlags = async () => {
    setLoading(true);
    try {
      const list = await request<Flag[]>('GET', '/flags');
      setFlags(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFlags();
  }, []);

  const handleToggle = async (key: string, on: boolean) => {
    try {
      const updated = await request<Flag>('PATCH', `/flags/${key}`, { on: !on });
      setFlags((prev) =>
        prev.map((f) => (f.key === key ? updated : f))
      );
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleSave = async (payload: {
    key?: string;
    name: string;
    description?: string;
    on?: boolean;
  }) => {
    try {
      if (modal === 'create' && payload.key) {
        await request('POST', '/flags', {
          key: payload.key,
          name: payload.name,
          description: payload.description ?? '',
        });
      } else if (typeof modal === 'object' && modal?.key) {
        await request('PATCH', `/flags/${modal.key}`, {
          name: payload.name,
          description: payload.description ?? '',
          on: payload.on,
        });
      }
      setModal(null);
      loadFlags();
    } catch (e) {
      throw e;
    }
  };

  const handleDelete = async (key: string) => {
    if (!confirm(`Delete flag "${key}"?`)) return;
    try {
      await request('DELETE', `/flags/${key}`);
      loadFlags();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <header className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Feature Flags</h1>
          <p className="mt-1 text-slate-400">
            LaunchDarkly-style MVP — toggle features without redeploying
          </p>
          <div className="mt-4 flex gap-2">
            <a
              href="/demo.html"
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
            >
              SDK demo
            </a>
            <button
              type="button"
              onClick={() => setModal('create')}
              className="rounded-lg bg-sky-400 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-sky-300"
            >
              + Create flag
            </button>
          </div>
        </header>

        <main>
          {loading ? (
            <p className="text-slate-400">Loading flags…</p>
          ) : flags.length === 0 ? (
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-8 text-center text-slate-400">
              <p className="mb-2">No feature flags yet.</p>
              <p className="mb-4">Create one to toggle features without redeploying.</p>
              <button
                type="button"
                onClick={() => setModal('create')}
                className="rounded-lg bg-sky-400 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-sky-300"
              >
                + Create flag
              </button>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {flags.map((flag) => (
                <FlagCard
                  key={flag.key}
                  flag={flag}
                  onToggle={() => handleToggle(flag.key, flag.on)}
                  onEdit={() => setModal(flag)}
                  onDelete={() => handleDelete(flag.key)}
                />
              ))}
            </ul>
          )}
        </main>
      </div>

      {modal !== null && (
        <FlagModal
          mode={modal === 'create' ? 'create' : 'edit'}
          flag={typeof modal === 'object' ? modal : undefined}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
