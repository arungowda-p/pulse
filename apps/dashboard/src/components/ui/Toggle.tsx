'use client';

import { ButtonHTMLAttributes } from 'react';

interface ToggleProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  checked: boolean;
  label?: string;
  loading?: boolean;
}

export function Toggle({ checked, label, loading, className = '', disabled, ...props }: ToggleProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label ?? (checked ? 'On' : 'Off')}
      disabled={isDisabled}
      className={[
        'relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
        checked ? 'bg-indigo-600' : 'bg-slate-200',
        isDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        className,
      ].join(' ')}
      {...props}
    >
      {loading ? (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
        </span>
      ) : (
        <span
          className={[
            'pointer-events-none mt-0.5 inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200',
            checked ? 'translate-x-5' : 'translate-x-0.5',
          ].join(' ')}
        />
      )}
    </button>
  );
}
