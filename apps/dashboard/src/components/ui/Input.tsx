'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, className = '', id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="w-full">
        {label ? (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          className={[
            'w-full rounded-lg border bg-white px-3 py-2 text-slate-900 placeholder-slate-400 transition-colors',
            'focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20',
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
              : 'border-slate-300',
            'disabled:cursor-not-allowed disabled:opacity-60',
            className,
          ].join(' ')}
          {...props}
        />
        {hint && !error ? (
          <p className="mt-1 text-xs text-slate-500">{hint}</p>
        ) : null}
        {error ? (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = 'Input';
