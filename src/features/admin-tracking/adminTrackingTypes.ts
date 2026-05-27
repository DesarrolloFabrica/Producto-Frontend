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
  /** Null en filas legacy/finalizadas simplificadas (sin estado institucional real). */
  operationalState: InstitutionalOperationalState | null;
  currentResponsibleRole: Role | null;
  slaStatus: SlaStatus | null;
  stageDueAt: string | null;
  lastReturnReason: string | null;
  semesterNumbers: number[];
  subjectsTotal: number;
  subjectsReady: number;
  openObservations: number;
  isReturned: boolean;
  isFinalized: boolean;
  isLegacyOnly: boolean;
  /** Pipeline completo solo cuando hay operationalState institucional real. */
  showInstitutionalPipeline: boolean;
  /** Etiqueta para tarjetas simplificadas (legacy / finalizado). */
  simplifiedStatusLabel: string | null;
  /** Estado legacy del proyecto (solo filas pre-institutional). */
  projectStatus: ProjectStatus | null;
  /** Fecha de creación del proyecto (GET /projects.createdAt). */
  projectCreatedAt: string | null;
  sortPriority: number;
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
