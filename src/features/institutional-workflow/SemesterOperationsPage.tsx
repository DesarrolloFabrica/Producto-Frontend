import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { ContextBackLink } from '../../navigation/ContextBackLink';
import { homePathForRole } from '../../navigation/roleNavigation';
import type { InstitutionalOperationalAction } from '../../types/domain';
import { OperationalStateBadgeV2 } from '../operations-v2/components/OperationalStateBadgeV2';
import { SlaBadgeV2 } from '../operations-v2/components/SlaBadgeV2';
import { TransitionModalsV2, type ModalRequestV2 } from '../operations-v2/modals/TransitionModalsV2';
import { actionLabelV2 } from '../operations-v2/rules/workflowRulesV2';
import { Button } from '../../components/ui/Button';
import { Skeleton, SkeletonKpiGrid } from '../../components/ui/Skeleton';
import { cn, surface } from '../../components/ui/tokens';
import { useToast } from '../../components/ui/ToastProvider';
import { getApiErrorMessage } from '../operations/apiMappers';
import { OperationalPipelineInstitutional } from './components/OperationalPipelineInstitutional';
import { OperationalTimelineExecutive } from './components/OperationalTimelineExecutive';
import { InstitutionalOperationalChecks } from './components/InstitutionalOperationalChecks';
import { institutionalStateLabel } from './institutionalCopy';
import { useSemesterOperationalWorkspaceQuery } from '../queries/useSemesterOperationalWorkspaceQuery';
import { useSemesterInstitutionalTransitionMutation } from '../queries/useSemesterInstitutionalTransitionMutation';
import type { OperationalCheckKeyV2, SlaStatusV2 } from '../../types/operationalWorkflow';

function isReturnOrRejectAction(action: InstitutionalOperationalAction): boolean {
  return action.includes('RETURN') || action === 'PRODUCT_REQUEST_CHANGES';
}

function sortActionsForDisplay(actions: InstitutionalOperationalAction[]): InstitutionalOperationalAction[] {
  return [...actions].sort((a, b) => {
    const aReturn = isReturnOrRejectAction(a);
    const bReturn = isReturnOrRejectAction(b);
    if (aReturn === bReturn) return 0;
    return aReturn ? 1 : -1;
  });
}

