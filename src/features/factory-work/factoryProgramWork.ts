import type { ApiFactoryProgramWorkItem, ApiSubjectOperationalState } from '../../services/factoryApi';
import type { ProgramOperationalWorkItemDto } from '../../services/institutionalWorkflowApi';
import type { InstitutionalOperationalState, Role, SlaStatus } from '../../types/domain';

/** Filtros de bandeja programática para Fábrica (compatibles con query param `status`). */
export type FactoryProgramTrayFilter =
  | 'NOT_STARTED'
  | 'IN_PRODUCTION'
  | 'IN_REVIEW'
  | 'CHANGES_REQUESTED'
  | 'CORRECTION_SENT'
  | 'APPROVED'
  | 'OVERDUE';

const FACTORY_STATE_TO_INSTITUTIONAL: Record<ApiSubjectOperationalState, InstitutionalOperationalState> = {
  NOT_STARTED: 'PENDING_FACTORY',
  IN_PRODUCTION: 'IN_FACTORY_PRODUCTION',
  IN_REVIEW: 'PENDING_PLANNING_PRODUCTION_VALIDATION',
  CHANGES_REQUESTED: 'CHANGES_REQUESTED_BY_PRODUCT',
  CORRECTION_SENT: 'RETURNED_TO_PRODUCT_FROM_PLANNING',
  APPROVED: 'FINALIZED',
};

function resolveInstitutionalState(sem: ApiFactoryProgramWorkItem['semesters'][number]): InstitutionalOperationalState {
  if (sem.institutionalOperationalState) {
    return sem.institutionalOperationalState as InstitutionalOperationalState;
  }
  return FACTORY_STATE_TO_INSTITUTIONAL[sem.operationalState];
}

function resolveSemesterResponsibleRole(
  sem: ApiFactoryProgramWorkItem['semesters'][number],
  institutionalState: InstitutionalOperationalState,
): Role {
  if (sem.currentResponsibleRole) {
    return sem.currentResponsibleRole as Role;
  }
  if (institutionalState === 'CHANGES_REQUESTED_BY_PRODUCT' && sem.openObservationsCount === 0) {
    return 'PRODUCT';
  }
  const fallback: Record<InstitutionalOperationalState, Role> = {
    PENDING_PLANNING_INITIAL_VALIDATION: 'PLANEACION',
    RETURNED_TO_PRODUCT_FROM_PLANNING: 'PRODUCT',
    PENDING_FACTORY: 'FABRICA',
    IN_FACTORY_PRODUCTION: 'FABRICA',
    PENDING_PLANNING_PRODUCTION_VALIDATION: 'PLANEACION',
    RETURNED_TO_FACTORY_FROM_PLANNING: 'FABRICA',
    PENDING_LMS_UPLOAD: 'LMS',
    IN_LMS_UPLOAD: 'LMS',
    PENDING_PLANNING_LMS_VALIDATION: 'PLANEACION',
    RETURNED_TO_LMS_FROM_PLANNING: 'LMS',
    PENDING_PRODUCT_ACADEMIC_REVIEW: 'PRODUCT',
    IN_PRODUCT_ACADEMIC_REVIEW: 'PRODUCT',
    CHANGES_REQUESTED_BY_PRODUCT: 'FABRICA',
    PENDING_PROJECT_RADICATION: 'PLANEACION',
    FINALIZED: 'PLANEACION',
  };
  return fallback[institutionalState] ?? 'PLANEACION';
}

function resolveFactoryProgramResponsibleRole(
  semesters: Array<{ currentResponsibleRole?: Role; institutionalOperationalState: InstitutionalOperationalState }>,
): Role {
  const factorySemester = semesters.find((sem) => sem.currentResponsibleRole === 'FABRICA');
  if (factorySemester?.currentResponsibleRole) return factorySemester.currentResponsibleRole;
  const active = semesters.find((sem) => sem.institutionalOperationalState !== 'FINALIZED');
  return active?.currentResponsibleRole ?? semesters[0]?.currentResponsibleRole ?? 'FABRICA';
}

/** Semestres donde Fábrica aún tiene trabajo de producción con plazo relevante. */
const FACTORY_SLA_STATES = new Set<ApiSubjectOperationalState>([
  'NOT_STARTED',
  'IN_PRODUCTION',
  'CHANGES_REQUESTED',
  'CORRECTION_SENT',
]);

/** Días naturales antes del plazo para marcar "En riesgo" (~20% de ventana de 22 días hábiles). */
const FACTORY_SLA_RISK_DAYS = 5;

