import type { InstitutionalOperationalAction, InstitutionalOperationalState, Role, SlaStatus } from '../../types/domain';
import type { OperationalWorkItemDto } from '../../services/institutionalWorkflowApi';
import type { LmsSubjectPreview } from '../../services/lmsApi';

export type LmsDashboardFilter =
  | 'all'
  | 'pending'
  | 'in-upload'
  | 'returned'
  | 'completed'
  | 'history';

export type LmsWorkRow = {
  kind: 'work' | 'returned' | 'completed';
  id: string;
  subjectId: string;
  projectId: string;
  subjectName: string;
  program: string;
  school: string;
  semesterNumber: number;
  operationalState: InstitutionalOperationalState;
  stageLabel: string;
  stageDueAt: string | null;
  slaStatus: SlaStatus;
  lastActivity: string | null;
  availableActions: InstitutionalOperationalAction[];
  actionUrl: string;
  semesterId?: string;
};

export function parseLmsFilter(raw: string | null): LmsDashboardFilter {
  const allowed: LmsDashboardFilter[] = ['all', 'pending', 'in-upload', 'returned', 'completed', 'history'];
  if (raw && allowed.includes(raw as LmsDashboardFilter)) {
    return raw as LmsDashboardFilter;
  }
  return 'all';
}

export function mapWorkItem(item: OperationalWorkItemDto): LmsWorkRow {
  return {
    kind: 'work',
    id: item.subjectId,
    subjectId: item.subjectId,
    projectId: item.projectId,
    subjectName: item.subjectName,
    program: item.program,
    school: item.school,
    semesterNumber: item.semesterNumber,
    operationalState: item.operationalState,
    stageLabel: '',
    stageDueAt: item.stageDueAt,
    slaStatus: item.slaStatus,
    lastActivity: item.lastReturnReason,
    availableActions: item.availableActions,
    actionUrl: item.actionUrl,
    semesterId: item.semesterId,
  };
}

export function mapPreview(item: LmsSubjectPreview, kind: 'returned' | 'completed'): LmsWorkRow {
  return {
    kind,
    id: item.subjectId,
    subjectId: item.subjectId,
    projectId: item.projectId,
    subjectName: item.subjectName,
    program: item.program,
    school: item.school,
    semesterNumber: item.semesterNumber,
    operationalState: item.operationalState,
    stageLabel: '',
    stageDueAt: item.stageDueAt,
    slaStatus: item.slaStatus,
    lastActivity: item.lastReturnReason,
    availableActions: item.availableActions,
    actionUrl: `/subjects/${item.subjectId}/operations`,
  };
}

export function filterLmsRows(rows: LmsWorkRow[], filter: LmsDashboardFilter): LmsWorkRow[] {
  switch (filter) {
    case 'pending':
      return rows.filter((r) => r.operationalState === 'PENDING_LMS_UPLOAD');
    case 'in-upload':
      return rows.filter((r) => r.operationalState === 'IN_LMS_UPLOAD');
    case 'returned':
      return rows.filter((r) => r.operationalState === 'RETURNED_TO_LMS_FROM_PLANNING');
    case 'completed':
      return rows.filter((r) => r.kind === 'completed');
    case 'history':
      return rows.filter((r) => r.kind === 'completed');
    case 'all':
    default:
      return rows.filter((r) => r.kind === 'work' || r.kind === 'returned');
  }
}
