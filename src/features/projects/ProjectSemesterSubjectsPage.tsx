import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ContextBackLink } from '../../navigation/ContextBackLink';
import { ContextLink } from '../../navigation/ContextLink';
import { InstitutionalBreadcrumb } from '../../components/navigation/InstitutionalBreadcrumb';
import { ArrowLeft, BookOpen, CalendarDays, CheckCircle2, GitBranch, Package } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { StatusBadge } from '../../components/status/StatusBadge';
import { DeepLinkNotFound } from '../../components/feedback/DeepLinkNotFound';
import { ProjectsLoadNotice } from '../../components/feedback/ProjectsLoadNotice';
import { useOperations } from '../../features/operations/OperationsContext';
import { useEnsureProjectDetail } from '../operations/useEnsureProjectDetail';
import { useAuth } from '../auth/AuthContext';
import { formatDate } from '../../utils/formatters';
import { cn } from '../../components/ui/tokens';
import { useDismissNotificationsOnVisit } from '../notifications/useDismissNotificationsOnVisit';
import { ChangeOriginBadge, ChangeOriginCardAccent, ChangeOriginHint } from '../../components/change-tracking/ChangeOriginBadge';
import type { SemesterHubTab } from '../institutional-workflow/institutionalNavigation';
import {
  productSubjectChecklistReviewPath,
  productSubjectClosurePath,
  productSubjectTopicsPath,
  subjectFactoryCorrectionsPath,
} from '../institutional-workflow/institutionalNavigation';
import {
  isSemesterFactoryProductionActive,
  isSemesterFactoryStartPending,
  isSemesterProductAcademicReviewPhase,
} from '../institutional-workflow/institutionalCopy';
import { SemesterOperationsWorkspace } from '../institutional-workflow/SemesterOperationsWorkspace';
import { RequestProductOwnerMeta } from '../institutional-workflow/components/RequestProductOwnerMeta';
import { FactorySemesterDeliveryBanner } from '../institutional-workflow/components/FactorySemesterDeliveryBanner';
import {
  FactoryObservationsMetricHighlight,
  FactoryObservationsSemesterAlert,
  FactorySubjectObservationBadge,
  type FactoryObservationSubjectRef,
} from '../institutional-workflow/components/FactoryObservationsGuidance';
import { factorySubjectHasOpenObservations } from '../institutional-workflow/institutionalNavigation';
import {
  countFactoryReadySubjects,
  resolveFactorySemesterDeliveryGuidance,
} from '../institutional-workflow/factorySemesterDeliveryGuidance';
import { useSemesterOperationalWorkspaceQuery } from '../queries/useSemesterOperationalWorkspaceQuery';
import {
  countFactoryVisibleOpenObservations,
  countProductVisibleOpenObservations,
  countSubjectFactoryOpenObservations,
  countSubjectProductOpenObservations,
  filterObservationsVisibleToFactory,
  getEffectiveProductChecklistCounts,
} from '../observations/observationDeliverableHelpers';
import {
  getOperationalCta,
  getProductObservationsForSubject,
  normalizeSubjectOperationalState,
  resolveSubjectExpectedDeliveryDate,
} from '../operations/subjectOperationalState';
import {
  factorySubjectStatusBadgeTone,
  isSubjectFactoryProductionComplete,
  resolveFactorySubjectDisplayProgress,
  resolveFactorySubjectProductionLabel,
  resolveFactorySubjectStatusBadgeLabel,
} from '../subjects/factoryProductionStatus';

