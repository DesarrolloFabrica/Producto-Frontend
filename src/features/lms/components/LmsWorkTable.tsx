import { ArrowRight, Loader2 } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { SkeletonTable } from '../../../components/ui/Skeleton';
import { cn, surface, tableRow, text } from '../../../components/ui/tokens';
import { Button } from '../../../components/ui/Button';
import { formatDate } from '../../../utils/formatters';
import { OperationalStateBadgeV2 } from '../../operations-v2/components/OperationalStateBadgeV2';
import { SlaBadgeV2 } from '../../operations-v2/components/SlaBadgeV2';
import type { SlaStatusV2 } from '../../../types/operationalWorkflow';
import type { InstitutionalOperationalAction } from '../../../types/domain';
import { LMS_ACTION_COPY } from '../lmsCopy';
import type { LmsWorkRow } from '../lmsTypes';

export function LmsWorkTable({
  rows,
  totalRows,
  isLoading,
  error,
  busySubjectId,
  onOpenFlow,
  onTransition,
}: {
  rows: LmsWorkRow[];
  totalRows?: number;
  isLoading: boolean;
  error: string | null;
  busySubjectId: string | null;
  onOpenFlow: (subjectId: string) => void;
  onTransition: (row: LmsWorkRow, action: InstitutionalOperationalAction) => void;
}) {
  const primaryAction = (row: LmsWorkRow): InstitutionalOperationalAction | null => {
    // Iniciar carga solo en el centro operacional (/subjects/:id/operations).
    if (row.availableActions.includes('LMS_CONFIRM_UPLOAD')) return 'LMS_CONFIRM_UPLOAD';
    return null;
  };

  const actionLabel = (action: InstitutionalOperationalAction) => {
    if (action === 'LMS_CONFIRM_UPLOAD') return LMS_ACTION_COPY.confirmUpload;
    return LMS_ACTION_COPY.viewFlow;
  };

  return (
    <Card variant="solid" className="overflow-hidden p-0">
      <div className={cn('flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/60 px-5 py-3.5 sm:px-6', surface.table)}>
        <div>
          <p className={text.label}>Bandeja LMS</p>
          <h2 className="text-sm font-semibold text-slate-900">Carga y publicación</h2>
        </div>
        <span className="rounded-lg bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500 ring-1 ring-slate-200/70">
          {totalRows != null && totalRows > rows.length
            ? `${rows.length} de ${totalRows} en vista`
            : `${rows.length} en vista`}
        </span>
      </div>

      {error ? (
        <div className="border-b border-rose-100 bg-rose-50 px-5 py-3 text-sm text-rose-700 sm:px-6">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="p-5 sm:p-6">
          <SkeletonTable rows={6} />
        </div>
      ) : rows.length === 0 ? null : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="px-5 py-3 sm:px-6">Solicitud / Proyecto</th>
                <th className="px-3 py-3">Asignatura</th>
                <th className="px-3 py-3">Programa</th>
                <th className="px-3 py-3">Etapa actual</th>
                <th className="px-3 py-3">Plazo</th>
                <th className="px-3 py-3">Última actividad</th>
                <th className="px-5 py-3 text-right sm:px-6">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => {
                const action = primaryAction(row);
                const isBusy = busySubjectId === row.subjectId;
                return (
                  <tr key={row.id} className={tableRow}>
                    <td className="px-5 py-4 sm:px-6">
                      <p className="text-[10px] font-bold uppercase text-slate-400">{row.school}</p>
                      <p className="font-bold text-slate-900">{row.program}</p>
                      <p className="text-xs text-slate-500">Sem. {row.semesterNumber}</p>
                    </td>
                    <td className="px-3 py-4 font-semibold text-slate-800">{row.subjectName}</td>
                    <td className="px-3 py-4 text-xs text-slate-600">{row.program}</td>
                    <td className="px-3 py-4">
                      <OperationalStateBadgeV2 state={row.operationalState} />
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex flex-col gap-1">
                        {row.stageDueAt ? (
                          <span className="text-xs font-medium text-slate-600">
                            {formatDate(row.stageDueAt)}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                        <SlaBadgeV2 status={row.slaStatus as SlaStatusV2} />
                      </div>
                    </td>
                    <td className="max-w-[12rem] px-3 py-4 text-xs text-slate-500">
                      {row.lastActivity ? (
                        <span className="line-clamp-2">{row.lastActivity}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-5 py-4 text-right sm:px-6">
                      <div className="flex flex-wrap justify-end gap-2">
                        {action ? (
                          <Button
                            type="button"
                            size="sm"
                            disabled={isBusy}
                              onClick={() => onTransition(row, action)}
                          >
                            {isBusy ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              actionLabel(action)
                            )}
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="gap-1.5"
                          disabled={isBusy}
                          onClick={() => onOpenFlow(row.actionUrl)}
                        >
                          {row.operationalState === 'RETURNED_TO_LMS_FROM_PLANNING'
                            ? LMS_ACTION_COPY.attendReturn
                            : LMS_ACTION_COPY.viewFlow}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
