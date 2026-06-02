import { ArrowLeft, ArrowRight, CalendarDays } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ContextBackLink } from '../../navigation/ContextBackLink';
import { homePathForRole } from '../../navigation/roleNavigation';
import { useOperations } from '../../features/operations/OperationsContext';
import { useAuth } from '../auth/AuthContext';
import { Card } from '../../components/ui/Card';
import { cn } from '../../components/ui/tokens';
import { PageHeader } from '../../components/ui/PageHeader';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatDate } from '../../utils/formatters';
import type { ProgramOperationalWorkItemDto } from '../../services/institutionalWorkflowApi';
import {
  formatProgramProgress,
  formatSemesterSubjectProgress,
} from './institutionalCopy';
import { productSemesterOperationsPath, semesterHubPath, semesterOperationsPath } from './institutionalNavigation';
import { ProgramActiveStageBadge } from '../operations-v2/components/ProgramActiveStageBadge';
import { SlaBadgeV2 } from '../operations-v2/components/SlaBadgeV2';
import { OperationalTurnIndicator } from './components/OperationalTurnIndicator';
import { useFactoryProgramsQuery } from '../queries/useFactoryProgramsQuery';
import { findMappedFactoryProgram } from '../factory-work/factoryProgramNavigation';
import { mapFactoryProgramToTableItem } from '../factory-work/factoryProgramWork';
import {
  useInstitutionalProgramsWorkQuery,
  usePlanningTrackingProgramsQuery,
  useProjectOperationalProgramQuery,
} from '../queries/useInstitutionalProgramsWorkQuery';
import type { SlaStatusV2 } from '../../types/operationalWorkflow';
import type { InstitutionalOperationalState, Role } from '../../types/domain';
import { ProjectRadicationBanner } from '../project-radication/ProjectRadicationBanner';
import { projectRadicationApi } from '../../services/projectRadicationApi';
import { projectRadicationKeys } from '../project-radication/ProjectRadicationPanel';
import { useQuery } from '@tanstack/react-query';
import { PlanningProjectRadicationReviewPanel } from '../planning/components/PlanningProjectRadicationReviewPanel';
import { ProjectInstitutionalClosurePanel } from './components/ProjectInstitutionalClosurePanel';
import { queryKeys } from '../queries/queryKeys';
import { RequestProductOwnerMeta } from './components/RequestProductOwnerMeta';
import {
  FactoryObservationsMetricHighlight,
  FactoryObservationsProgramAlert,
  type FactoryObservationSemesterRef,
} from './components/FactoryObservationsGuidance';

type LocationState = {
  from?: string;
  programWorkItem?: ProgramOperationalWorkItemDto;
};

const backLinkClassName =
  'inline-flex w-fit items-center gap-2 rounded-[12px] border border-slate-200/80 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 shadow-sm transition-colors hover:border-orange-200 hover:bg-orange-50/50 hover:text-orange-700';

function findProgramInList(
  sources: Array<ProgramOperationalWorkItemDto[] | undefined>,
  projectId: string | undefined,
): ProgramOperationalWorkItemDto | null {
  if (!projectId) return null;
  for (const source of sources) {
    const match = (source ?? []).find((item) => item.projectId === projectId);
    if (match) return match;
  }
  return null;
}

function roleProgramsQueryRole(role: Role | null): Role | null {
  if (role === 'PLANEACION') return 'PLANEACION';
  if (role === 'LMS') return 'LMS';
  if (role === 'FABRICA') return 'FABRICA';
  if (role === 'PRODUCT') return 'PRODUCT';
  return null;
}

