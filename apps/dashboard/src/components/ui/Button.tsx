'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 focus-visible:ring-indigo-500',
  secondary:
    'bg-slate-100 text-slate-800 hover:bg-slate-200 focus-visible:ring-slate-400',
  ghost:
    'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-400',
  danger: 'bg-red-600 text-white hover:bg-red-500 focus-visible:ring-red-500',
  outline:
    'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-400',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-base gap-2.5',
};

export function Button({
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={[
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60',
        variantStyles[variant],
        sizeStyles[size],
        className,
      ].join(' ')}
      {...props}
    >
      {leftIcon ? (
        <span className="inline-flex shrink-0 items-center justify-center [&>svg]:max-h-6 [&>svg]:max-w-6 [&>svg]:shrink-0">
          {leftIcon}
        </span>
      ) : null}
      {children}
      {rightIcon ? (
        <span className="inline-flex shrink-0 items-center justify-center [&>svg]:max-h-6 [&>svg]:max-w-6 [&>svg]:shrink-0">
          {rightIcon}
        </span>
      ) : null}
    </button>
  );
}
