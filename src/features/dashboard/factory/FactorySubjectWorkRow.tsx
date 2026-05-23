import { ArrowRight, CalendarDays, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../../components/ui/tokens';
import { formatDate } from '../../../utils/formatters';
import { priorityLabels } from '../../../utils/status';
import type { SubjectWorkItem } from '../../operations/subjectOperationalState';

const stateStyles: Record<SubjectWorkItem['operationalState'], string> = {
  NOT_STARTED: 'bg-slate-100 text-slate-600',
  IN_PRODUCTION: 'bg-orange-50 text-orange-700',
  IN_REVIEW: 'bg-sky-50 text-sky-700',
  CHANGES_REQUESTED: 'bg-rose-50 text-rose-700',
  CORRECTION_SENT: 'bg-amber-50 text-amber-700',
  APPROVED: 'bg-emerald-50 text-emerald-700',
};

export function FactorySubjectWorkRow({ item }: { item: SubjectWorkItem }) {
  return (
    <div className="rounded-[16px] bg-white/80 p-4 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.1)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold tracking-[-0.02em] text-[#1E293B]">{item.subjectName}</p>
          <p className="mt-0.5 text-[0.85rem] font-medium text-[#64748B]">
            {item.program} · {item.school}
          </p>
          <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-medium text-[#64748B]">
            <span>Sem. {item.semesterNumber}</span>
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              {formatDate(item.expectedDeliveryDate)}
            </span>
            <span>{priorityLabels[item.priority]}</span>
            {item.openObservationsCount > 0 && (
              <span className="inline-flex items-center gap-1 text-rose-600">
                <MessageSquare className="h-3 w-3" />
                {item.openObservationsCount} obs. abiertas
              </span>
            )}
          </div>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-[10px] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide',
            stateStyles[item.operationalState],
          )}
        >
          {item.operationalLabel}
        </span>
      </div>
      <div className="mt-3 flex justify-end">
        <Link
          to={item.actionUrl}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-[12px] px-3 py-2 text-xs font-bold transition-all duration-200',
            item.operationalState === 'APPROVED'
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : item.operationalState === 'CHANGES_REQUESTED'
                ? 'bg-rose-600 text-white hover:bg-rose-700'
                : 'bg-[#FF6B00] text-white shadow-lg shadow-[#FF6B00]/20 hover:bg-[#E66000]',
          )}
        >
          {item.actionLabel}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
