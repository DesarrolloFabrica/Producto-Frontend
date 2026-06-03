/** Tamaño de página por defecto en vista previa (backend acepta hasta 500). */
export const REPORT_PREVIEW_PAGE_SIZE = 25;

/** Máximo permitido en preview por solicitud del producto. */
export const REPORT_PREVIEW_MAX_LIMIT = 100;

/** Máximo que el DTO del backend acepta en query `limit`. */
export const REPORT_QUERY_MAX_LIMIT = 500;

export function clampReportPreviewLimit(limit: number): number {
  if (!Number.isFinite(limit) || limit < 1) return REPORT_PREVIEW_PAGE_SIZE;
  return Math.min(REPORT_PREVIEW_MAX_LIMIT, Math.max(1, Math.floor(limit)));
}
