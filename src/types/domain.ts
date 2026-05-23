export type Role = 'PRODUCT' | 'FABRICA' | 'ADMIN';

export type ProjectStatus =
  | 'PENDING_SYLLABUS'
  | 'READY_FOR_PRODUCTION'
  | 'IN_PRODUCTION'
  | 'IN_REVIEW'
  | 'DELIVERED_TO_LMS'
  | 'FEEDBACK_PENDING'
  | 'CLOSED';

export type SubjectStatus =
  | 'PENDING'
  | 'IN_PRODUCTION'
  | 'SUBMITTED'
  | 'IN_REVIEW'
  | 'CHANGES_REQUESTED'
  | 'APPROVED'
  | 'DELIVERED';

export type SemesterStatus =
  | 'PENDING'
  | 'IN_PRODUCTION'
  | 'PARTIAL_REVIEW'
  | 'CHANGES_REQUESTED'
  | 'APPROVED'
  | 'DELIVERED';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ChecklistStatus = 'NO_EXISTE' | 'PENDIENTE' | 'EN_PRODUCCION' | 'ENTREGADO' | 'APROBADO' | 'RECHAZADO';

export type LinkResourceType = 'SYLLABUS' | 'CURRICULUM' | 'DRIVE_FOLDER' | 'BRIEF' | 'REFERENCE' | 'OTHER';

export interface SubjectSummary {
  id: string;
  name: string;
  status: SubjectStatus;
  semesterNumber: number;
  expectedDeliveryDate?: string | null;
  progress: number;
  openObservationsCount: number;
  correctionSentCount: number;
  updatedAt?: string;
}

export interface VirtualizationProject {
  id: string;
  school: string;
  program: string;
  modality: string;
  requestType: string;
  priority: Priority;
  status: ProjectStatus;
  progress: number;
  createdAt: string;
  expectedDeliveryDate: string;
  productOwner: string;
  factoryOwner: string;
  observations: string;
  semesters: ProjectSemester[];
  subjects: SubjectVirtualization[];
  subjectsSummary?: SubjectSummary[];
  links: LinkResource[];
}

export interface ProjectSemester {
  id: string;
  semesterNumber: number;
  status: SemesterStatus;
  curriculumStatus: ChecklistStatus;
  factoryStatus: ChecklistStatus;
  factoryExpectedDate: string;
  continuationDate: string;
  observations: string;
}

export interface SubjectVirtualization {
  id: string;
  projectId: string;
  semesterNumber: number;
  name: string;
  expectedDeliveryDate?: string;
  status: SubjectStatus;
  progress: number;
  checklist: ChecklistItem[];
  generalObservations: string;
  contentTopics: string[];
  topicChecklists: TopicChecklist[];
}

export interface TopicChecklist {
  id?: string;
  topicName: string;
  topicOrder: number;
  items: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  subjectId?: string;
  topicId?: string | null;
  label: string;
  status: ChecklistStatus;
  ownerRole: Role;
  updatedAt: string;
  observations: string;
}

export interface LinkResource {
  id: string;
  title: string;
  url: string;
  type: LinkResourceType;
  uploadedBy: Role;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  entityType: string;
  entityName: string;
  action: string;
  userName: string;
  role: Role;
  previousValue: string;
  newValue: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  userId?: string | null;
  roleTarget?: Role | null;
  type?: 'INFO' | 'ACTION' | 'DEADLINE' | 'CRITICAL';
  createdAt: string;
  read: boolean;
  projectId?: string;
  subjectId?: string;
  eventType?: string;
  actionUrl?: string;
  readAt?: string;
  severity?: string;
}

export interface ActivityEvent {
  id: string;
  userName: string;
  role: Role;
  action: string;
  entityType: string;
  entityName: string;
  eventType: 'LINK' | 'STATUS' | 'OBSERVATION' | 'APPROVAL' | 'DOCUMENT';
  projectId?: string;
  subjectId?: string;
  createdAt: string;
}

export interface PipelineStageSummary {
  status: ProjectStatus;
  count: number;
  progress: number;
  critical: boolean;
}

export interface OperationalObservation {
  id: string;
  projectId: string;
  subjectId?: string;
  author: string;
  role: Role;
  text: string;
  status: 'ABIERTA' | 'EN_CORRECCION' | 'RESUELTA';
  relatedEntity: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  createdAt: string;
  updatedAt?: string;
}

export type CommentEntityType = 'project' | 'subject' | 'checklist' | 'link' | 'observation';

export interface OperationalComment {
  id: string;
  entityType: CommentEntityType;
  entityId: string;
  authorName: string;
  authorRole: Role;
  message: string;
  createdAt: string;
  parentId?: string;
  mentions?: string[];
  resolved?: boolean;
}
