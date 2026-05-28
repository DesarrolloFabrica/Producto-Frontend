import { ArrowLeft, ArrowRight, CalendarDays } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useMemo } from 'react';
import { ContextBackLink } from '../../navigation/ContextBackLink';
import { homePathForRole } from '../../navigation/roleNavigation';
import { useAuth } from '../auth/AuthContext';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatDate } from '../../utils/formatters';
import type { ProgramOperationalWorkItemDto } from '../../services/institutionalWorkflowApi';
import {
  formatProgramProgress,
  institutionalStateLabel,
} from './institutionalCopy';
import { semesterOperationsPath } from './institutionalNavigation';
import { ProgramActiveStageBadge } from '../operations-v2/components/ProgramActiveStageBadge';
import { OperationalStateBadgeV2 } from '../operations-v2/components/OperationalStateBadgeV2';
import { SlaBadgeV2 } from '../operations-v2/components/SlaBadgeV2';
import { useFactoryProgramsQuery } from '../queries/useFactoryProgramsQuery';
import type { FactoryProgramWorkItem } from '../queries/useFactoryProgramsQuery';
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
  if (role === 'PLANEACION' || role === 'ADMIN') return 'PLANEACION';
  if (role === 'LMS') return 'LMS';
  if (role === 'FABRICA') return 'FABRICA';
  if (role === 'PRODUCT') return 'PRODUCT';
  return null;
}

