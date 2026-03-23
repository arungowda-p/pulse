'use client';

import { useState } from 'react';
import { Button, Input, Textarea } from './ui';

interface ProjectModalProps {
  onClose: () => void;
  onSave: (payload: { name: string; allowedOrigins: string[] }) => Promise<void>;
}

export function ProjectModal({ onClose, onSave }: ProjectModalProps) {
  const [name, setName] = useState('');
  const [origins, setOrigins] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const parseOrigins = (raw: string): string[] =>
    raw
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError('');
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        allowedOrigins: parseOrigins(origins),
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
          Create project
        </h2>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input
            label="Project name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Project"
            required
            hint="A URL-friendly slug will be generated from the name"
          />
          <Textarea
            label="Allowed origins (optional)"
            value={origins}
            onChange={(e) => setOrigins(e.target.value)}
            rows={4}
            placeholder={`https://myapp.com\nhttps://staging.myapp.com`}
          />
          <p className="-mt-2 text-xs text-slate-500">
            Add one URL per line (or comma-separated). Only HTTP/HTTPS origins
            are accepted.
          </p>
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
              {saving ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
