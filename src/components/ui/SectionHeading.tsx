import React from 'react';

type As = 'h2' | 'h3' | 'h4';

export interface SectionHeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: As;
  subtitle?: string;
}

/**
 * SectionHeading
 * Token-aligned heading block. Uses Bebas Neue via the global CSS var.
 * - Large, readable titles (athletic numberboard feel)
 * - Optional subtitle for brief context
 * - Accessible semantics with configurable heading level
 */
export function SectionHeading({
  as = 'h2',
  children,
  subtitle,
  className = '',
  ...props
}: SectionHeadingProps) {
  const Tag = as;
  return (
    <header className={`space-y-1 ${className}`}>
      <Tag
        className="heading-xl text-[var(--fg)] tracking-tight"
        {...props}
      >
        {children}
      </Tag>
      {subtitle ? (
        <p className="text-sm text-slate-500">
          {subtitle}
        </p>
      ) : null}
    </header>
  );
}