function startOfLocalDay(value: string | Date, now = new Date()): number {
  const d = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(d.getTime())) {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  }
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function calendarDaysUntilDue(due: string | null, now = new Date()): number | null {
  if (!due) return null;
  const dueDay = startOfLocalDay(due, now);
  const today = startOfLocalDay(now, now);
  return Math.round((dueDay - today) / (24 * 60 * 60 * 1000));
}

function semesterFactorySlaApplies(state: ApiSubjectOperationalState): boolean {
  return FACTORY_SLA_STATES.has(state);
}

function computeFactorySlaStatus(due: string | null, slaApplies: boolean, now = new Date()): SlaStatus {
  if (!slaApplies) return 'ON_TIME';
  const daysLeft = calendarDaysUntilDue(due, now);
  if (daysLeft == null) return 'ON_TIME';
  if (daysLeft < 0) return 'OVERDUE';
  if (daysLeft <= FACTORY_SLA_RISK_DAYS) return 'AT_RISK';
  return 'ON_TIME';
}

function factorySlaRelevantSemesters(program: ApiFactoryProgramWorkItem) {
  return program.semesters.filter((s) => semesterFactorySlaApplies(s.operationalState));
}

function factoryProgramSlaDueDate(program: ApiFactoryProgramWorkItem): string | null {
  const relevant = factorySlaRelevantSemesters(program);
  const dates = relevant
    .map((s) => s.expectedDeliveryDate)
    .filter((d): d is string => Boolean(d));
  if (dates.length === 0) return null;
  return dates.reduce((nearest, current) =>
    startOfLocalDay(current) < startOfLocalDay(nearest) ? current : nearest,
  );
}

function worstFactorySlaStatus(statuses: SlaStatus[]): SlaStatus {
  const rank: Record<SlaStatus, number> = {
    OVERDUE: 5,
    AT_RISK: 4,
    ON_TIME: 3,
    FINALIZED_OVERDUE: 2,
    FINALIZED_ON_TIME: 1,
  };
  if (!statuses.length) return 'ON_TIME';
  return statuses.reduce((worst, current) =>
    (rank[current] ?? 0) > (rank[worst] ?? 0) ? current : worst,
  );
}

function computeFactoryProgramSla(program: ApiFactoryProgramWorkItem, now = new Date()): SlaStatus {
  const relevant = factorySlaRelevantSemesters(program);
  if (relevant.length === 0) return 'ON_TIME';
  return worstFactorySlaStatus(
    relevant.map((sem) =>
      computeFactorySlaStatus(sem.expectedDeliveryDate, true, now),
    ),
  );
}

function programHasSemesterState(
  program: ApiFactoryProgramWorkItem,
  state: ApiSubjectOperationalState,
): boolean {
  return program.semesters.some((s) => s.operationalState === state);
}

export function matchesFactoryProgramTrayFilter(
  program: ApiFactoryProgramWorkItem,
  filter: FactoryProgramTrayFilter,
): boolean {
  switch (filter) {
    case 'NOT_STARTED':
      return programHasSemesterState(program, 'NOT_STARTED');
    case 'IN_PRODUCTION':
      return programHasSemesterState(program, 'IN_PRODUCTION');
    case 'IN_REVIEW':
      return programHasSemesterState(program, 'IN_REVIEW');
    case 'CHANGES_REQUESTED':
      return programHasSemesterState(program, 'CHANGES_REQUESTED') || program.openObservations > 0;
    case 'CORRECTION_SENT':
      return programHasSemesterState(program, 'CORRECTION_SENT');
    case 'APPROVED':
      return (
        program.totalSemesters > 0 &&
        program.completedSemesters >= program.totalSemesters &&
        program.semesters.every((s) => s.operationalState === 'APPROVED')
      );
    case 'OVERDUE': {
      const sla = computeFactoryProgramSla(program);
      return sla === 'OVERDUE' || sla === 'AT_RISK';
    }
    default:
      return true;
  }
}

