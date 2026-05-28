import { OperationalStateBadgeV2 } from '../../operations-v2/components/OperationalStateBadgeV2';
import { SlaBadgeV2 } from '../../operations-v2/components/SlaBadgeV2';
import { roleLabelV2 } from '../../operations-v2/rules/workflowRulesV2';
import type { OperationalRoleV2, OperationalStateV2, SlaStatusV2 } from '../../../types/operationalWorkflow';
import type { AdminProgramTrackingRow } from '../adminTrackingTypes';
import { AdminResponsibleRoleBadge } from './AdminResponsibleRoleBadge';

function isFinalizedEstadoRow(row: AdminProgramTrackingRow): boolean {
  return (
    row.isFinalized ||
    row.operationalState === 'FINALIZED' ||
    row.slaStatus === 'FINALIZED_ON_TIME' ||
    row.slaStatus === 'FINALIZED_OVERDUE'
  );
}

/** Estado + SLA sin duplicar badges de cierre (FINALIZADO + Finalizado a tiempo). */
export function AdminRowEstadoSlaCell({ row }: { row: AdminProgramTrackingRow }) {
  const finalized = isFinalizedEstadoRow(row);

  if (finalized) {
    return (
      <div className="flex flex-col gap-1">
        {row.slaStatus ? (
          <SlaBadgeV2 status={row.slaStatus as SlaStatusV2} />
        ) : row.simplifiedStatusLabel ? (
          <span className="inline-flex w-fit rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 ring-1 ring-emerald-200/80">
            {row.simplifiedStatusLabel}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {row.operationalState && !row.isLegacyOnly ? (
        <OperationalStateBadgeV2 state={row.operationalState as OperationalStateV2} />
      ) : row.simplifiedStatusLabel ? (
        <span className="inline-flex w-fit rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 ring-1 ring-slate-200/80">
          {row.simplifiedStatusLabel}
        </span>
      ) : null}
      {row.currentResponsibleRole ? (
        <AdminResponsibleRoleBadge role={row.currentResponsibleRole} compact />
      ) : row.isLegacyOnly && row.productOwnerName ? (
        <span className="text-[10px] font-semibold text-slate-500">
          {roleLabelV2('PRODUCT' as OperationalRoleV2)} · {row.productOwnerName}
        </span>
      ) : null}
      {row.slaStatus ? <SlaBadgeV2 status={row.slaStatus as SlaStatusV2} /> : null}
    </div>
  );
}
