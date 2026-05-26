import { useQuery } from '@tanstack/react-query';
import type { Role } from '../../types/domain';
import { institutionalWorkflowApi } from '../../services/institutionalWorkflowApi';
import { queryKeys } from './queryKeys';

function workQueryKey(role: Role | null) {
  if (role === 'PLANEACION') return queryKeys.institutionalWork.planning();
  if (role === 'LMS') return queryKeys.institutionalWork.lms();
  if (role === 'FABRICA') return queryKeys.institutionalWork.factory();
  if (role === 'PRODUCT') return queryKeys.institutionalWork.product();
  return queryKeys.institutionalWork.forRole(role ?? 'unknown');
}

async function fetchInstitutionalWork(role: Role | null) {
  if (role === 'PLANEACION' || role === 'ADMIN') return institutionalWorkflowApi.planningWork();
  if (role === 'LMS') return institutionalWorkflowApi.lmsWork();
  if (role === 'FABRICA') return institutionalWorkflowApi.factoryWork();
  if (role === 'PRODUCT') return institutionalWorkflowApi.productWork();
  return [];
}

export function useInstitutionalWorkQuery(role: Role | null, enabled = true) {
  return useQuery({
    queryKey: workQueryKey(role),
    queryFn: () => fetchInstitutionalWork(role),
    enabled: Boolean(role) && enabled,
    staleTime: 15_000,
  });
}
