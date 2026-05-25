import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ContextBackLink } from '../../navigation/ContextBackLink';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  CircleDashed,
  Clock3,
  MessageSquare,
  Package,
  RefreshCcw,
  Send,
} from 'lucide-react';
import { StatusBadge } from '../../components/status/StatusBadge';
import { Card } from '../../components/ui/Card';
import { getApiErrorMessage } from '../operations/apiMappers';
import { calculateSubjectProgress } from '../operations/progress';
import {
  getOperationalCta,
  getOperationalStateLabel,
  getProductObservationsForSubject,
  normalizeSubjectOperationalState,
  resolveSubjectExpectedDeliveryDate,
} from '../operations/subjectOperationalState';
import { useOperations } from '../../features/operations/OperationsContext';
import { useToast } from '../../components/ui/ToastProvider';
import { useUpdateSubjectProductionStatusMutation } from '../queries/useWorkflowMutations';
import { formatDate } from '../../utils/formatters';
import { Button } from '../../components/ui/Button';
import { cn } from '../../components/ui/tokens';
import type { OperationalObservation, SubjectVirtualization, VirtualizationProject } from '../../types/domain';
import { ChangeOriginBadge, ChangeOriginHint } from '../../components/change-tracking/ChangeOriginBadge';

type FlowStepId = 'PENDIENTE' | 'EN_PRODUCCION' | 'EN_REVISION';
type GeneralProductionState = FlowStepId | 'APROBADA';

function mapSubjectToProductionState(status: string): GeneralProductionState {
  if (status === 'APPROVED' || status === 'DELIVERED') return 'APROBADA';
  if (status === 'IN_PRODUCTION' || status === 'CHANGES_REQUESTED') return 'EN_PRODUCCION';
  if (status === 'IN_REVIEW' || status === 'SUBMITTED') return 'EN_REVISION';
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
  if (current === 'APROBADA') return 'done';
  const order: FlowStepId[] = ['PENDIENTE', 'EN_PRODUCCION', 'EN_REVISION'];
  const currentIndex = order.indexOf(current);
  const stepIndex = order.indexOf(step);
  if (currentIndex === stepIndex) return 'current';
  if (currentIndex > stepIndex) return 'done';
  return 'upcoming';
}

function flowStepLabel(stepId: FlowStepId, productionState: GeneralProductionState): string {
  if (stepId === 'EN_REVISION') {
    return productionState === 'APROBADA' ? 'Completada' : 'En revisión Product';
  }
  if (stepId === 'PENDIENTE') return 'Pendiente';
  return 'En producción';
}

const correctionStatusUi = {
  ABIERTA: {
    badge: 'border-rose-200 bg-rose-50 text-rose-700',
    dot: 'bg-rose-500',
    label: 'ABIERTA',
    title: 'Corrección pendiente',
    helper: 'Aún falta aplicar esta corrección en la materia.',
  },
  EN_CORRECCION: {
    badge: 'border-sky-200 bg-sky-50 text-sky-700',
    dot: 'bg-sky-500',
    label: 'EN_CORRECCION',
    title: 'Corrección enviada a Product',
    helper: 'Product debe validar esta corrección de forma individual.',
  },
  RESUELTA: {
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    dot: 'bg-emerald-500',
    label: 'RESUELTA',
    title: 'Validada por Product',
    helper: 'Esta observación ya quedó cerrada.',
  },
} as const;

interface FactorySubjectDetailProps {
  project: VirtualizationProject;
  subject: SubjectVirtualization;
  observations?: OperationalObservation[];
}

