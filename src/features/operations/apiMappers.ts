import type {
  ChecklistItem,
  ChecklistStatus,
  LinkResource,
  LinkResourceType,
  Priority,
  ProjectSemester,
  ProjectStatus,
  Role,
  Notification,
  OperationalObservation,
  SubjectVirtualization,
  SubjectSummary,
  TopicChecklist,
  VirtualizationProject,
} from '../../types/domain';
import type {
  ApiChecklistItem,
  ApiCreateProjectPayload,
  ApiModality,
  ApiProjectDetail,
  ApiProjectLink,
  ApiProjectListItem,
  ApiProjectOwner,
  ApiSemesterDetail,
  ApiSubjectDetail,
  ApiSubjectSummary,
  ApiTopicDetail,
} from '../../services/types/projectsApi.types';
import type {
  ApiCreateObservationPayload,
  ApiNotification,
  ApiObservation,
  ApiObservationStatus,
  ApiRelatedEntityType,
} from '../../services/types/workflowApi.types';
import type { ApiSubjectWorkspace } from '../../services/subjectsApi';

export interface CreateProjectFormInput {
  school: string;
  program: string;
  modality: string;
  subjectMatterExpertType: 'INTERNAL' | 'EXTERNAL';
  priority: Priority;
  requestType?: string;
  observations?: string;
  hasSyllabus: boolean | null;
  syllabusUrl?: string;
  factoryOwnerId?: string;
  semesters: {
    number: number;
    subjects: { name: string; topics?: string[] }[];
  }[];
}

export interface CreateObservationInput {
  projectId: string;
  subjectId?: string;
  topicId?: string;
  checklistItemId?: string;
  relatedEntityType: 'PROJECT' | 'SUBJECT' | 'TOPIC' | 'CHECKLIST_ITEM' | 'project' | 'subject' | 'topic' | 'checklist';
  relatedEntityId: string;
  text: string;
  priority?: Priority;
}

function toIsoDateTime(value: string): string {
  if (!value) return new Date().toISOString();
  if (value.includes('T')) return value;
  return `${value}T00:00:00.000Z`;
}

export function toDateOnly(value: string): string {
  if (!value) return '';
  return value.includes('T') ? value.slice(0, 10) : value;
}

export function mapOwnerName(owner: ApiProjectOwner | null | undefined): string {
  if (!owner) return 'Por asignar';
  return owner.name?.trim() || owner.email;
}

export function mapModalityToApi(value: string): ApiModality {
  const normalized = value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase();

  if (normalized.includes('hibr')) return 'HIBRIDA';
  if (normalized.includes('presen')) return 'PRESENCIAL';
  return 'VIRTUAL';
}

export function mapModalityFromApi(value: ApiModality | string): string {
  switch (value) {
    case 'HIBRIDA':
      return 'Híbrida';
    case 'PRESENCIAL':
      return 'Presencial';
    case 'VIRTUAL':
    default:
      return 'Virtual';
  }
}

export function mapPriorityToApi(value: Priority): Priority {
  return value;
}

export function mapPriorityFromApi(value: Priority): Priority {
  return value;
}

export function mapStatusFromApi(value: ProjectStatus): ProjectStatus {
  return value;
}

export function mapChecklistItemFromApi(api: ApiChecklistItem): ChecklistItem {
  return {
    id: api.id,
    subjectId: api.subjectId,
    topicId: api.topicId ?? null,
    label: api.label,
    status: api.status as ChecklistStatus,
    ownerRole: api.ownerRole,
    updatedAt: toDateOnly(api.updatedAt),
    observations: '',
  };
}

function dedupeChecklistItems(items: ChecklistItem[], contextLabel: string): ChecklistItem[] {
  const seen = new Set<string>();
  const out: ChecklistItem[] = [];
  let dupes = 0;
  for (const item of items) {
    if (seen.has(item.id)) {
      dupes++;
      continue;
    }
    seen.add(item.id);
    out.push(item);
  }
  if (dupes > 0 && import.meta.env.DEV) {
    // Defensive: if backend ever sends duplicates, avoid rendering multiple copies.
    console.warn(`[apiMappers] Duplicated checklist items detected (${contextLabel}):`, dupes);
  }
  return out;
}

