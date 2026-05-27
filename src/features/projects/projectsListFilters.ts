import type { ProjectStatus, VirtualizationProject } from '../../types/domain';

export type ProjectsListQuery = {
  search?: string;
  school?: string;
  status?: ProjectStatus;
  page?: number;
  limit?: number;
};

export function filterProjectsList(
  projects: VirtualizationProject[],
  query: ProjectsListQuery,
): VirtualizationProject[] {
  let items = [...projects];

  if (query.search?.trim()) {
    const needle = query.search.trim().toLowerCase();
    items = items.filter(
      (p) =>
        p.program.toLowerCase().includes(needle) ||
        p.school.toLowerCase().includes(needle) ||
        p.modality.toLowerCase().includes(needle),
    );
  }

  if (query.school) {
    items = items.filter((p) => p.school === query.school);
  }

  if (query.status) {
    items = items.filter((p) => p.status === query.status);
  }

  return items;
}

export function uniqueProjectSchools(projects: VirtualizationProject[]): string[] {
  return [...new Set(projects.map((p) => p.school).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'es'),
  );
}

export function hasActiveProjectsFilters(query: ProjectsListQuery): boolean {
  return Boolean(query.search?.trim() || query.school || query.status);
}
