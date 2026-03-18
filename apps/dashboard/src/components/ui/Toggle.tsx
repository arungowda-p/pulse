'use client';

import { ButtonHTMLAttributes } from 'react';

interface ToggleProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  checked: boolean;
  label?: string;
}

export function Toggle({ checked, label, className = '', ...props }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label ?? (checked ? 'On' : 'Off')}
      className={[
        'relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
        checked ? 'bg-indigo-600' : 'bg-slate-200',
        className,
      ].join(' ')}
      {...props}
    >
      <span
        className={[
          'pointer-events-none mt-0.5 inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200',
          checked ? 'translate-x-5' : 'translate-x-0.5',
        ].join(' ')}
      />
    </button>
  );
}
