import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ContextBackLink } from '../../navigation/ContextBackLink';
import { LayoutDashboard } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { type FactorySubjectsOrigin, type FactorySubjectsQuery } from '../../services/factoryApi';
import type { SubjectOperationalState } from '../operations/subjectOperationalState';
import { getApiErrorMessage } from '../operations/apiMappers';
import { useFactorySubjectsQuery } from '../queries/useFactorySubjectsQuery';
import { FactoryWorkFilters } from './components/FactoryWorkFilters';
import { FactoryWorkTable } from './components/FactoryWorkTable';
import { FactoryWorkPagination } from './components/FactoryWorkPagination';
import { FactoryWorkSummary } from './components/FactoryWorkSummary';

type SortKey = NonNullable<FactorySubjectsQuery['sort']>;

function parseIntOr(value: string | null, fallback: number) {
  const n = value ? Number(value) : NaN;
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function pickStatus(value: string | null): SubjectOperationalState | undefined {
  if (!value) return undefined;
  const allowed: SubjectOperationalState[] = [
    'NOT_STARTED',
    'IN_PRODUCTION',
    'IN_REVIEW',
    'CHANGES_REQUESTED',
    'CORRECTION_SENT',
    'APPROVED',
  ];
  return (allowed as string[]).includes(value) ? (value as SubjectOperationalState) : undefined;
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

  const subjectsQuery = useFactorySubjectsQuery(query);
  const items = subjectsQuery.data?.items ?? [];
  const total = subjectsQuery.data?.total ?? 0;
  const isLoading = subjectsQuery.isInitialLoadingWithoutData;
  const error = subjectsQuery.error ? getApiErrorMessage(subjectsQuery.error) : null;

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

  const showPagination = (Boolean(subjectsQuery.data) || subjectsQuery.isBackgroundFetching) && total > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Bandeja de trabajo"
        title="Bandeja operativa"
        description="Gestiona semestres/paquetes por estado, prioridad y fecha de entrega."
        action={
          <ContextBackLink
            fallback="/factory/dashboard"
            className="inline-flex h-10 items-center gap-2 rounded-[12px] border border-slate-200/80 bg-white px-4 text-xs font-bold text-[#475569] shadow-sm transition-colors hover:border-orange-200 hover:bg-orange-50/50 hover:text-orange-700"
          >
            <LayoutDashboard className="h-4 w-4" />
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

      <FactoryWorkTable
        items={items}
        isLoading={isLoading}
        error={error}
        onClearFilters={clearFilters}
        backToDashboardFallback="/factory/dashboard"
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
