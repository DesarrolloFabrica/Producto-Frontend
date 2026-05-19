import type { LucideIcon } from 'lucide-react';
import { Card, type CardVariant } from './Card';
import { cn } from './tokens';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  cardVariant?: CardVariant;
}

export function EmptyState({ icon: Icon, title, description, action, className, cardVariant = 'default' }: EmptyStateProps) {
  return (
    <Card variant={cardVariant} className={cn('flex flex-col items-center justify-center p-10 text-center', className)}>
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-50 text-slate-300">
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="text-lg font-black text-slate-950">{title}</h3>
      {description && <p className="mt-2 max-w-xs text-sm font-semibold text-slate-400">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </Card>
  );
}