export function mapTopicFromApi(api: ApiTopicDetail): { topicName: string; topicChecklist: TopicChecklist } {
  return {
    topicName: api.name,
    topicChecklist: {
      id: api.id,
      topicName: api.name,
      topicOrder: api.order,
      items: dedupeChecklistItems(
        api.checklist
          .map(mapChecklistItemFromApi)
          .filter((item) => item.topicId === api.id),
        `topic:${api.id}`,
      ),
    },
  };
}

export function mapSubjectFromApi(
  api: ApiSubjectDetail,
  projectId: string,
  semesterNumber: number,
  fallbackDates?: { semesterFactoryExpectedDate?: string | null; projectExpectedDeliveryDate?: string | null },
): SubjectVirtualization {
  const mappedTopics = api.topics.map(mapTopicFromApi);

  const subjectChecklist = dedupeChecklistItems(
    api.checklist
      .map(mapChecklistItemFromApi)
      .filter((item) => !item.topicId),
    `subject:${api.id}`,
  );

  return {
    id: api.id,
    projectId,
    semesterNumber,
    name: api.name,
    expectedDeliveryDate:
      (api.expectedDeliveryDate ? toDateOnly(api.expectedDeliveryDate) : '') ||
      (fallbackDates?.semesterFactoryExpectedDate
        ? toDateOnly(fallbackDates.semesterFactoryExpectedDate)
        : '') ||
      (fallbackDates?.projectExpectedDeliveryDate
        ? toDateOnly(fallbackDates.projectExpectedDeliveryDate)
        : ''),
    status: api.status,
    operationalState: api.operationalState,
    progress: api.progress,
    factoryProductionStatus: api.factoryProductionStatus ?? 'NOT_STARTED',
    factoryProductionCompletedAt: api.factoryProductionCompletedAt ?? null,
    createdFromChange: Boolean(api.createdFromChange),
    openObservationsCount: api.openObservationsCount ?? 0,
    correctionSentCount: api.correctionSentCount ?? 0,
    checklist: subjectChecklist,
    generalObservations: '',
    contentTopics: mappedTopics.map((t) => t.topicName),
    topicChecklists: mappedTopics.map((t) => t.topicChecklist),
  };
}

export function mapSemesterFromApi(
  api: ApiSemesterDetail,
  subjects: SubjectVirtualization[],
): ProjectSemester {
  const semesterSubjects = subjects.filter((s) => s.semesterNumber === api.semesterNumber);
  const deliveredCount = semesterSubjects.filter((s) =>
    ['SUBMITTED', 'IN_REVIEW', 'APPROVED', 'DELIVERED'].includes(s.status),
  ).length;

  return {
    id: api.id,
    semesterNumber: api.semesterNumber,
    status: api.status,
    curriculumStatus: 'PENDIENTE',
    factoryStatus:
      deliveredCount === 0
        ? 'PENDIENTE'
        : deliveredCount === semesterSubjects.length
          ? 'ENTREGADO'
          : 'EN_PRODUCCION',
    factoryExpectedDate: api.factoryExpectedDate ? toDateOnly(api.factoryExpectedDate) : '',
    continuationDate: api.continuationDate ? toDateOnly(api.continuationDate) : '',
    observations: '',
    createdFromChange: Boolean(api.createdFromChange),
  };
}

function mapLinkFromApi(api: ApiProjectLink): LinkResource {
  const knownTypes: LinkResourceType[] = ['SYLLABUS', 'CURRICULUM', 'DRIVE_FOLDER', 'BRIEF', 'REFERENCE', 'OTHER'];
  const type = knownTypes.includes(api.type as LinkResourceType) ? (api.type as LinkResourceType) : 'OTHER';
  return {
    id: api.id,
    title: api.title,
    url: api.url,
    type,
    uploadedBy: api.uploadedBy,
    createdAt: toDateOnly(api.createdAt),
  };
}

