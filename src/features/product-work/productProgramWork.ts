import type { InstitutionalOperationalState, Priority, SlaStatus } from '../../types/domain';
import type {
  OperationalWorkItemDto,
  ProgramOperationalWorkItemDto,
} from '../../services/institutionalWorkflowApi';
import type { VirtualizationProject } from '../../types/domain';
import type { OperationalObservation } from '../../types/domain';
import {
  buildWorkItemsFromProjects,
  type SubjectOperationalState,
  type SubjectWorkItem,
} from '../operations/subjectOperationalState';

/** Filtros de bandeja programática (compatibles con query params legacy `status`). */
export type ProductProgramTrayFilter =
  | 'NOT_STARTED'
  | 'IN_PRODUCTION'
  | 'IN_REVIEW'
  | 'CORRECTION_SENT'
  | 'CHANGES_REQUESTED'
  | 'APPROVED'
  | 'OVERDUE';

export type ProductProgramWorkQuery = {
  status?: ProductProgramTrayFilter;
  search?: string;
  program?: string;
  school?: string;
  priority?: Priority;
  dueFrom?: string;
  dueTo?: string;
  sort?: 'dueDate' | 'updatedAt' | 'priority';
  page?: number;
  limit?: number;
};

const PLANNING_INITIAL = 'PENDING_PLANNING_INITIAL_VALIDATION' as InstitutionalOperationalState;

const FACTORY_STATES = new Set<InstitutionalOperationalState>([
  'PENDING_FACTORY',
  'IN_FACTORY_PRODUCTION',
  'RETURNED_TO_FACTORY_FROM_PLANNING',
  'PENDING_PLANNING_PRODUCTION_VALIDATION',
  'CHANGES_REQUESTED_BY_PRODUCT',
]);

const ACADEMIC_REVIEW_STATES = new Set<InstitutionalOperationalState>([
  'PENDING_PRODUCT_ACADEMIC_REVIEW',
  'IN_PRODUCT_ACADEMIC_REVIEW',
]);

const RETURNED_TO_PRODUCT = 'RETURNED_TO_PRODUCT_FROM_PLANNING' as InstitutionalOperationalState;

function programSemesters(program: ProgramOperationalWorkItemDto): OperationalWorkItemDto[] {
  return (program.semesters ?? []) as OperationalWorkItemDto[];
}

function programHasSemesterInStates(
  program: ProgramOperationalWorkItemDto,
  states: Set<InstitutionalOperationalState>,
): boolean {
  return programSemesters(program).some((s) => states.has(s.operationalState));
}

function programHasSemesterState(
  program: ProgramOperationalWorkItemDto,
  state: InstitutionalOperationalState,
): boolean {
  return programSemesters(program).some((s) => s.operationalState === state);
}

export function matchesProductProgramTrayFilter(
  program: ProgramOperationalWorkItemDto,
  filter: ProductProgramTrayFilter,
): boolean {
  switch (filter) {
    case 'NOT_STARTED':
      return programHasSemesterState(program, PLANNING_INITIAL);
    case 'IN_PRODUCTION':
      return programHasSemesterInStates(program, FACTORY_STATES);
    case 'IN_REVIEW':
      return program.academicReviewPendingCount > 0 || programHasSemesterInStates(program, ACADEMIC_REVIEW_STATES);
    case 'CORRECTION_SENT':
      return programHasSemesterState(program, RETURNED_TO_PRODUCT);
    case 'CHANGES_REQUESTED':
      return program.openObservations > 0;
    case 'APPROVED':
      return (
        program.totalSemesters > 0 &&
        program.completedSemesters >= program.totalSemesters &&
        programSemesters(program).every((s) => s.operationalState === 'FINALIZED')
      );
    case 'OVERDUE':
      return program.slaStatus === 'OVERDUE' || program.slaStatus === 'AT_RISK';
    default:
      return true;
  }
}

function toTs(value?: string | null) {
  if (!value) return 0;
  const ts = new Date(value).getTime();
  return Number.isFinite(ts) ? ts : 0;
}

