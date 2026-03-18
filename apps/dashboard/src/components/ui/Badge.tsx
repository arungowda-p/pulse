import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'on' | 'off' | 'neutral';
  className?: string;
}

const variantStyles = {
  on: 'bg-emerald-100 text-emerald-800',
  off: 'bg-slate-100 text-slate-600',
  neutral: 'bg-slate-100 text-slate-700',
};

export function Badge({
  children,
  variant = 'neutral',
  className = '',
}: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantStyles[variant],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  );
}
