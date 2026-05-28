import type { LucideIcon } from 'lucide-react';
import { AppLogo } from '../branding/AppLogo';
import { Card, type CardVariant } from './Card';
import { cn, text } from './tokens';

type EmptyStateVariant = 'default' | 'operational' | 'compact';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  cardVariant?: CardVariant;
  variant?: EmptyStateVariant;
  brandMark?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  cardVariant = 'default',
  variant = 'default',
  brandMark = false,
}: EmptyStateProps) {
  const isCompact = variant === 'compact';
  const isOperational = variant === 'operational' || variant === 'default';

  return (
    <Card
      variant={cardVariant}
      className={cn(
        'flex flex-col items-center justify-center text-center',
        isCompact ? 'p-6' : 'p-10',
        className,
      )}
    >
      {brandMark ? (
        <AppLogo
          variant="mark"
          size="sm"
          className="mb-4 opacity-[0.35]"
          aria-hidden
        />
      ) : null}
      <div
        className={cn(
          'mb-4 flex items-center justify-center rounded-2xl bg-slate-50/80 text-slate-300',
          isCompact ? 'h-10 w-10' : 'h-14 w-14',
        )}
      >
        <Icon className={isCompact ? 'h-5 w-5' : 'h-7 w-7'} />
      </div>
      <h3 className={cn(isCompact ? 'text-sm font-bold text-slate-900' : 'text-lg font-black text-slate-950')}>
        {title}
      </h3>
      {description && (
        <p className={cn('mt-2 max-w-sm', isOperational ? text.body : 'text-sm font-medium text-slate-400')}>
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </Card>
  );
}
