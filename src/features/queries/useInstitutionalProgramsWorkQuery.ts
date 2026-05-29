import { useQuery } from '@tanstack/react-query';
import type { Role } from '../../types/domain';
import { institutionalWorkflowApi } from '../../services/institutionalWorkflowApi';
import { queryKeys } from './queryKeys';

function programsQueryKey(role: Role | null) {
  if (role === 'PLANEACION') return queryKeys.institutionalWork.planningPrograms();
  if (role === 'LMS') return queryKeys.institutionalWork.lmsPrograms();
  if (role === 'FABRICA') return queryKeys.institutionalWork.factoryPrograms();
  if (role === 'PRODUCT') return queryKeys.institutionalWork.productPrograms();
  return ['institutional-work', 'programs', role ?? 'unknown'] as const;
}

async function fetchInstitutionalProgramsWork(role: Role | null) {
  if (role === 'PLANEACION') return institutionalWorkflowApi.planningWorkPrograms();
  if (role === 'LMS') return institutionalWorkflowApi.lmsWorkPrograms();
  if (role === 'FABRICA') return institutionalWorkflowApi.factoryProgramsWork();
  if (role === 'PRODUCT') return institutionalWorkflowApi.productProgramsWork();
  return [];
}

export function useInstitutionalProgramsWorkQuery(role: Role | null, enabled = true) {
  return useQuery({
    queryKey: programsQueryKey(role),
    queryFn: () => fetchInstitutionalProgramsWork(role),
    enabled: Boolean(role) && enabled,
    staleTime: 15_000,
  });
}

export function usePlanningTrackingProgramsQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.planning.trackingPrograms(),
    queryFn: () => institutionalWorkflowApi.planningTrackingPrograms(),
    enabled,
    staleTime: 15_000,
  });
}

export function useProductProgramsTrackingQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.institutionalWork.productTrackingPrograms(),
    queryFn: () => institutionalWorkflowApi.productTrackingPrograms(),
    enabled,
    staleTime: 15_000,
  });
}

export function useProjectOperationalProgramQuery(projectId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: queryKeys.institutionalWork.projectProgram(projectId ?? ''),
    queryFn: () => institutionalWorkflowApi.getProjectOperationalProgram(projectId!),
    enabled: Boolean(projectId) && enabled,
    staleTime: 15_000,
    retry: 1,
  });
}
