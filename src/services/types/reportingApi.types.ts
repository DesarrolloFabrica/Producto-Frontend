import type { Role } from '../../types/domain';

export type ReportSearchSuggestion = {
  projectId: string;
  label: string;
  subtitle: string;
  radicationNumber?: string;
  hasRadication: boolean;
};

export type ReportFilterOption = {
  value: string;
  label: string;
};

export type ReportRadicatedProgramOption = {
  projectId: string;
  program: string;
  school: string;
  radicationNumber: string;
  label: string;
};

export type ReportFilterOptions = {
  reportId: string;
  schools: ReportFilterOption[];
  modalities?: ReportFilterOption[];
  priorities?: ReportFilterOption[];
  slaStatuses?: ReportFilterOption[];
  projectStatuses?: ReportFilterOption[];
  institutionalStates?: ReportFilterOption[];
  operationalStates?: ReportFilterOption[];
  observationStatuses?: ReportFilterOption[];
  factoryProductionStatuses?: ReportFilterOption[];
  radicationStatuses?: ReportFilterOption[];
  hasRadicationOptions?: ReportFilterOption[];
  radicatedPrograms?: ReportRadicatedProgramOption[];
};

export type ReportCatalogItem = {
  id: string;
  name: string;
  description: string;
  allowedRoles: Role[];
  supportsExcel: boolean;
  supportsPdf: boolean;
  filterKeys: string[];
};

export type ReportColumn = {
  key: string;
  label: string;
};

export type ReportPreviewResponse = {
  reportId: string;
  generatedAt: string;
  filters: Record<string, unknown>;
  columns: ReportColumn[];
  rows: Record<string, unknown>[];
  total: number;
  page: number;
  limit: number;
  sheets?: { name: string; columns: ReportColumn[]; rows: Record<string, unknown>[] }[];
};

export type ReportFiltersState = {
  dateFrom: string;
  dateTo: string;
  school: string;
  modality: string;
  priority: string;
  projectStatus: string;
  institutionalState: string;
  legacyWorkflow: string;
  slaStatus: string;
  query: string;
  productOwnerId: string;
  factoryOwnerId: string;
  projectId: string;
  operationalState: string;
  factoryProductionStatus: string;
  status: string;
  role: string;
  semesterNumber: string;
  onlyOpen: boolean;
  onlyOverdue: boolean;
  onlyFinalized: boolean;
  responsibleRole: string;
  hasRadicationNumber: string;
  radicationStatus: string;
  entityType: string;
  auditRole: string;
};

export const DEFAULT_REPORT_FILTERS: ReportFiltersState = {
  dateFrom: '',
  dateTo: '',
  school: '',
  modality: '',
  priority: '',
  projectStatus: '',
  institutionalState: '',
  legacyWorkflow: '',
  slaStatus: '',
  query: '',
  productOwnerId: '',
  factoryOwnerId: '',
  projectId: '',
  operationalState: '',
  factoryProductionStatus: '',
  status: '',
  role: '',
  semesterNumber: '',
  onlyOpen: false,
  onlyOverdue: false,
  onlyFinalized: false,
  responsibleRole: '',
  hasRadicationNumber: '',
  radicationStatus: '',
  entityType: '',
  auditRole: '',
};
