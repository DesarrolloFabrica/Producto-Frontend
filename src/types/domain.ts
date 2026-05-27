export type Role = 'PRODUCT' | 'FABRICA' | 'PLANEACION' | 'LMS' | 'ADMIN';

export type InstitutionalOperationalState =
  | 'PENDING_PLANNING_INITIAL_VALIDATION'
  | 'RETURNED_TO_PRODUCT_FROM_PLANNING'
  | 'PENDING_FACTORY'
  | 'IN_FACTORY_PRODUCTION'
  | 'PENDING_PLANNING_PRODUCTION_VALIDATION'
  | 'RETURNED_TO_FACTORY_FROM_PLANNING'
  | 'PENDING_LMS_UPLOAD'
  | 'IN_LMS_UPLOAD'
  | 'PENDING_PLANNING_LMS_VALIDATION'
  | 'RETURNED_TO_LMS_FROM_PLANNING'
  | 'PENDING_PRODUCT_ACADEMIC_REVIEW'
  | 'IN_PRODUCT_ACADEMIC_REVIEW'
  | 'CHANGES_REQUESTED_BY_PRODUCT'
  | 'PENDING_PROJECT_RADICATION'
  | 'FINALIZED';

export type InstitutionalOperationalAction =
  | 'INSTITUTIONAL_SUBJECT_CREATED'
  | 'PLANNING_VALIDATE_INITIAL'
  | 'PLANNING_RETURN_INITIAL'
  | 'FACTORY_START_PRODUCTION'
  | 'FACTORY_DELIVER_CONTENT'
  | 'PLANNING_VALIDATE_PRODUCTION'
  | 'PLANNING_RETURN_PRODUCTION'
  | 'LMS_START_UPLOAD'
  | 'LMS_CONFIRM_UPLOAD'
  | 'PLANNING_VALIDATE_LMS'
  | 'PLANNING_RETURN_LMS'
  | 'PRODUCT_START_ACADEMIC_REVIEW'
  | 'PRODUCT_REQUEST_CHANGES'
  | 'PRODUCT_APPROVE_ACADEMIC'
  | 'PRODUCT_RESUBMIT_REQUEST';

export type SlaStatus =
  | 'ON_TIME'
  | 'AT_RISK'
  | 'OVERDUE'
  | 'FINALIZED_ON_TIME'
  | 'FINALIZED_OVERDUE';

export type SubjectMatterExpertType = 'INTERNAL' | 'EXTERNAL';
export type SubjectMatterExpertStatus = 'READY' | 'PENDING';

export type ProjectStatus =
  | 'PENDING_SYLLABUS'
  | 'PENDING_SUBJECT_MATTER_EXPERT'
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

export type SubjectOperationalState =
  | 'NOT_STARTED'
  | 'IN_PRODUCTION'
  | 'IN_REVIEW'
  | 'CHANGES_REQUESTED'
  | 'CORRECTION_SENT'
  | 'APPROVED';

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
  operationalState?: SubjectOperationalState;
  semesterNumber: number;
  expectedDeliveryDate?: string | null;
  progress: number;
  openObservationsCount: number;
  correctionSentCount: number;
  updatedAt?: string;
  createdFromChange?: boolean;
}

export interface ProjectRecentChanges {
  semestersAdded: number;
  subjectsAdded: number;
}

export interface ProjectChangeTimelineEntry {
  occurredAt: string;
  label: string;
  kind: 'PROJECT_CREATED' | 'SEMESTER_ADDED' | 'SUBJECT_ADDED';
  semesterNumber?: number | null;
  subjectName?: string | null;
  subjectId?: string | null;
  actionUrl?: string;
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
  subjectMatterExpertType: SubjectMatterExpertType;
  subjectMatterExpertStatus: SubjectMatterExpertStatus;
  activatedAt?: string | null;
  expertConfirmedAt?: string | null;
  productOwner: string;
  factoryOwner: string;
  observations: string;
  semesters: ProjectSemester[];
  subjects: SubjectVirtualization[];
  subjectsSummary?: SubjectSummary[];
  links: LinkResource[];
  recentChanges?: ProjectRecentChanges;
  changeTimeline?: ProjectChangeTimelineEntry[];
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
  createdFromChange?: boolean;
}

export interface SubjectVirtualization {
  id: string;
  projectId: string;
  semesterNumber: number;
  name: string;
  expectedDeliveryDate?: string;
  status: SubjectStatus;
  operationalState?: SubjectOperationalState;
  progress: number;
  createdFromChange?: boolean;
  openObservationsCount?: number;
  correctionSentCount?: number;
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
  notificationStatus?: 'PENDING' | 'SENT';
  correctionNotificationStatus?: 'PENDING' | 'SENT' | null;
  checklistItemId?: string;
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
