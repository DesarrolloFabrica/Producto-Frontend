import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './tokens';

export type OperationalTrayVariant = 'corrections' | 'production' | 'pending' | 'review' | 'completed';

/** @deprecated Use OperationalTrayVariant */
export type FolderPanelVariant = OperationalTrayVariant;

export const operationalTrayVariantStyles: Record<
  OperationalTrayVariant,
  {
    topBorder: string;
    icon: string;
    iconBg: string;
    kpi: string;
    link: string;
    previewHover: string;
    arrowHover: string;
  }
> = {
  corrections: {
    topBorder: 'border-t-amber-500',
    icon: 'text-amber-700',
    iconBg: 'bg-amber-500/10 ring-1 ring-amber-500/15',
    kpi: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200/50',
    link: 'text-amber-700 hover:text-amber-800',
    previewHover: 'hover:border-amber-200/70 hover:bg-amber-50/30',
    arrowHover: 'group-hover:text-amber-600',
  },
  production: {
    topBorder: 'border-t-blue-500',
    icon: 'text-blue-700',
    iconBg: 'bg-blue-500/10 ring-1 ring-blue-500/15',
    kpi: 'bg-blue-50 text-blue-800 ring-1 ring-blue-200/50',
    link: 'text-blue-700 hover:text-blue-800',
    previewHover: 'hover:border-blue-200/70 hover:bg-blue-50/30',
    arrowHover: 'group-hover:text-blue-600',
  },
  pending: {
    topBorder: 'border-t-[var(--fac-primary)]',
    icon: 'text-[var(--fac-primary)]',
    iconBg: 'bg-[var(--fac-primary-soft)] ring-1 ring-[var(--fac-primary)]/15',
    kpi: 'bg-orange-50 text-orange-800 ring-1 ring-orange-200/50',
    link: 'text-[var(--fac-primary)] hover:text-[var(--fac-primary-hover)]',
    previewHover: 'hover:border-orange-200/70 hover:bg-orange-50/30',
    arrowHover: 'group-hover:text-[var(--fac-primary)]',
  },
  review: {
    topBorder: 'border-t-violet-500',
    icon: 'text-violet-700',
    iconBg: 'bg-violet-500/10 ring-1 ring-violet-500/15',
    kpi: 'bg-violet-50 text-violet-800 ring-1 ring-violet-200/50',
    link: 'text-violet-700 hover:text-violet-800',
    previewHover: 'hover:border-violet-200/70 hover:bg-violet-50/30',
    arrowHover: 'group-hover:text-violet-600',
  },
  completed: {
    topBorder: 'border-t-emerald-500',
    icon: 'text-emerald-700',
    iconBg: 'bg-emerald-500/10 ring-1 ring-emerald-500/15',
    kpi: 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/50',
    link: 'text-emerald-700 hover:text-emerald-800',
    previewHover: 'hover:border-emerald-200/70 hover:bg-emerald-50/30',
    arrowHover: 'group-hover:text-emerald-600',
  },
};

/** @deprecated Use operationalTrayVariantStyles */
export const folderVariantStyles = operationalTrayVariantStyles;

interface OperationalTrayCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: OperationalTrayVariant;
  compact?: boolean;
}

export function OperationalTrayCard({
  children,
  variant = 'pending',
  compact = false,
  className,
  ...props
}: OperationalTrayCardProps) {
  const styles = operationalTrayVariantStyles[variant];

  return (
    <div
      className={cn(
        'group flex flex-col rounded-2xl border border-slate-200/65 border-t-[3px] bg-white/90 backdrop-blur-[10px]',
        'shadow-[0_1px_2px_rgba(15,23,42,0.04),0_6px_20px_-6px_rgba(15,23,42,0.07)]',
        'transition-all duration-180 ease-out hover:-translate-y-0.5',
        'hover:shadow-[0_2px_4px_rgba(15,23,42,0.04),0_10px_28px_-8px_rgba(15,23,42,0.1)]',
        styles.topBorder,
        compact ? 'min-h-[160px]' : undefined,
        className,
      )}
      data-variant={variant}
      {...props}
    >
      <div className="flex min-h-0 flex-1 flex-col p-3 sm:p-3.5">{children}</div>
    </div>
  );
}