export function mapFactoryProgramToTableItem(
  program: ApiFactoryProgramWorkItem,
): ProgramOperationalWorkItemDto {
  const inReview = program.semesters.filter((s) => {
    const state = resolveInstitutionalState(s);
    return state === 'PENDING_PRODUCT_ACADEMIC_REVIEW' || state === 'IN_PRODUCT_ACADEMIC_REVIEW';
  }).length;
  const factoryDueDate = factoryProgramSlaDueDate(program) ?? program.nearestDueDate;
  const mappedSemesters = program.semesters.map((sem) => {
    const institutionalState = resolveInstitutionalState(sem);
    const responsibleRole = resolveSemesterResponsibleRole(sem, institutionalState);
    return {
      kind: 'semester' as const,
      semesterId: sem.semesterId ?? undefined,
      subjectId: sem.subjectId,
      subjectName: sem.subjectName,
      projectId: sem.projectId,
      program: sem.program,
      school: sem.school,
      semesterNumber: sem.semesterNumber,
      operationalState: institutionalState,
      currentResponsibleRole: responsibleRole,
      stageDueAt: sem.expectedDeliveryDate,
      slaStatus: computeFactorySlaStatus(
        sem.expectedDeliveryDate,
        semesterFactorySlaApplies(sem.operationalState),
      ),
      availableActions: [],
      lastReturnReason: null,
      actionUrl: sem.actionUrl,
      subjectsTotal: sem.subjectsTotal,
      subjectsReady: sem.subjectsReady,
      openObservations: sem.openObservationsCount,
    };
  });

  return {
    kind: 'program',
    projectId: program.projectId,
    program: program.program,
    school: program.school,
    totalSemesters: program.totalSemesters,
    completedSemesters: program.completedSemesters,
    totalSubjects: program.totalSubjects,
    completedSubjects: program.completedSubjects,
    pendingSubjects: program.pendingSubjects,
    academicReviewPendingCount: inReview,
    activeStageSummary: program.activeStageSummary,
    nearestDueDate: factoryDueDate,
    slaStatus: computeFactoryProgramSla(program),
    currentResponsibleRole: resolveFactoryProgramResponsibleRole(
      mappedSemesters.map((sem) => ({
        currentResponsibleRole: sem.currentResponsibleRole,
        institutionalOperationalState: sem.operationalState,
      })),
    ),
    openObservations: program.openObservations,
    actionUrl: program.actionUrl,
    semesters: mappedSemesters,
  };
}

export function mapFactoryProgramsToTableItems(
  programs: ApiFactoryProgramWorkItem[],
): ProgramOperationalWorkItemDto[] {
  return programs.map(mapFactoryProgramToTableItem);
}

export function groupFactoryProgramsByTray(
  programs: ApiFactoryProgramWorkItem[],
): Record<FactoryProgramTrayFilter, ProgramOperationalWorkItemDto[]> {
  const filters: FactoryProgramTrayFilter[] = [
    'NOT_STARTED',
    'IN_PRODUCTION',
    'IN_REVIEW',
    'CHANGES_REQUESTED',
    'CORRECTION_SENT',
    'APPROVED',
    'OVERDUE',
  ];
  const result = {} as Record<FactoryProgramTrayFilter, ProgramOperationalWorkItemDto[]>;
  for (const key of filters) {
    result[key] = programs
      .filter((p) => matchesFactoryProgramTrayFilter(p, key))
      .map(mapFactoryProgramToTableItem);
  }
  return result;
}

export function filterFactoryProgramsBySearch(
  programs: ProgramOperationalWorkItemDto[],
  search: string,
): ProgramOperationalWorkItemDto[] {
  const q = search.trim().toLowerCase();
  if (!q) return programs;
  return programs.filter(
    (p) => p.program.toLowerCase().includes(q) || p.school.toLowerCase().includes(q),
  );
}

export function parseFactoryProgramTrayFilter(raw: string | null): FactoryProgramTrayFilter | undefined {
  const allowed: FactoryProgramTrayFilter[] = [
    'NOT_STARTED',
    'IN_PRODUCTION',
    'IN_REVIEW',
    'CHANGES_REQUESTED',
    'CORRECTION_SENT',
    'APPROVED',
    'OVERDUE',
  ];
  if (raw && (allowed as string[]).includes(raw)) return raw as FactoryProgramTrayFilter;
  return undefined;
}

export function matchesFactoryProgramNewlyAdded(program: ApiFactoryProgramWorkItem): boolean {
  return program.semesters.some((s) => s.createdFromChange);
}

export function filterNewlyAddedFactoryPrograms(
  programs: ApiFactoryProgramWorkItem[],
): ProgramOperationalWorkItemDto[] {
  return programs.filter(matchesFactoryProgramNewlyAdded).map(mapFactoryProgramToTableItem);
}


export function countFactoryProgramsWithNewSemesters(programs: ApiFactoryProgramWorkItem[]): number {
  return programs.filter(matchesFactoryProgramNewlyAdded).length;
}

export function countFactoryProgramsUpcoming(programs: ApiFactoryProgramWorkItem[]): number {
  const today = new Date();

  return programs.filter((p) => {
    const due = factoryProgramSlaDueDate(p);
    if (!due) return false;
    const daysLeft = calendarDaysUntilDue(due, today);
    if (daysLeft == null || daysLeft < 0) return false;
    return daysLeft <= FACTORY_SLA_RISK_DAYS && factorySlaRelevantSemesters(p).length > 0;
  }).length;
}