export function mapSubjectSummaryFromApi(api: ApiSubjectSummary): SubjectSummary {
  return {
    id: api.id,
    name: api.name,
    status: api.status,
    operationalState: api.operationalState,
    semesterNumber: api.semesterNumber,
    expectedDeliveryDate: api.expectedDeliveryDate
      ? toDateOnly(api.expectedDeliveryDate)
      : null,
    progress: api.progress,
    openObservationsCount: api.openObservationsCount,
    correctionSentCount: api.correctionSentCount,
    updatedAt: toDateOnly(api.updatedAt),
    createdFromChange: Boolean(api.createdFromChange),
  };
}

function resolveListItemProgress(api: ApiProjectListItem): number {
  if (api.status === 'CLOSED') return 100;
  const summary = api.subjectsSummary ?? [];
  if (summary.length > 0) {
    const allComplete = summary.every(
      (s) =>
        (s.progress ?? 0) >= 100 ||
        s.status === 'DELIVERED' ||
        s.status === 'APPROVED' ||
        s.operationalState === 'APPROVED',
    );
    if (allComplete) return 100;
    const avg = Math.round(
      summary.reduce((acc, s) => acc + Math.min(100, Math.max(0, s.progress ?? 0)), 0) / summary.length,
    );
    return Math.max(api.progress ?? 0, avg);
  }
  return api.progress ?? 0;
}

export function mapProjectListItemFromApi(api: ApiProjectListItem): VirtualizationProject {
  const subjectsSummary = api.subjectsSummary?.map(mapSubjectSummaryFromApi);
  return {
    id: api.id,
    school: api.school,
    program: api.program,
    modality: mapModalityFromApi(api.modality),
    requestType: api.requestType,
    priority: mapPriorityFromApi(api.priority),
    status: mapStatusFromApi(api.status),
    progress: resolveListItemProgress(api),
    createdAt: toDateOnly(api.createdAt),
    expectedDeliveryDate: api.expectedDeliveryDate ? toDateOnly(api.expectedDeliveryDate) : '',
    subjectMatterExpertType: api.subjectMatterExpertType ?? 'INTERNAL',
    subjectMatterExpertStatus: api.subjectMatterExpertStatus ?? 'READY',
    activatedAt: api.activatedAt ? toDateOnly(api.activatedAt) : null,
    expertConfirmedAt: api.expertConfirmedAt ? toDateOnly(api.expertConfirmedAt) : null,
    productOwner: mapOwnerName(api.productOwner),
    factoryOwner: mapOwnerName(api.factoryOwner),
    observations: '',
    semesters: [],
    subjects: [],
    subjectsSummary,
    links: [],
  };
}

export function mapProjectDetailFromApi(api: ApiProjectDetail): VirtualizationProject {
  const subjectsById = new Map<string, SubjectVirtualization>();

  api.semesters.forEach((semester) => {
    semester.subjects.forEach((subject) => {
      if (subjectsById.has(subject.id)) return;
      subjectsById.set(
        subject.id,
        mapSubjectFromApi(subject, api.id, semester.semesterNumber, {
          semesterFactoryExpectedDate: semester.factoryExpectedDate,
          projectExpectedDeliveryDate: api.expectedDeliveryDate,
        }),
      );
    });
  });

  const subjects = Array.from(subjectsById.values());

  const semesters = api.semesters.map((semester) => mapSemesterFromApi(semester, subjects));

  return {
    id: api.id,
    school: api.school,
    program: api.program,
    modality: mapModalityFromApi(api.modality),
    requestType: api.requestType,
    priority: mapPriorityFromApi(api.priority),
    status: mapStatusFromApi(api.status),
    progress: api.progress,
    createdAt: toDateOnly(api.createdAt),
    expectedDeliveryDate: api.expectedDeliveryDate ? toDateOnly(api.expectedDeliveryDate) : '',
    subjectMatterExpertType: api.subjectMatterExpertType ?? 'INTERNAL',
    subjectMatterExpertStatus: api.subjectMatterExpertStatus ?? 'READY',
    activatedAt: api.activatedAt ? toDateOnly(api.activatedAt) : null,
    expertConfirmedAt: api.expertConfirmedAt ? toDateOnly(api.expertConfirmedAt) : null,
    productOwner: mapOwnerName(api.productOwner),
    factoryOwner: mapOwnerName(api.factoryOwner),
    observations: api.observations ?? '',
    semesters,
    subjects,
    links: api.links.map(mapLinkFromApi),
    recentChanges: api.recentChanges,
    changeTimeline: api.changeTimeline?.map((entry) => ({
      ...entry,
      occurredAt: toDateOnly(entry.occurredAt),
    })),
  };
}

