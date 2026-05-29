import { ChevronRight } from 'lucide-react';
import { ContextLink } from '../../navigation/ContextLink';
import { cn } from '../ui/tokens';

export type InstitutionalBreadcrumbItem = {
  label: string;
  to?: string;
  state?: Record<string, unknown>;
};

type InstitutionalBreadcrumbProps = {
  items: InstitutionalBreadcrumbItem[];
  className?: string;
};

export function InstitutionalBreadcrumb({ items, className }: InstitutionalBreadcrumbProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Ruta de navegación" className={cn('flex flex-wrap items-center gap-1', className)}>
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="inline-flex min-w-0 items-center gap-1">
          {index > 0 ? <ChevronRight className="h-3 w-3 shrink-0 text-slate-300" aria-hidden /> : null}
          {item.to ? (
            <ContextLink
              to={item.to}
              state={item.state}
              className="truncate text-xs font-semibold text-slate-500 transition-colors hover:text-orange-600"
            >
              {item.label}
            </ContextLink>
          ) : (
            <span className="truncate text-xs font-semibold text-slate-700">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
