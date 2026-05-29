import { Navigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { projectRadicationApi } from '../../services/projectRadicationApi';
import { projectRadicationKeys } from '../project-radication/ProjectRadicationPanel';
import { useAuth } from '../auth/AuthContext';
import { ContextBackLink } from '../../navigation/ContextBackLink';
import { homePathForRole } from '../../navigation/roleNavigation';
import { OperationalStateBadgeV2 } from '../operations-v2/components/OperationalStateBadgeV2';
import { SlaBadgeV2 } from '../operations-v2/components/SlaBadgeV2';
import { Skeleton, SkeletonKpiGrid } from '../../components/ui/Skeleton';
import { cn, surface } from '../../components/ui/tokens';
import { semesterHubPath } from './institutionalNavigation';
import { useSemesterOperationalWorkspaceQuery } from '../queries/useSemesterOperationalWorkspaceQuery';
import { SemesterOperationsWorkspace } from './SemesterOperationsWorkspace';
import type { SlaStatusV2 } from '../../types/operationalWorkflow';

export function SemesterOperationsPage() {
  const { projectId, semesterId } = useParams<{ projectId: string; semesterId: string }>();
  const { role } = useAuth();
  const roleHome = homePathForRole(role);
  const workspaceQuery = useSemesterOperationalWorkspaceQuery(semesterId);
  const workspace = workspaceQuery.data;

  const projectRadicationReadinessQuery = useQuery({
    queryKey: projectRadicationKeys.readiness(projectId ?? ''),
    queryFn: () => projectRadicationApi.getReadiness(projectId!),
    enabled: Boolean(projectId) && role === 'PLANEACION',
  });

  if (
    projectId &&
    role === 'PLANEACION' &&
    projectRadicationReadinessQuery.data?.projectInstitutionalState === 'PENDING_PLANNING_RADICATION_CHECK'
  ) {
    return <Navigate to={`/projects/${projectId}/operations`} replace />;
  }

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
        <ContextBackLink
          fallback={roleHome}
          className="mt-4 inline-flex rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
        >
          Volver a mi bandeja
        </ContextBackLink>
      </div>
    );
  }

  if (role === 'PRODUCT' || role === 'FABRICA') {
    return (
      <Navigate
        to={semesterHubPath(workspace.projectId, workspace.semesterNumber, 'operaciones')}
        replace
      />
    );
  }

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
            <ContextBackLink
              fallback={roleHome}
              className="mt-0.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-100 hover:text-slate-800"
            >
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

        <SemesterOperationsWorkspace semesterId={semesterId!} showSubjectsTable showTopStatus={false} />
      </div>
    </div>
  );
}
