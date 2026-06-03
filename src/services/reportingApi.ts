import { env } from '../config/env';
import type {
  ReportCatalogItem,
  ReportFilterOptions,
  ReportPreviewResponse,
  ReportSearchSuggestion,
} from './types/reportingApi.types';

function toUrl(path: string) {
  const base = env.apiUrl.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

function readToken(): string | null {
  try {
    return localStorage.getItem('producto_access_token');
  } catch {
    return null;
  }
}

export function parseReportingApiError(text: string, status: number): string {
  const trimmed = text.trim();
  if (!trimmed) return `No se pudo completar la operación (código ${status}).`;
  try {
    const body = JSON.parse(trimmed) as {
      message?: string | string[];
      error?: string;
    };
    const msg = body.message;
    if (Array.isArray(msg)) return msg.join('. ');
    if (typeof msg === 'string' && msg.length > 0) return msg;
    if (body.error) return body.error;
  } catch {
    /* respuesta no JSON */
  }
  if (trimmed.length > 200) return `No se pudo completar la operación (código ${status}).`;
  return trimmed;
}

function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '' || value === false) continue;
    if (value === true) {
      search.set(key, 'true');
      continue;
    }
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export const reportingApi = {
  getCatalog(): Promise<ReportCatalogItem[]> {
    return fetch(toUrl('/reports/catalog'), {
      headers: {
        Accept: 'application/json',
        ...(readToken() ? { Authorization: `Bearer ${readToken()}` } : {}),
      },
      cache: 'no-store',
    }).then(async (res) => {
      if (!res.ok) throw new Error(`Error ${res.status}`);
      return res.json() as Promise<ReportCatalogItem[]>;
    });
  },

  getFilterOptions(reportId: string): Promise<ReportFilterOptions> {
    return fetch(toUrl(`/reports/${reportId}/filter-options`), {
      headers: {
        Accept: 'application/json',
        ...(readToken() ? { Authorization: `Bearer ${readToken()}` } : {}),
      },
      cache: 'no-store',
    }).then(async (res) => {
      if (!res.ok) {
        const text = await res.text();
        throw new Error(parseReportingApiError(text, res.status));
      }
      return res.json() as Promise<ReportFilterOptions>;
    });
  },

  getSearchSuggestions(reportId: string, q: string): Promise<ReportSearchSuggestion[]> {
    const params = new URLSearchParams({ q });
    return fetch(toUrl(`/reports/${reportId}/search-suggestions?${params.toString()}`), {
      headers: {
        Accept: 'application/json',
        ...(readToken() ? { Authorization: `Bearer ${readToken()}` } : {}),
      },
      cache: 'no-store',
    }).then(async (res) => {
      if (!res.ok) {
        const text = await res.text();
        throw new Error(parseReportingApiError(text, res.status));
      }
      return res.json() as Promise<ReportSearchSuggestion[]>;
    });
  },

  getPreview(
    reportId: string,
    params: Record<string, string | number | boolean | undefined>,
  ): Promise<ReportPreviewResponse> {
    return fetch(toUrl(`/reports/${reportId}/preview${buildQuery(params)}`), {
      headers: {
        Accept: 'application/json',
        ...(readToken() ? { Authorization: `Bearer ${readToken()}` } : {}),
      },
      cache: 'no-store',
    }).then(async (res) => {
      if (!res.ok) {
        const text = await res.text();
        throw new Error(parseReportingApiError(text, res.status));
      }
      return res.json() as Promise<ReportPreviewResponse>;
    });
  },

  async downloadExport(
    reportId: string,
    format: 'xlsx' | 'pdf',
    params: Record<string, string | number | boolean | undefined>,
  ): Promise<void> {
    const suffix = format === 'xlsx' ? 'export.xlsx' : 'export.pdf';
    const res = await fetch(toUrl(`/reports/${reportId}/${suffix}${buildQuery(params)}`), {
      headers: {
        ...(readToken() ? { Authorization: `Bearer ${readToken()}` } : {}),
      },
      cache: 'no-store',
    });
    if (!res.ok) {
      const text = await res.text();
      const message = parseReportingApiError(text, res.status);
      const error = new Error(message) as Error & { status?: number };
      error.status = res.status;
      throw error;
    }
    const blob = await res.blob();
    const disposition = res.headers.get('Content-Disposition');
    let fileName = `OperacionAcademicaCUN_Reporte.${format === 'xlsx' ? 'xlsx' : 'pdf'}`;
    const match = disposition?.match(/filename="([^"]+)"/);
    if (match?.[1]) fileName = match[1];

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  },
};
