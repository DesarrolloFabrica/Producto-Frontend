import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '../../services/projectsApi';
import type { OperationalWorkspaceDto } from '../../services/institutionalWorkflowApi';
import type { ApiProjectDetail, ApiProjectListItem, ApiSubjectDetail, ApiSubjectSummary } from '../../services/types/projectsApi.types';
import type { ApiSubjectWorkspace } from '../../services/subjectsApi';
import { isLightSubjectWorkspace, mapProjectDetailFromApi } from '../operations/apiMappers';
import { markFactoryQueriesStale } from './factoryQueryUtils';
import { invalidateSemesterWorkflowQueries } from './invalidateSemesterWorkflowQueries';
import { queryKeys } from './queryKeys';

type ProductionStatusInput = 'PENDIENTE' | 'EN_PRODUCCION' | 'COMPLETADA';

function optimisticSubjectStatus(
  status: ProductionStatusInput,
  institutional = false,
): ApiSubjectDetail['status'] {
  if (status === 'EN_PRODUCCION') return 'IN_PRODUCTION';
  if (status === 'COMPLETADA') return institutional ? 'IN_PRODUCTION' : 'IN_REVIEW';
  return 'PENDING';
}

function updateSubjectForProductionStatus(
  subject: ApiSubjectDetail,
  status: ProductionStatusInput,
  institutional = false,
): ApiSubjectDetail {
  const nextStatus = optimisticSubjectStatus(status, institutional);
  const completedAt =
    status === 'COMPLETADA' ? new Date().toISOString() : subject.factoryProductionCompletedAt ?? null;
  return {
    ...subject,
    status: nextStatus,
    progress: status === 'PENDIENTE' ? 0 : status === 'EN_PRODUCCION' ? Math.max(subject.progress, 50) : 100,
    factoryProductionStatus:
      status === 'COMPLETADA'
        ? 'COMPLETED'
        : status === 'EN_PRODUCCION'
          ? 'IN_PROGRESS'
          : subject.factoryProductionStatus ?? 'NOT_STARTED',
    factoryProductionCompletedAt: completedAt,
    checklist: subject.checklist.map((item) => {
      if (item.ownerRole !== 'FABRICA' || item.status === 'APROBADO') return item;
      if (status === 'EN_PRODUCCION') return { ...item, status: 'EN_PRODUCCION' };
      if (status === 'COMPLETADA') return { ...item, status: 'ENTREGADO' };
      return item;
    }),
    topics: subject.topics.map((topic) => ({
      ...topic,
      checklist: topic.checklist.map((item) => {
        if (item.ownerRole !== 'FABRICA' || item.status === 'APROBADO') return item;
        if (status === 'EN_PRODUCCION') return { ...item, status: 'EN_PRODUCCION' };
        if (status === 'COMPLETADA') return { ...item, status: 'ENTREGADO' };
        return item;
      }),
    })),
  };
}

function findSubjectInProject(project: ApiProjectDetail, subjectId: string) {
  for (const semester of project.semesters) {
    const subject = semester.subjects.find((item) => item.id === subjectId);
    if (subject) return { semester, subject };
  }
  return null;
}

function projectToListItem(project: ApiProjectDetail, previous?: ApiProjectListItem): ApiProjectListItem {
  return {
    id: project.id,
    school: project.school,
    program: project.program,
    modality: project.modality,
    requestType: project.requestType,
    priority: project.priority,
    status: project.status,
    progress: project.progress,
    expectedDeliveryDate: project.expectedDeliveryDate,
    productOwner: project.productOwner,
    factoryOwner: project.factoryOwner,
    createdAt: project.createdAt,
    subjectsSummary: previous?.subjectsSummary,
  };
}

function subjectToSummary(subject: ApiSubjectDetail, semesterNumber: number): ApiSubjectSummary {
  return {
    id: subject.id,
    name: subject.name,
    status: subject.status,
    operationalState: subject.operationalState,
    semesterNumber,
    expectedDeliveryDate: subject.expectedDeliveryDate,
    progress: subject.progress,
    factoryProductionStatus: subject.factoryProductionStatus,
    factoryProductionCompletedAt: subject.factoryProductionCompletedAt,
    openObservationsCount: subject.openObservationsCount ?? 0,
    correctionSentCount: subject.correctionSentCount ?? 0,
    updatedAt: subject.updatedAt,
    createdFromChange: subject.createdFromChange,
  };
}

