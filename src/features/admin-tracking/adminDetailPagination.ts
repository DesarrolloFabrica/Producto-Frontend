export const ADMIN_DETAIL_SEMESTERS_PAGE_SIZE = 5;
export const ADMIN_DETAIL_SUBJECTS_PAGE_SIZE = 8;
export const ADMIN_DETAIL_CHECKLIST_PAGE_SIZE = 10;

export function adminDetailTotalPages(totalItems: number, pageSize: number): number {
  if (totalItems <= 0) return 1;
  return Math.ceil(totalItems / pageSize);
}

export function adminDetailSafePage(page: number, totalItems: number, pageSize: number): number {
  const totalPages = adminDetailTotalPages(totalItems, pageSize);
  if (page < 1) return 1;
  if (page > totalPages) return totalPages;
  return page;
}

export function paginateAdminDetail<T>(rows: T[], page: number, pageSize: number): T[] {
  const safe = adminDetailSafePage(page, rows.length, pageSize);
  const start = (safe - 1) * pageSize;
  return rows.slice(start, start + pageSize);
}
