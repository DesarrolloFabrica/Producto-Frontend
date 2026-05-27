import type { HTMLAttributes, ReactNode } from 'react';
import { cn, motion, radius, surface } from './tokens';

export type CardVariant = 'default' | 'elevated' | 'solid' | 'subjectPanel' | 'nested';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  glass?: boolean;
  interactive?: boolean;
  variant?: CardVariant;
}

const variantClasses: Record<CardVariant, string> = {
  default: cn(surface.glassSubtle, radius.card),
  elevated: cn(surface.elevated, radius.elevated),
  solid: cn(surface.solid, radius.card),
  subjectPanel: cn(surface.subjectPanel, radius.subjectPanel),
  nested: cn(surface.nested, radius.nested),
};

export function Card({
  children,
  className,
  glass = false,
  interactive = false,
  variant = 'default',
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        glass ? cn(surface.glass, radius.card) : variantClasses[variant],
        interactive && motion.hoverLift,
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
