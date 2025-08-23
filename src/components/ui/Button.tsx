import Link from 'next/link';
import React from 'react';

type Variant = 'primary' | 'outline' | 'ghost';
type Size = 'md' | 'lg';

const base =
  'inline-flex items-center justify-center rounded-lg font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--accent-cool)] disabled:opacity-50 disabled:pointer-events-none select-none';

const sizes: Record<Size, string> = {
  md: 'px-4 py-2 text-sm min-h-[44px] min-w-[44px]',
  lg: 'px-5 py-3 text-base min-h-[48px] min-w-[48px]',
};

const variants: Record<Variant, string> = {
  primary:
    'bg-[var(--brand-green)] text-white hover:bg-[var(--brand-green-dark)] ring-offset-[var(--bg)]',
  outline:
    'border border-slate-300 text-[var(--fg)] bg-white hover:bg-slate-50 ring-offset-white',
  ghost: 'text-[var(--fg)] hover:bg-slate-100/60 ring-offset-[var(--bg)]',
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export interface LinkButtonProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: Variant;
  size?: Size;
  href: string;
  prefetch?: boolean;
}

export const LinkButton = React.forwardRef<HTMLAnchorElement, LinkButtonProps>(
  ({ variant = 'outline', size = 'md', className = '', href, prefetch, ...props }, ref) => {
    const cls = `${base} ${sizes[size]} ${variants[variant]} ${className}`;
    const isExternal =
      /^https?:/i.test(href) || href.startsWith('mailto:') || href.startsWith('tel:');
    if (isExternal) {
      return (
        <a ref={ref} href={href} className={cls} {...props} />
      );
    }
    return (
      <Link href={href} prefetch={prefetch} className={cls} {...props} />
    );
  }
);
LinkButton.displayName = 'LinkButton';