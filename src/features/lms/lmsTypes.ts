import type { InstitutionalOperationalState, Role, SlaStatus } from '../../types/domain';
import type { OperationalWorkItemDto, ProgramOperationalWorkItemDto } from '../../services/institutionalWorkflowApi';
import type { LmsSubjectPreview } from '../../services/lmsApi';
import {
  type InboxAdvancedFilters,
  matchesInboxQuery,
  matchesInboxSlaFilter,
  sortInboxRows,
} from '../operations-v2/operationalInboxFilters';

export type LmsDashboardFilter =
  | 'all'
  | 'pending'
  | 'in-upload'
  | 'returned'
  | 'completed'
  | 'history';

const LMS_QUEUE_STATES = {
  pending: 'PENDING_LMS_UPLOAD',
  inUpload: 'IN_LMS_UPLOAD',
  returned: 'RETURNED_TO_LMS_FROM_PLANNING',
} as const satisfies Record<string, InstitutionalOperationalState>;

export type LmsProgramRow = {
  kind: 'program';
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

export type LmsWorkRow =
  | LmsProgramRow
  | {
      kind: 'completed-program';
      id: string;
      projectId: string;
      program: string;
      school: string;
      subjectsCompleted: number;
      stageDueAt: string | null;
      slaStatus: SlaStatus;
      actionUrl: string;
    };

export function parseLmsFilter(raw: string | null): LmsDashboardFilter {
  const allowed: LmsDashboardFilter[] = ['all', 'pending', 'in-upload', 'returned', 'completed', 'history'];
  if (raw && allowed.includes(raw as LmsDashboardFilter)) {
    return raw as LmsDashboardFilter;
  }
  return 'all';
}

function programHasSemesterState(
  row: LmsProgramRow,
  state: InstitutionalOperationalState,
): boolean {
  return row.semesters.some((semester) => semester.operationalState === state);
}

export function mapLmsProgramWorkItem(item: ProgramOperationalWorkItemDto): LmsProgramRow {
  return {
    kind: 'program',
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

export function mapCompletedPrograms(previews: LmsSubjectPreview[]): LmsWorkRow[] {
  const byProject = new Map<string, LmsSubjectPreview[]>();
  for (const item of previews) {
    const list = byProject.get(item.projectId) ?? [];
    list.push(item);
    byProject.set(item.projectId, list);
  }

  return [...byProject.entries()].map(([projectId, items]) => {
    const first = items[0]!;
    return {
      kind: 'completed-program',
      id: projectId,
      projectId,
      program: first.program,
      school: first.school,
      subjectsCompleted: items.length,
      stageDueAt: first.stageDueAt,
      slaStatus: first.slaStatus,
      actionUrl: `/projects/${projectId}/operations`,
    };
  });
}

export function filterLmsRows(rows: LmsWorkRow[], filter: LmsDashboardFilter): LmsWorkRow[] {
  switch (filter) {
    case 'pending':
      return rows.filter(
        (row) => row.kind === 'program' && programHasSemesterState(row, LMS_QUEUE_STATES.pending),
      );
    case 'in-upload':
      return rows.filter(
        (row) => row.kind === 'program' && programHasSemesterState(row, LMS_QUEUE_STATES.inUpload),
      );
    case 'returned':
      return rows.filter(
        (row) => row.kind === 'program' && programHasSemesterState(row, LMS_QUEUE_STATES.returned),
      );
    case 'completed':
    case 'history':
      return rows.filter((row) => row.kind === 'completed-program');
    case 'all':
    default:
      return rows.filter((row) => row.kind === 'program');
  }
}

export function countLmsRowsByFilter(rows: LmsWorkRow[], filter: LmsDashboardFilter): number {
  return filterLmsRows(rows, filter).length;
}

export function countLmsProgramsWithState(
  programs: ProgramOperationalWorkItemDto[],
  state: InstitutionalOperationalState,
): number {
  return programs.filter((program) =>
    program.semesters.some((semester) => semester.operationalState === state),
  ).length;
}

export function applyLmsInboxAdvancedFilters(
  rows: LmsWorkRow[],
  advanced: InboxAdvancedFilters,
): LmsWorkRow[] {
  const filtered = rows.filter((row) => {
    const queryOk = matchesInboxQuery(
      advanced.query,
      row.school,
      row.program,
      row.program,
      row.kind === 'program' ? 'Carga LMS' : 'Completada',
    );
    if (!queryOk) return false;
    if (row.kind === 'completed-program') {
      return advanced.sla === 'all';
    }
    return matchesInboxSlaFilter(advanced.sla, row.slaStatus);
  });

  return sortInboxRows(filtered, advanced.sort, {
    dueAt: (row) => row.stageDueAt,
    school: (row) => row.school,
    program: (row) => row.program,
    stage: (row) => (row.kind === 'program' ? 'Carga LMS' : 'Completada'),
  });
}

export const LMS_INBOX_CATEGORIES: Array<{ id: LmsDashboardFilter; label: string }> = [
  { id: 'all', label: 'Todas' },
  { id: 'pending', label: 'Pendientes de carga' },
  { id: 'in-upload', label: 'En carga' },
  { id: 'returned', label: 'Devueltas' },
  { id: 'completed', label: 'Completadas' },
  { id: 'history', label: 'Historial' },
];
