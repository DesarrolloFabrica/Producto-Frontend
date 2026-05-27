import type { InstitutionalOperationalState, Role, SlaStatus } from '../../types/domain';
import type { OperationalWorkItemDto } from '../../services/institutionalWorkflowApi';
import type { ProjectRadicationWorkItemDto } from '../../services/projectRadicationApi';
import type { PlanningFinalizedProject, PlanningSubjectPreview } from '../../services/planningApi';
import {
  type InboxAdvancedFilters,
  matchesInboxQuery,
  matchesInboxSlaFilter,
  sortInboxRows,
} from '../operations-v2/operationalInboxFilters';

export type PlanningDashboardFilter =
  | 'all'
  | 'initial'
  | 'production'
  | 'lms'
  | 'radication'
  | 'tracking'
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
      actionUrl: string;
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
      kind: 'tracking';
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
      actionUrl: string;
      subjectsTotal: number;
      subjectsReady: number;
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
      actionUrl: string;
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
    'tracking',
    'returned',
    'history',
  ];
  if (raw && allowed.includes(raw as PlanningDashboardFilter)) {
    return raw as PlanningDashboardFilter;
  }
  return 'all';
}

export function mapTrackingWorkItem(item: OperationalWorkItemDto): PlanningWorkRow {
  const isSemester = item.kind === 'semester' && item.semesterId;
  return {
    kind: 'tracking',
    id: isSemester ? item.semesterId! : item.subjectId,
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
    actionUrl: item.actionUrl,
    subjectsTotal: item.subjectsTotal ?? 0,
    subjectsReady: item.subjectsReady ?? 0,
  };
}

export function mapSubjectWorkItem(item: OperationalWorkItemDto): PlanningWorkRow {
  const isSemester = item.kind === 'semester' && item.semesterId;
  return {
    kind: 'subject',
    id: isSemester ? item.semesterId! : item.subjectId,
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
    actionUrl: item.actionUrl,
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
    actionUrl: `/subjects/${item.subjectId}/operations`,
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
    case 'tracking':
      return rows.filter((r) => r.kind === 'tracking');
    case 'returned':
      return rows.filter((r) => r.kind === 'returned');
    case 'history':
      return rows.filter((r) => r.kind === 'finalized');
    case 'all':
    default:
      return rows.filter(
        (r) =>
          r.kind === 'subject' ||
          r.kind === 'radication' ||
          r.kind === 'tracking' ||
          r.kind === 'returned',
      );
  }
}

export function countPlanningRowsByFilter(
  rows: PlanningWorkRow[],
  filter: PlanningDashboardFilter,
): number {
  return filterPlanningRows(rows, filter).length;
}

function planningRowDueAt(row: PlanningWorkRow): string | null {
  if (row.kind === 'radication') return row.planningRadicationCheckDueAt;
  if (row.kind === 'finalized') return row.radicatedAt;
  if (row.kind === 'subject' || row.kind === 'tracking' || row.kind === 'returned') {
    return row.stageDueAt;
  }
  return null;
}

function planningRowStage(row: PlanningWorkRow): string {
  if (row.kind === 'finalized') return 'Finalizada';
  if (row.kind === 'radication') return 'Radicación';
  if (row.kind === 'subject' || row.kind === 'tracking' || row.kind === 'returned') {
    return row.stageLabel || row.operationalState;
  }
  return '';
}

function planningRowSla(row: PlanningWorkRow): SlaStatus | null {
  if (row.kind === 'subject' || row.kind === 'tracking' || row.kind === 'returned') {
    return row.slaStatus;
  }
  return null;
}

export function applyPlanningInboxAdvancedFilters(
  rows: PlanningWorkRow[],
  advanced: InboxAdvancedFilters,
): PlanningWorkRow[] {
  const filtered = rows.filter((row) => {
    const queryOk = matchesInboxQuery(
      advanced.query,
      row.school,
      row.program,
      row.kind === 'radication' || row.kind === 'finalized'
        ? row.radicationNumber
        : row.kind === 'subject' || row.kind === 'tracking' || row.kind === 'returned'
          ? row.subjectName
          : null,
      planningRowStage(row),
    );
    if (!queryOk) return false;
    if (row.kind === 'radication' || row.kind === 'finalized') {
      return advanced.sla === 'all';
    }
    return matchesInboxSlaFilter(advanced.sla, planningRowSla(row));
  });

  return sortInboxRows(filtered, advanced.sort, {
    dueAt: planningRowDueAt,
    school: (row) => row.school,
    program: (row) => row.program,
    stage: planningRowStage,
  });
}

export const PLANNING_INBOX_CATEGORIES: Array<{ id: PlanningDashboardFilter; label: string }> = [
  { id: 'all', label: 'Todas' },
  { id: 'initial', label: 'Validación inicial' },
  { id: 'production', label: 'Validación producción' },
  { id: 'lms', label: 'Validación LMS' },
  { id: 'radication', label: 'Radicación' },
  { id: 'tracking', label: 'En seguimiento' },
  { id: 'returned', label: 'Devueltas' },
  { id: 'history', label: 'Finalizadas / Historial' },
];
