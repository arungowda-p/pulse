import type { Flag } from './types';

interface FlagCardProps {
  flag: Flag;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function FlagCard({ flag, onToggle, onEdit, onDelete }: FlagCardProps) {
  return (
    <li className="flex items-center justify-between gap-4 rounded-lg border border-slate-600 bg-slate-800/50 px-5 py-4">
      <div className="min-w-0 flex-1">
        <div className="font-mono text-sm text-sky-400">{flag.key}</div>
        <p className="font-medium">{flag.name}</p>
        {flag.description ? (
          <p className="mt-1 text-sm text-slate-400">{flag.description}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggle}
          aria-label={`Toggle ${flag.key}`}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
            flag.on ? 'bg-sky-400' : 'bg-slate-600'
          }`}
        >
          <span
            className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform ${
              flag.on ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="rounded-lg px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-lg px-3 py-1.5 text-sm text-red-400 hover:bg-red-400/10"
        >
          Delete
        </button>
      </div>
    </li>
  );
}
