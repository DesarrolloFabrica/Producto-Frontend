import { ContextLink } from '../../../navigation/ContextLink';
import { useContextBack } from '../../../navigation/useContextBack';
import { ArrowRight, CalendarDays, ClipboardList, MessageSquare } from 'lucide-react';
import type { SubjectWorkItem } from '../../operations/subjectOperationalState';
import { Card } from '../../../components/ui/Card';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Button } from '../../../components/ui/Button';
import { cn } from '../../../components/ui/tokens';
import { formatDate } from '../../../utils/formatters';
import { priorityLabels, priorityTone } from '../../../utils/status';
import { ChangeOriginBadge, ChangeOriginCardAccent } from '../../../components/change-tracking/ChangeOriginBadge';
import { getCompactWorkCta } from '../factoryWorkCta';

const stateLabelTone: Record<SubjectWorkItem['operationalState'], string> = {
  NOT_STARTED: 'bg-slate-100 text-slate-700 ring-slate-200/80',
  IN_PRODUCTION: 'bg-orange-50 text-orange-700 ring-orange-100',
  IN_REVIEW: 'bg-sky-50 text-sky-700 ring-sky-100',
  CHANGES_REQUESTED: 'bg-rose-50 text-rose-700 ring-rose-100',
  CORRECTION_SENT: 'bg-amber-50 text-amber-800 ring-amber-100',
  APPROVED: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
};

function WorkActionButton({ item }: { item: SubjectWorkItem }) {
  const cta = getCompactWorkCta(item.operationalState);
  const isApproved = item.operationalState === 'APPROVED';
  const isCorrections = item.operationalState === 'CHANGES_REQUESTED';

  return (
    <ContextLink
      to={item.actionUrl}
      title={cta.title}
      className={cn(
        'inline-flex h-9 items-center gap-1 rounded-[12px] px-3 text-xs font-bold transition-colors',
        isApproved
          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
          : isCorrections
            ? 'bg-rose-600 text-white hover:bg-rose-700'
            : 'bg-[#FF6B00] text-white shadow-md shadow-[#FF6B00]/15 hover:bg-[#E66000]',
      )}
    >
      {cta.shortLabel}
      <ArrowRight className="h-3.5 w-3.5" />
    </ContextLink>
  );
}

