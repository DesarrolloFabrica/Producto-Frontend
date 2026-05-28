import type { InstitutionalOperationalState, Role, SlaStatus } from '../../types/domain';
import type { OperationalWorkItemDto, ProgramOperationalWorkItemDto } from '../../services/institutionalWorkflowApi';
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

const PLANNING_VALIDATION_STATES = {
  initial: 'PENDING_PLANNING_INITIAL_VALIDATION',
  production: 'PENDING_PLANNING_PRODUCTION_VALIDATION',
  lms: 'PENDING_PLANNING_LMS_VALIDATION',
} as const satisfies Record<string, InstitutionalOperationalState>;

export type PlanningProgramRow = {
  kind: 'program';
  variant: 'pending' | 'tracking';
  /** Proyecto en validación de radicado por Planeación (solo bandeja / seguimiento). */
  radicationReview?: boolean;
  id: string;
  projectId: string;
  program: string;
  school: string;
  stageDueAt: string | null;
  slaStatus: SlaStatus;
  actionUrl: string;
  totalSemesters: number;
  completedSemesters: number;
  totalSubjects: number;
  completedSubjects: number;
  activeStageSummary: Array<{ label: string; count: number }>;
  currentResponsibleRole: Role;
  semesters: OperationalWorkItemDto[];
};

export type PlanningWorkRow =
  | PlanningProgramRow
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
      kind: 'returned-program';
      id: string;
      projectId: string;
      program: string;
      school: string;
      subjectsAffected: number;
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
      actionUrl: string;
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

function programHasSemesterState(
  row: PlanningProgramRow,
  state: InstitutionalOperationalState,
): boolean {
  return row.semesters.some((semester) => semester.operationalState === state);
}

export function mapProgramWorkItem(
  item: ProgramOperationalWorkItemDto,
  variant: 'pending' | 'tracking',
): PlanningProgramRow {
  return {
    kind: 'program',
    variant,
    id: item.projectId,
    projectId: item.projectId,
    program: item.program,
    school: item.school,
    stageDueAt: item.nearestDueDate,
    slaStatus: item.slaStatus,
    actionUrl: item.actionUrl,
    totalSemesters: item.totalSemesters,
    completedSemesters: item.completedSemesters,
    totalSubjects: item.totalSubjects,
    completedSubjects: item.completedSubjects,
    activeStageSummary: item.activeStageSummary,
    currentResponsibleRole: item.currentResponsibleRole,
    semesters: item.semesters,
  };
}

export function mapProgramTrackingWorkItem(
  item: ProgramOperationalWorkItemDto,
  options?: { radicationReview?: boolean },
): PlanningWorkRow {
  const row = mapProgramWorkItem(item, 'tracking');
  if (options?.radicationReview) {
    return { ...row, radicationReview: true };
  }
  return row;
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

export function mapReturnedPrograms(previews: PlanningSubjectPreview[]): PlanningWorkRow[] {
  const byProject = new Map<string, PlanningSubjectPreview[]>();
  for (const item of previews) {
    const list = byProject.get(item.projectId) ?? [];
    list.push(item);
    byProject.set(item.projectId, list);
  }

  return [...byProject.entries()].map(([projectId, items]) => {
    const first = items[0]!;
    const lastActivity =
      items
        .map((item) => item.lastReturnReason)
        .filter(Boolean)
        .join(' · ') || null;
    const nearestDue = items
      .map((item) => item.stageDueAt)
      .filter((due): due is string => Boolean(due))
      .sort()[0] ?? null;

    return {
      kind: 'returned-program',
      id: projectId,
      projectId,
      program: first.program,
      school: first.school,
      subjectsAffected: items.length,
      stageDueAt: nearestDue,
      slaStatus: first.slaStatus,
      lastActivity,
      actionUrl: `/projects/${projectId}/operations`,
    };
  });
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
    actionUrl: `/projects/${item.projectId}/operations`,
  };
}

export function filterPlanningRows(
  rows: PlanningWorkRow[],
  filter: PlanningDashboardFilter,
): PlanningWorkRow[] {
  switch (filter) {
    case 'initial':
      return rows.filter(
        (row) =>
          row.kind === 'program' &&
          programHasSemesterState(row, PLANNING_VALIDATION_STATES.initial),
      );
    case 'production':
      return rows.filter(
        (row) =>
          row.kind === 'program' &&
          programHasSemesterState(row, PLANNING_VALIDATION_STATES.production),
      );
    case 'lms':
      return rows.filter(
        (row) =>
          row.kind === 'program' &&
          programHasSemesterState(row, PLANNING_VALIDATION_STATES.lms),
      );
    case 'radication':
      return rows.filter((row) => row.kind === 'program' && row.radicationReview);
    case 'tracking':
      return rows.filter((row) => row.kind === 'program' && row.variant === 'tracking');
    case 'returned':
      return rows.filter((row) => row.kind === 'returned-program');
    case 'history':
      return rows.filter((row) => row.kind === 'finalized');
    case 'all':
    default:
      return rows.filter(
        (row) => row.kind === 'program' || row.kind === 'returned-program',
      );
  }
}

export function countPlanningRowsByFilter(
  rows: PlanningWorkRow[],
  filter: PlanningDashboardFilter,
): number {
  return filterPlanningRows(rows, filter).length;
}

export function countPlanningProgramsWithState(
  programs: ProgramOperationalWorkItemDto[],
  state: InstitutionalOperationalState,
): number {
  return programs.filter((program) =>
    program.semesters.some((semester) => semester.operationalState === state),
  ).length;
}

function planningRowDueAt(row: PlanningWorkRow): string | null {
  if (row.kind === 'radication') return row.planningRadicationCheckDueAt;
  if (row.kind === 'finalized') return row.radicatedAt;
  if (row.kind === 'program' || row.kind === 'returned-program') return row.stageDueAt;
  return null;
}

function planningRowStage(row: PlanningWorkRow): string {
  if (row.kind === 'finalized') return 'Finalizada';
  if (row.kind === 'radication') return 'Radicación';
  if (row.kind === 'program') {
    if (row.radicationReview) return 'Radicación';
    return row.variant === 'tracking' ? 'Seguimiento' : 'Validación';
  }
  if (row.kind === 'returned-program') return 'Devuelta';
  return '';
}

function planningRowSla(row: PlanningWorkRow): SlaStatus | null {
  if (row.kind === 'program' || row.kind === 'returned-program') return row.slaStatus;
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
        : row.program,
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
