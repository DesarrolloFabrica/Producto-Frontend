import type {
  OperationalObservation,
  ProjectStatus,
  SubjectStatus,
  VirtualizationProject,
} from '../../types/domain';
import { getProjectSubjects, normalizeSubjectOperationalState } from './subjectOperationalState';

export type ProductProjectBucket =
  | 'NEEDS_REVIEW'
  | 'FULLY_APPROVED'
  | 'IN_FACTORY_PRODUCTION'
  | 'OTHER_ACTIVE';

export interface ProductProjectInsight {
  project: VirtualizationProject;
  bucket: ProductProjectBucket;
  subjectsPendingReview: number;
  subjectsApproved: number;
  totalSubjects: number;
  reviewLabel: string;
  actionRoute: string;
  actionLabel: string;
  displayStatus: SubjectStatus | ProjectStatus;
  isFullyApproved: boolean;
  statusLabel: string;
}

export function analyzeProductProject(
  project: VirtualizationProject,
  observations: OperationalObservation[] = [],
): ProductProjectInsight {
  const subjects = getProjectSubjects(project);
  const projectObs = observations.filter((o) => o.projectId === project.id);
  const totalSubjects = subjects.length;

  const pendingReviewSubjects = subjects.filter((subject) => {
    const state = normalizeSubjectOperationalState({
      subject,
      observations: projectObs,
      projectStatus: project.status,
    });
    return state === 'IN_REVIEW' || state === 'CORRECTION_SENT';
  });

  const approvedSubjects = subjects.filter((subject) => {
    const state = normalizeSubjectOperationalState({
      subject,
      observations: projectObs,
      projectStatus: project.status,
    });
    return state === 'APPROVED';
  });

  const factoryActiveSubjects = subjects.filter((subject) => {
    const state = normalizeSubjectOperationalState({
      subject,
      observations: projectObs,
      projectStatus: project.status,
    });
    return (
      state === 'NOT_STARTED' ||
      state === 'IN_PRODUCTION' ||
      state === 'CHANGES_REQUESTED'
    );
  });

  const isFullyApproved = totalSubjects > 0 && approvedSubjects.length === totalSubjects;

  let bucket: ProductProjectBucket = 'OTHER_ACTIVE';

  if (totalSubjects > 0 && approvedSubjects.length === totalSubjects) {
    bucket = 'FULLY_APPROVED';
  } else if (
    pendingReviewSubjects.length > 0 ||
    project.status === 'FEEDBACK_PENDING'
  ) {
    bucket = 'NEEDS_REVIEW';
  } else if (
    factoryActiveSubjects.length > 0 ||
    project.status === 'READY_FOR_PRODUCTION' ||
    project.status === 'IN_PRODUCTION'
  ) {
    bucket = 'IN_FACTORY_PRODUCTION';
  } else if (!totalSubjects && project.status === 'IN_REVIEW') {
    // Cuando aun no hay materias pero el proyecto esta en revision.
    bucket = 'NEEDS_REVIEW';
  }

  const reviewLabel =
    bucket === 'FULLY_APPROVED'
      ? 'Todas las materias aprobadas'
      : pendingReviewSubjects.length > 0
        ? `${pendingReviewSubjects.length} materia${pendingReviewSubjects.length !== 1 ? 's' : ''} por revisar`
        : project.status === 'FEEDBACK_PENDING'
          ? 'Feedback pendiente'
          : factoryActiveSubjects.length > 0
            ? `${factoryActiveSubjects.length} en producción Fábrica`
            : projectStatusFallbackLabel(project.status);

  const actionRoute =
    bucket === 'FULLY_APPROVED' ? `/projects/${project.id}` : `/projects/${project.id}`;

  const actionLabel =
    bucket === 'FULLY_APPROVED' ? 'Ver completado' : 'Revisar solicitud';

  const statusLabel = isFullyApproved
    ? 'Completada'
    : bucket === 'NEEDS_REVIEW'
      ? 'Pendiente de revisión'
      : projectStatusFallbackLabel(project.status);

  return {
    project,
    bucket,
    subjectsPendingReview: pendingReviewSubjects.length,
    subjectsApproved: approvedSubjects.length,
    totalSubjects,
    reviewLabel,
    actionRoute,
    actionLabel,
    displayStatus: isFullyApproved ? 'APPROVED' : project.status,
    isFullyApproved,
    statusLabel,
  };
}

function projectStatusFallbackLabel(status: VirtualizationProject['status']): string {
  switch (status) {
    case 'IN_REVIEW':
      return 'En revisión';
    case 'READY_FOR_PRODUCTION':
      return 'Lista para producción';
    case 'IN_PRODUCTION':
      return 'En producción';
    case 'FEEDBACK_PENDING':
      return 'Feedback pendiente';
    default:
      return status;
  }
}

export function analyzeProductProjects(
  projects: VirtualizationProject[],
  observations: OperationalObservation[] = [],
) {
  const insights = projects
    .filter((p) => !['CLOSED', 'DELIVERED_TO_LMS'].includes(p.status))
    .map((p) => analyzeProductProject(p, observations));

  return {
    needsReview: insights.filter((i) => i.bucket === 'NEEDS_REVIEW'),
    fullyApproved: insights.filter((i) => i.bucket === 'FULLY_APPROVED'),
    inFactoryProduction: insights.filter((i) => i.bucket === 'IN_FACTORY_PRODUCTION'),
    otherActive: insights.filter((i) => i.bucket === 'OTHER_ACTIVE'),
    insights,
  };
}

export function getRecentlyCompletedProjects(
  projects: VirtualizationProject[],
  observations: OperationalObservation[] = [],
  limit = 5,
): ProductProjectInsight[] {
  return projects
    .map((p) => analyzeProductProject(p, observations))
    .filter((i) => i.bucket === 'FULLY_APPROVED')
    .sort((a, b) => {
      const aDate = a.project.subjectsSummary?.[0]?.updatedAt ?? a.project.createdAt;
      const bDate = b.project.subjectsSummary?.[0]?.updatedAt ?? b.project.createdAt;
      return bDate.localeCompare(aDate);
    })
    .slice(0, limit);
}