function SemesterHubTabs({
  activeTab,
  onChange,
  openObservationsCount = 0,
}: {
  activeTab: SemesterHubTab;
  onChange: (tab: SemesterHubTab) => void;
  openObservationsCount?: number;
}) {
  const tabs: { id: SemesterHubTab; label: string; icon: typeof BookOpen }[] = [
    { id: 'asignaturas', label: 'Asignaturas', icon: BookOpen },
    { id: 'operaciones', label: 'Flujo operacional', icon: GitBranch },
  ];

  return (
    <div className="header-nav-track flex w-fit max-w-full gap-0.5 rounded-2xl p-1">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={cn(
            'flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold tracking-tight transition-all duration-200',
            activeTab === id
              ? 'header-nav-link-active text-orange-600'
              : 'text-slate-500 hover:bg-white/45 hover:text-slate-700',
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
          {id === 'asignaturas' && openObservationsCount > 0 ? (
            <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-100 px-1 text-[9px] font-bold text-amber-800">
              {openObservationsCount}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

export function ProjectSemesterSubjectsPage() {
  const { projectId, semesterNumber } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { projectObservations, refreshProjects, loadProjectDetail, loadProjectObservations, backendEnabled } = useOperations();
  const { role } = useAuth();
  const reviewJustStarted = Boolean(
    (location.state as { reviewStarted?: boolean } | null)?.reviewStarted,
  );
  const focusObservationsFromNav = Boolean(
    (location.state as { focusObservations?: boolean } | null)?.focusObservations,
  );
  const subjectCardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [pendingScrollSubjectId, setPendingScrollSubjectId] = useState<string | null>(null);
  const { project, isLoading, error, notFound } = useEnsureProjectDetail(projectId);
  useDismissNotificationsOnVisit({ projectId: project?.id });
  const semesterNum = parseInt(semesterNumber ?? '0', 10);
  const preliminarySemester = project?.semesters.find((s) => s.semesterNumber === semesterNum);
  const semesterWorkspaceSemesterId =
    (role === 'PRODUCT' || role === 'FABRICA') && backendEnabled
      ? preliminarySemester?.id
      : undefined;
  const semesterWorkspaceQuery = useSemesterOperationalWorkspaceQuery(semesterWorkspaceSemesterId);
  const semesterWorkspace = semesterWorkspaceQuery.data;
  const activeTab: SemesterHubTab =
    searchParams.get('tab') === 'operaciones' ? 'operaciones' : 'asignaturas';

  const setTab = (tab: SemesterHubTab) => {
    if (tab === 'asignaturas') {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ tab: 'operaciones' }, { replace: true });
    }
  };

  const handleGoToSubjectsTab = (options?: { reviewStarted?: boolean; focusObservations?: boolean }) => {
    if (!projectId) return;
    setTab('asignaturas');
    if (options?.reviewStarted || options?.focusObservations) {
      navigate(`/projects/${projectId}/semesters/${semesterNum}`, {
        replace: true,
        state: {
          reviewStarted: options.reviewStarted ?? false,
          focusObservations: options.focusObservations ?? false,
        },
      });
    }
    if (options?.focusObservations) {
      const firstSubjectId =
        semesterWorkspace?.subjects.find(factorySubjectHasOpenObservations)?.subjectId ?? null;
      if (firstSubjectId) {
        setPendingScrollSubjectId(firstSubjectId);
      }
    }
  };

  useEffect(() => {
    if (!pendingScrollSubjectId || activeTab !== 'asignaturas') return;
    const timeoutId = window.setTimeout(() => {
      subjectCardRefs.current[pendingScrollSubjectId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
      setPendingScrollSubjectId(null);
    }, 320);
    return () => window.clearTimeout(timeoutId);
  }, [pendingScrollSubjectId, activeTab]);

  useEffect(() => {
    if (!focusObservationsFromNav || activeTab !== 'asignaturas') return;
    const firstSubjectId =
      semesterWorkspace?.subjects.find(factorySubjectHasOpenObservations)?.subjectId ?? null;
    if (firstSubjectId) {
      setPendingScrollSubjectId(firstSubjectId);
    }
  }, [focusObservationsFromNav, activeTab, semesterWorkspace?.subjects]);

  useEffect(() => {
    if (!projectId || !backendEnabled || role !== 'FABRICA') return;
    void loadProjectDetail(projectId);
    void loadProjectObservations(projectId);
  }, [projectId, backendEnabled, role, loadProjectDetail, loadProjectObservations, location.key]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <ProjectsLoadNotice isLoading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <ProjectsLoadNotice error={error} onRefresh={() => void refreshProjects()} />
      </div>
    );
  }

  if (isNaN(semesterNum)) {
    return (
      <DeepLinkNotFound
        title="Semestre no válido"
        description="La URL no contiene un número de semestre válido."
        backTo={projectId ? `/projects/${projectId}` : '/projects'}
        backLabel="Volver al proyecto"
      />
    );
  }

  if (notFound || !project) {
    return (
      <DeepLinkNotFound
        title="Proyecto no encontrado"
        description={error ?? 'No pudimos cargar el proyecto de esta URL.'}
        backTo="/projects"
        onRetry={() => void refreshProjects()}
      />
    );
  }

  const semester = project.semesters.find((s) => s.semesterNumber === semesterNum);
  const subjects = project.subjects.filter((s) => s.semesterNumber === semesterNum);
  const showProductHub = role === 'PRODUCT' && Boolean(semester?.id);
  const showFactoryHub = role === 'FABRICA' && Boolean(semester?.id);
  const inAcademicReviewPhase = Boolean(
    semesterWorkspace && isSemesterProductAcademicReviewPhase(semesterWorkspace.operationalState),
  );
  const academicReviewPendingStart =
    semesterWorkspace?.operationalState === 'PENDING_PRODUCT_ACADEMIC_REVIEW';
  const institutionalFactoryFlow = Boolean(
    showFactoryHub && backendEnabled && semesterWorkspace?.institutionalFlowActive,
  );
  const semesterFactoryStartPending = institutionalFactoryFlow &&
    isSemesterFactoryStartPending(semesterWorkspace?.operationalState);
  const semesterFactoryProductionActive = institutionalFactoryFlow &&
    isSemesterFactoryProductionActive(semesterWorkspace?.operationalState);
  const semesterSubjectCounts = countFactoryReadySubjects(
    subjects,
    semesterNum,
    isSubjectFactoryProductionComplete,
  );
  const deliveryGuidance = resolveFactorySemesterDeliveryGuidance({
    institutionalFlowActive: institutionalFactoryFlow,
    semesterOperationalState: semesterWorkspace?.operationalState,
    subjectsReady: semesterWorkspace?.metrics.subjectsReady ?? semesterSubjectCounts.ready,
    subjectsTotal: semesterWorkspace?.metrics.subjectsTotal ?? semesterSubjectCounts.total,
    deliverReady: semesterWorkspace?.readiness?.ready ?? false,
    projectId: project?.id ?? '',
    semesterNumber: semesterNum,
  });

  const semesterProgress =
    subjects.length > 0
      ? Math.round(
          subjects.reduce(
            (acc, s) =>
              acc +
              (showFactoryHub
                ? resolveFactorySubjectDisplayProgress(s)
                : s.progress ?? 0),
            0,
          ) / subjects.length,
        )
      : 0;
  const semesterScopedProductObservations = projectObservations.filter(
    (o) => o.projectId === project.id && subjects.some((s) => s.id === o.subjectId),
  );
  const openObservations = showFactoryHub
    ? countFactoryVisibleOpenObservations(semesterScopedProductObservations)
    : countProductVisibleOpenObservations(semesterScopedProductObservations);

  const semesterScopedObservations = filterObservationsVisibleToFactory(semesterScopedProductObservations);

  const subjectsWithOpenObservations: FactoryObservationSubjectRef[] = showFactoryHub
    ? semesterWorkspace?.subjects?.length
      ? semesterWorkspace.subjects
          .filter(factorySubjectHasOpenObservations)
          .map((subject) => ({
            subjectId: subject.subjectId,
            subjectName: subject.subjectName,
            count: subject.openObservationsCount ?? 1,
          }))
      : subjects
          .map((subject) => ({
            subjectId: subject.id,
            subjectName: subject.name,
            count: countSubjectFactoryOpenObservations(semesterScopedObservations, subject.id),
          }))
          .filter((subject) => subject.count > 0)
    : subjects
        .map((subject) => ({
          subjectId: subject.id,
          subjectName: subject.name,
          count: Math.max(
            countSubjectProductOpenObservations(semesterScopedProductObservations, subject.id),
            semesterWorkspace?.subjects.find((item) => item.subjectId === subject.id)
              ?.openObservationsCount ?? 0,
          ),
        }))
        .filter((subject) => subject.count > 0);

  const sortedSubjects =
    subjectsWithOpenObservations.length > 0
      ? [...subjects].sort((a, b) => {
          const priority = new Map(
            subjectsWithOpenObservations.map((item) => [item.subjectId, item.count]),
          );
          const aCount = priority.get(a.id) ?? 0;
          const bCount = priority.get(b.id) ?? 0;
          if (aCount !== bCount) return bCount - aCount;
          return a.name.localeCompare(b.name, 'es');
        })
      : subjects;

  const showHubTabs = showProductHub || showFactoryHub;

  const backFallback =
    role === 'FABRICA'
      ? `/projects/${project.id}/operations`
      : `/projects/${project.id}?tab=semesters`;

  return (
    <div className="space-y-7">
      <InstitutionalBreadcrumb
        className="mb-1"
        items={[
          { label: 'Solicitudes', to: '/projects' },
          { label: project.program, to: `/projects/${project.id}` },
          ...(role === 'FABRICA'
            ? [
                {
                  label: 'Centro operacional',
                  to: `/projects/${project.id}/operations`,
                },
              ]
            : []),
          { label: `Semestre ${semesterNum}` },
        ]}
      />

      <PageHeader
        prominentEyebrow
        eyebrow={`${project.school} · ${project.program}`}
        title={`Semestre ${semesterNum}`}
        description={
          role === 'FABRICA'
            ? `${project.modality} · Producción de contenido por asignatura`
            : `${project.modality} · Responsable Product: ${project.productOwner}`
        }
        action={
          <ContextBackLink
            fallback={backFallback}
            className="inline-flex items-center gap-1.5 rounded-2xl border border-orange-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition-all hover:border-orange-300 hover:text-orange-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {role === 'FABRICA' ? 'Volver al centro operacional' : 'Volver al proyecto'}
          </ContextBackLink>
        }
      />

      {role === 'FABRICA' ? (
        <div className="-mt-4">
          <RequestProductOwnerMeta name={project.productOwner} />
        </div>
      ) : null}

      {showHubTabs ? (
        <div className="w-full">
          <SemesterHubTabs
            activeTab={activeTab}
            onChange={setTab}
            openObservationsCount={showFactoryHub ? openObservations : 0}
          />
        </div>
      ) : null}

      <Card variant="subjectPanel" className="overflow-hidden p-0">
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="grid min-w-0 flex-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Estado del proyecto">
                <StatusBadge status={project.status} />
              </Info>
              <Info label="Entrega esperada por Fábrica">
                {semester ? formatDate(semester.factoryExpectedDate) : formatDate(project.expectedDeliveryDate)}
              </Info>
              <Info label="Asignaturas">{subjects.length}</Info>
              {showFactoryHub ? (
                <FactoryObservationsMetricHighlight count={openObservations} embedded />
              ) : (
                <Info label="Observaciones abiertas">{openObservations}</Info>
              )}
            </div>
            <div className="flex min-w-[220px] flex-col gap-3">
              <div className="relative h-2.5 overflow-hidden rounded-[10px] bg-[#E2E8F0]">
                <div
                  className="progress-glass relative h-full rounded-[10px] bg-linear-to-r from-[#FF7E5F] to-[#FEB47B]"
                  style={{ width: `${semesterProgress}%` }}
                />
              </div>
              <p className="text-right text-xs font-black text-orange-600">{semesterProgress}% avance</p>
            </div>
          </div>
        </div>
      </Card>

      {activeTab === 'operaciones' && showHubTabs && semester ? (
        <SemesterOperationsWorkspace
          semesterId={semester.id}
          showSubjectsTable={false}
          onGoToSubjectsTab={handleGoToSubjectsTab}
          showTopStatus={role !== 'FABRICA'}
          requestOwnerName={project.productOwner}
        />
      ) : (
        <>
          {showProductHub && (
            <Card
              variant="subjectPanel"
              className={cn(
                'p-4 sm:p-5',
                inAcademicReviewPhase
                  ? 'border-indigo-200/80 bg-indigo-50/50'
                  : reviewJustStarted
                    ? 'border-emerald-200 bg-emerald-50/60'
                    : undefined,
              )}
            >
              <div className="flex min-w-0 items-start gap-3">
                <CheckCircle2
                  className={cn(
                    'mt-0.5 h-5 w-5 shrink-0',
                    inAcademicReviewPhase || reviewJustStarted ? 'text-indigo-600' : 'text-orange-500',
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900">
                    {inAcademicReviewPhase
                      ? 'Fase 7 · Revisión académica del semestre'
                      : reviewJustStarted
                        ? 'Revisión académica en curso'
                        : academicReviewPendingStart
                          ? 'Revisión académica pendiente de inicio'
                          : 'Revisión de asignaturas'}
                  </p>
                  <p className="mt-1 text-xs font-medium leading-relaxed text-slate-600">
                    {inAcademicReviewPhase || reviewJustStarted
                      ? 'Elija cada asignatura para validar entregables, definir temas y aprobar o solicitar correcciones.'
                      : academicReviewPendingStart
                        ? 'Inicie la revisión desde la pestaña Flujo operacional con el botón «Iniciar revisión». Luego trabaje cada asignatura desde esta vista.'
                        : 'Revise las asignaturas de este semestre. Para consultar el pipeline institucional, use la pestaña Flujo operacional.'}
                  </p>
                  {academicReviewPendingStart ? (
                    <button
                      type="button"
                      onClick={() => setTab('operaciones')}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold text-indigo-800 hover:bg-indigo-50"
                    >
                      <GitBranch className="h-3.5 w-3.5" />
                      Ir a iniciar revisión
                    </button>
                  ) : null}
                </div>
              </div>
            </Card>
          )}

          {showFactoryHub && !openObservations && (
            <Card variant="subjectPanel" className="p-4 sm:p-5">
              <div className="flex min-w-0 items-start gap-3">
                <Package className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />
                <div>
                  <p className="text-sm font-bold text-slate-900">Producción por asignatura</p>
                  <p className="text-xs font-medium text-slate-600">
                    {semesterFactoryStartPending
                      ? 'Inicie la producción del semestre desde la pestaña Flujo operacional. Luego entre a cada materia para marcar la producción interna como completa.'
                      : deliveryGuidance?.variant === 'ready_to_deliver'
                        ? 'Todas las asignaturas están completas. Confirme la entrega del paquete semestral en Flujo operacional para avanzar a Planeación.'
                        : semesterFactoryProductionActive
                          ? 'Marque la producción interna de cada asignatura. Cuando todas estén al 100%, confirme la entrega del semestre en Flujo operacional.'
                          : 'Gestiona cada materia desde su detalle: aplica correcciones o marca la producción interna como completa. El inicio del paquete semestral se realiza en Flujo operacional.'}
                  </p>
                  {semesterFactoryStartPending ? (
                    <button
                      type="button"
                      onClick={() => setTab('operaciones')}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-orange-200 bg-white px-3 py-2 text-xs font-semibold text-orange-800 hover:bg-orange-50"
                    >
                      <GitBranch className="h-3.5 w-3.5" />
                      Ir a iniciar producción
                    </button>
                  ) : null}
                </div>
              </div>
            </Card>
          )}

          {showFactoryHub && deliveryGuidance ? (
            <FactorySemesterDeliveryBanner
              guidance={deliveryGuidance}
              onPrimaryAction={
                deliveryGuidance.variant === 'ready_to_deliver'
                  ? () => setTab('operaciones')
                  : undefined
              }
            />
          ) : null}

          {showFactoryHub && activeTab === 'asignaturas' && openObservations > 0 ? (
            <FactoryObservationsSemesterAlert
              totalCount={openObservations}
              subjects={subjectsWithOpenObservations}
            />
          ) : null}

          {subjects.length === 0 ? (
            <Card variant="subjectPanel" className="p-8 text-center">
              <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm font-bold text-slate-700">Sin asignaturas en este semestre</p>
              <p className="mt-1 text-xs font-medium text-slate-500">
                {role === 'FABRICA'
                  ? 'Este semestre no tiene materias registradas para producción.'
                  : 'Este semestre no tiene materias registradas. Para incluir materias nuevas, agrega un semestre desde el detalle del proyecto.'}
              </p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {sortedSubjects.map((subject) => {
                const workspaceSubject = semesterWorkspace?.subjects.find((item) => item.subjectId === subject.id);
                const factoryVisibleObservations = showFactoryHub
                  ? filterObservationsVisibleToFactory(projectObservations)
                  : projectObservations;
                const productChecklistItems = subject.checklist.filter((item) => item.ownerRole === 'PRODUCT');
                const subjectProductObservations = getProductObservationsForSubject(
                  project,
                  subject.id,
                  showFactoryHub ? factoryVisibleObservations : semesterScopedProductObservations,
                );
                const checklistCounts = getEffectiveProductChecklistCounts(
                  productChecklistItems,
                  subjectProductObservations,
                );
                const subjectChecklist = checklistCounts.total;
                const approvedChecklist = checklistCounts.approved;
                const subjectProgress = showFactoryHub
                  ? resolveFactorySubjectDisplayProgress(subject)
                  : subject.progress ?? 0;
                const factoryProductionComplete = showFactoryHub && isSubjectFactoryProductionComplete(subject);
                const subjectOpenObservations = showFactoryHub
                  ? workspaceSubject && factorySubjectHasOpenObservations(workspaceSubject)
                    ? workspaceSubject.openObservationsCount ?? countSubjectFactoryOpenObservations(factoryVisibleObservations, subject.id)
                    : countSubjectFactoryOpenObservations(factoryVisibleObservations, subject.id)
                  : Math.max(
                      countSubjectProductOpenObservations(semesterScopedProductObservations, subject.id),
                      workspaceSubject?.openObservationsCount ?? 0,
                    );
                const hasOpenObservations = subjectOpenObservations > 0;
                const topicCount = subject.contentTopics?.length ?? 0;
                const productObs = subjectProductObservations;
                const operationalState = normalizeSubjectOperationalState({
                  subject,
                  observations: productObs,
                  projectStatus: project.status,
                  forFactoryView: showFactoryHub,
                });
                const cta = hasOpenObservations
                  ? { label: 'Ver corrección', passive: false }
                  : factoryProductionComplete
                    ? { label: 'Ver asignatura', passive: true }
                    : semesterFactoryStartPending
                      ? { label: 'Ver asignatura', passive: false }
                      : semesterFactoryProductionActive
                        ? operationalState === 'NOT_STARTED'
                          ? { label: 'Continuar producción' }
                          : getOperationalCta(operationalState)
                        : getOperationalCta(operationalState);
                const subjectPath =
                  hasOpenObservations || operationalState === 'CHANGES_REQUESTED'
                    ? subjectFactoryCorrectionsPath(subject.id)
                    : inAcademicReviewPhase || reviewJustStarted
                      ? topicCount === 0
                        ? productSubjectTopicsPath(subject.id)
                        : approvedChecklist >= subjectChecklist && subjectChecklist > 0
                          ? productSubjectClosurePath(subject.id)
                          : productSubjectChecklistReviewPath(subject.id)
                      : `/subjects/${subject.id}`;

                const productReviewCtaLabel =
                  topicCount === 0
                    ? 'Definir temas'
                    : approvedChecklist >= subjectChecklist && subjectChecklist > 0
                      ? 'Revisar cierre'
                      : 'Validar entregables';

                return (
                  <div
                    key={subject.id}
                    id={`factory-subject-${subject.id}`}
                    ref={(node) => {
                      subjectCardRefs.current[subject.id] = node;
                    }}
                  >
                  <Card
                    variant="subjectPanel"
                    className={cn(
                      'relative overflow-hidden p-5 pl-6 transition-all hover:shadow-md',
                      hasOpenObservations && 'border-l-[3px] border-l-amber-400 pl-[calc(1.5rem-3px)]',
                      factoryProductionComplete && !hasOpenObservations && 'ring-1 ring-emerald-100/80',
                    )}
                  >
                    <ChangeOriginCardAccent isNew={Boolean(subject.createdFromChange)} />
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#94A3B8]">
                          Semestre {subject.semesterNumber}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold tracking-tight text-slate-950">{subject.name}</h3>
                          {subject.createdFromChange && <ChangeOriginBadge kind="subject" />}
                          {showFactoryHub ? (
                            <FactorySubjectObservationBadge count={subjectOpenObservations} />
                          ) : null}
                        </div>
                        {subject.createdFromChange && <ChangeOriginHint kind="subject" />}
                      </div>
                      {showFactoryHub ? (
                        <span
                          className={cn(
                            'inline-flex shrink-0 items-center rounded-[12px] px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.05em] ring-1',
                            factorySubjectStatusBadgeTone(subject),
                          )}
                        >
                          {resolveFactorySubjectStatusBadgeLabel(subject)}
                        </span>
                      ) : (
                        <StatusBadge status={subject.status} size="sm" />
                      )}
                    </div>

                    <div className="mt-4">
                      <ProgressBar value={subjectProgress} showLabel={false} size="sm" />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-slate-600">
                      {showFactoryHub ? (
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5',
                            factoryProductionComplete ? 'text-emerald-700' : 'text-slate-600',
                          )}
                        >
                          <Package className="h-3.5 w-3.5 text-orange-400" />
                          {resolveFactorySubjectProductionLabel(subject)}
                        </span>
                      ) : (
                        <>
                          <span className="inline-flex items-center gap-1.5">
                            <BookOpen className="h-3.5 w-3.5 text-orange-400" />
                            {inAcademicReviewPhase || reviewJustStarted
                              ? `${approvedChecklist}/${subjectChecklist} entregables validados`
                              : `${subjectChecklist} entregables`}
                          </span>
                        </>
                      )}
                      {topicCount > 0 && showProductHub && (
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5 text-orange-400" />
                          {topicCount} temas
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 text-orange-400" />
                        Entrega:{' '}
                        {formatDate(resolveSubjectExpectedDeliveryDate(project, subject))}
                      </span>
                    </div>

                    <div className="mt-5">
                      <ContextLink
                        to={subjectPath}
                        className={cn(
                          'flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-all',
                          cta.passive
                            ? 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                            : 'bg-linear-to-br from-orange-400 to-orange-600 text-white shadow-sm shadow-orange-500/20 hover:from-orange-500 hover:to-orange-700',
                        )}
                      >
                        {showFactoryHub
                          ? cta.label
                          : inAcademicReviewPhase || reviewJustStarted
                            ? productReviewCtaLabel
                            : 'Gestionar revisión'}
                      </ContextLink>
                    </div>
                  </Card>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
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
