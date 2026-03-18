'use client';

import { useState } from 'react';
import { Button, Input } from './ui';

interface ClientModalProps {
  onClose: () => void;
  onSave: (payload: { name: string }) => Promise<void>;
}

export function ClientModal({ onClose, onSave }: ClientModalProps) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError('');
    setSaving(true);
    try {
      await onSave({ name: name.trim() });
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
        <h2 className="text-xl font-semibold text-slate-900">Add client</h2>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input
            label="Client name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Web App, Mobile App, API Server"
            required
          />
          {error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Adding...' : 'Add client'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
