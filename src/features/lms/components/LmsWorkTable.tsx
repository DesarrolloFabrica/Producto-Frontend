import { Card } from '../../../components/ui/Card';
import { SkeletonTable } from '../../../components/ui/Skeleton';
import { cn, surface, tableRow, text } from '../../../components/ui/tokens';
import { formatDate } from '../../../utils/formatters';
import { formatProgramProgress } from '../../institutional-workflow/institutionalCopy';
import { ProgramActiveStageBadge } from '../../operations-v2/components/ProgramActiveStageBadge';
import { SlaBadgeV2 } from '../../operations-v2/components/SlaBadgeV2';
import {
  OperationalInboxActionCell,
  OperationalInboxFlowAction,
  operationalInboxActionHeaderClass,
} from '../../operations-v2/components/OperationalInboxFlowAction';
import { roleLabelV2 } from '../../operations-v2/rules/workflowRulesV2';
import type { OperationalRoleV2, SlaStatusV2 } from '../../../types/operationalWorkflow';
import { LMS_ACTION_COPY } from '../lmsCopy';
import type { LmsWorkRow } from '../lmsTypes';

function roleLabel(role: string): string {
  return roleLabelV2(role as OperationalRoleV2);
}

export function LmsWorkTable({
  rows,
  totalRows,
  isLoading,
  error,
  onOpenFlow,
}: {
  rows: LmsWorkRow[];
  totalRows?: number;
  isLoading: boolean;
  error: string | null;
  onOpenFlow: (actionUrl: string) => void;
}) {
  return (
    <Card variant="roleGlass" className="overflow-hidden p-0">
      <div className={cn('flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 sm:px-6', surface.table)}>
        <div>
          <p className={text.label}>Bandeja LMS</p>
          <h2 className="text-sm font-semibold text-slate-900">Carga y publicación por programa</h2>
        </div>
        <span className="rounded-lg bg-white/50 px-2.5 py-1 text-[11px] font-medium text-slate-500 ring-1 ring-white/55 backdrop-blur-sm">
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
              <tr className={cn('text-[10px] font-bold uppercase tracking-wider text-slate-400', surface.roleGlassTableHead)}>
                <th className="px-5 py-3 sm:px-6">Solicitud / Programa</th>
                <th className="px-3 py-3">Avance</th>
                <th className="px-3 py-3">Etapa</th>
                <th className="px-3 py-3">Responsable</th>
                <th className="px-3 py-3">Plazo</th>
                <th className={operationalInboxActionHeaderClass}>Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => {
                if (row.kind === 'program') {
                  const hasReturn = row.semesters.some(
                    (semester) => semester.operationalState === 'RETURNED_TO_LMS_FROM_PLANNING',
                  );
                  return (
                    <tr key={row.id} className={tableRow}>
                      <td className="px-5 py-4 sm:px-6">
                        <p className="text-[10px] font-bold uppercase text-slate-400">{row.school}</p>
                        <p className="font-bold text-slate-900">{row.program}</p>
                        <p className="text-xs text-slate-500">Carga por programa</p>
                      </td>
                      <td className="px-3 py-4">
                        <p className="text-xs font-medium text-slate-700">
                          {formatProgramProgress({
                            completedSemesters: row.completedSemesters,
                            totalSemesters: row.totalSemesters,
                            completedSubjects: row.completedSubjects,
                            totalSubjects: row.totalSubjects,
                          })}
                        </p>
                      </td>
                      <td className="px-3 py-4">
                        <ProgramActiveStageBadge stages={row.activeStageSummary} />
                      </td>
                      <td className="px-3 py-4 text-xs font-semibold text-slate-600">
                        {roleLabel(row.currentResponsibleRole)}
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
                      <OperationalInboxActionCell>
                        <OperationalInboxFlowAction
                          label={hasReturn ? LMS_ACTION_COPY.attendReturn : LMS_ACTION_COPY.viewFlow}
                          onClick={() => onOpenFlow(row.actionUrl)}
                        />
                      </OperationalInboxActionCell>
                    </tr>
                  );
                }

                return (
                  <tr key={row.id} className={tableRow}>
                    <td className="px-5 py-4 sm:px-6">
                      <p className="text-[10px] font-bold uppercase text-slate-400">{row.school}</p>
                      <p className="font-bold text-slate-900">{row.program}</p>
                      <p className="text-xs text-slate-500">Carga completada</p>
                    </td>
                    <td className="px-3 py-4 text-xs text-slate-600">
                      {row.subjectsCompleted} materia{row.subjectsCompleted === 1 ? '' : 's'}
                    </td>
                    <td className="px-3 py-4">
                      <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-100">
                        Completada
                      </span>
                    </td>
                    <td className="px-3 py-4 text-xs text-slate-400">—</td>
                    <td className="px-3 py-4 text-xs text-slate-500">
                      {row.stageDueAt ? formatDate(row.stageDueAt) : '—'}
                    </td>
                    <OperationalInboxActionCell>
                      <OperationalInboxFlowAction
                        label={LMS_ACTION_COPY.viewFlow}
                        onClick={() => onOpenFlow(row.actionUrl)}
                      />
                    </OperationalInboxActionCell>
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
