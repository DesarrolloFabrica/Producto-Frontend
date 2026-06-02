import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ContextBackLink } from '../../navigation/ContextBackLink';
import { stripReturnToQuery } from '../../navigation/contextNavigation';
import { InstitutionalBreadcrumb } from '../../components/navigation/InstitutionalBreadcrumb';
import {
  ArrowLeft,
  CheckCircle2,
  CircleDashed,
  Clock3,
  MessageSquare,
  Package,
  Send,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { getApiErrorMessage } from '../operations/apiMappers';
import {
  filterObservationsVisibleToFactory,
  getFactoryCorrectionPhase,
  isCorrectionReadyToNotify,
  isCorrectionSentToProduct,
} from '../observations/observationDeliverableHelpers';
import {
  getOperationalCta,
  getOperationalStateLabel,
  getProductObservationsForSubject,
  normalizeSubjectOperationalState,
  resolveSubjectExpectedDeliveryDate,
} from '../operations/subjectOperationalState';
import { useOperations } from '../../features/operations/OperationsContext';
import { useToast } from '../../components/ui/ToastProvider';
import { useQueryClient } from '@tanstack/react-query';
import { useUpdateSubjectProductionStatusMutation } from '../queries/useWorkflowMutations';
import { useOperationalWorkspaceQuery } from '../queries/useOperationalWorkspaceQuery';
import { useSemesterOperationalWorkspaceQuery } from '../queries/useSemesterOperationalWorkspaceQuery';
import { queryKeys } from '../queries/queryKeys';
import { formatDate } from '../../utils/formatters';
import { Button } from '../../components/ui/Button';
import { cn } from '../../components/ui/tokens';
import type {
  InstitutionalOperationalState,
  OperationalObservation,
  SubjectVirtualization,
  VirtualizationProject,
} from '../../types/domain';
import { ChangeOriginBadge, ChangeOriginHint } from '../../components/change-tracking/ChangeOriginBadge';
import {
  FACTORY_COPY,
  institutionalStateLabel,
  isSemesterFactoryProductionActive,
  isSemesterFactoryStartPending,
} from '../institutional-workflow/institutionalCopy';
import { factorySemesterOperationsPath, semesterHubPath } from '../institutional-workflow/institutionalNavigation';
import { FactorySemesterDeliveryBanner } from '../institutional-workflow/components/FactorySemesterDeliveryBanner';
import {
  countFactoryReadySubjects,
  resolveFactorySemesterDeliveryGuidance,
} from '../institutional-workflow/factorySemesterDeliveryGuidance';
import { isSubjectFactoryProductionComplete, resolveFactorySubjectDisplayProgress, factorySubjectStatusBadgeTone, resolveFactorySubjectStatusBadgeLabel } from './factoryProductionStatus';

type FlowStepId = 'PENDIENTE' | 'EN_PRODUCCION' | 'ENTREGA_SEMESTRE';
type GeneralProductionState = FlowStepId | 'INTERNA_COMPLETA' | 'APROBADA';

function mapSubjectToProductionState(status: string): GeneralProductionState {
  if (status === 'APPROVED' || status === 'DELIVERED') return 'APROBADA';
  if (status === 'IN_PRODUCTION' || status === 'CHANGES_REQUESTED') return 'EN_PRODUCCION';
  if (status === 'IN_REVIEW' || status === 'SUBMITTED') return 'INTERNA_COMPLETA';
  return 'PENDIENTE';
}

function mapSubjectToProgress(status: string): number {
  if (status === 'IN_PRODUCTION' || status === 'CHANGES_REQUESTED') return 50;
  if (status === 'IN_REVIEW' || status === 'SUBMITTED' || status === 'APPROVED' || status === 'DELIVERED') {
    return 100;
  }
  return 0;
}

function stepState(current: GeneralProductionState, step: FlowStepId) {
  if (current === 'APROBADA' || current === 'INTERNA_COMPLETA') return 'done';
  const order: FlowStepId[] = ['PENDIENTE', 'EN_PRODUCCION', 'ENTREGA_SEMESTRE'];
  const currentIndex = order.indexOf(current as FlowStepId);
  const stepIndex = order.indexOf(step);
  if (currentIndex === stepIndex) return 'current';
  if (currentIndex > stepIndex) return 'done';
  return 'upcoming';
}

function flowStepLabel(
  stepId: FlowStepId,
  productionState: GeneralProductionState,
  useInstitutionalUi: boolean,
): string {
  if (stepId === 'ENTREGA_SEMESTRE') {
    if (productionState === 'INTERNA_COMPLETA' || productionState === 'APROBADA') {
      return useInstitutionalUi ? 'Producción interna completa' : 'Completada';
    }
    return useInstitutionalUi ? 'Entrega del semestre' : 'Validación Planeación';
  }
  if (stepId === 'PENDIENTE') return 'Pendiente';
  return 'En producción';
}

function mapInstitutionalToFactoryFlowState(
  state: InstitutionalOperationalState,
): GeneralProductionState {
  if (state === 'FINALIZED') return 'APROBADA';
  if (
    state === 'PENDING_PLANNING_PRODUCTION_VALIDATION' ||
    state === 'PENDING_LMS_UPLOAD' ||
    state === 'IN_LMS_UPLOAD' ||
    state === 'PENDING_PLANNING_LMS_VALIDATION' ||
    state === 'RETURNED_TO_LMS_FROM_PLANNING' ||
    state === 'PENDING_PRODUCT_ACADEMIC_REVIEW' ||
    state === 'IN_PRODUCT_ACADEMIC_REVIEW' ||
    state === 'PENDING_PROJECT_RADICATION'
  ) {
    return 'INTERNA_COMPLETA';
  }
  if (
    state === 'IN_FACTORY_PRODUCTION' ||
    state === 'RETURNED_TO_FACTORY_FROM_PLANNING' ||
    state === 'CHANGES_REQUESTED_BY_PRODUCT'
  ) {
    return 'EN_PRODUCCION';
  }
  return 'PENDIENTE';
}

function getInstitutionalFactoryCta(state: InstitutionalOperationalState): { label: string; passive?: boolean } {
  switch (state) {
    case 'PENDING_FACTORY':
    case 'RETURNED_TO_FACTORY_FROM_PLANNING':
      return { label: 'Pendiente de inicio del semestre', passive: true };
    case 'IN_FACTORY_PRODUCTION':
      return { label: 'Marcar producción completa' };
    case 'CHANGES_REQUESTED_BY_PRODUCT':
      return { label: 'Ver correcciones' };
    case 'PENDING_PLANNING_PRODUCTION_VALIDATION':
      return { label: 'Esperando Planeación', passive: true };
    default:
      return { label: 'En seguimiento', passive: true };
  }
}

function getFactoryRecommendation(params: {
  displayProductionState: GeneralProductionState;
  useInstitutionalUi: boolean;
  institutionalOperationalState?: InstitutionalOperationalState;
  openCorrections: number;
  hasCorrectionFlow: boolean;
  correctionsInReview: number;
  isApproved: boolean;
}): string {
  const {
    displayProductionState,
    useInstitutionalUi,
    institutionalOperationalState,
    openCorrections,
    hasCorrectionFlow,
    correctionsInReview,
    isApproved,
  } = params;

  if (openCorrections > 0) {
    return 'Aplica las correcciones abiertas, selecciónalas e inclúyelas en el envío a Product.';
  }
  if (hasCorrectionFlow && correctionsInReview > 0) {
    return 'Las correcciones ya fueron notificadas a Product. Espera su validación individual.';
  }
  if (useInstitutionalUi && institutionalOperationalState === 'PENDING_PLANNING_PRODUCTION_VALIDATION') {
    return 'Producción entregada. Planeación está validando la entrega antes de continuar hacia LMS.';
  }
  if (useInstitutionalUi && displayProductionState === 'INTERNA_COMPLETA') {
    return 'Producción interna completa. La entrega formal del paquete semestral a Planeación se realiza desde el centro operacional del semestre.';
  }
  if (useInstitutionalUi && isSemesterFactoryStartPending(institutionalOperationalState)) {
    return 'La producción del semestre se inicia desde la pestaña Flujo operacional. Cuando esté activa, podrá marcar esta asignatura como completa.';
  }
  if (displayProductionState === 'PENDIENTE') {
    return 'Cuando el equipo inicie el trabajo, marca la materia como En producción.';
  }
  if (displayProductionState === 'EN_PRODUCCION') {
    return 'Cuando el contenido esté listo, marca la producción interna como completa. La entrega del semestre a Planeación se hace desde el centro operacional del paquete.';
  }
  if (isApproved) {
    return 'Product aprobó esta materia. No hay acciones pendientes de Fábrica.';
  }
  return 'La materia ya fue enviada a Product. Espera validación.';
}

function correctionCardMeta(observation: OperationalObservation) {
  const phase = getFactoryCorrectionPhase(observation);
  if (phase === 'open') {
    return {
      badge: 'border-rose-200 bg-rose-50 text-rose-700',
      dot: 'bg-rose-500',
      label: 'ABIERTA',
      title: 'Corrección pendiente',
      helper: 'Aplica el cambio, selecciona esta corrección e inclúyela en el envío a Product.',
    };
  }
  if (phase === 'ready_to_notify') {
    return {
      badge: 'border-amber-200 bg-amber-50 text-amber-800',
      dot: 'bg-amber-500',
      label: FACTORY_COPY.correctionReadyLabel,
      title: 'Corrección lista (sin notificar)',
      helper: 'Selecciona esta corrección e inclúyela en el envío a Product.',
    };
  }
  if (phase === 'sent_to_product') {
    return {
      badge: 'border-sky-200 bg-sky-50 text-sky-700',
      dot: 'bg-sky-500',
      label: FACTORY_COPY.correctionSentLabel,
      title: 'Corrección enviada a Product',
      helper: 'Product debe validar esta corrección de forma individual.',
    };
  }
  return {
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    dot: 'bg-emerald-500',
    label: 'RESUELTA',
    title: 'Validada por Product',
    helper: 'Esta observación ya quedó cerrada.',
  };
}

interface FactorySubjectDetailProps {
  project: VirtualizationProject;
  subject: SubjectVirtualization;
  observations?: OperationalObservation[];
}

export function FactorySubjectDetail({ project, subject, observations }: FactorySubjectDetailProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const backFallbackTimerRef = useRef<number | null>(null);
  const {
    projectObservations,
    observationsByProject,
    notifyCorrectionsBatchFromApi,
    isMutating,
    backendEnabled,
  } = useOperations();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const updateProductionStatusMutation = useUpdateSubjectProductionStatusMutation();
  const operationalWorkspaceQuery = useOperationalWorkspaceQuery(subject.id, backendEnabled);
  const semesterIdForQuery =
    operationalWorkspaceQuery.data?.semesterId ??
    project.semesters.find((item) => item.semesterNumber === subject.semesterNumber)?.id;
  const semesterWorkspaceQuery = useSemesterOperationalWorkspaceQuery(
    backendEnabled ? semesterIdForQuery : undefined,
  );

  const [submittingAction, setSubmittingAction] = useState<
    'production' | 'complete' | 'notify-corrections' | null
  >(null);
  const actionInFlightRef = useRef(false);
  const correctionsSectionRef = useRef<HTMLDivElement | null>(null);
  const [correctionsHighlighted, setCorrectionsHighlighted] = useState(false);
  const [selectedNotifyIds, setSelectedNotifyIds] = useState<Set<string>>(() => new Set());
  const [optimisticSentIds, setOptimisticSentIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (searchParams.get('focus') !== 'correction') return;
    if (!correctionsSectionRef.current) return;
    setCorrectionsHighlighted(true);
    setTimeout(() => {
      correctionsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
  }, [searchParams]);

  useEffect(() => {
    if (!correctionsHighlighted) return;
    const timeoutId = window.setTimeout(() => setCorrectionsHighlighted(false), 2800);
    return () => window.clearTimeout(timeoutId);
  }, [correctionsHighlighted]);

  const scopedProjectObservations =
    observations ??
    observationsByProject[project.id] ??
    projectObservations.filter((observation) => observation.projectId === project.id);
  const isActionBusy = isMutating || updateProductionStatusMutation.isPending;

  const productCorrections = filterObservationsVisibleToFactory(
    getProductObservationsForSubject(project, subject.id, scopedProjectObservations),
  )
    .map((observation) =>
      optimisticSentIds.has(observation.id)
        ? {
            ...observation,
            status: 'EN_CORRECCION' as const,
            correctionNotificationStatus: 'SENT' as const,
          }
        : observation,
    )
    .sort(
      (a, b) => new Date(b.updatedAt ?? b.createdAt).getTime() - new Date(a.updatedAt ?? a.createdAt).getTime(),
    );

  useEffect(() => {
    setOptimisticSentIds((prev) => {
      if (prev.size === 0) return prev;
      const next = new Set(
        [...prev].filter((id) => {
          const observation = scopedProjectObservations.find((item) => item.id === id);
          return observation ? !isCorrectionSentToProduct(observation) : false;
        }),
      );
      if (next.size === prev.size && [...next].every((id) => prev.has(id))) return prev;
      return next;
    });
  }, [scopedProjectObservations]);

  const openCorrections = productCorrections.filter((observation) => observation.status === 'ABIERTA');
  const correctionsReadyToNotify = productCorrections.filter(isCorrectionReadyToNotify);
  const correctionsSentToProduct = productCorrections.filter(isCorrectionSentToProduct);
  const resolvedCorrections = productCorrections.filter((observation) => observation.status === 'RESUELTA');
  const hasCorrectionFlow =
    openCorrections.length > 0 ||
    correctionsReadyToNotify.length > 0 ||
    correctionsSentToProduct.length > 0;

  const correctionsPendingSend = useMemo(
    () => [...openCorrections, ...correctionsReadyToNotify],
    [openCorrections, correctionsReadyToNotify],
  );
  const pendingSendIdsKey = useMemo(
    () => correctionsPendingSend.map((observation) => observation.id).join(','),
    [correctionsPendingSend],
  );

  useEffect(() => {
    const pendingIds = pendingSendIdsKey ? pendingSendIdsKey.split(',').filter(Boolean) : [];
    const pendingSet = new Set(pendingIds);
    setSelectedNotifyIds((prev) => {
      const next = new Set([...prev].filter((id) => pendingSet.has(id)));
      if (next.size === prev.size && [...next].every((id) => prev.has(id))) return prev;
      return next;
    });
  }, [pendingSendIdsKey]);

  const toggleNotifySelection = useCallback((observationId: string) => {
    setSelectedNotifyIds((prev) => {
      const next = new Set(prev);
      if (next.has(observationId)) next.delete(observationId);
      else next.add(observationId);
      return next;
    });
  }, []);

  const selectedNotifyCount = selectedNotifyIds.size;

  const productionState = mapSubjectToProductionState(subject.status);
  const institutionalFlowActive = operationalWorkspaceQuery.data?.institutionalFlowActive === true;
  const institutionalOperationalState = operationalWorkspaceQuery.data?.operationalState;
  const useInstitutionalUi = Boolean(
    backendEnabled && institutionalFlowActive && institutionalOperationalState,
  );
  const factoryActionsReady = !backendEnabled || operationalWorkspaceQuery.isFetched;
  const isFactoryComplete = isSubjectFactoryProductionComplete(subject);
  const displayProductionState: GeneralProductionState = isFactoryComplete
    ? 'INTERNA_COMPLETA'
    : useInstitutionalUi
      ? mapInstitutionalToFactoryFlowState(institutionalOperationalState!)
      : productionState;
  const canStartProduction =
    !useInstitutionalUi &&
    factoryActionsReady &&
    !isFactoryComplete &&
    !hasCorrectionFlow &&
    productionState === 'PENDIENTE';
  const canFinishProduction =
    factoryActionsReady &&
    !isFactoryComplete &&
    (useInstitutionalUi
      ? isSemesterFactoryProductionActive(institutionalOperationalState)
      : productionState === 'EN_PRODUCCION');
  const semesterStartPending =
    useInstitutionalUi && isSemesterFactoryStartPending(institutionalOperationalState);
  const semesterSubjectCounts = countFactoryReadySubjects(
    project.subjects,
    subject.semesterNumber,
    isSubjectFactoryProductionComplete,
  );
  const deliveryGuidance = resolveFactorySemesterDeliveryGuidance({
    institutionalFlowActive: useInstitutionalUi,
    semesterOperationalState: semesterWorkspaceQuery.data?.operationalState ?? institutionalOperationalState,
    subjectsReady: semesterWorkspaceQuery.data?.metrics.subjectsReady ?? semesterSubjectCounts.ready,
    subjectsTotal: semesterWorkspaceQuery.data?.metrics.subjectsTotal ?? semesterSubjectCounts.total,
    deliverReady: semesterWorkspaceQuery.data?.readiness?.ready ?? false,
    projectId: project.id,
    semesterNumber: subject.semesterNumber,
  });
  const showDeliveryGuidance =
    Boolean(deliveryGuidance) &&
    isSemesterFactoryProductionActive(
      semesterWorkspaceQuery.data?.operationalState ?? institutionalOperationalState,
    ) &&
    (isFactoryComplete || deliveryGuidance?.variant === 'ready_to_deliver');
  const operationalState = normalizeSubjectOperationalState({
    subject,
    observations: productCorrections,
    projectStatus: project.status,
  });
  const operationalLabel = isFactoryComplete
    ? FACTORY_COPY.internalProductionCompleteLabel
    : useInstitutionalUi
      ? institutionalStateLabel(institutionalOperationalState!)
      : getOperationalStateLabel(operationalState);
  const operationalCta = isFactoryComplete
    ? { label: 'Producción completa', passive: true }
    : useInstitutionalUi
      ? getInstitutionalFactoryCta(institutionalOperationalState!)
      : getOperationalCta(operationalState);
  const progress = resolveFactorySubjectDisplayProgress(subject);
  const semesterId = semesterIdForQuery;
  const semesterHubUrl = semesterHubPath(project.id, subject.semesterNumber);
  const semesterBackPath = stripReturnToQuery(semesterHubUrl);

  const handleBackToSemester = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    navigate(semesterBackPath, { replace: true, state: null });
    if (backFallbackTimerRef.current !== null) {
      window.clearTimeout(backFallbackTimerRef.current);
    }
    backFallbackTimerRef.current = window.setTimeout(() => {
      const desired = stripReturnToQuery(semesterBackPath);
      const current = stripReturnToQuery(`${window.location.pathname}${window.location.search}`);
      if (current !== desired) {
        window.location.replace(desired);
      }
    }, 250);
  };

  useEffect(
    () => () => {
      if (backFallbackTimerRef.current !== null) {
        window.clearTimeout(backFallbackTimerRef.current);
      }
    },
    [],
  );

  const isApproved = displayProductionState === 'APROBADA';
  const isInternallyComplete = isFactoryComplete;
  const factoryProductionDelivered =
    useInstitutionalUi &&
    !isFactoryComplete &&
    institutionalOperationalState === 'PENDING_PLANNING_PRODUCTION_VALIDATION' &&
    !hasCorrectionFlow;
  const factoryRecommendation = getFactoryRecommendation({
    displayProductionState,
    useInstitutionalUi,
    institutionalOperationalState,
    openCorrections: openCorrections.length,
    hasCorrectionFlow,
    correctionsInReview: correctionsSentToProduct.length,
    isApproved,
  });

  const handleStartProduction = async () => {
    if (actionInFlightRef.current || isActionBusy || submittingAction) return;
    actionInFlightRef.current = true;
    setSubmittingAction('production');
    try {
      await updateProductionStatusMutation.mutateAsync({
        subjectId: subject.id,
        projectId: project.id,
        semesterId,
        status: 'EN_PRODUCCION',
      });
      await operationalWorkspaceQuery.refetch();
      showToast(FACTORY_COPY.toastProductionStarted);
    } catch (updateError) {
      showToast(getApiErrorMessage(updateError), 'error');
    } finally {
      actionInFlightRef.current = false;
      setSubmittingAction(null);
    }
  };

  const handleMarkCompleted = async () => {
    if (actionInFlightRef.current || isActionBusy || submittingAction) return;
    actionInFlightRef.current = true;
    setSubmittingAction('complete');
    try {
      await updateProductionStatusMutation.mutateAsync({
        subjectId: subject.id,
        projectId: project.id,
        semesterId,
        status: 'COMPLETADA',
      });
      const [, semesterResult] = await Promise.all([
        operationalWorkspaceQuery.refetch(),
        semesterWorkspaceQuery.refetch(),
        queryClient.refetchQueries({ queryKey: queryKeys.subjectWorkspace(subject.id) }),
      ]);
      const readyCount = semesterResult.data?.metrics.subjectsReady ?? 0;
      const totalCount = semesterResult.data?.metrics.subjectsTotal ?? 0;
      const allReady = semesterResult.data?.readiness?.ready === true;
      showToast(
        allReady
          ? 'Producción interna completa en todas las asignaturas. Confirme la entrega en Flujo operacional.'
          : totalCount > 0
            ? `Producción interna registrada (${readyCount}/${totalCount}). Complete las asignaturas restantes y confirme la entrega del semestre.`
            : FACTORY_COPY.toastProductionFinished,
      );
    } catch (updateError) {
      showToast(getApiErrorMessage(updateError), 'error');
    } finally {
      actionInFlightRef.current = false;
      setSubmittingAction(null);
    }
  };

  const handleNotifySelectedCorrections = async () => {
    const ids = [...selectedNotifyIds];
    if (ids.length === 0) {
      showToast('Selecciona al menos una corrección para enviar a Product.', 'error');
      return;
    }
    if (actionInFlightRef.current || isActionBusy || submittingAction) return;
    actionInFlightRef.current = true;
    setSubmittingAction('notify-corrections');
    try {
      const count = await notifyCorrectionsBatchFromApi(subject.id, project.id, ids);
      setOptimisticSentIds((prev) => new Set([...prev, ...ids]));
      setSelectedNotifyIds(new Set());
      showToast(`${count} corrección(es) enviadas a Product en un solo aviso`);
    } catch (updateError) {
      showToast(getApiErrorMessage(updateError), 'error');
    } finally {
      actionInFlightRef.current = false;
      setSubmittingAction(null);
    }
  };

  return (
    <div className="space-y-6">
      <InstitutionalBreadcrumb
        items={[
          { label: 'Solicitudes', to: '/projects' },
          { label: project.program, to: `/projects/${project.id}` },
          { label: 'Centro operacional', to: `/projects/${project.id}/operations` },
          { label: `Semestre ${subject.semesterNumber}`, to: semesterHubUrl },
          { label: subject.name },
        ]}
      />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          {useInstitutionalUi ? (
            <button
              type="button"
              onClick={handleBackToSemester}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#64748B] hover:text-[#FF6B00]"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Volver al semestre
            </button>
          ) : (
            <ContextBackLink
              fallback={semesterBackPath}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#64748B] hover:text-[#FF6B00]"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Volver al semestre
            </ContextBackLink>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-[-0.02em] text-[#1E293B]">{subject.name}</h1>
            {subject.createdFromChange && <ChangeOriginBadge kind="subject" />}
          </div>
          {subject.createdFromChange && <ChangeOriginHint kind="subject" />}
          <p className="mt-1 text-[0.9rem] text-[#64748B]">
            {project.program} · {project.school} · Semestre {subject.semesterNumber}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className={cn(
              'inline-flex shrink-0 items-center rounded-[12px] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.05em] ring-1',
              factorySubjectStatusBadgeTone(subject),
            )}
          >
            {resolveFactorySubjectStatusBadgeLabel(subject)}
          </span>
          <span className="rounded-[10px] bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600">
            {operationalLabel}
          </span>
          <span className="text-[11px] font-medium text-[#94A3B8]">
            Entrega: {formatDate(resolveSubjectExpectedDeliveryDate(project, subject))}
          </span>
        </div>
      </div>

      {useInstitutionalUi && (
        <div className="rounded-[14px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-semibold">{FACTORY_COPY.institutionalSubjectBanner}</p>
          <p className="mt-1 text-xs text-amber-800">
            Entrega del paquete:{' '}
            <button
              type="button"
              onClick={handleBackToSemester}
              className="font-bold underline hover:text-amber-950"
            >
              hub del semestre {subject.semesterNumber}
            </button>
          </p>
        </div>
      )}

      <Card className="p-6 sm:p-7">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-2xl',
              isApproved ? 'bg-emerald-100 text-emerald-600' : 'bg-[#FFEDD5] text-[#FF6B00]',
            )}
          >
            {isApproved ? <CheckCircle2 className="h-5 w-5" /> : <Package className="h-5 w-5" />}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Estado general</p>
            <h2 className="text-sm font-black tracking-tight text-slate-950">Producción de la materia</h2>
            <p className="mt-1 text-[11px] font-medium text-slate-500">
              Este bloque solo refleja el avance operativo general. Las correcciones de Product se gestionan abajo, una por una.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-[18px] border border-slate-100 bg-slate-50/60 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Flujo</p>
          <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:gap-0">
            {([
              { id: 'PENDIENTE' as const },
              { id: 'EN_PRODUCCION' as const },
              { id: 'ENTREGA_SEMESTRE' as const },
            ]).map((step, index, list) => {
              const state = stepState(displayProductionState, step.id);
              return (
                <div key={step.id} className="flex items-center gap-3 md:flex-1">
                  <div className={cn('flex h-9 w-9 items-center justify-center rounded-full text-xs font-black transition-all', state === 'done' && 'bg-emerald-500 text-white shadow-sm', state === 'current' && 'bg-orange-500 text-white shadow-[0_12px_24px_-16px_rgba(249,115,22,0.65)]', state === 'upcoming' && 'bg-white text-slate-400 ring-1 ring-slate-200')}>
                    {state === 'done' ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                  </div>
                  <div className="min-w-0">
                    <p className={cn('text-xs font-bold transition-colors', state === 'upcoming' ? 'text-slate-400' : state === 'done' ? 'text-emerald-700' : 'text-slate-900')}>
                      {flowStepLabel(step.id, displayProductionState, useInstitutionalUi)}
                    </p>
                    <p className={cn('text-[10px] font-medium', state === 'done' ? 'text-emerald-600' : 'text-slate-400')}>
                      {state === 'current' ? 'Estado actual' : state === 'done' ? 'Completado' : 'Pendiente'}
                    </p>
                  </div>
                  {index < list.length - 1 && <div className={cn('hidden h-[2px] flex-1 rounded-full md:block', state === 'done' ? 'bg-emerald-400' : 'bg-slate-200')} />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Info label="Estado operacional">{operationalLabel}</Info>
          <Info label="Acción sugerida">{operationalCta.label}</Info>
          <Info label="Temas informativos">{subject.topicChecklists.length}</Info>
          <Info label="Correcciones Product">{productCorrections.length}</Info>
          <Info label="Avance registrado">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={cn(
                      'h-full rounded-full',
                      isInternallyComplete || isApproved
                        ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                        : 'bg-gradient-to-r from-orange-400 to-orange-600',
                    )}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              <span
                className={cn(
                  'text-xs font-black',
                  isInternallyComplete || isApproved ? 'text-emerald-600' : 'text-orange-600',
                )}
              >
                {progress}%
              </span>
            </div>
          </Info>
        </div>

        <div
          className={cn(
            'mt-6 rounded-[16px] border p-4',
            isInternallyComplete || isApproved
              ? 'border-emerald-100 bg-emerald-50/70'
              : 'border-slate-100 bg-slate-50/60',
          )}
        >
          <p className={cn('text-xs font-bold', isInternallyComplete || isApproved ? 'text-emerald-900' : 'text-slate-900')}>
            {isInternallyComplete ? 'Producción interna registrada' : isApproved ? 'Materia completada' : 'Siguiente acción recomendada'}
          </p>
          <p className={cn('mt-1 text-sm font-medium', isInternallyComplete || isApproved ? 'text-emerald-800' : 'text-slate-600')}>
            {isInternallyComplete ? FACTORY_COPY.internalProductionCompleteBanner : factoryRecommendation}
          </p>
        </div>

        {factoryProductionDelivered && (
          <div className="mt-6 rounded-[12px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            Producción de Fábrica completada y entregada a Planeación. No hay acciones pendientes en esta etapa.
          </div>
        )}

        {semesterStartPending && (
          <div className="mt-6 rounded-[16px] border border-sky-200 bg-sky-50/80 p-4">
            <p className="text-xs font-bold text-sky-900">Producción del semestre pendiente</p>
            <p className="mt-1 text-sm font-medium text-sky-800">
              Para iniciar la producción de todas las asignaturas del semestre, use el botón en la pestaña{' '}
              <span className="font-bold">Flujo operacional</span>.
            </p>
            <Link
              to={factorySemesterOperationsPath(project.id, subject.semesterNumber)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-sky-300 bg-white px-3 py-2 text-xs font-bold text-sky-900 transition-colors hover:bg-sky-100"
            >
              Ir a Flujo operacional
            </Link>
          </div>
        )}

        {showDeliveryGuidance && deliveryGuidance ? (
          <FactorySemesterDeliveryBanner guidance={deliveryGuidance} className="mt-6" />
        ) : null}

        {!hasCorrectionFlow && (
          <div className="mt-6">
            {canStartProduction && (
              <Button
                onClick={() => void handleStartProduction()}
                disabled={isActionBusy || submittingAction === 'production'}
                className="w-full py-3 text-sm font-bold shadow-[0_14px_28px_-20px_rgba(249,115,22,0.55)]"
              >
                {submittingAction === 'production' ? <Clock3 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
                Iniciar producción
              </Button>
            )}

            {canFinishProduction && (
              <div className="space-y-3">
                <div className="rounded-[12px] bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
                  {FACTORY_COPY.finishProductionHint}
                </div>
                <Button
                  onClick={() => void handleMarkCompleted()}
                  disabled={isActionBusy || submittingAction === 'complete'}
                  className="w-full py-3 text-sm font-bold shadow-[0_14px_28px_-20px_rgba(249,115,22,0.55)]"
                >
                  {submittingAction === 'complete' ? <Clock3 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  {FACTORY_COPY.finishProduction}
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      <div ref={correctionsSectionRef}>
        <Card
          className={cn(
            'overflow-hidden p-0 transition-all duration-500',
            correctionsHighlighted && 'ring-2 ring-orange-200 shadow-[0_0_0_6px_rgba(251,191,36,0.12),0_16px_40px_-24px_rgba(249,115,22,0.45)]',
          )}
        >
          <div className="border-b border-slate-100 bg-gradient-to-r from-rose-50 via-white to-sky-50 px-6 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-rose-500">Correcciones Product</p>
                  <h2 className="text-base font-black tracking-tight text-slate-950">Seguimiento individual por observación</h2>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                    Cada observación tiene su propio ciclo. No cierres la materia hasta que todas las correcciones abiertas hayan sido aplicadas.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/70 bg-white/80 p-2 shadow-sm sm:grid-cols-4">
                <MetricPill label="Abiertas" value={openCorrections.length} tone="rose" />
                <MetricPill label="Listas" value={correctionsReadyToNotify.length} tone="amber" />
                <MetricPill label="Notificadas" value={correctionsSentToProduct.length} tone="sky" />
                <MetricPill label="Validadas" value={resolvedCorrections.length} tone="emerald" />
              </div>
            </div>
          </div>

          <div className="p-6">
            {productCorrections.length === 0 ? (
              <div className="rounded-[20px] border border-slate-100 bg-slate-50/70 px-5 py-6 text-center">
                <CircleDashed className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-3 text-sm font-bold text-slate-900">Sin correcciones de Product</p>
                <p className="mt-1 text-sm text-slate-500">La materia no tiene observaciones activas ni históricas de corrección.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-[18px] border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">Envío a Product</p>
                  <p className="mt-1">{FACTORY_COPY.correctionNotifyHint}</p>
                </div>

                {correctionsPendingSend.length > 0 && (
                  <CorrectionPhaseSection
                    title="Correcciones listas para enviar"
                    description={FACTORY_COPY.correctionNotifySectionHint}
                    tone="amber"
                  >
                    <div className="grid gap-4 xl:grid-cols-2">
                      {correctionsPendingSend.map((observation) => (
                        <CorrectionCard
                          key={observation.id}
                          observation={observation}
                          phase={getFactoryCorrectionPhase(observation)}
                          disabled={isActionBusy || submittingAction !== null}
                          selectedForNotify={selectedNotifyIds.has(observation.id)}
                          onToggleNotifySelect={() => toggleNotifySelection(observation.id)}
                        />
                      ))}
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button
                        onClick={() => void handleNotifySelectedCorrections()}
                        disabled={isActionBusy || submittingAction !== null || selectedNotifyCount === 0}
                        className="min-w-[220px] py-3 text-sm font-bold shadow-[0_14px_28px_-20px_rgba(14,165,233,0.6)]"
                      >
                        {submittingAction === 'notify-corrections' ? (
                          <Clock3 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        {formatCorrectionNotifyButtonLabel(selectedNotifyCount)}
                      </Button>
                    </div>
                  </CorrectionPhaseSection>
                )}

                {(correctionsSentToProduct.length > 0 || resolvedCorrections.length > 0) && (
                  <CorrectionPhaseSection
                    title="Seguimiento"
                    description="Correcciones ya notificadas a Product o validadas."
                    tone="slate"
                  >
                    <div className="grid gap-4 xl:grid-cols-2">
                      {[...correctionsSentToProduct, ...resolvedCorrections].map((observation) => (
                        <CorrectionCard
                          key={observation.id}
                          observation={observation}
                          phase={getFactoryCorrectionPhase(observation)}
                          disabled={isActionBusy || submittingAction !== null}
                        />
                      ))}
                    </div>
                  </CorrectionPhaseSection>
                )}

              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function formatCorrectionNotifyButtonLabel(selectedCount: number): string {
  if (selectedCount === 0) return 'Enviar a Product';
  if (selectedCount === 1) return 'Enviar 1';
  return `Enviar ${selectedCount}`;
}

function CorrectionPhaseSection({
  title,
  description,
  tone,
  headerAction,
  children,
}: {
  title: string;
  description: string;
  tone: 'rose' | 'amber' | 'slate';
  headerAction?: ReactNode;
  children: ReactNode;
}) {
  const tones = {
    rose: 'border-rose-200 bg-rose-50/40',
    amber: 'border-amber-200 bg-amber-50/40',
    slate: 'border-slate-200 bg-slate-50/60',
  } as const;

  return (
    <section className={cn('rounded-[22px] border p-5', tones[tone])}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{title}</p>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>
        {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function CorrectionCard({
  observation,
  phase,
  disabled,
  selectedForNotify = false,
  onToggleNotifySelect,
}: {
  observation: OperationalObservation;
  phase: ReturnType<typeof getFactoryCorrectionPhase>;
  disabled: boolean;
  selectedForNotify?: boolean;
  onToggleNotifySelect?: () => void;
}) {
  const statusUi = correctionCardMeta(observation);
  const lastUpdated = observation.updatedAt ?? observation.createdAt;
  const isSelectableForNotify =
    (phase === 'open' || phase === 'ready_to_notify') && onToggleNotifySelect && !disabled;

  return (
    <div
      className={cn(
        'rounded-[22px] border bg-white p-5 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.25)] transition-all hover:border-slate-300',
        selectedForNotify ? 'border-amber-300 ring-1 ring-amber-100' : 'border-slate-200',
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Corrección solicitada por Product</p>
          <h3 className="mt-1 text-base font-black tracking-tight text-slate-950">{statusUi.title}</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isSelectableForNotify ? (
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-bold text-amber-800">
              <input
                type="checkbox"
                className="h-3.5 w-3.5 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                checked={selectedForNotify}
                disabled={disabled}
                onChange={onToggleNotifySelect}
              />
              Incluir envío
            </label>
          ) : null}
          <span className={cn('inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black tracking-wide', statusUi.badge)}>
            <span className={cn('h-2 w-2 rounded-full', statusUi.dot)} />
            {statusUi.label}
          </span>
        </div>
      </div>

      <div className="mt-4 rounded-[18px] border border-slate-100 bg-slate-50/80 p-4">
        <p className="text-sm font-medium leading-6 text-slate-800">{observation.text}</p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetaBox label="Fecha" value={formatDate(observation.createdAt)} />
        <MetaBox label="Estado" value={statusUi.label.replace('_', ' ')} />
        <MetaBox label="Responsable" value="Fábrica" />
        <MetaBox label="Última actualización" value={formatDate(lastUpdated)} />
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">{statusUi.helper}</p>

        {phase === 'sent_to_product' && (
          <div className="inline-flex min-w-[240px] items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-bold text-sky-700">
            <Send className="h-4 w-4" />
            {FACTORY_COPY.correctionSentLabel}
          </div>
        )}

        {phase === 'resolved' && (
          <div className="inline-flex min-w-[240px] items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            Validada por Product
          </div>
        )}
      </div>
    </div>
  );
}

function MetaBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white px-3 py-3">
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 text-[11px] font-bold leading-5 text-slate-700">{value}</p>
    </div>
  );
}

function MetricPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'rose' | 'amber' | 'sky' | 'emerald';
}) {
  const tones = {
    rose: 'bg-rose-50 text-rose-700',
    amber: 'bg-amber-50 text-amber-800',
    sky: 'bg-sky-50 text-sky-700',
    emerald: 'bg-emerald-50 text-emerald-700',
  } as const;

  return (
    <div className={cn('rounded-2xl px-3 py-2 text-center', tones[tone])}>
      <p className="text-[9px] font-black uppercase tracking-widest">{label}</p>
      <p className="mt-1 text-lg font-black">{value}</p>
    </div>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#94A3B8]">{label}</p>
      <div className="text-sm font-medium text-[#1E293B]">{children}</div>
    </div>
  );
}