export function FactorySubjectDetail({ project, subject, observations }: FactorySubjectDetailProps) {
  const [searchParams] = useSearchParams();
  const {
    projectObservations,
    observationsByProject,
    markObservationCorrectionApplied,
    isMutating,
  } = useOperations();
  const { showToast } = useToast();
  const updateProductionStatusMutation = useUpdateSubjectProductionStatusMutation();

  const [submittingAction, setSubmittingAction] = useState<'production' | 'complete' | 'send-corrections' | null>(null);
  const [submittingObservationId, setSubmittingObservationId] = useState<string | null>(null);
  const actionInFlightRef = useRef(false);
  const correctionsSectionRef = useRef<HTMLDivElement | null>(null);
  const [correctionsHighlighted, setCorrectionsHighlighted] = useState(false);

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

  const productCorrections = getProductObservationsForSubject(
    project,
    subject.id,
    scopedProjectObservations,
  ).sort(
    (a, b) => new Date(b.updatedAt ?? b.createdAt).getTime() - new Date(a.updatedAt ?? a.createdAt).getTime(),
  );

  const openCorrections = productCorrections.filter((observation) => observation.status === 'ABIERTA');
  const correctionsInReview = productCorrections.filter((observation) => observation.status === 'EN_CORRECCION');
  const resolvedCorrections = productCorrections.filter((observation) => observation.status === 'RESUELTA');
  const productionState = mapSubjectToProductionState(subject.status);
  const operationalState = normalizeSubjectOperationalState({
    subject,
    observations: productCorrections,
    projectStatus: project.status,
  });
  const operationalLabel = getOperationalStateLabel(operationalState);
  const operationalCta = getOperationalCta(operationalState);
  const progress =
    subject.checklist.length > 0 ? calculateSubjectProgress(subject) : mapSubjectToProgress(subject.status);
  const semester = project.semesters.find((item) => item.semesterNumber === subject.semesterNumber);
  const canSendCorrections = openCorrections.length === 0 && correctionsInReview.length > 0;
  const hasCorrectionFlow = productCorrections.length > 0;
  const isApproved = productionState === 'APROBADA';

  const handleStartProduction = async () => {
    if (actionInFlightRef.current || isActionBusy || submittingAction) return;
    actionInFlightRef.current = true;
    setSubmittingAction('production');
    try {
      await updateProductionStatusMutation.mutateAsync({ subjectId: subject.id, projectId: project.id, status: 'EN_PRODUCCION' });
      showToast('Producción iniciada.');
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
      await updateProductionStatusMutation.mutateAsync({ subjectId: subject.id, projectId: project.id, status: 'COMPLETADA' });
      showToast('Materia enviada a Product para revisión.');
    } catch (updateError) {
      showToast(getApiErrorMessage(updateError), 'error');
    } finally {
      actionInFlightRef.current = false;
      setSubmittingAction(null);
    }
  };

  const handleSendCorrectionsToProduct = async () => {
    if (actionInFlightRef.current || isActionBusy || submittingAction) return;
    actionInFlightRef.current = true;
    setSubmittingAction('send-corrections');
    try {
      await updateProductionStatusMutation.mutateAsync({ subjectId: subject.id, projectId: project.id, status: 'COMPLETADA' });
      showToast('Correcciones enviadas a Product.');
    } catch (updateError) {
      showToast(getApiErrorMessage(updateError), 'error');
    } finally {
      actionInFlightRef.current = false;
      setSubmittingAction(null);
    }
  };

  const handleMarkCorrectionApplied = async (observation: OperationalObservation) => {
    setSubmittingObservationId(observation.id);
    try {
      await markObservationCorrectionApplied(project.id, observation.id, observation);
      showToast('Corrección enviada a Product.');
    } catch (updateError) {
      showToast(getApiErrorMessage(updateError), 'error');
    } finally {
      setSubmittingObservationId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <ContextBackLink
            fallback={`/projects/${project.id}/semesters/${subject.semesterNumber}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-[#64748B] hover:text-[#FF6B00]"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Volver al semestre
          </ContextBackLink>
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
          <StatusBadge status={subject.status} />
          <span className="rounded-[10px] bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600">
            {operationalLabel}
          </span>
          <span className="text-[11px] font-medium text-[#94A3B8]">
            Entrega: {formatDate(resolveSubjectExpectedDeliveryDate(project, subject))}
          </span>
        </div>
      </div>

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
              { id: 'EN_REVISION' as const },
            ]).map((step, index, list) => {
              const state = stepState(productionState, step.id);
              return (
                <div key={step.id} className="flex items-center gap-3 md:flex-1">
                  <div className={cn('flex h-9 w-9 items-center justify-center rounded-full text-xs font-black transition-all', state === 'done' && 'bg-emerald-500 text-white shadow-sm', state === 'current' && 'bg-orange-500 text-white shadow-[0_12px_24px_-16px_rgba(249,115,22,0.65)]', state === 'upcoming' && 'bg-white text-slate-400 ring-1 ring-slate-200')}>
                    {state === 'done' ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                  </div>
                  <div className="min-w-0">
                    <p className={cn('text-xs font-bold transition-colors', state === 'upcoming' ? 'text-slate-400' : state === 'done' ? 'text-emerald-700' : 'text-slate-900')}>
                      {flowStepLabel(step.id, productionState)}
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
                      isApproved
                        ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                        : 'bg-gradient-to-r from-orange-400 to-orange-600',
                    )}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              <span className={cn('text-xs font-black', isApproved ? 'text-emerald-600' : 'text-orange-600')}>
                {progress}%
              </span>
            </div>
          </Info>
        </div>

        <div
          className={cn(
            'mt-6 rounded-[16px] border p-4',
            isApproved ? 'border-emerald-100 bg-emerald-50/70' : 'border-slate-100 bg-slate-50/60',
          )}
        >
          <p className={cn('text-xs font-bold', isApproved ? 'text-emerald-900' : 'text-slate-900')}>
            {isApproved ? 'Materia completada' : 'Siguiente acción recomendada'}
          </p>
          <p className={cn('mt-1 text-sm font-medium', isApproved ? 'text-emerald-800' : 'text-slate-600')}>
            {openCorrections.length > 0
              ? 'Primero aplica todas las correcciones abiertas. Cada observación debe marcarse individualmente.'
              : hasCorrectionFlow && correctionsInReview.length > 0
                ? 'Todas las correcciones ya fueron aplicadas. Ahora puedes enviar la materia nuevamente a Product.'
                : productionState === 'PENDIENTE'
                  ? 'Cuando el equipo inicie el trabajo, marca la materia como En producción.'
                  : productionState === 'EN_PRODUCCION'
                    ? 'Cuando el contenido esté listo, envía la materia a Product para revisión.'
                    : isApproved
                      ? 'Product aprobó esta materia. No hay acciones pendientes de Fábrica.'
                      : 'La materia ya fue enviada a Product. Espera validación.'}
          </p>
        </div>

        {!hasCorrectionFlow && (
          <div className="mt-6">
            {productionState === 'PENDIENTE' && (
              <Button
                onClick={() => void handleStartProduction()}
                disabled={isActionBusy || submittingAction === 'production'}
                className="w-full py-3 text-sm font-bold shadow-[0_14px_28px_-20px_rgba(249,115,22,0.55)]"
              >
                {submittingAction === 'production' ? <Clock3 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
                Iniciar producción
              </Button>
            )}

            {productionState === 'EN_PRODUCCION' && (
              <div className="space-y-3">
                <div className="rounded-[12px] bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
                  Usa esta acción cuando el contenido ya esté listo para revisión de Product.
                </div>
                <Button
                  onClick={() => void handleMarkCompleted()}
                  disabled={isActionBusy || submittingAction === 'complete'}
                  className="w-full py-3 text-sm font-bold shadow-[0_14px_28px_-20px_rgba(249,115,22,0.55)]"
                >
                  {submittingAction === 'complete' ? <Clock3 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Enviar materia a Product
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
              <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/70 bg-white/80 p-2 shadow-sm">
                <MetricPill label="Abiertas" value={openCorrections.length} tone="rose" />
                <MetricPill label="En revisión" value={correctionsInReview.length} tone="sky" />
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
                {openCorrections.length > 0 && (
                  <div className="rounded-[18px] border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-800">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <div>
                        <p className="font-bold">Aún existen correcciones pendientes por aplicar.</p>
                        <p className="mt-1 text-amber-700">Mientras exista al menos una observación `ABIERTA`, no podrás reenviar la materia a Product.</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid gap-4 xl:grid-cols-2">
                  {productCorrections.map((observation) => (
                    <CorrectionCard
                      key={observation.id}
                      observation={observation}
                      isSubmitting={submittingObservationId === observation.id}
                      disabled={isActionBusy}
                      onMarkApplied={() => void handleMarkCorrectionApplied(observation)}
                    />
                  ))}
                </div>

                {canSendCorrections && (
                  <div className="rounded-[22px] border border-sky-200 bg-sky-50/70 p-5 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-sky-600">Revisión final</p>
                        <h3 className="mt-1 text-base font-black text-slate-950">Todas las correcciones ya fueron aplicadas</h3>
                        <p className="mt-1 text-sm text-slate-600">
                          Ya no quedan observaciones abiertas. Puedes enviar la materia nuevamente a Product para validación individual.
                        </p>
                      </div>
                      <Button
                        onClick={() => void handleSendCorrectionsToProduct()}
                        disabled={isActionBusy || submittingAction === 'send-corrections'}
                        className="min-w-[280px] py-3 text-sm font-bold shadow-[0_14px_28px_-20px_rgba(14,165,233,0.6)]"
                      >
                        {submittingAction === 'send-corrections' ? <Clock3 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        Enviar correcciones a Product
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function CorrectionCard({
  observation,
  isSubmitting,
  disabled,
  onMarkApplied,
}: {
  observation: OperationalObservation;
  isSubmitting: boolean;
  disabled: boolean;
  onMarkApplied: () => void;
}) {
  const statusUi = correctionStatusUi[observation.status];
  const lastUpdated = observation.updatedAt ?? observation.createdAt;

  return (
    <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.25)] transition-all hover:border-slate-300">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Corrección solicitada por Product</p>
          <h3 className="mt-1 text-base font-black tracking-tight text-slate-950">{statusUi.title}</h3>
        </div>
        <span className={cn('inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black tracking-wide', statusUi.badge)}>
          <span className={cn('h-2 w-2 rounded-full', statusUi.dot)} />
          {statusUi.label}
        </span>
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

        {observation.status === 'ABIERTA' && (
          <Button
            onClick={onMarkApplied}
            disabled={disabled || isSubmitting}
            className="min-w-[240px] py-2.5 text-sm font-bold"
          >
            {isSubmitting ? <Clock3 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
            Marcar corrección aplicada
          </Button>
        )}

        {observation.status === 'EN_CORRECCION' && (
          <div className="inline-flex min-w-[240px] items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-bold text-sky-700">
            <Send className="h-4 w-4" />
            Corrección enviada a Product
          </div>
        )}

        {observation.status === 'RESUELTA' && (
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

function MetricPill({ label, value, tone }: { label: string; value: number; tone: 'rose' | 'sky' | 'emerald' }) {
  const tones = {
    rose: 'bg-rose-50 text-rose-700',
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
