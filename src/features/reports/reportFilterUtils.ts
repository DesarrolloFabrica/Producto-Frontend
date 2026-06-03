import type { ReportFiltersState } from '../../services/types/reportingApi.types';
import { clampReportPreviewLimit } from './reportLimits';
import { sanitizeSemesterNumber, sanitizeUserRole } from './reportFilterConstants';

function filterFieldsOnly(
  filters: ReportFiltersState,
): Record<string, string | number | boolean | undefined> {
  const semesterNumber = sanitizeSemesterNumber(filters.semesterNumber);

  return {
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    school: filters.school && filters.school !== 'all' ? filters.school : undefined,
    modality: filters.modality && filters.modality !== 'all' ? filters.modality : undefined,
    priority: filters.priority || undefined,
    projectStatus: filters.projectStatus || undefined,
    institutionalState: filters.institutionalState || undefined,
    legacyWorkflow:
      filters.legacyWorkflow === 'true'
        ? true
        : filters.legacyWorkflow === 'false'
          ? false
          : undefined,
    slaStatus: filters.slaStatus || undefined,
    query: filters.query || undefined,
    productOwnerId: filters.productOwnerId || undefined,
    factoryOwnerId: filters.factoryOwnerId || undefined,
    projectId: filters.projectId || undefined,
    operationalState: filters.operationalState || undefined,
    factoryProductionStatus: filters.factoryProductionStatus || undefined,
    status: filters.status || undefined,
    role: sanitizeUserRole(filters.role),
    semesterNumber,
    onlyOpen: filters.onlyOpen || undefined,
    onlyOverdue: filters.onlyOverdue || undefined,
    onlyFinalized: filters.onlyFinalized || undefined,
    responsibleRole: sanitizeUserRole(filters.responsibleRole),
    hasRadicationNumber:
      filters.hasRadicationNumber === 'true'
        ? true
        : filters.hasRadicationNumber === 'false'
          ? false
          : undefined,
    radicationStatus: filters.radicationStatus || undefined,
    entityType: filters.entityType || undefined,
    auditRole: sanitizeUserRole(filters.auditRole),
  };
}

/** Preview paginado: page + limit acotado (25 por defecto, máx. 100). */
export function filtersToPreviewParams(
  filters: ReportFiltersState,
  page: number,
  limit: number,
): Record<string, string | number | boolean | undefined> {
  return {
    page: Math.max(1, page),
    limit: clampReportPreviewLimit(limit),
    ...filterFieldsOnly(filters),
  };
}

/**
 * Export Excel/PDF: solo filtros.
 * El backend ignora `limit` en export y aplica REPORT_EXPORT_MAX_ROWS internamente.
 * No enviar limit > 500 evita 400 del ValidationPipe.
 */
export function filtersToExportParams(
  filters: ReportFiltersState,
): Record<string, string | number | boolean | undefined> {
  return filterFieldsOnly(filters);
}
