import type { ProgramOperationalWorkItemDto } from '../../services/institutionalWorkflowApi';
import type { InstitutionalOperationalState, ProjectStatus, Role, SlaStatus } from '../../types/domain';

export type AdminTrackingKpis = {
  active: number;
  overdue: number;
  returned: number;
  finalized: number;
};

export type AdminProgramTrackingRow = {
  projectId: string;
  program: string;
  school: string;
  modality: string;
  /** Estado institucional para pipeline (incluye FINALIZED en cerrados). */
  operationalState: InstitutionalOperationalState | null;
  currentResponsibleRole: Role | null;
  slaStatus: SlaStatus | null;
  stageDueAt: string | null;
  nearestDueAt: string | null;
  lastReturnReason: string | null;
  semesterNumbers: number[];
  subjectsTotal: number;
  subjectsReady: number;
  completedSubjects: number;
  completedSemesters: number;
  totalSemesters: number;
  openObservations: number;
  isReturned: boolean;
  isFinalized: boolean;
  isLegacyOnly: boolean;
  simplifiedStatusLabel: string | null;
  projectStatus: ProjectStatus | null;
  projectCreatedAt: string | null;
  sortPriority: number;
  /** Resumen de etapas activas (tracking por programa). */
  activeStageSummary: Array<{ label: string; count: number }>;
  /** Item de tracking cuando el programa está en flujo institucional. */
  programWorkItem: ProgramOperationalWorkItemDto | null;
  /** Progreso agregado de materias (0–100) para filas pre-institutional. */
  productionProgressPercent: number | null;
  detailPath: string;
  productOwnerName: string | null;
  factoryOwnerName: string | null;
};

export type AdminInstitutionalTrackingData = {
  rows: AdminProgramTrackingRow[];
  kpis: AdminTrackingKpis;
};

export type {
  AdminTrackingFiltersState,
  AdminTrackingOwnerFilter,
  AdminTrackingStatusFilter,
} from './adminTrackingFilters';