function resolveProgramTurnContext(
  program: ProgramOperationalWorkItemDto,
  viewerRole?: Role | null,
): {
  operationalState: InstitutionalOperationalState;
  responsibleRole: Role;
} | null {
  const active = program.semesters.filter(
    (s) => s.operationalState !== 'FINALIZED' && s.operationalState !== 'PENDING_PROJECT_RADICATION',
  );
  const pool = active.length > 0 ? active : program.semesters;
  if (pool.length === 0) return null;

  if (viewerRole) {
    const viewerSemester = pool.find((s) => s.currentResponsibleRole === viewerRole);
    if (viewerSemester) {
      return {
        operationalState: viewerSemester.operationalState as InstitutionalOperationalState,
        responsibleRole: viewerSemester.currentResponsibleRole as Role,
      };
    }
  }

  const target =
    pool.find((s) => s.currentResponsibleRole === program.currentResponsibleRole) ?? pool[0]!;
  return {
    operationalState: target.operationalState as InstitutionalOperationalState,
    responsibleRole: target.currentResponsibleRole as Role,
  };
}

export function ProjectProgramOperationsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { role } = useAuth();
  const { projects } = useOperations();
  const roleHome = homePathForRole(role);
  const state = (location.state ?? {}) as LocationState;

  const programsRole = roleProgramsQueryRole(role);
  const workProgramsQuery = useInstitutionalProgramsWorkQuery(
    programsRole,
    Boolean(programsRole) && role !== 'FABRICA',
  );
  const planningTrackingQuery = usePlanningTrackingProgramsQuery(
    role === 'PLANEACION',
  );
  const productProgramsQuery = useInstitutionalProgramsWorkQuery(
    'PRODUCT',
    role === 'PRODUCT',
  );

  const factoryProgramsQuery = useFactoryProgramsQuery(
    { page: 1, limit: 100, projectId },
    Boolean(projectId) && role === 'FABRICA',
  );

  useEffect(() => {
    if (role !== 'FABRICA' || !projectId) return;
    void queryClient.invalidateQueries({
      queryKey: queryKeys.factory.subjectsPrograms({ page: 1, limit: 100, projectId }),
    });
  }, [projectId, role, queryClient]);

  const programFromLists = useMemo(() => {
    if (role === 'FABRICA') {
      const fresh = findMappedFactoryProgram(factoryProgramsQuery.data?.items, projectId ?? '');
      if (fresh) return fresh;
    }
    if (role === 'PLANEACION') {
      const fresh = findProgramInList(
        [workProgramsQuery.data, planningTrackingQuery.data, productProgramsQuery.data],
        projectId,
      );
      if (fresh) return fresh;
    }
    if (role === 'LMS') {
      const fresh = findProgramInList([workProgramsQuery.data], projectId);
      if (fresh) return fresh;
    }
    if (role === 'PRODUCT') {
      const fresh = findProgramInList([productProgramsQuery.data], projectId);
      if (fresh) return fresh;
    }
    if (state.programWorkItem && state.programWorkItem.projectId === projectId) {
      return state.programWorkItem;
    }
    return null;
  }, [
    state.programWorkItem,
    projectId,
    role,
    workProgramsQuery.data,
    planningTrackingQuery.data,
    productProgramsQuery.data,
    factoryProgramsQuery.data,
  ]);

  const factoryProgram = useMemo(() => {
    if (!projectId) return null;
    return (factoryProgramsQuery.data?.items ?? []).find((p) => p.projectId === projectId) ?? null;
  }, [factoryProgramsQuery.data, projectId]);

  const mappedFactoryProgram = useMemo(
    () => (factoryProgram ? mapFactoryProgramToTableItem(factoryProgram) : null),
    [factoryProgram],
  );

  const listsLoading =
    role === 'FABRICA'
      ? factoryProgramsQuery.isLoading
      : role === 'PLANEACION'
        ? workProgramsQuery.isLoading || planningTrackingQuery.isLoading
        : role === 'LMS'
          ? workProgramsQuery.isLoading
          : productProgramsQuery.isLoading;

  const shouldFetchProjectProgram =
    Boolean(projectId) && !programFromLists && !factoryProgram && !listsLoading;

  const projectProgramQuery = useProjectOperationalProgramQuery(
    projectId,
    shouldFetchProjectProgram,
  );

  const institutionalProgram =
    programFromLists ?? projectProgramQuery.data ?? mappedFactoryProgram ?? null;

  const displayProgram = institutionalProgram;

  const requestOwnerName = useMemo(() => {
    return (
      displayProgram?.productOwnerName ??
      projects.find((project) => project.id === projectId)?.productOwner ??
      null
    );
  }, [displayProgram?.productOwnerName, projects, projectId]);

  const planningRadicationReview =
    role === 'PLANEACION' && Boolean(projectId);

  const radicationReadinessQuery = useQuery({
    queryKey: projectRadicationKeys.readiness(projectId ?? ''),
    queryFn: () => projectRadicationApi.getReadiness(projectId!),
    enabled: planningRadicationReview && Boolean(projectId),
  });

  const isPlanningRadicationReview =
    radicationReadinessQuery.data?.projectInstitutionalState === 'PENDING_PLANNING_RADICATION_CHECK';

  const isInstitutionalFinalized =
    radicationReadinessQuery.data?.projectInstitutionalState === 'FINALIZED';

  const isLoading =
    (listsLoading && !displayProgram) ||
    (shouldFetchProjectProgram && projectProgramQuery.isLoading && !displayProgram);

  const loadError =
    !isLoading && !displayProgram && projectProgramQuery.isError
      ? 'No se pudo cargar el centro operacional del programa.'
      : null;

  const backTarget = state.from ?? roleHome;

  const programTurnContext = useMemo(
    () => (displayProgram ? resolveProgramTurnContext(displayProgram, role) : null),
    [displayProgram, role],
  );

  const semestersWithOpenObservations = useMemo((): FactoryObservationSemesterRef[] => {
    if (!displayProgram) return [];
    return displayProgram.semesters
      .filter((semester) => (semester.openObservations ?? 0) > 0 && semester.semesterId)
      .map((semester) => ({
        semesterId: semester.semesterId!,
        semesterNumber: semester.semesterNumber,
        semesterLabel: semester.subjectName,
        count: semester.openObservations ?? 0,
      }));
  }, [displayProgram]);

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-6">
      <ContextBackLink fallback={backTarget} className={backLinkClassName}>
        <ArrowLeft className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Volver a bandeja
      </ContextBackLink>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : !displayProgram ? (
        <Card className="p-8 text-center">
          <p className="text-sm font-semibold text-slate-900">Programa no encontrado en bandeja activa</p>
          <p className="mt-2 text-sm text-slate-500">
            {loadError ??
              'El programa puede haber salido de su cola operacional o no estar asignado a su rol.'}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <Link
              to={roleHome}
              className="inline-flex rounded-xl border border-slate-200/80 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Ir al dashboard
            </Link>
          </div>
        </Card>
      ) : (
        <>
          <div className="space-y-2">
            <PageHeader
              eyebrow={displayProgram.school}
              title={displayProgram.program}
              description="Centro operacional del programa. Revisa el avance macro y entra al detalle de cada semestre."
            />
            <RequestProductOwnerMeta name={requestOwnerName} />
          </div>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Avance macro" value={formatProgramProgress(displayProgram)} />
            <MetricCard
              label="Revisión académica"
              value={`${displayProgram.academicReviewPendingCount} sem.`}
            />
            {role === 'FABRICA' ? (
              <FactoryObservationsMetricHighlight count={displayProgram.openObservations} />
            ) : (
              <MetricCard label="Observaciones abiertas" value={String(displayProgram.openObservations)} />
            )}
            <MetricCard
              label="Plazo más próximo"
              value={displayProgram.nearestDueDate ? formatDate(displayProgram.nearestDueDate) : '—'}
            />
          </section>

          {role === 'FABRICA' && displayProgram.openObservations > 0 ? (
            <FactoryObservationsProgramAlert
              totalCount={displayProgram.openObservations}
              semesters={semestersWithOpenObservations}
              projectId={displayProgram.projectId}
            />
          ) : null}

          {isInstitutionalFinalized && projectId ? (
            <ProjectInstitutionalClosurePanel projectId={projectId} />
          ) : null}

          {isPlanningRadicationReview && projectId ? (
            <PlanningProjectRadicationReviewPanel projectId={projectId} />
          ) : null}

          {role === 'PRODUCT' && projectId && !isPlanningRadicationReview && !isInstitutionalFinalized ? (
            <ProjectRadicationBanner
              projectId={projectId}
              macroProgress={{
                completedSemesters: displayProgram.completedSemesters,
                totalSemesters: displayProgram.totalSemesters,
                completedSubjects: displayProgram.completedSubjects,
                totalSubjects: displayProgram.totalSubjects,
              }}
            />
          ) : null}

          <Card className="space-y-3 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Estado macro</p>
                  <div className="mt-2">
                    <ProgramActiveStageBadge stages={displayProgram.activeStageSummary} />
                  </div>
                </div>
                {programTurnContext ? (
                  <OperationalTurnIndicator
                    operationalState={programTurnContext.operationalState}
                    responsibleRole={programTurnContext.responsibleRole}
                    viewerRole={role}
                    variant="card"
                  />
                ) : null}
              </div>
              <SlaBadgeV2 status={displayProgram.slaStatus as SlaStatusV2} />
            </div>
          </Card>

          {!isInstitutionalFinalized ? (
          <Card className="overflow-hidden p-0">
            <div className="border-b border-slate-200/60 px-5 py-3.5 sm:px-6">
              <h2 className="text-sm font-semibold text-slate-900">Semestres del programa</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {isPlanningRadicationReview
                  ? 'Resumen del alcance. El cierre se valida en el panel superior.'
                  : 'Cada semestre mantiene su flujo operacional independiente.'}
              </p>
            </div>
            <div className="divide-y divide-slate-100">
              {displayProgram.semesters.map((semester) => {
                const semesterOpenObs = semester.openObservations ?? 0;
                const hasOpenObservations = role === 'FABRICA' && semesterOpenObs > 0;
                return (
                <div
                  key={semester.semesterId ?? semester.subjectId}
                  className={cn(
                    'flex flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-6',
                    hasOpenObservations && 'bg-slate-50/80',
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900">{semester.subjectName}</p>
                      {role === 'FABRICA' && (semester.openObservations ?? 0) > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          {semester.openObservations} obs.
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatSemesterSubjectProgress({
                        operationalState: semester.operationalState as InstitutionalOperationalState,
                        subjectsTotal: semester.subjectsTotal ?? 0,
                        subjectsReady: semester.subjectsReady ?? 0,
                        subjectsApproved: semester.subjectsApproved,
                      })}
                    </p>
                    <div className="mt-2 space-y-2">
                      <OperationalTurnIndicator
                        operationalState={semester.operationalState as InstitutionalOperationalState}
                        responsibleRole={semester.currentResponsibleRole as Role}
                        viewerRole={role}
                        variant="compact"
                      />
                      {semester.stageDueAt ? (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                          <CalendarDays className="h-3.5 w-3.5" />
                          Plazo: {formatDate(semester.stageDueAt)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  {!isPlanningRadicationReview && semester.semesterId ? (
                    <Link
                      to={
                        hasOpenObservations
                          ? semesterHubPath(displayProgram.projectId, semester.semesterNumber)
                          : role === 'PRODUCT'
                            ? productSemesterOperationsPath(displayProgram.projectId, semester.semesterNumber)
                            : semesterOperationsPath(displayProgram.projectId, semester.semesterId)
                      }
                      state={
                        hasOpenObservations
                          ? { from: location.pathname, focusObservations: true }
                          : { from: location.pathname }
                      }
                      className={cn(
                        'inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-semibold transition-colors',
                        hasOpenObservations
                          ? 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                          : 'border-slate-200/80 bg-white text-slate-700 hover:bg-slate-50',
                      )}
                    >
                      {hasOpenObservations ? 'Ver semestre' : 'Ir al semestre'}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  ) : null}
                </div>
              );
              })}
            </div>
          </Card>
          ) : null}
        </>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </Card>
  );
}