export function isLightSubjectWorkspace(api: ApiSubjectWorkspace): api is Extract<ApiSubjectWorkspace, { projectMeta: unknown }> {
  return 'projectMeta' in api;
}

export function mapSubjectWorkspaceProjectFromApi(api: ApiSubjectWorkspace): VirtualizationProject {
  if (!isLightSubjectWorkspace(api)) {
    return mapProjectDetailFromApi(api.project);
  }

  const subject = mapSubjectFromApi(api.subject, api.projectMeta.id, api.semesterMeta.semesterNumber, {
    semesterFactoryExpectedDate: api.semesterMeta.factoryExpectedDate,
    projectExpectedDeliveryDate: api.projectMeta.expectedDeliveryDate,
  });
  const semester = mapSemesterFromApi({ ...api.semesterMeta, subjects: [api.subject] }, [subject]);

  return {
    id: api.projectMeta.id,
    school: api.projectMeta.school,
    program: api.projectMeta.program,
    modality: mapModalityFromApi(api.projectMeta.modality),
    requestType: api.projectMeta.requestType,
    priority: mapPriorityFromApi(api.projectMeta.priority),
    status: mapStatusFromApi(api.projectMeta.status),
    progress: api.projectMeta.progress,
    createdAt: toDateOnly(api.projectMeta.createdAt),
    expectedDeliveryDate: api.projectMeta.expectedDeliveryDate
      ? toDateOnly(api.projectMeta.expectedDeliveryDate)
      : '',
    subjectMatterExpertType: api.projectMeta.subjectMatterExpertType ?? 'INTERNAL',
    subjectMatterExpertStatus: api.projectMeta.subjectMatterExpertStatus ?? 'READY',
    activatedAt: api.projectMeta.activatedAt ? toDateOnly(api.projectMeta.activatedAt) : null,
    expertConfirmedAt: api.projectMeta.expertConfirmedAt
      ? toDateOnly(api.projectMeta.expertConfirmedAt)
      : null,
    productOwner: mapOwnerName(api.projectMeta.productOwner),
    factoryOwner: mapOwnerName(api.projectMeta.factoryOwner),
    observations: '',
    semesters: [semester],
    subjects: [subject],
    subjectsSummary: [
      {
        id: subject.id,
        name: subject.name,
        status: subject.status,
        operationalState: subject.operationalState,
        semesterNumber: subject.semesterNumber,
        expectedDeliveryDate: subject.expectedDeliveryDate ?? null,
        progress: subject.progress,
        factoryProductionStatus: subject.factoryProductionStatus,
        factoryProductionCompletedAt: subject.factoryProductionCompletedAt ?? null,
        openObservationsCount: subject.openObservationsCount ?? 0,
        correctionSentCount: subject.correctionSentCount ?? 0,
        createdFromChange: Boolean(subject.createdFromChange),
      },
    ],
    links: [],
  };
}

export function mapProjectsFromApi(items: ApiProjectListItem[]): VirtualizationProject[] {
  return items.map(mapProjectListItemFromApi);
}

export function mapCreateProjectToApi(input: CreateProjectFormInput): ApiCreateProjectPayload {
  const payload: ApiCreateProjectPayload = {
    school: input.school.trim(),
    program: input.program.trim(),
    modality: mapModalityToApi(input.modality),
    subjectMatterExpertType: input.subjectMatterExpertType,
    requestType: input.requestType?.trim() || 'Virtualizacion completa',
    priority: mapPriorityToApi(input.priority),
    semesters: input.semesters.map((semester) => ({
      semesterNumber: semester.number,
      subjects: semester.subjects.map((subject) => ({
        name: subject.name.trim(),
        topics: (subject.topics ?? []).map((t) => t.trim()).filter(Boolean),
      })),
    })),
  };

  if (input.observations?.trim()) {
    payload.observations = input.observations.trim();
  }

  if (input.factoryOwnerId) {
    payload.factoryOwnerId = input.factoryOwnerId;
  }

  if (input.hasSyllabus === true) {
    payload.syllabus = { hasSyllabus: true, url: input.syllabusUrl?.trim() };
  } else if (input.hasSyllabus === false) {
    payload.syllabus = { hasSyllabus: false };
  }

  return payload;
}

