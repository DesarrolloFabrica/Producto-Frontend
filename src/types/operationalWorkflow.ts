export type OperationalRoleV2 = 'PRODUCT' | 'FABRICA' | 'LMS' | 'PLANEACION' | 'ADMIN';

export type OperationalStateV2 =
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

export type SlaStatusV2 =
  | 'ON_TIME'
  | 'AT_RISK'
  | 'OVERDUE'
  | 'FINALIZED_ON_TIME'
  | 'FINALIZED_OVERDUE';

export type OperationalCheckStatusV2 = 'PENDING' | 'CHECKED' | 'RETURNED';

export type OperationalCheckKeyV2 =
  | 'PLANNING_INITIAL_VALIDATED'
  | 'FACTORY_CONTENT_DELIVERED'
  | 'PLANNING_PRODUCTION_VALIDATED'
  | 'LMS_UPLOAD_COMPLETED'
  | 'PLANNING_LMS_VALIDATED'
  | 'PRODUCT_ACADEMIC_APPROVED'
  | 'PLANNING_FINAL_RADICATED';

export interface OperationalUserRefV2 {
  id: string;
  name: string;
  role: OperationalRoleV2;
}

export interface OperationalCheckV2 {
  key: OperationalCheckKeyV2;
  label: string;
  responsibleRole: OperationalRoleV2;
  status: OperationalCheckStatusV2;
  checkedAt: string | null;
  checkedBy: OperationalUserRefV2 | null;
  comment: string | null;
  evidenceUrl: string | null;
  dueAt: string | null;
  meta?: Record<string, unknown>;
}

export type OperationalActionV2 =
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
  | 'PRODUCT_OPEN_ACADEMIC_CHECKLIST'
  | 'PRODUCT_REQUEST_CHANGES'
  | 'PRODUCT_APPROVE_ACADEMIC'
  | 'PRODUCT_RESUBMIT_REQUEST'
  | 'INSTITUTIONAL_SUBJECT_CREATED'
  | 'VIEW_TIMELINE'
  | 'VIEW_DETAIL';

export interface OperationalTransitionV2 {
  id: string;
  occurredAt: string;
  from: OperationalStateV2 | null;
  to: OperationalStateV2;
  action: OperationalActionV2;
  actor: OperationalUserRefV2;
  comment: string | null;
  returnReason: string | null;
  durationLabel: string | null;
  meta?: Record<string, unknown>;
}

export interface OperationalEvidenceV2 {
  id: string;
  label: string;
  url: string;
  kind: 'DRIVE' | 'LMS' | 'CREDENTIALS' | 'OTHER';
  addedAt: string;
  addedBy: OperationalUserRefV2;
}

export interface OperationalSubjectV2 {
  subjectId: string;
  projectId: string;
  subjectName: string;
  program: string;
  school: string;
  semesterNumber: number;
  modality: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  expectedDeliveryDate: string;

  operationalState: OperationalStateV2;
  currentStageLabel: string;
  currentResponsibleRole: OperationalRoleV2;

  createdAt: string;
  lastActivityAt: string;
  stageEnteredAt: string;
  stageDueAt: string;
  finalizedAt: string | null;

  checks: OperationalCheckV2[];
  timeline: OperationalTransitionV2[];
  evidences: OperationalEvidenceV2[];
  returnContext?: {
    returnedFromRole: OperationalRoleV2;
    comment: string;
    returnedAt: string;
  } | null;
}

export interface OperationalWorkItemV2 {
  subjectId: string;
  projectId: string;
  subjectName: string;
  program: string;
  school: string;
  semesterNumber: number;
  modality: string;
  priority: OperationalSubjectV2['priority'];
  expectedDeliveryDate: string;
  operationalState: OperationalStateV2;
  currentStageLabel: string;
  currentResponsibleRole: OperationalRoleV2;
  slaStatus: SlaStatusV2;
  stageDueAt: string;
  lastActivityAt: string;
  checksCompleted: number;
  checksTotal: number;
  primaryAction: OperationalActionV2;
  actions: OperationalActionV2[];
}

