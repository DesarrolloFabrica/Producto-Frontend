import type { InstitutionalOperationalState, Role, SlaStatus } from '../../types/domain';
import type { OperationalWorkItemDto } from '../../services/institutionalWorkflowApi';
import type { ProjectRadicationWorkItemDto } from '../../services/projectRadicationApi';
import type { PlanningFinalizedProject, PlanningSubjectPreview } from '../../services/planningApi';

export type PlanningDashboardFilter =
  | 'all'
  | 'initial'
  | 'production'
  | 'lms'
  | 'radication'
  | 'returned'
  | 'history';

export type PlanningWorkRow =
  | {
      kind: 'subject';
      id: string;
      subjectId: string;
      projectId: string;
      subjectName: string;
      program: string;
      school: string;
      semesterNumber: number;
      operationalState: InstitutionalOperationalState;
      stageLabel: string;
      responsibleRole: Role;
      stageDueAt: string | null;
      slaStatus: SlaStatus;
      lastActivity: string | null;
    }
  | {
      kind: 'radication';
      id: string;
      projectId: string;
      program: string;
      school: string;
      radicationNumber: string | null;
      radicatedAt: string | null;
      scopeSubjectsApproved: number;
      scopeSubjectsTotal: number;
      planningRadicationCheckDueAt: string | null;
      lastRadicationReturnReason: string | null;
    }
  | {
      kind: 'returned';
      id: string;
      subjectId: string;
      projectId: string;
      subjectName: string;
      program: string;
      school: string;
      operationalState: InstitutionalOperationalState;
      stageLabel: string;
      responsibleRole: Role;
      stageDueAt: string | null;
      slaStatus: SlaStatus;
      lastActivity: string | null;
    }
  | {
      kind: 'finalized';
      id: string;
      projectId: string;
      program: string;
      school: string;
      radicationNumber: string | null;
      radicatedAt: string | null;
      productOwnerName: string;
      subjectsCount: number;
      semestersCount: number;
    };

export function parsePlanningFilter(raw: string | null): PlanningDashboardFilter {
  const allowed: PlanningDashboardFilter[] = [
    'all',
    'initial',
    'production',
    'lms',
    'radication',
    'returned',
    'history',
  ];
  if (raw && allowed.includes(raw as PlanningDashboardFilter)) {
    return raw as PlanningDashboardFilter;
  }
  return 'all';
}

export function mapSubjectWorkItem(item: OperationalWorkItemDto): PlanningWorkRow {
  return {
    kind: 'subject',
    id: item.subjectId,
    subjectId: item.subjectId,
    projectId: item.projectId,
    subjectName: item.subjectName,
    program: item.program,
    school: item.school,
    semesterNumber: item.semesterNumber,
    operationalState: item.operationalState,
    stageLabel: '',
    responsibleRole: item.currentResponsibleRole,
    stageDueAt: item.stageDueAt,
    slaStatus: item.slaStatus,
    lastActivity: item.lastReturnReason,
  };
}

export function mapRadicationWorkItem(item: ProjectRadicationWorkItemDto): PlanningWorkRow {
  return {
    kind: 'radication',
    id: item.projectId,
    projectId: item.projectId,
    program: item.program,
    school: item.school,
    radicationNumber: item.radicationNumber,
    radicatedAt: item.radicatedAt,
    scopeSubjectsApproved: item.scopeSubjectsApproved,
    scopeSubjectsTotal: item.scopeSubjectsTotal,
    planningRadicationCheckDueAt: item.planningRadicationCheckDueAt,
    lastRadicationReturnReason: item.lastRadicationReturnReason,
  };
}

export function mapReturnedPreview(item: PlanningSubjectPreview): PlanningWorkRow {
  return {
    kind: 'returned',
    id: item.subjectId,
    subjectId: item.subjectId,
    projectId: item.projectId,
    subjectName: item.subjectName,
    program: item.program,
    school: item.school,
    operationalState: item.operationalState,
    stageLabel: '',
    responsibleRole: item.currentResponsibleRole,
    stageDueAt: item.stageDueAt,
    slaStatus: item.slaStatus,
    lastActivity: item.lastReturnReason,
  };
}

export function mapFinalizedProject(item: PlanningFinalizedProject): PlanningWorkRow {
  return {
    kind: 'finalized',
    id: item.projectId,
    projectId: item.projectId,
    program: item.program,
    school: item.school,
    radicationNumber: item.radicationNumber,
    radicatedAt: item.radicatedAt ?? item.finalizedAt,
    productOwnerName: item.productOwnerName,
    subjectsCount: item.subjectsCount,
    semestersCount: item.semestersCount,
  };
}

export function filterPlanningRows(
  rows: PlanningWorkRow[],
  filter: PlanningDashboardFilter,
): PlanningWorkRow[] {
  switch (filter) {
    case 'initial':
      return rows.filter(
        (r) => r.kind === 'subject' && r.operationalState === 'PENDING_PLANNING_INITIAL_VALIDATION',
      );
    case 'production':
      return rows.filter(
        (r) =>
          r.kind === 'subject' && r.operationalState === 'PENDING_PLANNING_PRODUCTION_VALIDATION',
      );
    case 'lms':
      return rows.filter(
        (r) => r.kind === 'subject' && r.operationalState === 'PENDING_PLANNING_LMS_VALIDATION',
      );
    case 'radication':
      return rows.filter((r) => r.kind === 'radication');
    case 'returned':
      return rows.filter((r) => r.kind === 'returned');
    case 'history':
      return rows.filter((r) => r.kind === 'finalized');
    case 'all':
    default:
      return rows.filter((r) => r.kind === 'subject' || r.kind === 'radication');
  }
}