function reconcileProjectsList(
  current: ApiProjectListItem[] | undefined,
  project: ApiProjectDetail,
  subjectId: string,
): ApiProjectListItem[] | undefined {
  if (!current) return current;
  const match = findSubjectInProject(project, subjectId);
  return current.map((item) => {
    if (item.id !== project.id) return item;
    const next = projectToListItem(project, item);
    if (match) {
      const summary = subjectToSummary(match.subject, match.semester.semesterNumber);
      next.subjectsSummary = item.subjectsSummary?.some((subject) => subject.id === subjectId)
        ? item.subjectsSummary.map((subject) => (subject.id === subjectId ? summary : subject))
        : [...(item.subjectsSummary ?? []), summary];
    }
    return next;
  });
}

function reconcileWorkspaceWithProject(
  current: ApiSubjectWorkspace | undefined,
  project: ApiProjectDetail,
  subjectId: string,
): ApiSubjectWorkspace | undefined {
  if (!current) return current;
  const match = findSubjectInProject(project, subjectId);
  if (!match) return current;

  if (!isLightSubjectWorkspace(current)) {
    return { ...current, project };
  }

  return {
    ...current,
    projectMeta: projectToListItem(project),
    semesterMeta: {
      id: match.semester.id,
      semesterNumber: match.semester.semesterNumber,
      status: match.semester.status,
      createdFromChange: match.semester.createdFromChange,
      factoryExpectedDate: match.semester.factoryExpectedDate,
      continuationDate: match.semester.continuationDate,
      createdAt: match.semester.createdAt,
      updatedAt: match.semester.updatedAt,
    },
    subject: match.subject,
  };
}

function optimisticWorkspace(
  current: ApiSubjectWorkspace | undefined,
  subjectId: string,
  status: ProductionStatusInput,
  institutional = false,
): ApiSubjectWorkspace | undefined {
  if (!current) return current;
  if (isLightSubjectWorkspace(current)) {
    return {
      ...current,
      subject: updateSubjectForProductionStatus(current.subject, status, institutional),
    };
  }
  return {
    ...current,
    project: {
      ...current.project,
      semesters: current.project.semesters.map((semester) => ({
        ...semester,
        subjects: semester.subjects.map((subject) =>
          subject.id === subjectId ? updateSubjectForProductionStatus(subject, status, institutional) : subject,
        ),
      })),
    },
  };
}

function optimisticProjectsList(
  current: ApiProjectListItem[] | undefined,
  projectId: string,
  subjectId: string,
  status: ProductionStatusInput,
  institutional = false,
): ApiProjectListItem[] | undefined {
  if (!current) return current;
  const nextStatus = optimisticSubjectStatus(status, institutional);
  return current.map((project) => {
    if (project.id !== projectId || !project.subjectsSummary) return project;
    return {
      ...project,
      subjectsSummary: project.subjectsSummary.map((subject) =>
        subject.id === subjectId
          ? {
              ...subject,
              status: nextStatus,
              progress: status === 'PENDIENTE' ? 0 : status === 'EN_PRODUCCION' ? Math.max(subject.progress, 50) : 100,
              factoryProductionStatus:
                status === 'COMPLETADA'
                  ? 'COMPLETED'
                  : status === 'EN_PRODUCCION'
                    ? 'IN_PROGRESS'
                    : subject.factoryProductionStatus,
              factoryProductionCompletedAt:
                status === 'COMPLETADA' ? new Date().toISOString() : subject.factoryProductionCompletedAt,
            }
          : subject,
      ),
    };
  });
}

function optimisticOperationalWorkspace(
  current: OperationalWorkspaceDto | undefined,
  _status: ProductionStatusInput,
): OperationalWorkspaceDto | undefined {
  if (!current?.institutionalFlowActive) return current;
  return current;
}

export function useUpdateSubjectProductionStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      subjectId: string;
      projectId: string;
      semesterId?: string;
      status: ProductionStatusInput;
    }) => {
      const { subjectsApi } = await import('../../services/subjectsApi');
      return subjectsApi.updateProductionStatus(input.subjectId, input.status);
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.subjectWorkspace(variables.subjectId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.projects() });
      await queryClient.cancelQueries({ queryKey: queryKeys.project(variables.projectId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.operationalWorkspace(variables.subjectId) });

      const previousWorkspace = queryClient.getQueryData<ApiSubjectWorkspace>(queryKeys.subjectWorkspace(variables.subjectId));
      const previousProjects = queryClient.getQueryData<ApiProjectListItem[]>(queryKeys.projects());
      const previousProject = queryClient.getQueryData<ApiProjectDetail>(queryKeys.project(variables.projectId));
      const previousOperationalWorkspace = queryClient.getQueryData<OperationalWorkspaceDto>(
        queryKeys.operationalWorkspace(variables.subjectId),
      );
      const institutionalFlow = previousOperationalWorkspace?.institutionalFlowActive === true;

      queryClient.setQueryData<OperationalWorkspaceDto>(
        queryKeys.operationalWorkspace(variables.subjectId),
        (current) => optimisticOperationalWorkspace(current, variables.status),
      );

      queryClient.setQueryData<ApiSubjectWorkspace>(
        queryKeys.subjectWorkspace(variables.subjectId),
        (current) => optimisticWorkspace(current, variables.subjectId, variables.status, institutionalFlow),
      );
      queryClient.setQueryData<ApiProjectListItem[]>(
        queryKeys.projects(),
        (current) =>
          optimisticProjectsList(
            current,
            variables.projectId,
            variables.subjectId,
            variables.status,
            institutionalFlow,
          ),
      );
      queryClient.setQueryData<ApiProjectDetail>(queryKeys.project(variables.projectId), (current) => {
        if (!current) return current;
        return {
          ...current,
          semesters: current.semesters.map((semester) => ({
            ...semester,
            subjects: semester.subjects.map((subject) =>
              subject.id === variables.subjectId
                ? updateSubjectForProductionStatus(subject, variables.status, institutionalFlow)
                : subject,
            ),
          })),
        };
      });

      return { previousWorkspace, previousProjects, previousProject, previousOperationalWorkspace };
    },
    onError: (_error, variables, context) => {
      queryClient.setQueryData(queryKeys.subjectWorkspace(variables.subjectId), context?.previousWorkspace);
      queryClient.setQueryData(queryKeys.projects(), context?.previousProjects);
      queryClient.setQueryData(queryKeys.project(variables.projectId), context?.previousProject);
      queryClient.setQueryData(
        queryKeys.operationalWorkspace(variables.subjectId),
        context?.previousOperationalWorkspace,
      );
    },
    onSuccess: async (project, variables) => {
      queryClient.setQueryData(queryKeys.project(project.id), project);
      queryClient.setQueryData<ApiSubjectWorkspace>(
        queryKeys.subjectWorkspace(variables.subjectId),
        (current) => reconcileWorkspaceWithProject(current, project, variables.subjectId),
      );
      queryClient.setQueryData<ApiProjectListItem[]>(
        queryKeys.projects(),
        (current) => reconcileProjectsList(current, project, variables.subjectId),
      );
      void queryClient.invalidateQueries({ queryKey: queryKeys.notificationsSummary(), refetchType: 'none' });
      await queryClient.refetchQueries({ queryKey: queryKeys.subjectWorkspace(variables.subjectId) });
      invalidateSemesterWorkflowQueries(queryClient, {
        semesterId: variables.semesterId,
        projectId: variables.projectId,
        subjectId: variables.subjectId,
        role: 'FABRICA',
      });
      markFactoryQueriesStale(queryClient);
    },
  });
}

export function useApplyProjectDetailMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => projectsApi.getProjectById(projectId),
    onSuccess: (project) => {
      queryClient.setQueryData(queryKeys.project(project.id), project);
      queryClient.setQueryData(queryKeys.projects(), (current: unknown) => current);
    },
  });
}

export { mapProjectDetailFromApi };
