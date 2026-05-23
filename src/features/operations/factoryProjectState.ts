import type {
  OperationalObservation,
  ProjectStatus,
  SubjectStatus,
  VirtualizationProject,
} from '../../types/domain';
import {
  getProjectSubjects,
  normalizeSubjectOperationalState,
  type SubjectOperationalState,
} from './subjectOperationalState';

export type FactoryProjectBucket =
  | 'FULLY_APPROVED'
  | 'NEEDS_WORK'
  | 'WAITING_PRODUCT'
  | 'HAS_CORRECTIONS';

export interface FactoryProjectInsight {
  project: VirtualizationProject;
  bucket: FactoryProjectBucket;
  totalSubjects: number;
  approvedCount: number;
  inReviewCount: number;
  needsWorkCount: number;
  correctionsCount: number;
  waitingValidationCount: number;
  statusLabel: string;
  summaryLabel: string;
  actionLabel: string;
  actionRoute: string;
  displayStatus: SubjectStatus | ProjectStatus;
  isFactoryWorkComplete: boolean;
}

function countByState(states: SubjectOperationalState[], target: SubjectOperationalState) {
  return states.filter((s) => s === target).length;
}

export function analyzeFactoryProject(
  project: VirtualizationProject,
  observations: OperationalObservation[] = [],
): FactoryProjectInsight {
  const subjects = getProjectSubjects(project);
  const projectObs = observations.filter((o) => o.projectId === project.id);
  const states = subjects.map((subject) =>
    normalizeSubjectOperationalState({
      subject,
      observations: projectObs,
      projectStatus: project.status,
    }),
  );

  const totalSubjects = subjects.length;
  const approvedCount = countByState(states, 'APPROVED');
  const inReviewCount = countByState(states, 'IN_REVIEW');
  const needsWorkCount =
    countByState(states, 'NOT_STARTED') + countByState(states, 'IN_PRODUCTION');
  const correctionsCount = countByState(states, 'CHANGES_REQUESTED');
  const waitingValidationCount = countByState(states, 'CORRECTION_SENT');
  const isFactoryWorkComplete = totalSubjects > 0 && approvedCount === totalSubjects;

  let bucket: FactoryProjectBucket = 'NEEDS_WORK';
  if (isFactoryWorkComplete) {
    bucket = 'FULLY_APPROVED';
  } else if (correctionsCount > 0) {
    bucket = 'HAS_CORRECTIONS';
  } else if (needsWorkCount > 0) {
    bucket = 'NEEDS_WORK';
  } else if (inReviewCount > 0 || waitingValidationCount > 0) {
    bucket = 'WAITING_PRODUCT';
  } else if (
    !totalSubjects &&
    (project.status === 'IN_REVIEW' || project.status === 'FEEDBACK_PENDING')
  ) {
    bucket = 'WAITING_PRODUCT';
  }

  const statusLabel = isFactoryWorkComplete
    ? 'Completada'
    : bucket === 'HAS_CORRECTIONS'
      ? 'Correcciones pendientes'
      : bucket === 'WAITING_PRODUCT'
        ? 'Esperando Product'
        : bucket === 'NEEDS_WORK'
          ? project.status === 'READY_FOR_PRODUCTION'
            ? 'Lista para producir'
            : 'En producción'
          : 'Activa';

  const summaryLabel = isFactoryWorkComplete
    ? `${approvedCount} materia${approvedCount !== 1 ? 's' : ''} completada${approvedCount !== 1 ? 's' : ''}`
    : inReviewCount > 0
      ? `${inReviewCount} en revisión Product`
      : needsWorkCount > 0
        ? `${needsWorkCount} por trabajar`
        : correctionsCount > 0
          ? `${correctionsCount} con correcciones`
          : statusLabel;

  const firstCorrection = projectObs.find(
    (o) => o.status === 'ABIERTA' || o.status === 'EN_CORRECCION',
  );

  const actionLabel = isFactoryWorkComplete
    ? 'Ver completado'
    : correctionsCount > 0
      ? 'Ver correcciones'
      : needsWorkCount > 0
        ? 'Trabajar solicitud'
        : 'Ver estado';

  const actionRoute = isFactoryWorkComplete
    ? `/projects/${project.id}`
    : firstCorrection?.subjectId
      ? `/subjects/${firstCorrection.subjectId}?focus=correction`
      : `/projects/${project.id}`;

  return {
    project,
    bucket,
    totalSubjects,
    approvedCount,
    inReviewCount,
    needsWorkCount,
    correctionsCount,
    waitingValidationCount,
    statusLabel,
    summaryLabel,
    actionLabel,
    actionRoute,
    displayStatus: isFactoryWorkComplete ? 'APPROVED' : project.status,
    isFactoryWorkComplete,
  };
}

export function analyzeFactoryProjects(
  projects: VirtualizationProject[],
  observations: OperationalObservation[] = [],
) {
  const visible = projects.filter((p) =>
    ['READY_FOR_PRODUCTION', 'IN_PRODUCTION', 'FEEDBACK_PENDING', 'IN_REVIEW'].includes(p.status),
  );
  const insights = visible.map((p) => analyzeFactoryProject(p, observations));

  return {
    insights,
    fullyApproved: insights.filter((i) => i.bucket === 'FULLY_APPROVED'),
    needsWork: insights.filter((i) => i.bucket === 'NEEDS_WORK'),
    hasCorrections: insights.filter((i) => i.bucket === 'HAS_CORRECTIONS'),
    waitingProduct: insights.filter((i) => i.bucket === 'WAITING_PRODUCT'),
    activeWork: insights.filter((i) => i.bucket !== 'FULLY_APPROVED'),
  };
}

export function analyzeFactorySemester(
  project: VirtualizationProject,
  semesterNumber: number,
  observations: OperationalObservation[] = [],
) {
  const subjects = getProjectSubjects(project).filter((s) => s.semesterNumber === semesterNumber);
  const projectObs = observations.filter((o) => o.projectId === project.id);
  const states = subjects.map((subject) =>
    normalizeSubjectOperationalState({
      subject,
      observations: projectObs,
      projectStatus: project.status,
    }),
  );

  const approvedCount = countByState(states, 'APPROVED');
  const inReviewCount = countByState(states, 'IN_REVIEW');
  const totalSubjects = subjects.length;
  const isComplete = totalSubjects > 0 && approvedCount === totalSubjects;

  return {
    subjects,
    approvedCount,
    inReviewCount,
    totalSubjects,
    isComplete,
    headerLabel: isComplete
      ? `${totalSubjects} asignatura${totalSubjects !== 1 ? 's' : ''} completada${totalSubjects !== 1 ? 's' : ''}`
      : `${totalSubjects} asignatura${totalSubjects !== 1 ? 's' : ''} en este semestre`,
    progressLabel: isComplete
      ? `${approvedCount} aprobada${approvedCount !== 1 ? 's' : ''} por Product`
      : `${inReviewCount} enviada${inReviewCount !== 1 ? 's' : ''} · ${approvedCount} aprobada${approvedCount !== 1 ? 's' : ''}`,
    displayStatus: (isComplete ? 'APPROVED' : project.status) as SubjectStatus | ProjectStatus,
  };
}
