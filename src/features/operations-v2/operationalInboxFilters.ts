import type { SlaStatus } from '../../types/domain';

export type InboxSlaFilter = 'all' | 'on-time' | 'at-risk' | 'overdue';
export type InboxSortOption = 'dueAsc' | 'dueDesc' | 'schoolAsc' | 'programAsc' | 'stageAsc';

export interface InboxAdvancedFilters {
  query: string;
  sla: InboxSlaFilter;
  sort: InboxSortOption;
}

export const INBOX_PAGE_SIZE = 10;

export function parseInboxPage(params: URLSearchParams): number {
  const raw = Number(params.get('page'));
  return Number.isInteger(raw) && raw > 0 ? raw : 1;
}

export function inboxTotalPages(totalItems: number, pageSize = INBOX_PAGE_SIZE): number {
  return Math.max(1, Math.ceil(totalItems / pageSize) || 1);
}

export function paginateInboxRows<T>(rows: T[], page: number, pageSize = INBOX_PAGE_SIZE): T[] {
  const safePage = Math.min(Math.max(1, page), inboxTotalPages(rows.length, pageSize));
  const start = (safePage - 1) * pageSize;
  return rows.slice(start, start + pageSize);
}

export function inboxSafePage(page: number, totalItems: number, pageSize = INBOX_PAGE_SIZE): number {
  return Math.min(Math.max(1, page), inboxTotalPages(totalItems, pageSize));
}

export const DEFAULT_INBOX_ADVANCED_FILTERS: InboxAdvancedFilters = {
  query: '',
  sla: 'all',
  sort: 'dueAsc',
};

export function parseInboxAdvancedFilters(params: URLSearchParams): InboxAdvancedFilters {
  const slaRaw = params.get('sla');
  const sortRaw = params.get('sort');
  const sla: InboxSlaFilter =
    slaRaw === 'on-time' || slaRaw === 'at-risk' || slaRaw === 'overdue' ? slaRaw : 'all';
  const sort: InboxSortOption =
    sortRaw === 'dueDesc' ||
    sortRaw === 'schoolAsc' ||
    sortRaw === 'programAsc' ||
    sortRaw === 'stageAsc'
      ? sortRaw
      : 'dueAsc';
  return {
    query: params.get('q')?.trim() ?? '',
    sla,
    sort,
  };
}

export function hasActiveInboxAdvancedFilters(filters: InboxAdvancedFilters): boolean {
  return (
    filters.query.length > 0 ||
    filters.sla !== 'all' ||
    filters.sort !== DEFAULT_INBOX_ADVANCED_FILTERS.sort
  );
}

export function matchesInboxQuery(query: string, ...parts: Array<string | null | undefined>): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const haystack = parts
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(needle);
}

export function matchesInboxSlaFilter(sla: InboxSlaFilter, status: SlaStatus | null | undefined): boolean {
  if (sla === 'all') return true;
  if (!status) return false;
  if (sla === 'on-time') return status === 'ON_TIME' || status === 'FINALIZED_ON_TIME';
  if (sla === 'at-risk') return status === 'AT_RISK';
  return status === 'OVERDUE' || status === 'FINALIZED_OVERDUE';
}

export function compareNullableDates(a: string | null | undefined, b: string | null | undefined): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return new Date(a).getTime() - new Date(b).getTime();
}

export function sortInboxRows<T>(
  rows: T[],
  sort: InboxSortOption,
  accessors: {
    dueAt: (row: T) => string | null | undefined;
    school: (row: T) => string;
    program: (row: T) => string;
    stage: (row: T) => string;
  },
): T[] {
  const sorted = [...rows];
  sorted.sort((a, b) => {
    switch (sort) {
      case 'dueDesc':
        return compareNullableDates(accessors.dueAt(b), accessors.dueAt(a));
      case 'schoolAsc':
        return accessors.school(a).localeCompare(accessors.school(b), 'es');
      case 'programAsc':
        return accessors.program(a).localeCompare(accessors.program(b), 'es');
      case 'stageAsc':
        return accessors.stage(a).localeCompare(accessors.stage(b), 'es');
      case 'dueAsc':
      default:
        return compareNullableDates(accessors.dueAt(a), accessors.dueAt(b));
    }
  });
  return sorted;
}
