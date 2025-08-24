import React from 'react';

type Variant = 'brand' | 'outline' | 'neutral';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

/**
 * Badge
 * Pill label for positions, class year, etc. Meets ≥44×44 when used with padding context.
 */
export function Badge({ variant = 'neutral', className = '', ...props }: BadgeProps) {
  const styles: Record<Variant, string> = {
    brand:
      'bg-white text-black ring-1 ring-[color:var(--brand-green)]/30',
    outline:
      'bg-white text-[color:var(--fg)] ring-1 ring-slate-300',
    neutral:
      'bg-slate-100 text-slate-700 ring-1 ring-slate-200',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${styles[variant]} ${className}`}
      {...props}
    />
  );
}