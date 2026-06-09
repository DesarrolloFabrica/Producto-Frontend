import { ArrowRight, CalendarDays, Inbox } from 'lucide-react';
import { OperationalRequestItemHeading } from '../../components/operational/OperationalRequestItemHeading';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { cn, surface, text } from '../../components/ui/tokens';
import { formatDate } from '../../utils/formatters';
import type { ProgramOperationalWorkItemDto } from '../../services/institutionalWorkflowApi';
import { formatProgramProgress } from '../institutional-workflow/institutionalCopy';
import { SlaBadgeV2 } from './components/SlaBadgeV2';
import { ProgramActiveStageBadge } from './components/ProgramActiveStageBadge';
import { roleLabelV2 } from './rules/workflowRulesV2';
import type { OperationalRoleV2, SlaStatusV2 } from '../../types/operationalWorkflow';

type ProgramOperationalWorkTableProps = {
  items: ProgramOperationalWorkItemDto[];
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  onOpenProgram: (item: ProgramOperationalWorkItemDto) => void;
  sectionTitle?: string;
  sectionDescription?: string;
  actionLabel?: string;
  queueLabel?: string;
};

function FlowOpenButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-slate-500 transition-colors hover:bg-white/70 hover:text-slate-900"
    >
      {label}
      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" strokeWidth={2.25} />
    </button>
  );
}

const thClass = cn(
  'px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400 first:pl-5 last:pr-5 sm:first:pl-6 sm:last:pr-6',
);
const tdClass = 'px-4 py-3 align-middle first:pl-5 last:pr-5 sm:first:pl-6 sm:last:pr-6';

export function ProgramOperationalWorkTable({
  items,
  isLoading,
  error,
  onRefresh,
  onOpenProgram,
  sectionTitle = 'Programas en revisión',
  actionLabel = 'Ver programa',
  queueLabel = 'Acciones en el centro operacional',
}: ProgramOperationalWorkTableProps) {
  const showEmpty = !isLoading && !error && items.length === 0;

  return (
    <Card variant="roleGlass" className="overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/40 px-5 py-3 sm:px-6">
        <div>
          <p className={cn(text.label, 'mb-0.5')}>Mis pendientes</p>
          <h2 className="text-sm font-semibold tracking-tight text-slate-900">{sectionTitle}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-white/50 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-slate-500 ring-1 ring-white/60 backdrop-blur-sm">
            {items.length} en cola
          </span>
          <span className="hidden rounded-md bg-orange-50/80 px-2 py-0.5 text-[10px] font-medium text-orange-700 ring-1 ring-orange-100/80 sm:inline">
            {queueLabel}
          </span>
        </div>
      </div>

      {error ? (
        <div className="border-b border-rose-100/80 bg-rose-50/80 px-5 py-2.5 text-sm text-rose-700 sm:px-6">{error}</div>
      ) : null}

      {showEmpty ? (
        <EmptyState
          icon={Inbox}
          title="Bandeja al día"
          description="No hay programas pendientes en su bandeja operacional."
          variant="operational"
          action={
            <Button type="button" size="sm" variant="secondary" onClick={onRefresh}>
              Actualizar bandeja
            </Button>
          }
        />
      ) : (
        <>
          <div className="hidden overflow-auto md:block">
            <table className="w-full min-w-[920px] text-sm">
              <thead className={surface.roleGlassTableHead}>
                <tr>
                  <th className={thClass}>Solicitud</th>
                  <th className={thClass}>Avance</th>
                  <th className={thClass}>Etapa</th>
                  <th className={thClass}>Responsable</th>
                  <th className={thClass}>Plazo</th>
                  <th className={cn(thClass, 'text-right')}>Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/35">
                {isLoading
                  ? [...Array(4)].map((_, idx) => (
                      <tr key={idx}>
                        <td className={tdClass} colSpan={6}>
                          <div className="h-3 w-full animate-pulse rounded bg-white/50" />
                        </td>
                      </tr>
                    ))
                  : items.map((item) => (
                      <tr
                        key={item.projectId}
                        className="group relative cursor-pointer transition-colors duration-150 hover:bg-white/45"
                        onClick={() => onOpenProgram(item)}
                      >
                        <td className={cn(tdClass, 'relative before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:scale-y-0 before:bg-orange-400/70 before:transition-transform group-hover:before:scale-y-100')}>
                          <OperationalRequestItemHeading program={item.program} size="table" />
                          <p className="mt-0.5 text-[11px] text-slate-500">{item.school}</p>
                        </td>
                        <td className={tdClass}>
                          <p className="text-[11px] font-medium tabular-nums text-slate-600">
                            {formatProgramProgress({
                              completedSemesters: item.completedSemesters,
                              totalSemesters: item.totalSemesters,
                              completedSubjects: item.completedSubjects,
                              totalSubjects: item.totalSubjects,
                            })}
                          </p>
                        </td>
                        <td className={tdClass}>
                          <ProgramActiveStageBadge stages={item.activeStageSummary} />
                        </td>
                        <td className={tdClass}>
                          <span className="text-[11px] font-medium text-slate-600">
                            {roleLabelV2(item.currentResponsibleRole as OperationalRoleV2)}
                          </span>
                        </td>
                        <td className={tdClass}>
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center gap-1 text-[11px] tabular-nums text-slate-600">
                              <CalendarDays className="h-3 w-3 text-slate-400" strokeWidth={2} />
                              {item.nearestDueDate ? formatDate(item.nearestDueDate) : '—'}
                            </span>
                            <SlaBadgeV2 status={item.slaStatus as SlaStatusV2} />
                          </div>
                        </td>
                        <td className={cn(tdClass, 'text-right')} onClick={(e) => e.stopPropagation()}>
                          <FlowOpenButton label={actionLabel} onClick={() => onOpenProgram(item)} />
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-2 p-3 md:hidden">
            {isLoading
              ? [...Array(3)].map((_, idx) => <div key={idx} className="h-28 animate-pulse rounded-xl bg-white/40" />)
              : items.map((item) => (
                  <div
                    key={item.projectId}
                    className="rounded-xl border border-white/50 bg-white/45 p-3.5 backdrop-blur-sm transition-colors active:bg-white/65"
                    onClick={() => onOpenProgram(item)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <OperationalRequestItemHeading program={item.program} size="table" />
                        <p className="mt-0.5 text-[11px] text-slate-500">{item.school}</p>
                      </div>
                      <SlaBadgeV2 status={item.slaStatus as SlaStatusV2} />
                    </div>
                    <p className="mt-2 text-[11px] font-medium tabular-nums text-slate-600">
                      {formatProgramProgress({
                        completedSemesters: item.completedSemesters,
                        totalSemesters: item.totalSemesters,
                        completedSubjects: item.completedSubjects,
                        totalSubjects: item.totalSubjects,
                      })}
                    </p>
                    <div className="mt-2">
                      <ProgramActiveStageBadge stages={item.activeStageSummary} />
                    </div>
                    <div className="mt-2.5 flex justify-end">
                      <FlowOpenButton label={actionLabel} onClick={() => onOpenProgram(item)} />
                    </div>
                  </div>
                ))}
          </div>
        </>
      )}
    </Card>
  );
}
