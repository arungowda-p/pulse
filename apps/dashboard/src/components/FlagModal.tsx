'use client';

import { useEffect, useState } from 'react';
import { Button, Input, Textarea, Toggle } from './ui';
import type { Flag } from '../types/flag';

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
      const k =
        mode === 'create'
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-slate-900">
          {mode === 'create' ? 'Create flag' : 'Edit flag'}
        </h2>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-1">
            <Input
              label="Key (e.g. new-checkout)"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="my-feature"
              required={mode === 'create'}
              disabled={mode === 'edit'}
              hint="Used in code: client.variation('key')"
            />
          </div>
          <div className="space-y-1">
            <Input
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My feature"
            />
          </div>
          <div className="space-y-1">
            <Textarea
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this flag controls"
              rows={3}
            />
          </div>
          {mode === 'edit' && (
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3">
              <span className="text-sm font-medium text-slate-700">Enabled</span>
              <Toggle checked={on} onClick={() => setOn(!on)} label="Enabled" />
            </div>
          )}
          {error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          ) : null}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
