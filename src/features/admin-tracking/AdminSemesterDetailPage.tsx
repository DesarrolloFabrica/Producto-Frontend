import { AlertCircle } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { ContextBackLink } from '../../navigation/ContextBackLink';
import { ADMIN_PROGRAM_DETAIL_PATH } from './adminNavigation';
import { cn, surface } from '../../components/ui/tokens';
import { Skeleton, SkeletonKpiGrid } from '../../components/ui/Skeleton';
import { OperationalStateBadgeV2 } from '../operations-v2/components/OperationalStateBadgeV2';
import { SlaBadgeV2 } from '../operations-v2/components/SlaBadgeV2';
import type { OperationalCheckKeyV2, SlaStatusV2 } from '../../types/operationalWorkflow';
import { OperationalPipelineInstitutional } from '../institutional-workflow/components/OperationalPipelineInstitutional';
import { InstitutionalOperationalChecks } from '../institutional-workflow/components/InstitutionalOperationalChecks';
import { OperationalTimelineExecutive } from '../institutional-workflow/components/OperationalTimelineExecutive';
import { SemesterSubjectsTable } from '../institutional-workflow/components/SemesterSubjectsTable';
import { useSemesterOperationalWorkspaceQuery } from '../queries/useSemesterOperationalWorkspaceQuery';

const backLinkClassName =
  'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-100 hover:text-slate-800';

export function AdminSemesterDetailPage() {
  const { projectId, semesterId } = useParams<{ projectId: string; semesterId: string }>();
  const backTarget = projectId ? ADMIN_PROGRAM_DETAIL_PATH(projectId) : '/admin/dashboard';
  const workspaceQuery = useSemesterOperationalWorkspaceQuery(semesterId);
  const workspace = workspaceQuery.data;

  if (workspaceQuery.isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 lg:px-8">
        <Skeleton variant="title" />
        <Skeleton variant="card" className="h-32" />
        <SkeletonKpiGrid count={3} />
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="mx-auto max-w-lg p-8">
        <p className="text-sm text-rose-600">No se pudo cargar el semestre operacional.</p>
        <ContextBackLink fallback={backTarget} className={cn('mt-4 inline-flex', backLinkClassName)}>
          Volver al detalle del programa
        </ContextBackLink>
      </div>
    );
  }

  const operationalChecks = (workspace.checks ?? []).map((c) => ({
    key: c.key as OperationalCheckKeyV2,
    label: c.label,
    responsibleRole: c.responsibleRole,
    status: c.status,
    checkedAt: c.checkedAt,
    checkedBy: c.checkedByName ? { id: '', name: c.checkedByName, role: c.responsibleRole } : null,
    comment: c.comment,
    evidenceUrl: c.evidenceUrl,
    dueAt: workspace.stageDueAt,
  }));

  const operationalTimeline = (workspace.timeline ?? []).map((t) => ({
    id: t.id,
    occurredAt: t.createdAt,
    from: t.fromState,
    to: t.toState,
    action: t.action,
    actor: { id: '', name: t.actorName, role: t.actorRole },
    comment: t.comment,
    returnReason: t.returnReason,
    durationLabel: null,
  }));

  const subjectsPendingProduction = Math.max(
    0,
    workspace.metrics.subjectsTotal - workspace.metrics.subjectsReady,
  );

  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 lg:px-8">
        <header
          className={cn(
            'glass-surface flex flex-wrap items-start justify-between gap-4 rounded-2xl p-5',
            surface.glassSubtle,
          )}
        >
          <div className="flex items-start gap-3">
            <ContextBackLink fallback={backTarget} className={cn('mt-0.5', backLinkClassName)}>
              Volver
            </ContextBackLink>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">
                Seguimiento ejecutivo por semestre
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                Semestre {workspace.semesterNumber}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {workspace.program} <span className="text-slate-300">·</span> {workspace.school}
              </p>
              <p className="mt-1 text-xs text-slate-400">Vista de solo lectura — sin acciones operativas</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <OperationalStateBadgeV2 state={workspace.operationalState} />
            <SlaBadgeV2 status={workspace.slaStatus as SlaStatusV2} />
          </div>
        </header>

        {workspace.lastReturnReason ? (
          <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              <span className="font-semibold">Devolución activa:</span> {workspace.lastReturnReason}
            </p>
          </div>
        ) : null}

        <OperationalPipelineInstitutional state={workspace.operationalState} />

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
            <p className="text-xs font-semibold uppercase text-slate-400">Producidas</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {workspace.metrics.subjectsReady}/{workspace.metrics.subjectsTotal}
            </p>
          </div>
          <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
            <p className="text-xs font-semibold uppercase text-slate-400">Pendientes de producir</p>
            <p className="mt-1 text-2xl font-bold text-orange-600">{subjectsPendingProduction}</p>
          </div>
          <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
            <p className="text-xs font-semibold uppercase text-slate-400">Observaciones abiertas</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{workspace.metrics.openObservations}</p>
          </div>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-3">
          <section className={cn('glass-surface rounded-2xl p-6 lg:col-span-2', surface.glassSubtle)}>
            <InstitutionalOperationalChecks checks={operationalChecks} now={new Date()} />
          </section>
          <section className="glass-surface h-fit self-start rounded-2xl border-l-4 border-l-slate-300 bg-slate-50/40 p-5 lg:col-span-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Estado actual</p>
            <h2 className="mt-2 text-base font-semibold leading-snug text-slate-900">
              {workspace.currentResponsibleRole ?? '—'}
            </h2>
            {workspace.stageDueAt ? (
              <p className="mt-2 text-xs text-slate-500">Plazo: {new Date(workspace.stageDueAt).toLocaleDateString('es-CO')}</p>
            ) : null}
          </section>
        </div>

        <section ref={undefined} className={cn('glass-surface rounded-2xl p-6', surface.glassSubtle)}>
          <h2 className="text-sm font-semibold text-slate-900">Asignaturas del semestre</h2>
          <div className="mt-4">
            <SemesterSubjectsTable subjects={workspace.subjects} readOnly />
          </div>
        </section>

        <OperationalTimelineExecutive items={operationalTimeline} />
      </div>
    </div>
  );
}