export function SemesterOperationsPage() {
  const { semesterId } = useParams<{ projectId: string; semesterId: string }>();
  const navigate = useNavigate();
  const { role } = useAuth();
  const roleHome = homePathForRole(role);
  const [modal, setModal] = useState<ModalRequestV2>(null);
  const { showToast } = useToast();
  const workspaceQuery = useSemesterOperationalWorkspaceQuery(semesterId);
  const transitionMutation = useSemesterInstitutionalTransitionMutation(semesterId);
  const workspace = workspaceQuery.data;

  const runTransition = async (params: {
    action: InstitutionalOperationalAction;
    comment?: string;
    evidenceUrl?: string;
  }) => {
    if (!semesterId) return;
    try {
      await transitionMutation.mutateAsync({
        action: params.action,
        comment: params.comment,
        returnReason: params.comment,
        evidenceUrl: params.evidenceUrl,
      });
      if (params.action === 'PRODUCT_START_ACADEMIC_REVIEW' && workspace?.subjects[0]) {
        navigate(`/subjects/${workspace.subjects[0].subjectId}?review=started`);
      }
    } catch (e: unknown) {
      showToast(getApiErrorMessage(e), 'error');
    }
  };

  if (workspaceQuery.isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 lg:px-8">
        <Skeleton variant="title" />
        <Skeleton variant="card" className="h-32" />
        <SkeletonKpiGrid count={4} />
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="mx-auto max-w-lg p-8">
        <p className="text-sm text-rose-600">No se pudo cargar el semestre operacional.</p>
        <ContextBackLink fallback={roleHome} className="mt-4 inline-flex rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600">
          Volver a mi bandeja
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

  const hasActions = workspace.availableActions.length > 0;
  const blockers = workspace.readiness?.blockers ?? [];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 lg:px-8">
        <header className={cn('glass-surface flex flex-wrap items-start justify-between gap-4 rounded-2xl p-5', surface.glassSubtle)}>
          <div className="flex items-start gap-3">
            <ContextBackLink fallback={roleHome} className="mt-0.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-100 hover:text-slate-800">
              Volver
            </ContextBackLink>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">
                Centro operacional por semestre
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                Semestre {workspace.semesterNumber}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {workspace.program} <span className="text-slate-300">·</span> {workspace.school}
              </p>
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
            <p><span className="font-semibold">Devolucion activa:</span> {workspace.lastReturnReason}</p>
          </div>
        ) : null}

        <OperationalPipelineInstitutional state={workspace.operationalState} />

        <div className="grid gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
            <p className="text-xs font-semibold uppercase text-slate-400">Asignaturas listas</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{workspace.metrics.subjectsReady}/{workspace.metrics.subjectsTotal}</p>
          </div>
          <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
            <p className="text-xs font-semibold uppercase text-slate-400">Aprobadas</p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">{workspace.metrics.subjectsApproved}</p>
          </div>
          <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
            <p className="text-xs font-semibold uppercase text-slate-400">Bloqueadas</p>
            <p className="mt-1 text-2xl font-bold text-rose-700">{workspace.metrics.subjectsBlocked}</p>
          </div>
          <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
            <p className="text-xs font-semibold uppercase text-slate-400">Observaciones abiertas</p>
            <p className="mt-1 text-2xl font-bold text-amber-700">{workspace.metrics.openObservations}</p>
          </div>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-3">
          <section className={cn('glass-surface rounded-2xl p-6 lg:col-span-2', surface.glassSubtle)}>
            <InstitutionalOperationalChecks checks={operationalChecks} now={new Date()} />
          </section>

          <section className="glass-surface h-fit self-start rounded-2xl border-l-4 border-l-amber-500 bg-amber-50/40 p-5 lg:col-span-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-800/90">Siguiente accion</p>
            <h2 className="mt-2 text-base font-semibold leading-snug text-slate-900">
              {institutionalStateLabel(workspace.operationalState)}
            </h2>
            {blockers.length > 0 ? (
              <ul className="mt-3 rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs text-amber-900">
                {blockers.slice(0, 5).map((blocker) => <li key={blocker}>• {blocker}</li>)}
              </ul>
            ) : null}
            {hasActions ? (
              <div className="mt-4 flex flex-col gap-2.5">
                {sortActionsForDisplay(workspace.availableActions).map((action) => {
                  const isReturn = isReturnOrRejectAction(action);
                  return (
                    <Button
                      key={action}
                      size="sm"
                      variant={isReturn ? 'secondary' : 'primary'}
                      className="w-full justify-center font-medium"
                      disabled={transitionMutation.isPending}
                      onClick={() => {
                        if (isReturn) {
                          setModal({ subjectId: workspace.semesterId, action: action as never });
                          return;
                        }
                        void runTransition({ action });
                      }}
                    >
                      {actionLabelV2(action as Parameters<typeof actionLabelV2>[0])}
                    </Button>
                  );
                })}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-600">No hay acciones pendientes de su rol en esta etapa.</p>
            )}
          </section>
        </div>

        <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
          <div className="border-b border-slate-100 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Asignaturas del paquete</p>
            <h2 className="text-sm font-semibold text-slate-900">Detalle interno del semestre</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-5 py-3 text-left">Asignatura</th>
                  <th className="px-5 py-3 text-left">Estado interno</th>
                  <th className="px-5 py-3 text-left">Bloqueos</th>
                  <th className="px-5 py-3 text-right">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {workspace.subjects.map((subject) => (
                  <tr key={subject.subjectId}>
                    <td className="px-5 py-4 font-semibold text-slate-900">{subject.subjectName}</td>
                    <td className="px-5 py-4 text-xs font-bold text-slate-600">{subject.internalState}</td>
                    <td className="px-5 py-4 text-xs text-slate-500">
                      {subject.blockers.length ? subject.blockers.slice(0, 2).join(' · ') : 'Sin bloqueos'}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link to={`/subjects/${subject.subjectId}/operations`} className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700">
                        Ver asignatura <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <OperationalTimelineExecutive items={operationalTimeline} />

        <TransitionModalsV2
          request={modal}
          onClose={() => setModal(null)}
          onConfirm={({ action, comment, evidenceUrl }) => {
            setModal(null);
            void runTransition({ action: action as InstitutionalOperationalAction, comment, evidenceUrl });
          }}
        />
      </div>
    </div>
  );
}
