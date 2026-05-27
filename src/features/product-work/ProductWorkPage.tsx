import { useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { LayoutDashboard } from 'lucide-react';
import { ContextBackLink } from '../../navigation/ContextBackLink';
import { buildFromLocation } from '../../navigation/contextNavigation';
import { PageHeader } from '../../components/ui/PageHeader';
import { useOperations } from '../operations/OperationsContext';
import { useProductProgramsTrackingQuery } from '../queries/useInstitutionalProgramsWorkQuery';
import { ProgramOperationalWorkTable } from '../operations-v2/ProgramOperationalWorkTable';
import type { ProgramOperationalWorkItemDto } from '../../services/institutionalWorkflowApi';
import { ProductProgramWorkFilters } from './components/ProductProgramWorkFilters';
import { ProductProgramWorkSummary } from './components/ProductProgramWorkSummary';
import { ProductWorkPagination } from './components/ProductWorkPagination';
import {
  buildLegacyProgramWorkItems,
  filterProductPrograms,
  mergeProductProgramSources,
  parseProductProgramTrayFilter,
  uniqueProgramSchools,
  type ProductProgramWorkQuery,
} from './productProgramWork';

function parseIntOr(value: string | null, fallback: number) {
  const n = value ? Number(value) : NaN;
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function pickSort(value: string | null): ProductProgramWorkQuery['sort'] | undefined {
  if (!value) return undefined;
  const allowed: NonNullable<ProductProgramWorkQuery['sort']>[] = ['dueDate', 'updatedAt', 'priority'];
  return (allowed as string[]).includes(value) ? (value as ProductProgramWorkQuery['sort']) : undefined;
}

export function ProductWorkPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { projects, projectObservations, backendEnabled } = useOperations();
  const [searchParams, setSearchParams] = useSearchParams();
  const trackingQuery = useProductProgramsTrackingQuery(backendEnabled);

  const query = useMemo((): ProductProgramWorkQuery => {
    const page = parseIntOr(searchParams.get('page'), 1);
    const limit = parseIntOr(searchParams.get('limit'), 20);
    return {
      status: parseProductProgramTrayFilter(searchParams.get('status')),
      search: searchParams.get('search') || undefined,
      program: searchParams.get('program') || undefined,
      school: searchParams.get('school') || undefined,
      dueFrom: searchParams.get('dueFrom') || undefined,
      dueTo: searchParams.get('dueTo') || undefined,
      sort: pickSort(searchParams.get('sort')),
      page,
      limit,
    };
  }, [searchParams]);

  const legacyPrograms = useMemo(
    () => buildLegacyProgramWorkItems(projects, projectObservations),
    [projects, projectObservations],
  );

  const allPrograms = useMemo(() => {
    if (!backendEnabled) return legacyPrograms;
    return mergeProductProgramSources(trackingQuery.data ?? [], legacyPrograms);
  }, [backendEnabled, trackingQuery.data, legacyPrograms]);

  const schools = useMemo(() => uniqueProgramSchools(allPrograms), [allPrograms]);

  const filtered = useMemo(() => filterProductPrograms(allPrograms, query), [allPrograms, query]);

  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  const paged = filtered.slice(start, start + limit);

  const updateParams = (patch: Record<string, string | undefined>, opts?: { resetPage?: boolean }) => {
    const next = new URLSearchParams(searchParams);
    for (const [k, v] of Object.entries(patch)) {
      if (!v) next.delete(k);
      else next.set(k, v);
    }
    if (opts?.resetPage) next.set('page', '1');
    if (!next.get('limit')) next.set('limit', String(limit));
    if (!next.get('page')) next.set('page', '1');
    setSearchParams(next, { replace: false });
  };

  const clearFilters = () => {
    setSearchParams({ page: '1', limit: String(limit) }, { replace: false });
  };

  const removeFilter = (param: string) => {
    updateParams({ [param]: undefined }, { resetPage: true });
  };

  const openProgram = (item: ProgramOperationalWorkItemDto) => {
    navigate(item.actionUrl, {
      state: { from: buildFromLocation(location), programWorkItem: item },
    });
  };

  const error =
    trackingQuery.error instanceof Error
      ? trackingQuery.error.message
      : trackingQuery.error
        ? 'No se pudo cargar la bandeja'
        : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Bandeja de trabajo"
        title="Bandeja de programas"
        description="Gestiona solicitudes por programa, semestre y etapa operacional."
        action={
          <ContextBackLink
            fallback="/product/dashboard"
            className="inline-flex h-10 items-center gap-2 rounded-[12px] border border-slate-200/80 bg-white px-4 text-xs font-bold text-[#475569] shadow-sm transition-colors hover:border-orange-200 hover:bg-orange-50/50 hover:text-orange-700"
          >
            <LayoutDashboard className="h-4 w-4" />
            Volver al dashboard
          </ContextBackLink>
        }
      />

      <ProductProgramWorkFilters
        query={query}
        schools={schools}
        onChange={(patch) => updateParams(patch, { resetPage: true })}
        onClear={clearFilters}
      />

      <ProductProgramWorkSummary total={total} query={query} onRemoveFilter={removeFilter} onClearAll={clearFilters} />

      <ProgramOperationalWorkTable
        items={paged}
        isLoading={backendEnabled && trackingQuery.isLoading}
        error={error}
        onRefresh={() => void trackingQuery.refetch()}
        onOpenProgram={openProgram}
        sectionTitle="Programas"
        actionLabel="Ver programa"
        queueLabel="Centro operacional del programa"
      />

      {total > 0 && (
        <ProductWorkPagination
          page={page}
          totalPages={totalPages}
          totalItems={total}
          pageSize={limit}
          onPageChange={(nextPage) => updateParams({ page: String(nextPage) })}
        />
      )}
    </div>
  );
}
