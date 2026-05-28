import { ArrowRight, CalendarDays, Inbox } from 'lucide-react';
import { OperationalRequestItemHeading } from '../../components/operational/OperationalRequestItemHeading';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
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
    <Button
      type="button"
      size="sm"
      variant="secondary"
      className="shrink-0 gap-1.5 border-slate-200/80 bg-white font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
      onClick={onClick}
    >
      {label}
      <ArrowRight className="h-3.5 w-3.5" />
    </Button>
  );
}

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
    <Card className="overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/60 bg-white px-5 py-3.5 sm:px-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Mis pendientes</p>
          <h2 className="text-sm font-semibold text-slate-900">{sectionTitle}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-medium text-slate-500">
          <span className="rounded-md bg-slate-50 px-2.5 py-1 ring-1 ring-slate-200/70">{items.length} en cola</span>
          <span className="rounded-md bg-orange-50 px-2.5 py-1 text-orange-700 ring-1 ring-orange-100">{queueLabel}</span>
        </div>
      </div>

      {error ? (
        <div className="border-b border-rose-100 bg-rose-50 px-5 py-3 text-sm text-rose-700 sm:px-6">{error}</div>
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
              <thead className="bg-slate-50/90 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-2.5 text-left sm:px-6">Solicitud</th>
                  <th className="px-4 py-2.5 text-left sm:px-6">Avance</th>
                  <th className="px-4 py-2.5 text-left sm:px-6">Etapa</th>
                  <th className="px-4 py-2.5 text-left sm:px-6">Responsable</th>
                  <th className="px-4 py-2.5 text-left sm:px-6">Plazo</th>
                  <th className="px-5 py-2.5 text-right sm:px-6">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {isLoading
                  ? [...Array(4)].map((_, idx) => (
                      <tr key={idx}>
                        <td className="px-5 py-3 sm:px-6" colSpan={6}>
                          <div className="h-3.5 w-full animate-pulse rounded bg-slate-100" />
                        </td>
                      </tr>
                    ))
                  : items.map((item) => (
                      <tr
                        key={item.projectId}
                        className="cursor-pointer transition-colors hover:bg-slate-50/80"
                        onClick={() => onOpenProgram(item)}
                      >
                        <td className="px-5 py-3 align-middle sm:px-6">
                          <OperationalRequestItemHeading program={item.program} size="table" />
                          <p className="mt-1 text-xs text-slate-500">{item.school}</p>
                        </td>
                        <td className="px-4 py-3 align-middle sm:px-6">
                          <p className="text-xs font-medium text-slate-700">
                            {formatProgramProgress({
                              completedSemesters: item.completedSemesters,
                              totalSemesters: item.totalSemesters,
                              completedSubjects: item.completedSubjects,
                              totalSubjects: item.totalSubjects,
                            })}
                          </p>
                        </td>
                        <td className="px-4 py-3 align-middle sm:px-6">
                          <ProgramActiveStageBadge stages={item.activeStageSummary} />
                        </td>
                        <td className="px-4 py-3 align-middle sm:px-6">
                          <span className="text-xs font-medium text-slate-600">
                            {roleLabelV2(item.currentResponsibleRole as OperationalRoleV2)}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-middle sm:px-6">
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                              <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                              {item.nearestDueDate ? formatDate(item.nearestDueDate) : '—'}
                            </span>
                            <SlaBadgeV2 status={item.slaStatus as SlaStatusV2} />
                          </div>
                        </td>
                        <td
                          className="px-5 py-3 text-right align-middle sm:px-6"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FlowOpenButton label={actionLabel} onClick={() => onOpenProgram(item)} />
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-2 p-3 md:hidden">
            {isLoading
              ? [...Array(3)].map((_, idx) => <div key={idx} className="h-28 animate-pulse rounded-xl bg-slate-100" />)
              : items.map((item) => (
                  <div
                    key={item.projectId}
                    className="rounded-xl border border-slate-200/70 bg-white p-3.5 shadow-sm"
                    onClick={() => onOpenProgram(item)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <OperationalRequestItemHeading program={item.program} size="table" />
                        <p className="mt-1 text-xs text-slate-500">{item.school}</p>
                      </div>
                      <SlaBadgeV2 status={item.slaStatus as SlaStatusV2} />
                    </div>
                    <p className="mt-2 text-xs font-medium text-slate-700">
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
                    <div className="mt-3 flex justify-end">
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
