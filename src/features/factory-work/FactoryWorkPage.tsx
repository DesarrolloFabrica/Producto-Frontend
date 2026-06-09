import { useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ContextBackLink } from '../../navigation/ContextBackLink';
import { buildFromLocation } from '../../navigation/contextNavigation';
import { LayoutDashboard } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { type FactorySubjectsOrigin, type FactorySubjectsQuery } from '../../services/factoryApi';
import type { ApiSubjectOperationalState } from '../../services/factoryApi';
import { getApiErrorMessage } from '../operations/apiMappers';
import { useFactoryProgramsQuery } from '../queries/useFactoryProgramsQuery';
import { ProgramOperationalWorkTable } from '../operations-v2/ProgramOperationalWorkTable';
import type { ProgramOperationalWorkItemDto } from '../../services/institutionalWorkflowApi';
import { FactoryWorkFilters } from './components/FactoryWorkFilters';
import { FactoryWorkPagination } from './components/FactoryWorkPagination';
import { FactoryWorkSummary } from './components/FactoryWorkSummary';
import { mapFactoryProgramsToTableItems } from './factoryProgramWork';

type SortKey = NonNullable<FactorySubjectsQuery['sort']>;

function parseIntOr(value: string | null, fallback: number) {
  const n = value ? Number(value) : NaN;
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function pickStatus(value: string | null): ApiSubjectOperationalState | undefined {
  if (!value) return undefined;
  const allowed: ApiSubjectOperationalState[] = [
    'NOT_STARTED',
    'IN_PRODUCTION',
    'IN_REVIEW',
    'CHANGES_REQUESTED',
    'CORRECTION_SENT',
    'APPROVED',
  ];
  return (allowed as string[]).includes(value) ? (value as ApiSubjectOperationalState) : undefined;
}

function pickOrigin(value: string | null): FactorySubjectsOrigin | undefined {
  if (value === 'new' || value === 'original' || value === 'all') return value;
  return undefined;
}

function pickSort(value: string | null): SortKey | undefined {
  if (!value) return undefined;
  const allowed: SortKey[] = ['dueDate', 'updatedAt', 'priority'];
  return (allowed as string[]).includes(value) ? (value as SortKey) : undefined;
}

export function FactoryWorkPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const query = useMemo(() => {
    const status = pickStatus(searchParams.get('status'));
    const search = searchParams.get('search') || undefined;
    const program = searchParams.get('program') || undefined;
    const priority = searchParams.get('priority') || undefined;
    const dueFrom = searchParams.get('dueFrom') || undefined;
    const dueTo = searchParams.get('dueTo') || undefined;
    const sort = pickSort(searchParams.get('sort'));
    const semesterRaw = searchParams.get('semester');
    const semester = semesterRaw ? Number(semesterRaw) : undefined;
    const page = parseIntOr(searchParams.get('page'), 1);
    const limit = parseIntOr(searchParams.get('limit'), 20);

    const origin = pickOrigin(searchParams.get('origin'));

    const q: FactorySubjectsQuery = {
      origin,
      status,
      search,
      program,
      semester: Number.isFinite(semester) ? semester : undefined,
      priority,
      dueFrom,
      dueTo,
      sort,
      page,
      limit,
    };
    return q;
  }, [searchParams]);

  const programsQuery = useFactoryProgramsQuery(query);
  const items = useMemo(
    () => mapFactoryProgramsToTableItems(programsQuery.data?.items ?? []),
    [programsQuery.data?.items],
  );
  const total = programsQuery.data?.total ?? 0;
  const isLoading = programsQuery.isInitialLoadingWithoutData;
  const error = programsQuery.error ? getApiErrorMessage(programsQuery.error) : null;

  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const totalPages = Math.max(1, Math.ceil(total / limit));

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

  const showPagination = (Boolean(programsQuery.data) || programsQuery.isBackgroundFetching) && total > 0;

  const openProgram = (item: ProgramOperationalWorkItemDto) => {
    navigate(item.actionUrl, {
      state: { from: buildFromLocation(location) },
    });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        variant="executive"
        roleAccent="factory"
        eyebrow="Bandeja de trabajo"
        title="Bandeja de programas"
        description="Gestiona solicitudes por programa, semestre y etapa operacional."
        action={
          <ContextBackLink
            fallback="/factory/dashboard"
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-white/55 px-3.5 text-[11px] font-semibold text-slate-600 ring-1 ring-white/60 backdrop-blur-sm transition-colors hover:bg-white/80 hover:text-slate-900"
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            Volver al dashboard
          </ContextBackLink>
        }
      />

      <FactoryWorkFilters query={query} onChange={(patch) => updateParams(patch, { resetPage: true })} onClear={clearFilters} />

      <FactoryWorkSummary
        total={total}
        query={query}
        onRemoveFilter={removeFilter}
        onClearAll={clearFilters}
      />

      <ProgramOperationalWorkTable
        items={items}
        isLoading={isLoading}
        error={error}
        onRefresh={() => void programsQuery.refetch()}
        onOpenProgram={openProgram}
        sectionTitle="Programas operacionales"
        actionLabel="Ver programa"
        queueLabel="Centro operacional del programa"
      />

      {showPagination && (
        <FactoryWorkPagination
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
