import type { Priority, ProjectStatus, Role } from '../../types/domain';
import type { SubjectOperationalState } from '../../types/domain';

export type ApiModality = 'VIRTUAL' | 'HIBRIDA' | 'PRESENCIAL';
export type ApiPriority = Priority;
export type ApiProjectStatus = ProjectStatus;
export type ApiChecklistStatus =
  | 'NO_EXISTE'
  | 'PENDIENTE'
  | 'EN_PRODUCCION'
  | 'ENTREGADO'
  | 'APROBADO'
  | 'RECHAZADO';
export type ApiSubjectStatus =
  | 'PENDING'
  | 'IN_PRODUCTION'
  | 'SUBMITTED'
  | 'IN_REVIEW'
  | 'CHANGES_REQUESTED'
  | 'APPROVED'
  | 'DELIVERED';
export type ApiSemesterStatus =
  | 'PENDING'
  | 'IN_PRODUCTION'
  | 'PARTIAL_REVIEW'
  | 'CHANGES_REQUESTED'
  | 'APPROVED'
  | 'DELIVERED';

export interface ApiProjectOwner {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface ApiSubjectSummary {
  id: string;
  name: string;
  status: ApiSubjectStatus;
  operationalState?: SubjectOperationalState;
  semesterNumber: number;
  expectedDeliveryDate?: string | null;
  progress: number;
  factoryProductionStatus?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  factoryProductionCompletedAt?: string | null;
  openObservationsCount: number;
  correctionSentCount: number;
  updatedAt: string;
  createdFromChange: boolean;
}

export interface ApiProjectRecentChanges {
  semestersAdded: number;
  subjectsAdded: number;
}

export interface ApiProjectChangeTimelineEntry {
  occurredAt: string;
  label: string;
  kind: 'PROJECT_CREATED' | 'SEMESTER_ADDED' | 'SUBJECT_ADDED';
  semesterNumber?: number | null;
  subjectName?: string | null;
  subjectId?: string | null;
  actionUrl?: string;
}

export interface ApiProjectListItem {
  id: string;
  school: string;
  program: string;
  modality: ApiModality;
  requestType: string;
  priority: ApiPriority;
  status: ApiProjectStatus;
  progress: number;
  expectedDeliveryDate: string | null;
  activatedAt?: string | null;
  subjectMatterExpertType?: 'INTERNAL' | 'EXTERNAL';
  subjectMatterExpertStatus?: 'READY' | 'PENDING';
  expertConfirmedAt?: string | null;
  productOwner: ApiProjectOwner;
  factoryOwner: ApiProjectOwner | null;
  createdAt: string;
  subjectsSummary?: ApiSubjectSummary[];
}

export interface ApiChecklistItem {
  id: string;
  subjectId: string;
  topicId?: string | null;
  category?: string | null;
  label: string;
  status: ApiChecklistStatus;
  ownerRole: Role;
  createdAt: string;
  updatedAt: string;
}

export interface ApiProjectActionResponse {
  projectId: string;
  projectStatus: ApiProjectStatus;
  projectProgress: number;
}

export interface ApiTopicDetail {
  id: string;
  name: string;
  order: number;
  checklist: ApiChecklistItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiSubjectDetail {
  id: string;
  name: string;
  expectedDeliveryDate?: string | null;
  status: ApiSubjectStatus;
  operationalState?: SubjectOperationalState;
  progress: number;
  factoryProductionStatus?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  factoryProductionCompletedAt?: string | null;
  openObservationsCount?: number;
  correctionSentCount?: number;
  createdFromChange: boolean;
  topics: ApiTopicDetail[];
  checklist: ApiChecklistItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiSemesterDetail {
  id: string;
  semesterNumber: number;
  status: ApiSemesterStatus;
  createdFromChange: boolean;
  factoryExpectedDate: string | null;
  continuationDate: string | null;
  subjects: ApiSubjectDetail[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiProjectLink {
  id: string;
  title: string;
  url: string;
  type: string;
  uploadedBy: Role;
  createdAt: string;
}

export interface ApiProjectDetail extends ApiProjectListItem {
  observations: string | null;
  updatedAt: string;
  semesters: ApiSemesterDetail[];
  links: ApiProjectLink[];
  recentChanges?: ApiProjectRecentChanges;
  changeTimeline?: ApiProjectChangeTimelineEntry[];
}

export interface ApiCreateProjectSyllabus {
  hasSyllabus: boolean;
  url?: string;
}

export interface ApiCreateProjectSubject {
  name: string;
  topics: string[];
}

export interface ApiCreateProjectSemester {
  semesterNumber: number;
  factoryExpectedDate?: string;
  subjects: ApiCreateProjectSubject[];
}

export interface ApiCreateProjectPayload {
  school: string;
  program: string;
  modality: ApiModality;
  subjectMatterExpertType: 'INTERNAL' | 'EXTERNAL';
  requestType: string;
  priority: ApiPriority;
  expectedDeliveryDate?: string;
  factoryOwnerId?: string;
  observations?: string;
  syllabus?: ApiCreateProjectSyllabus;
  semesters: ApiCreateProjectSemester[];
}

export interface ApiAddSemesterSubjectPayload {
  name: string;
  topics?: string[];
}

export interface ApiAddSemesterPayload {
  semesterNumber: number;
  factoryExpectedDate: string;
  subjects: ApiAddSemesterSubjectPayload[];
  changeReason?: string;
}

export interface ApiAddSubjectPayload {
  name: string;
  topics: string[];
  expectedDeliveryDate: string;
  changeReason?: string;
}

export interface ApiAddTopicsPayload {
  topics: string[];
  changeReason?: string;
}
