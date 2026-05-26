import { ArrowRight, MessageSquare } from 'lucide-react';
import { ContextLink } from '../../navigation/ContextLink';
import { ChangeOriginBadge } from '../change-tracking/ChangeOriginBadge';
import { cn } from '../ui/tokens';
import type { SubjectWorkItem } from '../../features/operations/subjectOperationalState';
import { formatDate } from '../../utils/formatters';
import { priorityLabels } from '../../utils/status';

const stateStyles: Record<SubjectWorkItem['operationalState'], string> = {
  NOT_STARTED: 'bg-slate-100 text-slate-600',
  IN_PRODUCTION: 'bg-orange-50 text-orange-700',
  IN_REVIEW: 'bg-sky-50 text-sky-700',
  CHANGES_REQUESTED: 'bg-rose-50 text-rose-700',
  CORRECTION_SENT: 'bg-amber-50 text-amber-700',
  APPROVED: 'bg-emerald-50 text-emerald-700',
};

export function OperationalTrayItem({
  item,
  role = 'factory',
}: {
  item: SubjectWorkItem;
  role?: 'factory' | 'product';
}) {
  if (role === 'product') {
    return (
      <ContextLink
        to={item.actionUrl}
        className="flex w-full items-center justify-between rounded-2xl border border-orange-100/60 bg-orange-50/20 p-3 text-left transition-all hover:border-orange-200 hover:bg-orange-50/50"
      >
        <ProductItemBody item={item} />
        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-orange-400" />
      </ContextLink>
    );
  }

  return (
    <ContextLink
      to={item.actionUrl}
      className={cn(
        'group flex w-full items-center gap-2 rounded-xl border border-slate-200/70 bg-white/80 p-2.5 text-left transition-all hover:border-orange-200/80 hover:bg-orange-50/30',
        item.createdFromChange && 'border-cyan-200/60 bg-cyan-50/10',
      )}
    >
      <FactoryItemBody item={item} />
      <span className="hidden shrink-0 items-center gap-0.5 text-[10px] font-bold text-orange-600 group-hover:inline-flex sm:inline-flex">
        {item.actionLabel}
        <ArrowRight className="h-3 w-3" />
      </span>
    </ContextLink>
  );
}

function ProductItemBody({ item }: { item: SubjectWorkItem }) {
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <p className="truncate text-xs font-bold text-slate-900">{item.subjectName}</p>
        {item.createdFromChange && <ChangeOriginBadge kind="subject" />}
      </div>
      {item.isProjectGrouped ? (
        <p className="text-[10px] font-semibold text-amber-700">
          {item.groupedSubjectCount} materia{item.groupedSubjectCount !== 1 ? 's' : ''} · Sem.{' '}
          {item.groupedSemesterNumbers?.join(', ')}
        </p>
      ) : (
        <p className="text-[10px] font-semibold text-amber-700">
          {item.program} · Sem. {item.semesterNumber}
        </p>
      )}
      <p className="text-[10px] font-medium text-slate-400">
        Entrega: {formatDate(item.expectedDeliveryDate)}
      </p>
    </div>
  );
}

function FactoryItemBody({ item }: { item: SubjectWorkItem }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-1.5">
        <p className="truncate text-xs font-bold text-slate-900">{item.subjectName}</p>
        {item.createdFromChange && <ChangeOriginBadge kind="subject" />}
        <span
          className={cn(
            'shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide',
            stateStyles[item.operationalState],
          )}
        >
          {item.operationalLabel}
        </span>
      </div>
      <p className="text-[10px] font-semibold text-slate-500">
        {item.program} · Sem. {item.semesterNumber}
      </p>
      <p className="flex flex-wrap items-center gap-1.5 text-[10px] font-medium text-slate-400">
        <span>{priorityLabels[item.priority]}</span>
        <span>·</span>
        <span>{formatDate(item.expectedDeliveryDate)}</span>
        {item.openObservationsCount > 0 && (
          <span className="inline-flex items-center gap-0.5 text-rose-600">
            <MessageSquare className="h-2.5 w-2.5" />
            {item.openObservationsCount}
          </span>
        )}
      </p>
    </div>
  );
}
