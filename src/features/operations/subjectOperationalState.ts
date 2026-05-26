import type {
  OperationalObservation,
  Priority,
  SubjectOperationalState,
  SubjectSummary,
  SubjectStatus,
  SubjectVirtualization,
  VirtualizationProject,
} from '../../types/domain';

export type { SubjectOperationalState } from '../../types/domain';

type ProjectSubject = SubjectSummary | SubjectVirtualization;

/** Lista única de asignaturas por proyecto. */
export function listSubjectsForProject(project: VirtualizationProject): ProjectSubject[] {
  const byId = new Map<string, ProjectSubject>();

  if (project.subjects.length > 0) {
    for (const subject of project.subjects) {
      if (subject.id) byId.set(subject.id, subject);
    }
    return Array.from(byId.values());
  }

  for (const summary of project.subjectsSummary ?? []) {
    if (summary.id && !byId.has(summary.id)) {
      byId.set(summary.id, summary);
    }
  }

  return Array.from(byId.values());
}

export function dedupeWorkItems(items: SubjectWorkItem[]): SubjectWorkItem[] {
  const seen = new Map<string, SubjectWorkItem>();
  for (const item of items) {
    const key = `${item.projectId}:${item.subjectId}`;
    if (!seen.has(key)) seen.set(key, item);
  }
  return Array.from(seen.values());
}

export function getProjectSubjects(project: VirtualizationProject): ProjectSubject[] {
  return listSubjectsForProject(project);
}

export function dedupeProjectsById(projects: VirtualizationProject[]): VirtualizationProject[] {
  const seen = new Map<string, VirtualizationProject>();
  for (const project of projects) {
    if (!seen.has(project.id)) {
      seen.set(project.id, project);
    }
  }
  return Array.from(seen.values());
}

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
  createdFromChange?: boolean;
  operationalState?: SubjectOperationalState;
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
  createdFromChange?: boolean;
  actionLabel: string;
  operationalLabel: string;
  /** Agrupa varias materias de la misma solicitud nueva en un solo ítem de bandeja. */
  isProjectGrouped?: boolean;
  groupedSubjectCount?: number;
  groupedSemesterNumbers?: number[];
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
  // En el modelo actual, SubjectVirtualization trae checklist y topicChecklists.
  // SubjectSummary no trae detalles de topics/checklists.
  const checklistIds = new Set(
    subject && 'checklist' in subject && Array.isArray(subject.checklist)
      ? subject.checklist.map((item) => item.id)
      : [],
  );
  const topicChecklistItemIds = new Set(
    subject && 'topicChecklists' in subject && Array.isArray(subject.topicChecklists)
      ? subject.topicChecklists.flatMap((tc) => tc.items ?? []).map((item) => item.id)
      : [],
  );

  return observations.filter((observation) => {
    if (observation.role !== 'PRODUCT') return false;
    if (observationBelongsToSubject(observation, subjectId)) return true;
    if (
      observation.relatedEntityType === 'TOPIC' &&
      observation.relatedEntityId &&
      // No tenemos id de TOPIC en el modelo de virtualization; ignoramos este match.
      false
    ) {
      return true;
    }
    if (
      observation.relatedEntityType === 'CHECKLIST_ITEM' &&
      observation.relatedEntityId &&
      (checklistIds.has(observation.relatedEntityId) ||
        topicChecklistItemIds.has(observation.relatedEntityId))
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
  if (subject.operationalState) return subject.operationalState;

  const subjectObs = productObservationsForSubject(observations, subject.id);

  const openCount =
    ('openObservationsCount' in subject ? subject.openObservationsCount : undefined) ??
    subjectObs.filter((o) => o.status === 'ABIERTA').length;
  const correctionSentCount =
    ('correctionSentCount' in subject ? subject.correctionSentCount : undefined) ??
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
  const openObservationsCount =
    ('openObservationsCount' in subject ? subject.openObservationsCount : undefined) ??
    subjectObs.filter((o) => o.status === 'ABIERTA').length;
  const correctionSentCount =
    ('correctionSentCount' in subject ? subject.correctionSentCount : undefined) ??
    subjectObs.filter((o) => o.status === 'EN_CORRECCION').length;
  const operationalState = normalizeSubjectOperationalState({
    subject: {
      ...subject,
      openObservationsCount,
      correctionSentCount,
    },
    observations: subjectObs,
    projectStatus: project.status,
  });
  const cta = getOperationalCta(operationalState);

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
    createdFromChange:
      'createdFromChange' in subject ? Boolean(subject.createdFromChange) : undefined,
    actionLabel: cta.label,
    operationalLabel: getOperationalStateLabel(operationalState),
  };
}

export function flattenProjectSubjects(
  projects: VirtualizationProject[],
): Array<{ project: VirtualizationProject; subject: SubjectSummaryLike }> {
  return dedupeProjectsById(projects).flatMap((project) =>
    listSubjectsForProject(project).map((subject) => ({ project, subject })),
  );
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
  const items = flattenProjectSubjects(projects).map(({ project, subject }) =>
    buildSubjectWorkItem(project, subject, observations),
  );
  return dedupeWorkItems(items);
}

/** Una fila por solicitud en bandejas de solicitudes nuevas (evita N filas por N materias). */
export function groupNewRequestItemsByProject(items: SubjectWorkItem[]): SubjectWorkItem[] {
  const initialScope = items.filter(
    (item) => item.operationalState === 'NOT_STARTED' && !item.createdFromChange,
  );
  const addedLater = items.filter(
    (item) => item.operationalState === 'NOT_STARTED' && item.createdFromChange,
  );

  const byProject = new Map<string, SubjectWorkItem[]>();
  for (const item of initialScope) {
    const list = byProject.get(item.projectId) ?? [];
    list.push(item);
    byProject.set(item.projectId, list);
  }

  const grouped: SubjectWorkItem[] = [];
  for (const [projectId, group] of byProject) {
    if (group.length === 1) {
      grouped.push({
        ...group[0],
        actionUrl: `/projects/${projectId}?tab=semesters`,
      });
      continue;
    }

    const first = group[0];
    const semesters = [...new Set(group.map((g) => g.semesterNumber))].sort((a, b) => a - b);
    const latestDelivery = group.reduce((latest, item) => {
      const ts = new Date(item.expectedDeliveryDate).getTime();
      return ts > new Date(latest).getTime() ? item.expectedDeliveryDate : latest;
    }, first.expectedDeliveryDate);

    grouped.push({
      ...first,
      subjectName: first.program,
      expectedDeliveryDate: latestDelivery,
      actionUrl: `/projects/${projectId}?tab=semesters`,
      isProjectGrouped: true,
      groupedSubjectCount: group.length,
      groupedSemesterNumbers: semesters,
    });
  }

  return [...grouped, ...addedLater];
}

export const TRAY_PRIORITY: SubjectOperationalState[] = [
  'CHANGES_REQUESTED',
  'IN_PRODUCTION',
  'NOT_STARTED',
  'IN_REVIEW',
  'APPROVED',
  'CORRECTION_SENT',
];
