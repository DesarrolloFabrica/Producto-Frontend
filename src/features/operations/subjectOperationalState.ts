import type {
  OperationalObservation,
  Priority,
  SubjectSummary,
  SubjectStatus,
  SubjectVirtualization,
  VirtualizationProject,
} from '../../types/domain';

export function getProjectSubjects(
  project: VirtualizationProject,
): Array<SubjectSummary | SubjectVirtualization> {
  if (project.subjects.length > 0) return project.subjects;
  return project.subjectsSummary ?? [];
}

export type SubjectOperationalState =
  | 'NOT_STARTED'
  | 'IN_PRODUCTION'
  | 'IN_REVIEW'
  | 'CHANGES_REQUESTED'
  | 'CORRECTION_SENT'
  | 'APPROVED';

export interface SubjectSummaryLike {
  id: string;
  name: string;
  status: SubjectStatus;
  semesterNumber: number;
  expectedDeliveryDate?: string | null;
  progress?: number;
  openObservationsCount?: number;
  correctionSentCount?: number;
  updatedAt?: string;
}

export interface SubjectWorkItem {
  subjectId: string;
  subjectName: string;
  projectId: string;
  program: string;
  school: string;
  semesterNumber: number;
  expectedDeliveryDate: string;
  priority: Priority;
  operationalState: SubjectOperationalState;
  openObservationsCount: number;
  correctionSentCount: number;
  lastActivity?: string;
  actionUrl: string;
  actionLabel: string;
  operationalLabel: string;
}

const OPERATIONAL_LABELS: Record<SubjectOperationalState, string> = {
  NOT_STARTED: 'Por iniciar',
  IN_PRODUCTION: 'En producción',
  IN_REVIEW: 'En revisión Product',
  CHANGES_REQUESTED: 'Correcciones pendientes',
  CORRECTION_SENT: 'Corrección enviada',
  APPROVED: 'Aprobada',
};

const OPERATIONAL_CTAS: Record<SubjectOperationalState, { label: string; passive?: boolean }> = {
  NOT_STARTED: { label: 'Iniciar producción' },
  IN_PRODUCTION: { label: 'Continuar producción' },
  IN_REVIEW: { label: 'Esperando Product', passive: true },
  CHANGES_REQUESTED: { label: 'Ver correcciones' },
  CORRECTION_SENT: { label: 'Esperando validación', passive: true },
  APPROVED: { label: 'Ver aprobado' },
};

export function getOperationalStateLabel(state: SubjectOperationalState): string {
  return OPERATIONAL_LABELS[state];
}

export function getOperationalCta(state: SubjectOperationalState): { label: string; passive?: boolean } {
  return OPERATIONAL_CTAS[state];
}

function hasDeliveryDate(value?: string | null): value is string {
  return Boolean(value && value.trim());
}

export function resolveSubjectExpectedDeliveryDate(
  project: VirtualizationProject,
  subject: SubjectSummaryLike | SubjectVirtualization,
): string {
  if (hasDeliveryDate(subject.expectedDeliveryDate)) {
    return subject.expectedDeliveryDate!.trim();
  }

  const semester = project.semesters.find((s) => s.semesterNumber === subject.semesterNumber);
  if (semester && hasDeliveryDate(semester.factoryExpectedDate)) {
    return semester.factoryExpectedDate.trim();
  }

  return project.expectedDeliveryDate?.trim() ?? '';
}

function productObservationsForSubject(
  observations: OperationalObservation[],
  subjectId: string,
): OperationalObservation[] {
  return observations.filter(
    (obs) => obs.role === 'PRODUCT' && observationBelongsToSubject(obs, subjectId),
  );
}

function observationBelongsToSubject(
  observation: OperationalObservation,
  subjectId: string,
): boolean {
  if (observation.subjectId === subjectId) return true;
  if (observation.relatedEntityType === 'SUBJECT' && observation.relatedEntityId === subjectId) {
    return true;
  }
  return false;
}

export function getProductObservationsForSubject(
  project: VirtualizationProject,
  subjectId: string,
  observations: OperationalObservation[],
): OperationalObservation[] {
  const subject = getProjectSubjects(project).find((item) => item.id === subjectId);
  const topicIds = new Set(
    subject && 'topics' in subject && subject.topics ? subject.topics.map((topic) => topic.id) : [],
  );
  const checklistIds = new Set(
    subject && 'checklist' in subject && subject.checklist
      ? subject.checklist.map((item) => item.id)
      : [],
  );

  return observations.filter((observation) => {
    if (observation.role !== 'PRODUCT') return false;
    if (observationBelongsToSubject(observation, subjectId)) return true;
    if (
      observation.relatedEntityType === 'TOPIC' &&
      observation.relatedEntityId &&
      topicIds.has(observation.relatedEntityId)
    ) {
      return true;
    }
    if (
      observation.relatedEntityType === 'CHECKLIST_ITEM' &&
      observation.relatedEntityId &&
      checklistIds.has(observation.relatedEntityId)
    ) {
      return true;
    }
    return false;
  });
}

