import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProjectsTable } from '../../components/tables/ProjectsTable';
import { ProjectsSummary } from '../../components/summary/ProjectsSummary';
import { PageHeader } from '../../components/ui/PageHeader';
import { ProjectsLoadNotice } from '../../components/feedback/ProjectsLoadNotice';
import { useOperations } from '../../features/operations/OperationsContext';
import { ProductWorkPagination } from '../product-work/components/ProductWorkPagination';
import { useAuth } from '../auth/AuthContext';
import { FactoryProjectsList } from './FactoryProjectsList';
import {
  ProjectsListFilterSummary,
  ProjectsListFilters,
} from './components/ProjectsListFilters';
import { filterProjectsList, type ProjectsListQuery } from './projectsListFilters';
import type { ProjectStatus } from '../../types/domain';
import { projectStatusLabels } from '../../utils/status';

const DEFAULT_PAGE_SIZE = 10;

function parseIntOr(value: string | null, fallback: number) {
  const n = value ? Number(value) : NaN;
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function parseProjectStatus(value: string | null): ProjectStatus | undefined {
  if (!value) return undefined;
  return value in projectStatusLabels ? (value as ProjectStatus) : undefined;
}

export function ProjectsPage() {
  const { projects, isLoadingProjects, projectsError, refreshProjects, backendEnabled } = useOperations();
  const { role } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const query = useMemo((): ProjectsListQuery => {
    const page = parseIntOr(searchParams.get('page'), 1);
    const limit = parseIntOr(searchParams.get('limit'), DEFAULT_PAGE_SIZE);
    return {
      search: searchParams.get('search') || undefined,
      school: searchParams.get('school') || undefined,
      status: parseProjectStatus(searchParams.get('status')),
      page,
      limit,
    };
  }, [searchParams]);

  const filteredProjects = useMemo(
    () => filterProjectsList(projects, query),
    [projects, query],
  );

  const pageSize = query.limit ?? DEFAULT_PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / pageSize));
  const page = query.page ?? 1;
  const safePage = Math.min(page, totalPages);
  const pagedProjects = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredProjects.slice(start, start + pageSize);
  }, [filteredProjects, safePage, pageSize]);

  const updateParams = (patch: Record<string, string | undefined>, opts?: { resetPage?: boolean }) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(patch)) {
      if (!value) next.delete(key);
      else next.set(key, value);
    }
    if (opts?.resetPage) next.set('page', '1');
    if (!next.get('limit')) next.set('limit', String(pageSize));
    if (!next.get('page')) next.set('page', '1');
    setSearchParams(next, { replace: false });
  };

  const setPage = (nextPage: number) => {
    updateParams({ page: String(nextPage) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setSearchParams({ page: '1', limit: String(pageSize) }, { replace: false });
  };

  if (role === 'FABRICA') {
    return <FactoryProjectsList />;
  }

  return (
    <div className="space-y-4">
      <PageHeader
        roleAccent="product"
        eyebrow="Portafolio académico"
        title="Solicitudes"
        description="Consulta, filtra y gestiona tus programas de virtualización."
      />
      {backendEnabled && (
        <ProjectsLoadNotice
          isLoading={isLoadingProjects && projects.length === 0}
          error={projectsError}
          isEmpty={!isLoadingProjects && !projectsError && projects.length === 0}
          onRefresh={() => void refreshProjects()}
        />
      )}
      <ProjectsSummary />
      {!projectsError && (
        <div className="space-y-3">
          <ProjectsListFilters
            projects={projects}
            query={query}
            onChange={updateParams}
            onClear={clearFilters}
          />
          <ProjectsListFilterSummary
            filteredCount={filteredProjects.length}
            totalCount={projects.length}
            query={query}
            onRemoveFilter={(param) => updateParams({ [param]: undefined }, { resetPage: true })}
          />
          <ProjectsTable
            projects={pagedProjects}
            totalCount={filteredProjects.length}
            portfolioTotal={projects.length}
          />
          {filteredProjects.length > 0 ? (
            <ProductWorkPagination
              page={safePage}
              totalPages={totalPages}
              totalItems={filteredProjects.length}
              pageSize={pageSize}
              onPageChange={setPage}
              entityLabel="solicitudes"
            />
          ) : projects.length > 0 ? (
            <p className="rounded-xl border border-slate-200/60 bg-white/80 px-4 py-3 text-center text-xs text-slate-500">
              No hay solicitudes que coincidan con los filtros aplicados.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
