import { useEffect } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ContextBackLink } from '../../navigation/ContextBackLink';
import { ContextLink } from '../../navigation/ContextLink';
import { InstitutionalBreadcrumb } from '../../components/navigation/InstitutionalBreadcrumb';
import { ArrowLeft, BookOpen, CalendarDays, CheckCircle2, GitBranch, MessageSquare, Package } from 'lucide-react';
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
import { isSemesterProductAcademicReviewPhase } from '../institutional-workflow/institutionalCopy';
import { SemesterOperationsWorkspace } from '../institutional-workflow/SemesterOperationsWorkspace';
import { useSemesterOperationalWorkspaceQuery } from '../queries/useSemesterOperationalWorkspaceQuery';
import {
  countFactoryVisibleOpenObservations,
  filterObservationsVisibleToFactory,
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
}: {
  activeTab: SemesterHubTab;
  onChange: (tab: SemesterHubTab) => void;
}) {
  const tabs: { id: SemesterHubTab; label: string; icon: typeof BookOpen }[] = [
    { id: 'asignaturas', label: 'Asignaturas', icon: BookOpen },
    { id: 'operaciones', label: 'Flujo operacional', icon: GitBranch },
  ];

  return (
    <div className="header-nav-track inline-flex gap-0.5 rounded-2xl p-1">
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
  const { project, isLoading, error, notFound } = useEnsureProjectDetail(projectId);
  useDismissNotificationsOnVisit({ projectId: project?.id });
  const semesterNum = parseInt(semesterNumber ?? '0', 10);
  const preliminarySemester = project?.semesters.find((s) => s.semesterNumber === semesterNum);
  const semesterWorkspaceQuery = useSemesterOperationalWorkspaceQuery(
    preliminarySemester?.id,
    Boolean(role === 'PRODUCT' && preliminarySemester?.id && backendEnabled),
  );
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

  const handleGoToSubjectsTab = (options?: { reviewStarted?: boolean }) => {
    if (!projectId) return;
    navigate(`/projects/${projectId}/semesters/${semesterNum}`, {
      replace: true,
      state: options?.reviewStarted ? { reviewStarted: true } : location.state,
    });
  };

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
  const openObservations = showFactoryHub
    ? countFactoryVisibleOpenObservations(
        projectObservations.filter(
          (o) => o.projectId === project.id && subjects.some((s) => s.id === o.subjectId),
        ),
      )
    : projectObservations.filter(
        (o) => o.projectId === project.id && o.status === 'ABIERTA' && subjects.some((s) => s.id === o.subjectId),
      ).length;

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

      {showHubTabs ? <SemesterHubTabs activeTab={activeTab} onChange={setTab} /> : null}

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
              <Info label="Observaciones abiertas">{openObservations}</Info>
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
                      ? 'Valide entregables, defina temas y apruebe cada asignatura. Use «Validar entregables» para abrir el checklist directamente.'
                      : academicReviewPendingStart
                        ? 'Inicie la revisión desde la pestaña Flujo operacional y luego valide el checklist de cada asignatura.'
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

          {showFactoryHub && (
            <Card variant="subjectPanel" className="p-4 sm:p-5">
              <div className="flex min-w-0 items-start gap-3">
                <Package className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />
                <div>
                  <p className="text-sm font-bold text-slate-900">Producción por asignatura</p>
                  <p className="text-xs font-medium text-slate-600">
                    Gestiona cada materia desde su detalle: inicia producción, aplica correcciones o marca como
                    completada. Para consultar el pipeline institucional, usa la pestaña Flujo operacional.
                  </p>
                </div>
              </div>
            </Card>
          )}

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
              {subjects.map((subject) => {
                const productChecklistItems = subject.checklist.filter((item) => item.ownerRole === 'PRODUCT');
                const subjectChecklist = productChecklistItems.length;
                const approvedChecklist = productChecklistItems.filter((item) => item.status === 'APROBADO').length;
                const subjectProgress = showFactoryHub
                  ? resolveFactorySubjectDisplayProgress(subject)
                  : subject.progress ?? 0;
                const factoryProductionComplete = showFactoryHub && isSubjectFactoryProductionComplete(subject);
                const factoryVisibleObservations = showFactoryHub
                  ? filterObservationsVisibleToFactory(projectObservations)
                  : projectObservations;
                const subjectObservations = factoryVisibleObservations.filter(
                  (o) => o.subjectId === subject.id && o.status === 'ABIERTA',
                ).length;
                const topicCount = subject.contentTopics?.length ?? 0;
                const productObs = getProductObservationsForSubject(
                  project,
                  subject.id,
                  factoryVisibleObservations,
                );
                const operationalState = normalizeSubjectOperationalState({
                  subject,
                  observations: productObs,
                  projectStatus: project.status,
                  forFactoryView: showFactoryHub,
                });
                const cta = factoryProductionComplete
                  ? { label: 'Producción completa', passive: true }
                  : getOperationalCta(operationalState);
                const subjectPath =
                  operationalState === 'CHANGES_REQUESTED' || subjectObservations > 0
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
                  <Card
                    key={subject.id}
                    variant="subjectPanel"
                    className={cn(
                      'relative overflow-hidden p-5 pl-6 transition-all hover:shadow-md',
                      factoryProductionComplete && 'ring-1 ring-emerald-100',
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
                      {subjectObservations > 0 && (
                        <span className="inline-flex items-center gap-1.5">
                          <MessageSquare className="h-3.5 w-3.5 text-amber-500" />
                          {subjectObservations} observaciones
                        </span>
                      )}
                    </div>

                    <div className="mt-5">
                      <ContextLink
                        to={showFactoryHub ? subjectPath : subjectPath}
                        className={cn(
                          'flex w-full items-center justify-center gap-1.5 rounded-2xl px-4 py-2.5 text-xs font-black shadow-lg transition-all',
                          factoryProductionComplete
                            ? 'border border-emerald-200 bg-emerald-50 text-emerald-800 shadow-none hover:bg-emerald-100'
                            : 'bg-linear-to-br from-orange-400 to-orange-600 text-white shadow-orange-500/30 hover:from-orange-500 hover:to-orange-700',
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