export function filterProductPrograms(
  programs: ProgramOperationalWorkItemDto[],
  query: ProductProgramWorkQuery,
): ProgramOperationalWorkItemDto[] {
  let items = [...programs];

  if (query.status) {
    items = items.filter((p) => matchesProductProgramTrayFilter(p, query.status!));
  }

  if (query.program) {
    const needle = query.program.toLowerCase();
    items = items.filter((p) => p.program.toLowerCase().includes(needle));
  }

  if (query.school) {
    items = items.filter((p) => p.school === query.school);
  }

  if (query.search) {
    const needle = query.search.toLowerCase();
    items = items.filter(
      (p) => p.program.toLowerCase().includes(needle) || p.school.toLowerCase().includes(needle),
    );
  }

  if (query.dueFrom) {
    const from = new Date(query.dueFrom).getTime();
    items = items.filter((p) => toTs(p.nearestDueDate) >= from);
  }
  if (query.dueTo) {
    const to = new Date(query.dueTo).getTime();
    items = items.filter((p) => toTs(p.nearestDueDate) <= to);
  }

  const sort = query.sort ?? 'dueDate';
  items.sort((a, b) => {
    if (sort === 'dueDate') return toTs(a.nearestDueDate) - toTs(b.nearestDueDate);
    if (sort === 'priority') {
      const rank: Record<SlaStatus, number> = {
        OVERDUE: 0,
        AT_RISK: 1,
        ON_TIME: 2,
        FINALIZED_OVERDUE: 3,
        FINALIZED_ON_TIME: 4,
      };
      return (rank[a.slaStatus] ?? 9) - (rank[b.slaStatus] ?? 9);
    }
    return toTs(b.nearestDueDate) - toTs(a.nearestDueDate);
  });

  return items;
}

export function groupProgramsByTray(
  programs: ProgramOperationalWorkItemDto[],
): Record<ProductProgramTrayFilter, ProgramOperationalWorkItemDto[]> {
  const filters: ProductProgramTrayFilter[] = [
    'NOT_STARTED',
    'IN_PRODUCTION',
    'IN_REVIEW',
    'CORRECTION_SENT',
    'CHANGES_REQUESTED',
    'OVERDUE',
    'APPROVED',
  ];
  const result = {} as Record<ProductProgramTrayFilter, ProgramOperationalWorkItemDto[]>;
  for (const key of filters) {
    result[key] = programs.filter((p) => matchesProductProgramTrayFilter(p, key));
  }
  return result;
}

const LEGACY_STAGE_LABELS: Record<SubjectOperationalState, string> = {
  NOT_STARTED: 'Por iniciar',
  IN_PRODUCTION: 'Fábrica',
  IN_REVIEW: 'Revisión',
  CHANGES_REQUESTED: 'Correcciones',
  CORRECTION_SENT: 'Devolución',
  APPROVED: 'Finalizado',
};

function worstSla(statuses: SlaStatus[]): SlaStatus {
  const rank: Record<SlaStatus, number> = {
    OVERDUE: 5,
    AT_RISK: 4,
    ON_TIME: 3,
    FINALIZED_OVERDUE: 2,
    FINALIZED_ON_TIME: 1,
  };
  if (!statuses.length) return 'ON_TIME';
  return statuses.reduce((worst, cur) => ((rank[cur] ?? 0) > (rank[worst] ?? 0) ? cur : worst));
}

