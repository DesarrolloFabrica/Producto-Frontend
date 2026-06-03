import type { ReportFilterOptions, ReportFiltersState } from '../../services/types/reportingApi.types';
import { DEFAULT_REPORT_FILTERS } from '../../services/types/reportingApi.types';
import { labelForEntityType, labelForUserRole } from './reportFilterConstants';

const FILTER_LABELS: Record<keyof ReportFiltersState, string> = {
  dateFrom: 'Desde',
  dateTo: 'Hasta',
  school: 'Escuela',
  modality: 'Modalidad',
  priority: 'Prioridad',
  projectStatus: 'Estado solicitud',
  institutionalState: 'Estado institucional',
  legacyWorkflow: 'Flujo legacy',
  slaStatus: 'SLA',
  query: 'Búsqueda',
  productOwnerId: 'Owner Product',
  factoryOwnerId: 'Owner Fábrica',
  projectId: 'Programa',
  operationalState: 'Estado operativo',
  factoryProductionStatus: 'Estado producción',
  status: 'Estado observación',
  role: 'Rol autor',
  semesterNumber: 'Semestre',
  onlyOpen: 'Solo abiertas',
  onlyOverdue: 'Solo vencidos',
  onlyFinalized: 'Solo finalizados',
  responsibleRole: 'Rol responsable',
  hasRadicationNumber: 'Radicación',
  radicationStatus: 'Estado radicación',
  entityType: 'Tipo entidad',
  auditRole: 'Rol auditoría',
};

function labelForValue(
  key: keyof ReportFiltersState,
  value: string,
  filterOptions: ReportFilterOptions | null,
): string {
  const maps: Partial<Record<keyof ReportFiltersState, keyof ReportFilterOptions>> = {
    school: 'schools',
    modality: 'modalities',
    priority: 'priorities',
    slaStatus: 'slaStatuses',
    projectStatus: 'projectStatuses',
    institutionalState: 'institutionalStates',
    operationalState: 'operationalStates',
    status: 'observationStatuses',
    factoryProductionStatus: 'factoryProductionStatuses',
    radicationStatus: 'radicationStatuses',
    hasRadicationNumber: 'hasRadicationOptions',
  };
  const optionsKey = maps[key];
  if (optionsKey && filterOptions?.[optionsKey]) {
    const found = (filterOptions[optionsKey] as { value: string; label: string }[]).find(
      (o) => o.value === value,
    );
    if (found) return found.label;
  }
  if (key === 'hasRadicationNumber') {
    if (value === 'true') return 'Con número';
    if (value === 'false') return 'Sin número';
  }
  if (key === 'projectId' && filterOptions?.radicatedPrograms) {
    const found = filterOptions.radicatedPrograms.find((p) => p.projectId === value);
    if (found) return found.program;
  }
  if (key === 'role' || key === 'auditRole' || key === 'responsibleRole') {
    return labelForUserRole(value);
  }
  if (key === 'entityType') {
    return labelForEntityType(value);
  }
  return value;
}

export type ActiveFilterChip = {
  key: keyof ReportFiltersState;
  label: string;
  valueLabel: string;
};

export function countActiveFilters(filters: ReportFiltersState): number {
  return getActiveFilterChips(filters, null).length;
}

export function getActiveFilterChips(
  filters: ReportFiltersState,
  filterOptions: ReportFilterOptions | null,
): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];

  (Object.keys(DEFAULT_REPORT_FILTERS) as (keyof ReportFiltersState)[]).forEach((key) => {
    const value = filters[key];
    if (key === 'query' || key === 'projectId') return;
    if (typeof value === 'boolean') {
      if (value) chips.push({ key, label: FILTER_LABELS[key], valueLabel: 'Sí' });
      return;
    }
    if (typeof value === 'string' && value.trim()) {
      chips.push({
        key,
        label: FILTER_LABELS[key],
        valueLabel: labelForValue(key, value, filterOptions),
      });
    }
  });

  if (filters.query.trim()) {
    chips.unshift({ key: 'query', label: 'Búsqueda', valueLabel: filters.query.trim() });
  }
  if (filters.projectId.trim()) {
    chips.push({
      key: 'projectId',
      label: 'Programa',
      valueLabel: labelForValue('projectId', filters.projectId, filterOptions),
    });
  }

  return chips;
}

export function hasActiveFilters(filters: ReportFiltersState): boolean {
  return getActiveFilterChips(filters, null).length > 0 || Boolean(filters.query || filters.projectId);
}

export function clearFilterKey(
  filters: ReportFiltersState,
  key: keyof ReportFiltersState,
): ReportFiltersState {
  const next = { ...filters };
  const defaultValue = DEFAULT_REPORT_FILTERS[key];
  if (typeof defaultValue === 'boolean') {
    (next[key] as boolean) = false;
  } else {
    (next[key] as string) = '';
  }
  if (key === 'projectId') next.query = '';
  return next;
}

export function suggestionToFilters(
  filters: ReportFiltersState,
  suggestion: { projectId: string; label: string; hasRadication: boolean },
  reportId: string,
): ReportFiltersState {
  const next = { ...filters, query: suggestion.label };
  if (reportId === 'radications' && suggestion.hasRadication) {
    next.projectId = suggestion.projectId;
  } else {
    next.projectId = '';
  }
  return next;
}