export function normalizeSubjectOperationalState(params: {
  subject: SubjectSummaryLike | SubjectVirtualization;
  observations?: OperationalObservation[];
  projectStatus?: VirtualizationProject['status'];
}): SubjectOperationalState {
  const { subject, observations = [], projectStatus } = params;
  const subjectObs = productObservationsForSubject(observations, subject.id);

  const openCount =
    subject.openObservationsCount ??
    subjectObs.filter((o) => o.status === 'ABIERTA').length;
  const correctionSentCount =
    subject.correctionSentCount ??
    subjectObs.filter((o) => o.status === 'EN_CORRECCION').length;

  if (subject.status === 'APPROVED') return 'APPROVED';
  if (openCount > 0) return 'CHANGES_REQUESTED';
  if (correctionSentCount > 0) return 'CORRECTION_SENT';
  if (subject.status === 'CHANGES_REQUESTED') return 'CHANGES_REQUESTED';
  if (subject.status === 'IN_REVIEW' || subject.status === 'SUBMITTED') return 'IN_REVIEW';
  if (subject.status === 'IN_PRODUCTION') return 'IN_PRODUCTION';
  return 'NOT_STARTED';
}

export function buildSubjectWorkItem(
  project: VirtualizationProject,
  subject: SubjectSummaryLike | SubjectVirtualization,
  observations: OperationalObservation[] = [],
): SubjectWorkItem {
  const subjectObs = getProductObservationsForSubject(project, subject.id, observations);
  const operationalState = normalizeSubjectOperationalState({
    subject: {
      ...subject,
      openObservationsCount: subjectObs.filter((o) => o.status === 'ABIERTA').length,
      correctionSentCount: subjectObs.filter((o) => o.status === 'EN_CORRECCION').length,
    },
    observations: subjectObs,
    projectStatus: project.status,
  });
  const cta = getOperationalCta(operationalState);
  const openObservationsCount = subjectObs.filter((o) => o.status === 'ABIERTA').length;
  const correctionSentCount = subjectObs.filter((o) => o.status === 'EN_CORRECCION').length;

  const focusCorrection =
    operationalState === 'CHANGES_REQUESTED' || openObservationsCount > 0
      ? '?focus=correction'
      : '';

  return {
    subjectId: subject.id,
    subjectName: subject.name,
    projectId: project.id,
    program: project.program,
    school: project.school,
    semesterNumber: subject.semesterNumber,
    expectedDeliveryDate: resolveSubjectExpectedDeliveryDate(project, subject),
    priority: project.priority,
    operationalState,
    openObservationsCount,
    correctionSentCount,
    lastActivity: 'updatedAt' in subject ? subject.updatedAt : undefined,
    actionUrl: `/subjects/${subject.id}${focusCorrection}`,
    actionLabel: cta.label,
    operationalLabel: getOperationalStateLabel(operationalState),
  };
}

export function flattenProjectSubjects(
  projects: VirtualizationProject[],
): Array<{ project: VirtualizationProject; subject: SubjectSummaryLike }> {
  return projects.flatMap((project) => {
    const summaries =
      project.subjects.length > 0
        ? project.subjects
        : (project.subjectsSummary ?? []);
    return summaries.map((subject) => ({ project, subject }));
  });
}

export function groupSubjectsByOperationalState(
  items: SubjectWorkItem[],
): Record<SubjectOperationalState, SubjectWorkItem[]> {
  const groups: Record<SubjectOperationalState, SubjectWorkItem[]> = {
    NOT_STARTED: [],
    IN_PRODUCTION: [],
    IN_REVIEW: [],
    CHANGES_REQUESTED: [],
    CORRECTION_SENT: [],
    APPROVED: [],
  };
  for (const item of items) {
    groups[item.operationalState].push(item);
  }
  return groups;
}

export function buildWorkItemsFromProjects(
  projects: VirtualizationProject[],
  observations: OperationalObservation[] = [],
): SubjectWorkItem[] {
  return flattenProjectSubjects(projects).map(({ project, subject }) =>
    buildSubjectWorkItem(project, subject, observations),
  );
}

export const TRAY_PRIORITY: SubjectOperationalState[] = [
  'CHANGES_REQUESTED',
  'IN_PRODUCTION',
  'NOT_STARTED',
  'IN_REVIEW',
  'APPROVED',
  'CORRECTION_SENT',
];
