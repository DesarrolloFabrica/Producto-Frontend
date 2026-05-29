import { useQuery } from '@tanstack/react-query';
import { AlertCircle, FileCheck2, Loader2 } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { formatDate } from '../../../utils/formatters';
import { projectRadicationApi } from '../../../services/projectRadicationApi';
import {
  projectRadicationKeys,
  RadicationProgressBar,
} from '../../project-radication/ProjectRadicationPanel';
import { InstitutionalOperationalChecks } from '../../institutional-workflow/components/InstitutionalOperationalChecks';
import { INSTITUTIONAL_CLOSURE_CHECKS } from '../../institutional-workflow/institutionalClosureChecks';
import type { OperationalCheckKeyV2 } from '../../../types/operationalWorkflow';

type AdminRadicationReadOnlyPanelProps = {
  projectId: string;
  macroProgress?: {
    completedSemesters: number;
    totalSemesters: number;
    completedSubjects: number;
    totalSubjects: number;
  };
};

function projectStateLabel(state: string | null | undefined): string {
  switch (state) {
    case 'READY_FOR_PRODUCT_RADICATION':
      return 'Listo para radicar';
    case 'PENDING_PLANNING_RADICATION_CHECK':
      return 'En validación Planeación';
    case 'RADICATION_RETURNED_TO_PRODUCT':
      return 'Radicado devuelto';
    case 'FINALIZED':
      return 'Solicitud finalizada';
    default:
      return 'En progreso institucional';
  }
}

export function AdminRadicationReadOnlyPanel({
  projectId,
  macroProgress,
}: AdminRadicationReadOnlyPanelProps) {
  const readinessQuery = useQuery({
    queryKey: projectRadicationKeys.readiness(projectId),
    queryFn: () => projectRadicationApi.getReadiness(projectId),
    enabled: Boolean(projectId),
    retry: 1,
  });

  if (readinessQuery.isLoading) {
    return (
      <Card className="flex items-center gap-2 p-6 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
        Cargando estado de radicación…
      </Card>
    );
  }

  if (readinessQuery.isError || !readinessQuery.data) {
    return (
      <Card className="border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-900">
        No se pudo cargar el estado de radicación institucional.
      </Card>
    );
  }

  const data = readinessQuery.data;
  const isPendingPlanning = data.projectInstitutionalState === 'PENDING_PLANNING_RADICATION_CHECK';
  const scopeComplete =
    data.scope.subjectsTotal > 0 && data.scope.subjectsApproved >= data.scope.subjectsTotal;

  const checks = INSTITUTIONAL_CLOSURE_CHECKS.map((def, index) => ({
    key: def.key as OperationalCheckKeyV2,
    label: def.label,
    responsibleRole: def.responsibleRole,
    status: (isPendingPlanning && index === INSTITUTIONAL_CLOSURE_CHECKS.length - 1
      ? 'PENDING'
      : index < INSTITUTIONAL_CLOSURE_CHECKS.length - 1 || data.projectInstitutionalState === 'FINALIZED'
        ? 'CHECKED'
        : 'PENDING') as 'CHECKED' | 'PENDING',
    checkedAt:
      index < INSTITUTIONAL_CLOSURE_CHECKS.length - 1 && data.radicatedAt
        ? data.radicatedAt
        : null,
    checkedBy: null,
    comment: null,
    evidenceUrl: null,
    dueAt: isPendingPlanning ? data.planningRadicationCheckDueAt : data.productRadicationDueAt,
  }));

  return (
    <Card className="overflow-hidden rounded-[20px] border border-slate-200/80 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-linear-to-r from-slate-50/90 via-white to-white px-6 py-5 sm:px-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Radicación institucional
            </p>
            <h2 className="mt-1 text-lg font-black tracking-tight text-slate-900">
              {projectStateLabel(data.projectInstitutionalState)}
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Vista de solo lectura para seguimiento ejecutivo. Las acciones de radicación y validación
              corresponden a los roles operativos.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
            <FileCheck2 className="h-3.5 w-3.5" />
            Solo lectura
          </span>
        </div>

        {data.radicationNumber ? (
          <p className="mt-3 text-sm text-slate-700">
            <span className="font-semibold">Radicado:</span> {data.radicationNumber}
            {data.radicatedAt ? ` · ${formatDate(data.radicatedAt)}` : ''}
          </p>
        ) : null}

        {data.lastRadicationReturnReason ? (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p>
              <span className="font-semibold">Devolución:</span> {data.lastRadicationReturnReason}
            </p>
          </div>
        ) : null}

        <RadicationProgressBar
          approved={data.scope.subjectsApproved}
          total={data.scope.subjectsTotal}
          complete={scopeComplete || data.projectInstitutionalState === 'FINALIZED'}
        />

        {macroProgress ? (
          <p className="mt-2 text-xs text-slate-500">
            Semestres: {macroProgress.completedSemesters}/{macroProgress.totalSemesters} · Materias:{' '}
            {macroProgress.completedSubjects}/{macroProgress.totalSubjects}
          </p>
        ) : null}

        {data.blockers.length > 0 ? (
          <ul className="mt-3 space-y-1 rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs text-amber-900">
            {data.blockers.map((blocker) => (
              <li key={blocker}>• {blocker}</li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="px-6 py-5 sm:px-7">
        <InstitutionalOperationalChecks checks={checks} now={new Date()} />
      </div>
    </Card>
  );
}