export function ProjectProgramOperationsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const location = useLocation();
  const { role } = useAuth();
  const roleHome = homePathForRole(role);
  const state = (location.state ?? {}) as LocationState;

  const programsRole = roleProgramsQueryRole(role);
  const workProgramsQuery = useInstitutionalProgramsWorkQuery(
    programsRole,
    Boolean(programsRole) && role !== 'FABRICA',
  );
  const planningTrackingQuery = usePlanningTrackingProgramsQuery(
    role === 'PLANEACION' || role === 'ADMIN',
  );
  const productProgramsQuery = useInstitutionalProgramsWorkQuery(
    'PRODUCT',
    role === 'PRODUCT' || role === 'ADMIN',
  );

  const factoryProgramsQuery = useFactoryProgramsQuery(
    { page: 1, limit: 100, projectId },
    Boolean(projectId) && (role === 'FABRICA' || role === 'ADMIN'),
  );

  const programFromLists = useMemo(() => {
    if (state.programWorkItem && state.programWorkItem.projectId === projectId) {
      return state.programWorkItem;
    }
    if (role === 'PLANEACION' || role === 'ADMIN') {
      return findProgramInList(
        [workProgramsQuery.data, planningTrackingQuery.data, productProgramsQuery.data],
        projectId,
      );
    }
    if (role === 'LMS') {
      return findProgramInList([workProgramsQuery.data], projectId);
    }
    if (role === 'PRODUCT') {
      return findProgramInList([productProgramsQuery.data], projectId);
    }
    return null;
  }, [
    state.programWorkItem,
    projectId,
    role,
    workProgramsQuery.data,
    planningTrackingQuery.data,
    productProgramsQuery.data,
  ]);

  const factoryProgram = useMemo((): FactoryProgramWorkItem | null => {
    if (!projectId) return null;
    return (factoryProgramsQuery.data?.items ?? []).find((p) => p.projectId === projectId) ?? null;
  }, [factoryProgramsQuery.data, projectId]);

  const listsLoading =
    role === 'FABRICA'
      ? factoryProgramsQuery.isLoading
      : role === 'PLANEACION' || role === 'ADMIN'
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
    programFromLists ?? projectProgramQuery.data ?? null;

  const displayProgram = useMemo(() => {
    if (institutionalProgram) return { kind: 'institutional' as const, data: institutionalProgram };
    if (factoryProgram) return { kind: 'factory' as const, data: factoryProgram };
    return null;
  }, [institutionalProgram, factoryProgram]);

  const planningRadicationReview =
    (role === 'PLANEACION' || role === 'ADMIN') && Boolean(projectId);

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
          <Link
            to={roleHome}
            className="mt-4 inline-flex rounded-xl border border-slate-200/80 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Ir al dashboard
          </Link>
        </Card>
      ) : displayProgram.kind === 'institutional' ? (
        <>
          <PageHeader
            eyebrow={displayProgram.data.school}
            title={displayProgram.data.program}
            description="Centro operacional del programa. Revisa el avance macro y entra al detalle de cada semestre."
          />

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Avance macro" value={formatProgramProgress(displayProgram.data)} />
            <MetricCard
              label="Revisión académica"
              value={`${displayProgram.data.academicReviewPendingCount} sem.`}
            />
            <MetricCard label="Observaciones abiertas" value={String(displayProgram.data.openObservations)} />
            <MetricCard
              label="Plazo más próximo"
              value={displayProgram.data.nearestDueDate ? formatDate(displayProgram.data.nearestDueDate) : '—'}
            />
          </section>

          {isInstitutionalFinalized && projectId ? (
            <ProjectInstitutionalClosurePanel projectId={projectId} />
          ) : null}

          {isPlanningRadicationReview && projectId ? (
            <PlanningProjectRadicationReviewPanel projectId={projectId} />
          ) : null}

          {(role === 'PRODUCT' || role === 'ADMIN') && projectId && !isPlanningRadicationReview && !isInstitutionalFinalized ? (
            <ProjectRadicationBanner
              projectId={projectId}
              macroProgress={{
                completedSemesters: displayProgram.data.completedSemesters,
                totalSemesters: displayProgram.data.totalSemesters,
                completedSubjects: displayProgram.data.completedSubjects,
                totalSubjects: displayProgram.data.totalSubjects,
              }}
            />
          ) : null}

          <Card className="space-y-3 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Estado macro</p>
                <div className="mt-2">
                  <ProgramActiveStageBadge stages={displayProgram.data.activeStageSummary} />
                </div>
              </div>
              <SlaBadgeV2 status={displayProgram.data.slaStatus as SlaStatusV2} />
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
              {displayProgram.data.semesters.map((semester) => (
                <div
                  key={semester.semesterId ?? semester.subjectId}
                  className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-6"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{semester.subjectName}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {semester.subjectsReady ?? 0}/{semester.subjectsTotal ?? 0} producidas
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <OperationalStateBadgeV2
                        state={semester.operationalState as InstitutionalOperationalState}
                      />
                      {semester.stageDueAt ? (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {formatDate(semester.stageDueAt)}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {institutionalStateLabel(semester.operationalState)}
                    </p>
                  </div>
                  {!isPlanningRadicationReview && semester.semesterId ? (
                    <Link
                      to={semesterOperationsPath(displayProgram.data.projectId, semester.semesterId)}
                      state={{ from: location.pathname }}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Ir al semestre
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  ) : null}
                </div>
              ))}
            </div>
          </Card>
          ) : null}
        </>
      ) : (
        <>
          <PageHeader
            eyebrow={displayProgram.data.school}
            title={displayProgram.data.program}
            description="Centro operacional del programa. Revisa el avance macro y entra al detalle de cada semestre."
          />

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Avance macro" value={formatProgramProgress(displayProgram.data)} />
            <MetricCard label="Semestres" value={`${displayProgram.data.totalSemesters}`} />
            <MetricCard label="Observaciones abiertas" value={String(displayProgram.data.openObservations)} />
            <MetricCard
              label="Plazo más próximo"
              value={displayProgram.data.nearestDueDate ? formatDate(displayProgram.data.nearestDueDate) : '—'}
            />
          </section>

          <Card className="space-y-3 p-5">
            <ProgramActiveStageBadge stages={displayProgram.data.activeStageSummary} />
          </Card>

          <Card className="overflow-hidden p-0">
            <div className="border-b border-slate-200/60 px-5 py-3.5 sm:px-6">
              <h2 className="text-sm font-semibold text-slate-900">Semestres del programa</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {displayProgram.data.semesters.map((semester) => (
                <div
                  key={semester.semesterId ?? semester.subjectId}
                  className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-6"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{semester.subjectName}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {semester.subjectsReady ?? 0}/{semester.subjectsTotal ?? 0} producidas
                    </p>
                  </div>
                  <Link
                    to={semester.actionUrl}
                    state={{ from: location.pathname }}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Ir al semestre
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </Card>
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
