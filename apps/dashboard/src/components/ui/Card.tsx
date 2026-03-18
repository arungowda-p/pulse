import { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

export function Card({
  children,
  padding = 'md',
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      className={[
        'rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md',
        paddingStyles[padding],
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </div>
  );
}
