import { cn } from '../../../components/ui/tokens';
import { StatusBadge } from '../../../components/status/StatusBadge';
import { OperationalStateBadgeV2 } from '../../operations-v2/components/OperationalStateBadgeV2';
import { SlaBadgeV2 } from '../../operations-v2/components/SlaBadgeV2';
import { OperationalPipelineInstitutional } from '../../institutional-workflow/components/OperationalPipelineInstitutional';
import type { OperationalStateV2, SlaStatusV2 } from '../../../types/operationalWorkflow';
import type { AdminProgramTrackingRow } from '../adminTrackingTypes';
import { AdminResponsibleRoleBadge } from './AdminResponsibleRoleBadge';
import { formatRelativeTime } from '../../operations/notificationInbox';

function formatSemestersCompact(numbers: number[]): string {
  if (numbers.length === 0) return '';
  if (numbers.length === 1) return String(numbers[0]);
  return numbers.join(', ');
}

/** Programa 25% · estado 20% · pipeline 55% */
export const ADMIN_TRACKING_ROW_GRID =
  'lg:grid lg:grid-cols-[minmax(0,25%)_minmax(112px,20%)_minmax(0,55%)] lg:items-center lg:gap-5';

function AdminRowProgram({ row, simplified }: { row: AdminProgramTrackingRow; simplified: boolean }) {
  const semesters = formatSemestersCompact(row.semesterNumbers);
  const showSchool = row.school.trim().length > 0;

  return (
    <div className="min-w-0">
      <p className="truncate text-sm font-bold leading-tight text-slate-900" title={row.program}>
        {row.program}
      </p>
      {showSchool ? (
        <p className="truncate text-[11px] leading-tight text-slate-500" title={row.school}>
          {row.school}
        </p>
      ) : null}
      {!simplified && semesters ? (
        <p className="text-[10px] leading-tight text-slate-400">Sem. {semesters}</p>
      ) : null}
      {row.projectCreatedAt ? (
        <p className="text-[10px] leading-tight text-slate-400" title={row.projectCreatedAt}>
          Creado {formatRelativeTime(row.projectCreatedAt).toLowerCase()}
        </p>
      ) : null}
    </div>
  );
}

function AdminRowEstado({ row, simplified }: { row: AdminProgramTrackingRow; simplified: boolean }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      {!simplified && row.operationalState ? (
        <OperationalStateBadgeV2 state={row.operationalState as OperationalStateV2} />
      ) : simplified && row.simplifiedStatusLabel ? (
        <span className="inline-flex w-fit rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 ring-1 ring-slate-200/80">
          {row.simplifiedStatusLabel}
        </span>
      ) : null}
      {!simplified && row.currentResponsibleRole ? (
        <AdminResponsibleRoleBadge role={row.currentResponsibleRole} compact />
      ) : null}
      {!simplified && row.slaStatus ? (
        <SlaBadgeV2 status={row.slaStatus as SlaStatusV2} />
      ) : simplified && row.projectStatus ? (
        <StatusBadge status={row.projectStatus} size="sm" />
      ) : null}
    </div>
  );
}

function AdminRowPipeline({ row, simplified }: { row: AdminProgramTrackingRow; simplified: boolean }) {
  if (simplified || !row.operationalState) {
    return <span className="text-[10px] text-slate-400">—</span>;
  }

  return (
    <OperationalPipelineInstitutional state={row.operationalState} variant="row" showHeader={false} />
  );
}

export function AdminProgramTrackingCard({ row }: { row: AdminProgramTrackingRow }) {
  const simplified = !row.showInstitutionalPipeline;

  return (
    <article
      className={cn(
        'group space-y-2 border-b border-slate-100 px-3 py-2.5 transition-colors last:border-b-0 hover:bg-slate-50/70',
        'min-h-[76px] lg:space-y-0',
        ADMIN_TRACKING_ROW_GRID,
      )}
    >
      <div className="min-w-0 lg:col-start-1">
        <AdminRowProgram row={row} simplified={simplified} />
      </div>

      <div className="min-w-0 lg:col-start-2">
        <AdminRowEstado row={row} simplified={simplified} />
      </div>

      <div className="flex min-w-0 items-center lg:col-start-3">
        <AdminRowPipeline row={row} simplified={simplified} />
      </div>
    </article>
  );
}

export const ADMIN_TRACKING_LIST_HEADER_CLASS = cn(
  'hidden border-b border-slate-200 bg-slate-50/90 px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-500 lg:grid lg:items-center lg:gap-5',
  'lg:grid-cols-[minmax(0,25%)_minmax(112px,20%)_minmax(0,55%)]',
);

export function AdminProgramTrackingListHeader() {
  return (
    <div className={ADMIN_TRACKING_LIST_HEADER_CLASS}>
      <span>Programa</span>
      <span>Estado actual</span>
      <span>Pipeline</span>
    </div>
  );
}