/** Agrupa materias legacy en filas de programa para modo mock / legacyWorkflow. */
export function buildLegacyProgramWorkItems(
  projects: VirtualizationProject[],
  observations: OperationalObservation[] = [],
): ProgramOperationalWorkItemDto[] {
  const workItems = buildWorkItemsFromProjects(projects, observations);
  const byProject = new Map<string, { project: VirtualizationProject; items: SubjectWorkItem[] }>();

  for (const item of workItems) {
    const project = projects.find((p) => p.id === item.projectId);
    if (!project) continue;
    const entry = byProject.get(item.projectId) ?? { project, items: [] };
    entry.items.push(item);
    byProject.set(item.projectId, entry);
  }

  const programs: ProgramOperationalWorkItemDto[] = [];

  for (const [projectId, { project, items }] of byProject) {
    const stageCounts = new Map<string, number>();
    for (const item of items) {
      const label = LEGACY_STAGE_LABELS[item.operationalState];
      stageCounts.set(label, (stageCounts.get(label) ?? 0) + 1);
    }

    const totalSubjects = items.length;
    const approved = items.filter((i) => i.operationalState === 'APPROVED').length;
    const semesters = [...new Set(items.map((i) => i.semesterNumber))].sort((a, b) => a - b);
    const dueDates = items.map((i) => i.expectedDeliveryDate).filter(Boolean);
    const nearestDueDate =
      dueDates.length > 0
        ? dueDates.reduce((min, d) => (toTs(d) < toTs(min) ? d : min))
        : null;

    const inReview = items.filter((i) => i.operationalState === 'IN_REVIEW').length;

    programs.push({
      kind: 'program',
      projectId,
      program: project.program,
      school: project.school,
      totalSemesters: semesters.length,
      completedSemesters: 0,
      totalSubjects,
      completedSubjects: approved,
      pendingSubjects: totalSubjects - approved,
      academicReviewPendingCount: inReview,
      activeStageSummary: [...stageCounts.entries()]
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count),
      nearestDueDate,
      slaStatus: worstSla(
        items.map((i) => {
          const due = toTs(i.expectedDeliveryDate);
          if (due > 0 && due < Date.now() && i.operationalState !== 'APPROVED') return 'OVERDUE' as SlaStatus;
          return 'ON_TIME' as SlaStatus;
        }),
      ),
      currentResponsibleRole: 'PRODUCT',
      openObservations: items.reduce((sum, i) => sum + i.openObservationsCount, 0),
      actionUrl: `/projects/${projectId}/operations`,
      semesters: items.map((item) => ({
        kind: 'subject' as const,
        subjectId: item.subjectId,
        subjectName: item.subjectName,
        projectId,
        program: project.program,
        school: project.school,
        semesterNumber: item.semesterNumber,
        operationalState: mapLegacyToInstitutionalState(item.operationalState),
        currentResponsibleRole: 'PRODUCT' as const,
        stageDueAt: item.expectedDeliveryDate || null,
        slaStatus: 'ON_TIME' as SlaStatus,
        availableActions: [],
        lastReturnReason: null,
        actionUrl: item.actionUrl,
      })),
    });
  }

  return programs.sort((a, b) => toTs(a.nearestDueDate) - toTs(b.nearestDueDate));
}

function mapLegacyToInstitutionalState(state: SubjectOperationalState): InstitutionalOperationalState {
  switch (state) {
    case 'NOT_STARTED':
      return 'PENDING_PLANNING_INITIAL_VALIDATION';
    case 'IN_PRODUCTION':
      return 'IN_FACTORY_PRODUCTION';
    case 'IN_REVIEW':
      return 'PENDING_PRODUCT_ACADEMIC_REVIEW';
    case 'CHANGES_REQUESTED':
      return 'CHANGES_REQUESTED_BY_PRODUCT';
    case 'CORRECTION_SENT':
      return 'RETURNED_TO_PRODUCT_FROM_PLANNING';
    case 'APPROVED':
      return 'FINALIZED';
    default:
      return 'PENDING_PLANNING_INITIAL_VALIDATION';
  }
}

export function uniqueProgramSchools(programs: ProgramOperationalWorkItemDto[]): string[] {
  return [...new Set(programs.map((p) => p.school).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'es'),
  );
}

export function parseProductProgramTrayFilter(raw: string | null): ProductProgramTrayFilter | undefined {
  const allowed: ProductProgramTrayFilter[] = [
    'NOT_STARTED',
    'IN_PRODUCTION',
    'IN_REVIEW',
    'CORRECTION_SENT',
    'CHANGES_REQUESTED',
    'APPROVED',
    'OVERDUE',
  ];
  if (raw && (allowed as string[]).includes(raw)) return raw as ProductProgramTrayFilter;
  return undefined;
}

/** API institucional gana sobre agregación legacy cuando existe el mismo projectId. */
export function mergeProductProgramSources(
  apiPrograms: ProgramOperationalWorkItemDto[],
  legacyPrograms: ProgramOperationalWorkItemDto[],
): ProgramOperationalWorkItemDto[] {
  const byId = new Map<string, ProgramOperationalWorkItemDto>();
  for (const program of legacyPrograms) byId.set(program.projectId, program);
  for (const program of apiPrograms) byId.set(program.projectId, program);
  return [...byId.values()].sort((a, b) => toTs(a.nearestDueDate) - toTs(b.nearestDueDate));
}
