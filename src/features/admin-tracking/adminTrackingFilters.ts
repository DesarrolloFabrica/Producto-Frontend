import type { AdminProgramTrackingRow } from './adminTrackingTypes';
import type { Role } from '../../types/domain';

export const ADMIN_TRACKING_PAGE_SIZE = 10;

export type AdminTrackingStatusFilter =
  | 'all'
  | 'overdue'
  | 'returned'
  | 'at_risk'
  | 'in_progress'
  | 'pre_institutional'
  | 'finalized';

export type AdminTrackingOwnerFilter = 'all' | Extract<Role, 'PRODUCT' | 'PLANEACION' | 'FABRICA' | 'LMS'>;

export type AdminTrackingFiltersState = {
  query: string;
  status: AdminTrackingStatusFilter;
  owner: AdminTrackingOwnerFilter;
  modality: string;
  school: string;
};

export const DEFAULT_ADMIN_TRACKING_FILTERS: AdminTrackingFiltersState = {
  query: '',
  status: 'all',
  owner: 'all',
  modality: 'all',
  school: 'all',
};

export const ADMIN_TRACKING_STATUS_OPTIONS: Array<{ id: AdminTrackingStatusFilter; label: string }> = [
  { id: 'all', label: 'Todos' },
  { id: 'overdue', label: 'Vencidos' },
  { id: 'returned', label: 'Devolución' },
  { id: 'at_risk', label: 'En riesgo' },
  { id: 'in_progress', label: 'En curso' },
  { id: 'pre_institutional', label: 'Pre-institutional' },
  { id: 'finalized', label: 'Finalizados' },
];

export const ADMIN_TRACKING_OWNER_OPTIONS: Array<{ id: AdminTrackingOwnerFilter; label: string }> = [
  { id: 'all', label: 'Todos' },
  { id: 'PRODUCT', label: 'Product' },
  { id: 'PLANEACION', label: 'Planeación' },
  { id: 'FABRICA', label: 'Fábrica' },
  { id: 'LMS', label: 'LMS' },
];

function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}

export function formatModalityFilterLabel(value: string): string {
  const normalized = value.trim();
  if (!normalized || normalized === '—') return normalized;
  return normalized
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function rowStatusCategory(row: AdminProgramTrackingRow): AdminTrackingStatusFilter {
  if (row.isFinalized) return 'finalized';
  if (row.isLegacyOnly) return 'pre_institutional';
  if (row.slaStatus === 'OVERDUE' || row.slaStatus === 'FINALIZED_OVERDUE') return 'overdue';
  if (row.isReturned) return 'returned';
  if (row.slaStatus === 'AT_RISK') return 'at_risk';
  return 'in_progress';
}

function rowOwnerForFilter(row: AdminProgramTrackingRow): Role | null {
  if (row.currentResponsibleRole) return row.currentResponsibleRole;
  if (row.isLegacyOnly) return 'PRODUCT';
  return null;
}

export function extractModalityOptions(rows: AdminProgramTrackingRow[]): string[] {
  const keys = new Map<string, string>();
  for (const row of rows) {
    const label = row.modality?.trim();
    if (!label || label === '—') continue;
    const key = normalizeKey(label);
    if (!keys.has(key)) keys.set(key, formatModalityFilterLabel(label));
  }
  return [...keys.entries()]
    .sort((a, b) => a[1].localeCompare(b[1], 'es'))
    .map(([, label]) => label);
}

export function extractSchoolOptions(rows: AdminProgramTrackingRow[]): string[] {
  const keys = new Map<string, string>();
  for (const row of rows) {
    const label = row.school?.trim();
    if (!label || label === '—') continue;
    const key = normalizeKey(label);
    if (!keys.has(key)) keys.set(key, label);
  }
  return [...keys.values()].sort((a, b) => a.localeCompare(b, 'es'));
}

export function hasActiveAdminFilters(filters: AdminTrackingFiltersState): boolean {
  return (
    filters.query.trim().length > 0 ||
    filters.status !== 'all' ||
    filters.owner !== 'all' ||
    filters.modality !== 'all' ||
    filters.school !== 'all'
  );
}

export function filterAdminTrackingRows(
  rows: AdminProgramTrackingRow[],
  filters: AdminTrackingFiltersState,
): AdminProgramTrackingRow[] {
  const q = filters.query.trim().toLowerCase();

  return rows.filter((row) => {
    if (q) {
      const semesterText = row.semesterNumbers.join(' ');
      const ownerText = `${row.productOwnerName ?? ''} ${row.factoryOwnerName ?? ''}`;
      const haystack =
        `${row.program} ${row.school} ${row.modality} ${semesterText} ${ownerText} ${row.currentResponsibleRole ?? ''}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (filters.status !== 'all' && rowStatusCategory(row) !== filters.status) return false;
    if (filters.owner !== 'all') {
      const owner = rowOwnerForFilter(row);
      if (owner !== filters.owner) return false;
    }
    if (
      filters.modality !== 'all' &&
      normalizeKey(row.modality) !== normalizeKey(filters.modality)
    ) {
      return false;
    }
    if (filters.school !== 'all' && normalizeKey(row.school) !== normalizeKey(filters.school)) {
      return false;
    }
    return true;
  });
}

export function countAdminRowsByStatus(
  rows: AdminProgramTrackingRow[],
): Record<AdminTrackingStatusFilter, number> {
  const counts: Record<AdminTrackingStatusFilter, number> = {
    all: rows.length,
    overdue: 0,
    returned: 0,
    at_risk: 0,
    in_progress: 0,
    pre_institutional: 0,
    finalized: 0,
  };
  for (const row of rows) {
    const cat = rowStatusCategory(row);
    counts[cat] += 1;
  }
  return counts;
}

export function adminTrackingTotalPages(totalItems: number, pageSize = ADMIN_TRACKING_PAGE_SIZE): number {
  if (totalItems <= 0) return 1;
  return Math.ceil(totalItems / pageSize);
}

export function adminTrackingSafePage(
  page: number,
  totalItems: number,
  pageSize = ADMIN_TRACKING_PAGE_SIZE,
): number {
  const totalPages = adminTrackingTotalPages(totalItems, pageSize);
  if (page < 1) return 1;
  if (page > totalPages) return totalPages;
  return page;
}

export function paginateAdminTrackingRows<T>(
  rows: T[],
  page: number,
  pageSize = ADMIN_TRACKING_PAGE_SIZE,
): T[] {
  const safePage = adminTrackingSafePage(page, rows.length, pageSize);
  const start = (safePage - 1) * pageSize;
  return rows.slice(start, start + pageSize);
}
