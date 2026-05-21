import type { HTMLAttributes, ReactNode } from 'react';
import { cn, radius, surface } from './tokens';

export type CardVariant = 'default' | 'subjectPanel' | 'nested';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  glass?: boolean;
  /** default: marca global redondeada; subjectPanel/nested: vista materia y anidados */
  variant?: CardVariant;
}

export function Card({ children, className, glass = false, variant = 'default', ...props }: CardProps) {
  const panel =
    variant === 'subjectPanel'
      ? cn(surface.subjectPanel, radius.subjectPanel)
      : variant === 'nested'
        ? cn(surface.nested, radius.nested)
        : cn(surface.card, radius.card);
  return (
    <div className={cn(glass ? cn(surface.glass, radius.card) : panel, className)} {...props}>
      {children}
    </div>
  );
}
