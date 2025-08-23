import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

/**
 * Card
 * Token-aligned container with rounded corners and hover micro-interaction.
 * Ensures ≥44×44px hit areas when used as interactive wrapper via padding utilities.
 */
export function Card({ className = '', ...props }: CardProps) {
  return (
    <div
      className={`card card-hover ${className}`}
      {...props}
    />
  );
}

/**
 * CardHeader / CardContent / CardFooter
 * Simple layout helpers to enforce consistent spacing inside cards.
 */
export function CardHeader({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`p-4 md:p-6 ${className}`} {...props} />;
}

export function CardContent({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`p-4 md:p-6 ${className}`} {...props} />;
}

export function CardFooter({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`p-4 md:p-6 border-t border-slate-100 ${className}`} {...props} />;
}