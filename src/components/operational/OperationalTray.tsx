import type { LucideIcon } from 'lucide-react';
import { ArrowRight, ClipboardList } from 'lucide-react';
import { ContextLink } from '../../navigation/ContextLink';
import { EmptyState } from '../ui/EmptyState';
import { Card } from '../ui/Card';
import { cn, text } from '../ui/tokens';
import type { SubjectWorkItem } from '../../features/operations/subjectOperationalState';
import { OperationalTrayItem } from './OperationalTrayItem';

const TRAY_LIMIT = 5;

export function OperationalTray({
  title,
  description,
  count,
  totalCount,
  items,
  emptyMessage,
  viewAllTo,
  icon: Icon = ClipboardList,
  role = 'factory',
}: {
  title: string;
  description: string;
  count: number;
  /** Total sin filtro de búsqueda; si no se pasa, usa count. */
  totalCount?: number;
  items: SubjectWorkItem[];
  emptyMessage: string;
  viewAllTo: string;
  icon?: LucideIcon;
  role?: 'factory' | 'product';
}) {
  const visible = items.slice(0, TRAY_LIMIT);
  const effectiveTotal = totalCount ?? count;
  const showEmpty = effectiveTotal === 0 || items.length === 0;

  return (
    <Card variant="subjectPanel" glass className="p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2 border-b border-orange-100/60 pb-3">
        <Icon className="h-4 w-4 text-orange-500" />
        <h2 className="text-sm font-bold text-slate-950">{title}</h2>
        <span className="ml-auto rounded-full bg-orange-50 px-2.5 py-0.5 text-[11px] font-bold text-orange-800 ring-1 ring-orange-200/60">
          {count}
        </span>
      </div>
      <p className={cn('mb-3', text.body)}>{description}</p>
      {showEmpty ? (
        <EmptyState
          icon={Icon}
          title={emptyMessage}
          variant="compact"
          cardVariant="solid"
          className="border-0 bg-transparent p-0 shadow-none"
          action={
            viewAllTo ? (
              <ContextLink
                to={viewAllTo}
                className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700"
              >
                Ir a la bandeja <ArrowRight className="h-3.5 w-3.5" />
              </ContextLink>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-2">
          {visible.map((item) => (
            <OperationalTrayItem key={`${item.projectId}:${item.subjectId}`} item={item} role={role} />
          ))}
        </div>
      )}
      {effectiveTotal > visible.length && (
        <div className="mt-3">
          <ContextLink
            to={viewAllTo}
            className="inline-flex items-center gap-1 text-xs font-bold text-orange-700 hover:text-orange-800"
          >
            Ver todas <ArrowRight className="h-3.5 w-3.5" />
          </ContextLink>
        </div>
      )}
    </Card>
  );
}
