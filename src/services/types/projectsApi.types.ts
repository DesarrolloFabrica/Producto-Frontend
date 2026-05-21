import type { Priority, ProjectStatus, Role } from '../../types/domain';

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

export interface ApiProjectListItem {
  id: string;
  school: string;
  program: string;
  modality: ApiModality;
  requestType: string;
  priority: ApiPriority;
  status: ApiProjectStatus;
  progress: number;
  expectedDeliveryDate: string;
  productOwner: ApiProjectOwner;
  factoryOwner: ApiProjectOwner | null;
  createdAt: string;
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
  status: ApiSubjectStatus;
  progress: number;
  topics: ApiTopicDetail[];
  checklist: ApiChecklistItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiSemesterDetail {
  id: string;
  semesterNumber: number;
  status: ApiSemesterStatus;
  factoryExpectedDate: string;
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
  factoryExpectedDate: string;
  subjects: ApiCreateProjectSubject[];
}

export interface ApiCreateProjectPayload {
  school: string;
  program: string;
  modality: ApiModality;
  requestType: string;
  priority: ApiPriority;
  expectedDeliveryDate: string;
  factoryOwnerId?: string;
  observations?: string;
  syllabus?: ApiCreateProjectSyllabus;
  semesters: ApiCreateProjectSemester[];
}