export function mapObservationStatusFromApi(status: string): OperationalObservation['status'] {
  if (status === 'EN_CORRECCION' || status === 'RESUELTA') return status;
  return 'ABIERTA';
}

export function mapObservationPriorityToApi(priority: Priority | undefined): Priority {
  return priority ?? 'MEDIUM';
}

export function mapRelatedEntityTypeToApi(type: CreateObservationInput['relatedEntityType']): ApiRelatedEntityType {
  if (type === 'PROJECT' || type === 'project') return 'PROJECT';
  if (type === 'TOPIC' || type === 'topic') return 'TOPIC';
  if (type === 'CHECKLIST_ITEM' || type === 'checklist') return 'CHECKLIST_ITEM';
  return 'SUBJECT';
}

function mapAuthorName(api: ApiObservation): string {
  return api.author?.name?.trim() || api.author?.email || 'Usuario';
}

function mapRelatedEntityLabel(api: ApiObservation): string {
  return api.relatedEntity || api.relatedEntityType || api.relatedEntityId || api.subjectId || api.projectId;
}

export function mapObservationFromApi(api: ApiObservation): OperationalObservation {
  return {
    id: api.id,
    projectId: api.projectId,
    subjectId: api.subjectId ?? undefined,
    author: mapAuthorName(api),
    role: api.role ?? api.author?.role ?? 'PRODUCT',
    text: api.text,
    status: mapObservationStatusFromApi(api.status),
    notificationStatus: api.notificationStatus === 'PENDING' ? 'PENDING' : 'SENT',
    correctionNotificationStatus: api.correctionNotificationStatus ?? null,
    checklistItemId: api.checklistItemId ?? undefined,
    relatedEntity: mapRelatedEntityLabel(api),
    relatedEntityType: api.relatedEntityType ?? undefined,
    relatedEntityId: api.relatedEntityId ?? undefined,
    createdAt: api.createdAt,
    updatedAt: api.updatedAt,
  };
}

export function mapObservationsFromApi(api: ApiObservation[]): OperationalObservation[] {
  return api.map(mapObservationFromApi);
}

export function mapCreateObservationToApi(input: CreateObservationInput): ApiCreateObservationPayload {
  const payload: ApiCreateObservationPayload = {
    projectId: input.projectId,
    relatedEntityType: mapRelatedEntityTypeToApi(input.relatedEntityType),
    relatedEntityId: input.relatedEntityId,
    text: input.text.trim(),
    priority: mapObservationPriorityToApi(input.priority),
  };

  if (input.subjectId) payload.subjectId = input.subjectId;
  if (input.topicId) payload.topicId = input.topicId;
  if (input.checklistItemId) payload.checklistItemId = input.checklistItemId;
  return payload;
}

export function mapNotificationFromApi(api: ApiNotification): Notification {
  const type = api.type === 'ACTION' || api.type === 'DEADLINE' || api.type === 'CRITICAL' ? api.type : 'INFO';
  return {
    id: api.id,
    title: api.title,
    message: api.message,
    userId: api.userId ?? null,
    roleTarget: api.roleTarget ?? null,
    type,
    createdAt: api.createdAt,
    read: api.isRead,
    projectId: api.projectId ?? (api.entityType === 'PROJECT' ? api.entityId ?? undefined : undefined),
    subjectId: api.subjectId ?? (api.entityType === 'SUBJECT' ? api.entityId ?? undefined : undefined),
    eventType: api.eventType ?? undefined,
    actionUrl: api.actionUrl ?? undefined,
    readAt: api.readAt ?? undefined,
    severity: api.severity ?? undefined,
  };
}

export function mapNotificationsFromApi(api: ApiNotification[]): Notification[] {
  return api.map(mapNotificationFromApi);
}

export function getApiErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message: unknown }).message;
    if (Array.isArray(message)) return message.join('. ');
    if (typeof message === 'string' && message.trim()) return message;
  }
  if (error instanceof Error && error.message) return error.message;
  return 'No se pudo completar la operación.';
}
