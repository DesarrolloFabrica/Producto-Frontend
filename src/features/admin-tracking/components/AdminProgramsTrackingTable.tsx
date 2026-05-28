import { AlertCircle, Inbox, SearchX } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { EmptyState } from '../../../components/ui/EmptyState';
import { SkeletonTable } from '../../../components/ui/Skeleton';
import { cn, surface, tableRow, text } from '../../../components/ui/tokens';
import { formatDate } from '../../../utils/formatters';
import { formatProgramProgress } from '../../institutional-workflow/institutionalCopy';
import {
  OperationalInboxActionCell,
  OperationalInboxFlowAction,
  operationalInboxActionHeaderClass,
} from '../../operations-v2/components/OperationalInboxFlowAction';
import type { AdminProgramTrackingRow } from '../adminTrackingTypes';
import { formatRelativeTime } from '../../operations/notificationInbox';
import { AdminRowEstadoSlaCell } from './AdminRowEstadoSlaCell';
import { AdminRowPipelineCell } from './AdminRowPipelineCell';

function formatSemestersCompact(numbers: number[]): string {
  if (numbers.length === 0) return '—';
  if (numbers.length <= 4) return numbers.join(', ');
  return `${numbers.slice(0, 3).join(', ')} +${numbers.length - 3}`;
}

function AdminRowProgramCell({ row }: { row: AdminProgramTrackingRow }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{row.school}</p>
      <p className="font-bold text-slate-900">{row.program}</p>
      <p className="text-xs text-slate-500">{row.modality}</p>
      {row.semesterNumbers.length > 0 ? (
        <p className="text-[10px] text-slate-400">Sem. {formatSemestersCompact(row.semesterNumbers)}</p>
      ) : null}
      {row.projectCreatedAt ? (
        <p className="text-[10px] text-slate-400">
          Creado {formatRelativeTime(row.projectCreatedAt).toLowerCase()}
        </p>
      ) : null}
    </div>
  );
}

function resolveAdminRowProgress(row: AdminProgramTrackingRow): {
  completedSemesters: number;
  totalSemesters: number;
  completedSubjects: number;
  totalSubjects: number;
} | null {
  const totalSubjects = row.subjectsTotal;
  const totalSemesters = Math.max(row.totalSemesters, row.semesterNumbers.length);
  if (totalSubjects <= 0 && totalSemesters <= 0) return null;

  const finalized = row.isFinalized || row.operationalState === 'FINALIZED';

  const completedSubjects = finalized
    ? Math.max(row.completedSubjects, row.subjectsReady, totalSubjects)
    : Math.max(row.completedSubjects, row.subjectsReady);

  const completedSemesters = finalized
    ? Math.max(row.completedSemesters, totalSemesters)
    : row.completedSemesters;

  return {
    completedSemesters,
    totalSemesters: Math.max(totalSemesters, completedSemesters),
    completedSubjects,
    totalSubjects: Math.max(totalSubjects, completedSubjects),
  };
}

function AdminRowProgressCell({ row }: { row: AdminProgramTrackingRow }) {
  const progress = resolveAdminRowProgress(row);
  if (!progress) {
    return <span className="text-xs text-slate-400">—</span>;
  }

  const complete =
    (row.isFinalized || row.operationalState === 'FINALIZED') &&
    progress.totalSubjects > 0 &&
    progress.completedSubjects >= progress.totalSubjects;

  return (
    <p
      className={
        complete ? 'text-xs font-semibold text-emerald-700' : 'text-xs font-medium text-slate-700'
      }
    >
      {formatProgramProgress(progress)}
    </p>
  );
}

export function AdminProgramsTrackingTable({
  rows,
  totalRows,
  filteredCount,
  isLoading,
  error,
  onClearFilters,
}: {
  rows: AdminProgramTrackingRow[];
  totalRows: number;
  filteredCount: number;
  isLoading: boolean;
  error: string | null;
  onClearFilters: () => void;
}) {
  const location = useLocation();

  return (
    <Card variant="roleGlass" className="overflow-hidden p-0">
      <div className={cn('flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 sm:px-6', surface.table)}>
        <div>
          <p className={text.label}>Seguimiento institucional</p>
          <h2 className="text-sm font-semibold text-slate-900">Programas y solicitudes</h2>
        </div>
        <span className="rounded-lg bg-white/50 px-2.5 py-1 text-[11px] font-medium text-slate-500 ring-1 ring-white/55 backdrop-blur-sm">
          {filteredCount} de {totalRows} programas
        </span>
      </div>

      {error ? (
        <div className="border-b border-rose-100 bg-rose-50 px-5 py-3 text-sm text-rose-700 sm:px-6">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="p-5 sm:p-6">
          <SkeletonTable rows={8} />
        </div>
      ) : totalRows === 0 ? (
        <div className="p-5 sm:p-6">
          <EmptyState
            icon={Inbox}
            cardVariant="roleGlass"
            variant="compact"
            title="Sin programas en seguimiento"
            description="Cuando existan solicitudes institucionales, aparecerán aquí con pipeline y métricas."
          />
        </div>
      ) : filteredCount === 0 ? (
        <div className="p-5 sm:p-6">
          <EmptyState
            icon={SearchX}
            cardVariant="roleGlass"
            variant="compact"
            title="Sin resultados"
            description="Ajusta los filtros para ver más programas."
            action={
              <button
                type="button"
                onClick={onClearFilters}
                className="rounded-xl border border-slate-200/80 bg-white/90 px-4 py-2 text-xs font-semibold text-slate-700 backdrop-blur-sm hover:bg-white"
              >
                Limpiar filtros
              </button>
            }
          />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[960px] w-full text-left text-sm">
            <thead>
              <tr
                className={cn(
                  'text-[10px] font-bold uppercase tracking-wider text-slate-400',
                  surface.roleGlassTableHead,
                )}
              >
                <th className="min-w-[200px] px-5 py-3 sm:px-6">Programa</th>
                <th className="px-3 py-3">Avance</th>
                <th className="min-w-[140px] px-3 py-3">Estado / SLA</th>
                <th className="min-w-[280px] px-3 py-3">Pipeline</th>
                <th className="px-3 py-3">Plazo</th>
                <th className={operationalInboxActionHeaderClass}>Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {rows.map((row) => (
                <tr key={row.projectId} className={tableRow}>
                  <td className="px-5 py-4 sm:px-6">
                    <AdminRowProgramCell row={row} />
                  </td>
                  <td className="px-3 py-4">
                    <AdminRowProgressCell row={row} />
                    {row.openObservations > 0 ? (
                      <p className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-amber-700">
                        <AlertCircle className="h-3 w-3" />
                        {row.openObservations} obs.
                      </p>
                    ) : null}
                  </td>
                  <td className="px-3 py-4">
                    <AdminRowEstadoSlaCell row={row} />
                  </td>
                  <td className="px-3 py-4">
                    <AdminRowPipelineCell row={row} />
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex flex-col gap-1">
                      {(row.nearestDueAt ?? row.stageDueAt) ? (
                        <span className="text-xs font-medium text-slate-600">
                          {formatDate(row.nearestDueAt ?? row.stageDueAt!)}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </div>
                  </td>
                  <OperationalInboxActionCell>
                    <OperationalInboxFlowAction
                      label="Ver detalle"
                      to={row.detailPath}
                      state={{
                        from: location.pathname,
                        programWorkItem: row.programWorkItem ?? undefined,
                      }}
                    />
                  </OperationalInboxActionCell>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
