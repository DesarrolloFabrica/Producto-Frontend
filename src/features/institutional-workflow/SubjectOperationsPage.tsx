import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, Loader2 } from 'lucide-react';
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
import { useOperationalWorkspaceQuery } from '../queries/useOperationalWorkspaceQuery';
import { useInstitutionalTransitionMutation } from '../queries/useInstitutionalTransitionMutation';
import { OperationalPipelineInstitutional } from './components/OperationalPipelineInstitutional';
import { OperationalTimelineExecutive } from './components/OperationalTimelineExecutive';
import { InstitutionalOperationalChecks } from './components/InstitutionalOperationalChecks';
import { institutionalStateLabel } from './institutionalCopy';
import type { OperationalCheckKeyV2 } from '../../types/operationalWorkflow';
import type { SlaStatusV2 } from '../../types/operationalWorkflow';
import { cn } from '../../components/ui/tokens';
import { useToast } from '../../components/ui/ToastProvider';
import { getApiErrorMessage } from '../operations/apiMappers';

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

export function SubjectOperationsPage() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const { role } = useAuth();
  const roleHome = homePathForRole(role);
  const [modal, setModal] = useState<ModalRequestV2>(null);

  const { showToast } = useToast();
  const workspaceQuery = useOperationalWorkspaceQuery(subjectId);
  const transitionMutation = useInstitutionalTransitionMutation(subjectId);

  const workspace = workspaceQuery.data;
  const loading = workspaceQuery.isLoading;
  const error = workspaceQuery.error
    ? workspaceQuery.error instanceof Error
      ? workspaceQuery.error.message
      : 'No se pudo cargar'
    : null;

  const runTransition = async (params: {
    action: InstitutionalOperationalAction;
    comment?: string;
    evidenceUrl?: string;
  }) => {
    if (!subjectId) return;
    try {
      await transitionMutation.mutateAsync({
        action: params.action,
        comment: params.comment,
        returnReason: params.comment,
        evidenceUrl: params.evidenceUrl,
      });
      if (params.action === 'PRODUCT_START_ACADEMIC_REVIEW') {
        navigate(`/subjects/${subjectId}?review=started`);
      }
    } catch (e: unknown) {
      showToast(getApiErrorMessage(e), 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-slate-50">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
          Cargando centro operacional…
        </div>
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="mx-auto max-w-lg p-8">
        <p className="text-sm text-rose-600">{error ?? 'Sin datos'}</p>
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
    checkedAt: c.checkedAt
      ? typeof c.checkedAt === 'string'
        ? c.checkedAt
        : new Date(c.checkedAt).toISOString()
      : null,
    checkedBy: c.checkedByName ? { id: '', name: c.checkedByName, role: c.responsibleRole } : null,
    comment: c.comment,
    evidenceUrl: c.evidenceUrl,
    dueAt: workspace.stageDueAt
      ? typeof workspace.stageDueAt === 'string'
        ? workspace.stageDueAt
        : new Date(workspace.stageDueAt).toISOString()
      : null,
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

  const showChecklistLink = workspace.academicChecklistEnabled;
  const hasActions = workspace.availableActions.length > 0;
  const stateHint = workspace.academicReviewReady
    ? 'Inicie la revisión académica para habilitar el checklist.'
    : workspace.academicApprovalBlockers?.length
      ? workspace.academicApprovalBlockers.join(' ')
      : 'La revisión académica se habilitará cuando Planeación valide la carga LMS.';

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 lg:px-8">
        {/* Header */}
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <ContextBackLink
              fallback={roleHome}
              className="mt-0.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-100 hover:text-slate-800"
              aria-label="Volver a mi bandeja"
            >
              ← Volver
            </ContextBackLink>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">
                Centro operacional
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                {workspace.subjectName}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {workspace.program}
                <span className="text-slate-300"> · </span>
                {workspace.school}
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
            <p>
              <span className="font-semibold">Devolución activa:</span> {workspace.lastReturnReason}
            </p>
          </div>
        ) : null}

        <OperationalPipelineInstitutional state={workspace.operationalState} />

        <div className="grid items-start gap-6 lg:grid-cols-3">
          {/* Checks — 2/3 width */}
          <section className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-2">
            <InstitutionalOperationalChecks checks={operationalChecks} now={new Date()} />
          </section>

          {/* Next action — altura según contenido */}
          <section className="h-fit self-start rounded-xl border border-slate-100 border-l-4 border-l-amber-500 bg-amber-50/30 p-5 shadow-sm lg:col-span-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-800/90">
              Siguiente acción
            </p>
            <h2 className="mt-2 text-base font-semibold leading-snug text-slate-900">
              {institutionalStateLabel(workspace.operationalState)}
            </h2>

            {hasActions ? (
              <div className="mt-4 flex flex-col gap-2.5">
                {sortActionsForDisplay(workspace.availableActions).map((action) => {
                  const isReturn = isReturnOrRejectAction(action);
                  return (
                    <Button
                      key={action}
                      size="sm"
                      variant={isReturn ? 'secondary' : 'primary'}
                      className={cn(
                        'w-full justify-center font-medium shadow-none',
                        !isReturn &&
                          'bg-orange-500 from-orange-500 to-orange-500 hover:from-orange-600 hover:to-orange-600 hover:bg-orange-600',
                        isReturn &&
                          'border-rose-200/80 bg-white text-rose-700 hover:border-rose-300 hover:bg-rose-50',
                      )}
                      disabled={transitionMutation.isPending}
                      onClick={() => {
                        if (isReturn) {
                          setModal({
                            subjectId: workspace.subjectId,
                            action: action as ModalRequestV2 extends { action: infer A } ? A : never,
                          });
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
              <div className="space-y-3">
                {workspace.academicApprovalBlockers && workspace.academicApprovalBlockers.length > 0 ? (
                  <ul className="rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs text-amber-900">
                    {workspace.academicApprovalBlockers.map((blocker) => (
                      <li key={blocker}>• {blocker}</li>
                    ))}
                  </ul>
                ) : null}
                <p className="text-sm text-slate-600">
                  No hay acciones pendientes de su rol en esta etapa.
                </p>
              </div>
            )}

            <div className="mt-4 border-t border-amber-200/50 pt-3">
              {showChecklistLink ? (
                <Link
                  to={`/subjects/${subjectId}`}
                  className="text-sm font-medium text-orange-600 hover:text-orange-700 hover:underline"
                >
                  Ir al checklist académico →
                </Link>
              ) : (
                <p className="text-sm leading-relaxed text-slate-500">{stateHint}</p>
              )}
            </div>
          </section>
        </div>

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
