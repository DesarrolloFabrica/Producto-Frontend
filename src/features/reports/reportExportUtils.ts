import type { ReportCatalogItem, ReportFiltersState } from '../../services/types/reportingApi.types';

export function canExportRadicationPdf(
  report: ReportCatalogItem,
  filters: ReportFiltersState,
  radicatedProjectIds: Set<string>,
): boolean {
  if (!report.supportsPdf || report.id !== 'radications') return false;
  const projectId = filters.projectId?.trim();
  if (!projectId) return false;
  return radicatedProjectIds.has(projectId);
}

export function isPdfUnavailableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const status = (error as Error & { status?: number }).status;
  if (status === 400 || status === 404) return true;
  return error.message.includes('PDF no disponible');
}