function CorrectionsBadge({ count }: { count: number }) {
  if (count <= 0) {
    return (
      <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-slate-100 px-2 text-[11px] font-bold text-[#94A3B8]">
        0
      </span>
    );
  }
  return (
    <span className="inline-flex h-6 items-center gap-1 rounded-full bg-rose-50 px-2.5 text-[11px] font-bold text-rose-700 ring-1 ring-rose-100">
      <MessageSquare className="h-3 w-3" />
      {count}
    </span>
  );
}

function WorkItemMobileCard({ item }: { item: SubjectWorkItem }) {
  return (
    <div className="relative overflow-hidden rounded-[16px] border border-slate-200/60 bg-white p-4 pl-5 shadow-[0_2px_12px_rgba(15,23,42,0.04)] transition-colors hover:border-cyan-100/80 hover:bg-cyan-50/15">
      <ChangeOriginCardAccent isNew={Boolean(item.createdFromChange)} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold text-[#1E293B]">{item.subjectName}</p>
            {item.createdFromChange && <ChangeOriginBadge kind="subject" />}
          </div>
          <p className="mt-0.5 text-sm font-medium text-[#64748B]">{item.program}</p>
          <p className="text-xs text-[#94A3B8]">{item.school}</p>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1',
            stateLabelTone[item.operationalState],
          )}
        >
          {item.operationalLabel}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[#64748B]">
        <div>
          <span className="font-bold uppercase tracking-wide text-[#94A3B8]">Semestre</span>
          <p className="mt-0.5 font-semibold text-[#475569]">Sem. {item.semesterNumber}</p>
        </div>
        <div>
          <span className="font-bold uppercase tracking-wide text-[#94A3B8]">Prioridad</span>
          <p className="mt-1">
            <span
              className={cn(
                'inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase',
                priorityTone[item.priority],
              )}
            >
              {priorityLabels[item.priority]}
            </span>
          </p>
        </div>
        <div className="col-span-2">
          <span className="font-bold uppercase tracking-wide text-[#94A3B8]">Entrega</span>
          <p className="mt-0.5 inline-flex items-center gap-1 font-semibold text-[#475569]">
            <CalendarDays className="h-3.5 w-3.5 text-[#94A3B8]" />
            {formatDate(item.expectedDeliveryDate)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <WorkActionButton item={item} />
      </div>
    </div>
  );
}

export function FactoryWorkTable({
  items,
  isLoading,
  error,
  onClearFilters,
  backToDashboardFallback,
}: {
  items: SubjectWorkItem[];
  isLoading: boolean;
  error: string | null;
  onClearFilters: () => void;
  backToDashboardFallback: string;
}) {
  const { goBack: goBackToDashboard } = useContextBack(backToDashboardFallback);
  const showEmpty = !isLoading && !error && items.length === 0;

  if (showEmpty) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="No hay materias con estos filtros"
        description="Ajusta los filtros o vuelve al dashboard para revisar otras bandejas."
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="secondary" size="sm" onClick={onClearFilters}>
              Limpiar filtros
            </Button>
            <Button variant="primary" size="sm" onClick={goBackToDashboard}>
              Volver al dashboard
            </Button>
          </div>
        }
      />
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-slate-200/60 bg-gradient-to-r from-white to-slate-50/80 px-5 py-4 sm:px-6">
        <h2 className="text-sm font-bold tracking-[-0.02em] text-[#1E293B]">Materias</h2>
        <p className="mt-0.5 text-[11px] font-medium text-[#64748B]">
          Vista filtrable y paginada de materias asignadas a Fábrica.
        </p>
      </div>

      {error && (
        <div className="border-b border-rose-100 bg-rose-50 px-5 py-4 text-sm text-rose-700 sm:px-6">{error}</div>
      )}

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-[980px] w-full text-sm">
          <thead className="sticky top-0 z-10 bg-[#F8FAFC]/95 backdrop-blur-sm text-[#64748B] shadow-[0_1px_0_0_rgba(226,232,240,0.8)]">
            <tr className="text-[11px] font-bold uppercase tracking-wide">
              <th className="px-5 py-3.5 text-left sm:px-6">Materia</th>
              <th className="px-5 py-3.5 text-left sm:px-6">Programa / Proyecto</th>
              <th className="px-5 py-3.5 text-left sm:px-6">Semestre</th>
              <th className="px-5 py-3.5 text-left sm:px-6">Estado</th>
              <th className="px-5 py-3.5 text-left sm:px-6">Entrega</th>
              <th className="px-5 py-3.5 text-left sm:px-6">Prioridad</th>
              <th className="px-5 py-3.5 text-left sm:px-6">Correcciones</th>
              <th className="px-5 py-3.5 text-left sm:px-6">Última actividad</th>
              <th className="px-5 py-3.5 text-right sm:px-6">Acción</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {isLoading
              ? [...Array(6)].map((_, idx) => (
                  <tr key={idx} className="border-t border-slate-100">
                    <td className="px-5 py-5 sm:px-6" colSpan={9}>
                      <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                    </td>
                  </tr>
                ))
              : items.map((item) => (
                  <tr
                    key={item.subjectId}
                    className={cn(
                      'relative border-t border-slate-100/80 transition-colors',
                      item.createdFromChange
                        ? 'bg-cyan-50/20 hover:bg-cyan-50/35'
                        : 'hover:bg-slate-50/70',
                    )}
                  >
                    <td className="px-5 py-5 align-middle sm:px-6">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-[#1E293B]">{item.subjectName}</p>
                        {item.createdFromChange && <ChangeOriginBadge kind="subject" />}
                      </div>
                    </td>
                    <td className="px-5 py-5 align-middle sm:px-6">
                      <p className="font-semibold text-[#1E293B]">{item.program}</p>
                      <p className="text-xs text-[#94A3B8]">{item.school}</p>
                    </td>
                    <td className="px-5 py-5 align-middle font-medium text-[#475569] sm:px-6">
                      Sem. {item.semesterNumber}
                    </td>
                    <td className="px-5 py-5 align-middle sm:px-6">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1',
                          stateLabelTone[item.operationalState],
                        )}
                      >
                        {item.operationalLabel}
                      </span>
                    </td>
                    <td className="px-5 py-5 align-middle sm:px-6">
                      <span className="inline-flex items-center gap-1.5 font-medium text-[#64748B]">
                        <CalendarDays className="h-3.5 w-3.5 shrink-0 text-[#94A3B8]" />
                        {formatDate(item.expectedDeliveryDate)}
                      </span>
                    </td>
                    <td className="px-5 py-5 align-middle sm:px-6">
                      <span
                        className={cn(
                          'inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide',
                          priorityTone[item.priority],
                        )}
                      >
                        {priorityLabels[item.priority]}
                      </span>
                    </td>
                    <td className="px-5 py-5 align-middle sm:px-6">
                      <CorrectionsBadge count={item.openObservationsCount} />
                    </td>
                    <td className="px-5 py-5 align-middle text-[#64748B] sm:px-6">
                      {formatDate(item.lastActivity ?? '')}
                    </td>
                    <td className="px-5 py-5 text-right align-middle sm:px-6">
                      <WorkActionButton item={item} />
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 p-4 md:hidden">
        {isLoading
          ? [...Array(4)].map((_, idx) => (
              <div key={idx} className="h-28 animate-pulse rounded-[16px] bg-slate-100" />
            ))
          : items.map((item) => <WorkItemMobileCard key={item.subjectId} item={item} />)}
      </div>
    </Card>
  );
}
