import { useEffect, useState } from 'react';
import type { Flag } from './types';

type Mode = 'create' | 'edit';

interface FlagModalProps {
  mode: Mode;
  flag?: Flag;
  onClose: () => void;
  onSave: (payload: {
    key?: string;
    name: string;
    description?: string;
    on?: boolean;
  }) => Promise<void>;
}

export function FlagModal({ mode, flag, onClose, onSave }: FlagModalProps) {
  const [key, setKey] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [on, setOn] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (mode === 'edit' && flag) {
      setKey(flag.key);
      setName(flag.name);
      setDescription(flag.description ?? '');
      setOn(flag.on);
    } else {
      setKey('');
      setName('');
      setDescription('');
      setOn(false);
    }
    setError('');
  }, [mode, flag]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const k = mode === 'create'
        ? key.trim().toLowerCase().replace(/\s+/g, '-')
        : flag?.key;
      await onSave({
        ...(mode === 'create' && k ? { key: k } : {}),
        name: name.trim() || k || 'Unnamed',
        description: description.trim() || undefined,
        ...(mode === 'edit' ? { on } : {}),
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-lg border border-slate-600 bg-slate-800 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-semibold">
          {mode === 'create' ? 'Create flag' : 'Edit flag'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-400">
              Key (e.g. new-checkout)
            </label>
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="my-feature"
              required={mode === 'create'}
              disabled={mode === 'edit'}
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none disabled:opacity-60"
            />
            <p className="mt-1 text-xs text-slate-500">
              Used in code: client.variation(&apos;key&apos;)
            </p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-400">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My feature"
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-400">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this flag controls"
              rows={2}
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none"
            />
          </div>
          {mode === 'edit' && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="flag-on"
                checked={on}
                onChange={(e) => setOn(e.target.checked)}
                className="h-4 w-4 rounded border-slate-600 text-sky-500 focus:ring-sky-500"
              />
              <label htmlFor="flag-on" className="text-sm">
                Enabled (on)
              </label>
            </div>
          )}
          {error ? (
            <p className="text-sm text-red-400">{error}</p>
          ) : null}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-sky-400 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-sky-300 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
