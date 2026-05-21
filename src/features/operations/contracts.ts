import type { ChecklistStatus, Priority, Role } from '../../types/domain';

export interface CreateProjectPayload {
  school: string;
  program: string;
  modality: string;
  requestType: string;
  priority: Priority;
  expectedDeliveryDate: string;
  productOwner: string;
  observations?: string;
  syllabus?: { hasSyllabus: boolean; url?: string };
  semesters: CreateSemesterPayload[];
}

export interface CreateSemesterPayload {
  semesterNumber: number;
  factoryExpectedDate: string;
  observations?: string;
  subjects: CreateSubjectPayload[];
}

export interface CreateSubjectPayload {
  semesterNumber: number;
  name: string;
  topics: CreateTopicPayload[];
}

export interface CreateTopicPayload {
  name: string;
  order?: number;
}

export interface UpdateChecklistItemPayload {
  projectId: string;
  subjectId: string;
  checklistItemId: string;
  status: ChecklistStatus;
}

export interface CreateObservationPayload {
  projectId: string;
  subjectId?: string;
  relatedEntity: string;
  text: string;
  authorName: string;
  authorRole: Role;
}

export interface UpdateObservationStatusPayload {
  projectId: string;
  observationId: string;
  status: 'ABIERTA' | 'EN_CORRECCION' | 'RESUELTA';
}

export interface SubmitSubjectPayload {
  projectId: string;
  subjectId: string;
}

export interface ApproveSubjectPayload {
  projectId: string;
  subjectId: string;
}

export interface RejectSubjectPayload {
  projectId: string;
  subjectId: string;
  reason?: string;
}

export interface DeliverProjectPayload {
  projectId: string;
  deliveryTarget: 'PRODUCT' | 'LMS';
}
