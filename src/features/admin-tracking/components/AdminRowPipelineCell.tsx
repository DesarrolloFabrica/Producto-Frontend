import { cn } from '../../../components/ui/tokens';
import { OperationalPipelineInstitutional } from '../../institutional-workflow/components/OperationalPipelineInstitutional';
import { ProgramActiveStageBadge } from '../../operations-v2/components/ProgramActiveStageBadge';
import type { AdminProgramTrackingRow } from '../adminTrackingTypes';

function AdminProductionProgressMini({ percent }: { percent: number }) {
  const safe = Math.min(100, Math.max(0, percent));
  return (
    <div className="min-w-0 space-y-1">
      <div className="flex items-center justify-between gap-2 text-[10px] font-semibold text-slate-500">
        <span>Producción</span>
        <span className="tabular-nums text-slate-700">{safe}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200/80">
        <div
          className="h-full rounded-full bg-linear-to-r from-orange-400 to-orange-600 transition-all"
          style={{ width: `${safe}%` }}
        />
      </div>
    </div>
  );
}

export function AdminRowPipelineCell({ row }: { row: AdminProgramTrackingRow }) {
  if (row.operationalState) {
    return (
      <div className="min-w-0 space-y-1.5">
        <OperationalPipelineInstitutional
          state={row.operationalState}
          variant="row"
          showHeader={false}
        />
        {row.activeStageSummary.length > 0 ? (
          <ProgramActiveStageBadge stages={row.activeStageSummary} />
        ) : null}
      </div>
    );
  }

  if (row.productionProgressPercent != null) {
    return (
      <div className="min-w-0 space-y-1.5">
        <span className="inline-flex w-fit rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 ring-1 ring-amber-100">
          Pre-institutional
        </span>
        <AdminProductionProgressMini percent={row.productionProgressPercent} />
      </div>
    );
  }

  return (
    <span className={cn('text-[10px] font-medium text-slate-400')}>
      {row.simplifiedStatusLabel ?? 'Sin flujo activo'}
    </span>
  );
}
