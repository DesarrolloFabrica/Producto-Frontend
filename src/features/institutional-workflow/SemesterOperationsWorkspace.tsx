import { useNavigate } from 'react-router-dom';
import { AlertCircle, MessageSquare } from 'lucide-react';
import { useRef, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import type { InstitutionalOperationalAction } from '../../types/domain';
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
import { OperationalTurnIndicator } from './components/OperationalTurnIndicator';
import { RequestProductOwnerMeta } from './components/RequestProductOwnerMeta';
import { SemesterSubjectsTable } from './components/SemesterSubjectsTable';
import {
  isSemesterProductAcademicReviewPhase,
  filterSemesterSubjectBlockers,
  shouldShowSemesterAcademicRequirements,
} from './institutionalCopy';
import {
  semesterHubPath,
} from './institutionalNavigation';
import { useSemesterOperationalWorkspaceQuery } from '../queries/useSemesterOperationalWorkspaceQuery';
import { useSemesterInstitutionalTransitionMutation } from '../queries/useSemesterInstitutionalTransitionMutation';
import type { OperationalCheckKeyV2, SlaStatusV2 } from '../../types/operationalWorkflow';
import { isReducedInstitutionalFlow } from '../../config/env';

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

export type SemesterOperationsWorkspaceProps = {
  semesterId: string;
  /** Sin tabla de asignaturas (hub Product). */
  showSubjectsTable?: boolean;
  /** En hub de semestre: cambiar a tab asignaturas. */
  onGoToSubjectsTab?: (options?: { reviewStarted?: boolean; focusObservations?: boolean }) => void;
  /** Ocultar badges superiores cuando la página padre ya los muestra. */
  showTopStatus?: boolean;
  /** Responsable Product (fallback si el workspace aún no lo trae). */
  requestOwnerName?: string | null;
};

export function SemesterOperationsWorkspace({
  semesterId,
  showSubjectsTable = true,
  onGoToSubjectsTab,
  showTopStatus = true,
  requestOwnerName,
}: SemesterOperationsWorkspaceProps) {
  const navigate = useNavigate();
  const { role } = useAuth();
  const [modal, setModal] = useState<ModalRequestV2>(null);
  const subjectsSectionRef = useRef<HTMLElement>(null);
  const { showToast } = useToast();
  const workspaceQuery = useSemesterOperationalWorkspaceQuery(semesterId);
  const transitionMutation = useSemesterInstitutionalTransitionMutation(semesterId);
  const workspace = workspaceQuery.data;
  const reducedFlow = isReducedInstitutionalFlow();

  const goToSubjectsPanel = (options?: { reviewStarted?: boolean }) => {
    if (onGoToSubjectsTab) {
      onGoToSubjectsTab(options);
      return;
    }
    if (!workspace) return;
    navigate(semesterHubPath(workspace.projectId, workspace.semesterNumber), {
      replace: true,
      state: options?.reviewStarted ? { reviewStarted: true } : undefined,
    });
  };

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
      if (params.action === 'PRODUCT_START_ACADEMIC_REVIEW') {
        goToSubjectsPanel({ reviewStarted: true });
        showToast('Revisión académica iniciada. Elija cada asignatura para validar entregables, temas y cierre.');
        return;
      }
      if (params.action === 'FACTORY_START_PRODUCTION') {
        goToSubjectsPanel();
        showToast(
          'Producción iniciada. Trabaje cada asignatura del semestre hasta completar la producción interna.',
        );
        return;
      }
    } catch (e: unknown) {
      showToast(getApiErrorMessage(e), 'error');
    }
  };

  if (workspaceQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="card" className="h-32" />
        <SkeletonKpiGrid count={4} />
      </div>
    );
  }

  if (!workspace) {
    return <p className="text-sm text-rose-600">No se pudo cargar el flujo operacional del semestre.</p>;
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
  const isFactoryView = role === 'FABRICA';
  const isProductView = role === 'PRODUCT';
  const isInstitutionalReader = role === 'PLANEACION' || role === 'LMS';
  const productReviewActive =
    isProductView &&
    (workspace.operationalState === 'IN_PRODUCT_ACADEMIC_REVIEW' ||
      workspace.operationalState === 'CHANGES_REQUESTED_BY_PRODUCT');
  const productSubjectsPendingReview = Math.max(
    0,
    workspace.metrics.subjectsTotal - workspace.metrics.subjectsApproved,
  );
  const showAcademicRequirements = shouldShowSemesterAcademicRequirements(role, workspace.operationalState);
  const blockers = filterSemesterSubjectBlockers(workspace.readiness?.blockers ?? [], showAcademicRequirements);
  const deliverBlocked =
    workspace.operationalState === 'IN_FACTORY_PRODUCTION' && !workspace.readiness?.ready;
  const productionDelivered =
    workspace.operationalState === 'PENDING_PLANNING_PRODUCTION_VALIDATION' ||
    workspace.operationalState === 'PENDING_LMS_UPLOAD';
  const subjectsPendingProduction = Math.max(
    0,
    workspace.metrics.subjectsTotal - workspace.metrics.subjectsReady,
  );
  const subjectsWithObservations = workspace.subjects.filter(
    (s) => s.internalState === 'HAS_OBSERVATIONS' || (s.openObservationsCount ?? 0) > 0,
  );
  const factoryNeedsSubjectWork =
    isFactoryView &&
    workspace.operationalState === 'IN_FACTORY_PRODUCTION' &&
    subjectsPendingProduction > 0;

  const scrollToSubjectsWithObservations = () => {
    if (onGoToSubjectsTab) {
      onGoToSubjectsTab({ focusObservations: true });
      return;
    }
    const first = subjectsWithObservations[0];
    if (first) {
      document.getElementById(`subject-row-${first.subjectId}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
      return;
    }
    subjectsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="space-y-6">
      {showTopStatus ? (
        <div className="flex flex-wrap items-center gap-3">
          <OperationalTurnIndicator
            operationalState={workspace.operationalState}
            responsibleRole={workspace.currentResponsibleRole}
            viewerRole={role}
            variant="compact"
          />
          <SlaBadgeV2 status={workspace.slaStatus as SlaStatusV2} />
          <RequestProductOwnerMeta
            name={workspace.productOwnerName ?? requestOwnerName}
            compact
            className="sm:ml-auto"
          />
        </div>
      ) : null}

      {workspace.lastReturnReason ? (
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            <span className="font-semibold">Devolución activa:</span> {workspace.lastReturnReason}
          </p>
        </div>
      ) : null}

      <OperationalPipelineInstitutional state={workspace.operationalState} />

      <div className={cn('grid gap-3', showAcademicRequirements ? 'sm:grid-cols-4' : 'sm:grid-cols-3')}>
        <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
          <p className="text-xs font-semibold uppercase text-slate-400">Producidas</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {workspace.metrics.subjectsReady}/{workspace.metrics.subjectsTotal}
          </p>
        </div>
        {showAcademicRequirements ? (
          <>
            <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
              <p className="text-xs font-semibold uppercase text-slate-400">Aprobadas</p>
              <p className="mt-1 text-2xl font-bold text-emerald-700">{workspace.metrics.subjectsApproved}</p>
            </div>
            <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
              <p className="text-xs font-semibold uppercase text-slate-400">Requisitos pendientes</p>
              <p className="mt-1 text-2xl font-bold text-amber-700">{workspace.metrics.subjectsBlocked}</p>
            </div>
          </>
        ) : (
          <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
            <p className="text-xs font-semibold uppercase text-slate-400">Pendientes de producir</p>
            <p className="mt-1 text-2xl font-bold text-orange-600">{subjectsPendingProduction}</p>
          </div>
        )}
        <button
          type="button"
          onClick={scrollToSubjectsWithObservations}
          disabled={workspace.metrics.openObservations === 0}
          className={cn(
            'rounded-xl bg-white p-4 text-left ring-1 ring-slate-200 transition-colors',
            workspace.metrics.openObservations > 0 &&
              'cursor-pointer hover:bg-slate-50 hover:ring-slate-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400',
            workspace.metrics.openObservations === 0 && 'cursor-default',
          )}
        >
          <p className="text-xs font-semibold uppercase text-slate-400">Observaciones abiertas</p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-2xl font-bold text-slate-900">
            {workspace.metrics.openObservations}
            {workspace.metrics.openObservations > 0 ? (
              <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
            ) : null}
          </p>
          {workspace.metrics.openObservations > 0 ? (
            <p className="mt-1 text-[10px] font-medium text-slate-500">
              {onGoToSubjectsTab ? 'Ver asignaturas' : 'Ir a la asignatura'}
            </p>
          ) : null}
        </button>
      </div>

      {workspace.metrics.openObservations > 0 && isFactoryView ? (
        <div className="flex items-start gap-2.5 rounded-xl border border-slate-200/90 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-600">
          <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
          <p className="min-w-0 flex-1 leading-5">
            <span className="font-medium text-slate-800">
              {workspace.metrics.openObservations === 1
                ? '1 observación pendiente'
                : `${workspace.metrics.openObservations} observaciones pendientes`}
            </span>
            {subjectsWithObservations.length > 0 ? (
              <>
                {' — '}
                {subjectsWithObservations.map((subject) => subject.subjectName).join(', ')}
              </>
            ) : null}
            {'. '}
            <button
              type="button"
              onClick={scrollToSubjectsWithObservations}
              className="font-semibold text-orange-700 underline-offset-2 hover:underline"
            >
              Ver asignaturas
            </button>
          </p>
        </div>
      ) : null}

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <section className={cn('glass-surface rounded-2xl p-6 lg:col-span-2', surface.glassSubtle)}>
          <InstitutionalOperationalChecks checks={operationalChecks} now={new Date()} />
        </section>

        <section className="glass-surface h-fit self-start space-y-4 rounded-2xl p-5 lg:col-span-1">
          <OperationalTurnIndicator
            operationalState={workspace.operationalState}
            responsibleRole={workspace.currentResponsibleRole}
            viewerRole={role}
            variant="card"
          />
          <div className="rounded-2xl border-l-4 border-l-amber-500 bg-amber-50/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-800/90">Siguiente acción</p>
          {blockers.length > 0 ? (
            <ul className="mt-3 rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs text-amber-900">
              {blockers.slice(0, 5).map((blocker) => (
                <li key={blocker}>• {blocker}</li>
              ))}
            </ul>
          ) : null}
          {productionDelivered ? (
            <p className="mt-4 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900">
              {reducedFlow
                ? 'Producción entregada. Product puede iniciar revisión y radicación.'
                : 'Producción entregada. Pendiente validación de producción.'}
            </p>
          ) : null}
          {factoryNeedsSubjectWork ? (
            <div className="mt-4 space-y-2">
              <p className="text-xs leading-relaxed text-amber-900">
                Complete la producción interna de cada asignatura del semestre. Cuando todas estén al 100%, podrá
                confirmar la entrega y avanzar a la siguiente fase.
              </p>
              <Button
                size="sm"
                variant="primary"
                className="w-full justify-center font-medium"
                onClick={() => goToSubjectsPanel()}
              >
                Ver asignaturas
                {subjectsPendingProduction > 1 ? ` (${subjectsPendingProduction} pendientes)` : ''}
              </Button>
            </div>
          ) : null}
          {productReviewActive ? (
            <div className="mt-4 space-y-2">
              <p className="text-xs leading-relaxed text-amber-900">
                Revise cada asignatura del semestre: valide entregables, defina temas y apruebe o solicite correcciones
                antes de cerrar el paquete.
              </p>
              <Button
                size="sm"
                variant="primary"
                className="w-full justify-center font-medium"
                onClick={() => goToSubjectsPanel({ reviewStarted: true })}
              >
                Ver asignaturas
                {productSubjectsPendingReview > 0
                  ? ` (${productSubjectsPendingReview} pendiente${productSubjectsPendingReview !== 1 ? 's' : ''})`
                  : ''}
              </Button>
            </div>
          ) : null}
          {hasActions ? (
            <div className="mt-4 flex flex-col gap-2.5">
              {sortActionsForDisplay(workspace.availableActions).map((action) => {
                const isReturn = isReturnOrRejectAction(action);
                const isDeliver = action === 'FACTORY_DELIVER_CONTENT';
                const actionDisabled = transitionMutation.isPending || (isDeliver && deliverBlocked);
                return (
                  <Button
                    key={action}
                    size="sm"
                    variant={isReturn ? 'secondary' : 'primary'}
                    className="w-full justify-center font-medium"
                    disabled={actionDisabled}
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
          ) : !factoryNeedsSubjectWork && !productReviewActive ? (
            <p className="mt-4 text-sm text-slate-600">No hay acciones pendientes de su rol en esta etapa.</p>
          ) : null}
          </div>
        </section>
      </div>

      {showSubjectsTable ? (
        <section
          ref={subjectsSectionRef}
          id="semester-subjects-section"
          className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200"
        >
          <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-orange-600">Asignaturas del paquete</p>
            <h2 className="mt-0.5 text-base font-semibold text-slate-900">Detalle interno del semestre</h2>
            <p className="mt-1 text-xs text-slate-500">
              {showAcademicRequirements
                ? 'Revise temas, granularidad y checklist académico por asignatura antes de aprobar el paquete.'
                : isFactoryView
                  ? reducedFlow
                    ? 'Marca la producción interna de cada asignatura. Product realiza la revisión y radicación final.'
                    : 'Marca la producción interna de cada asignatura. La validación académica la realiza Product en la fase 7 del flujo.'
                  : 'Avance de producción del paquete por asignatura. Los requisitos académicos se validan en la fase de revisión Product.'}
            </p>
          </div>
          <SemesterSubjectsTable
            subjects={workspace.subjects}
            showRequirements={showAcademicRequirements}
            checklistReviewMode={isSemesterProductAcademicReviewPhase(workspace.operationalState)}
            factoryCorrectionsMode={isFactoryView}
            institutionalReaderMode={isInstitutionalReader && !isFactoryView}
          />
        </section>
      ) : null}

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
  );
}
