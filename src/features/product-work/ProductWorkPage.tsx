import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LayoutDashboard } from 'lucide-react';
import { ContextBackLink } from '../../navigation/ContextBackLink';
import { PageHeader } from '../../components/ui/PageHeader';
import { useOperations } from '../operations/OperationsContext';
import { buildWorkItemsFromProjects } from '../operations/subjectOperationalState';
import type { SubjectOperationalState, SubjectWorkItem } from '../operations/subjectOperationalState';
import { getApiErrorMessage } from '../operations/apiMappers';
import { ProductWorkFilters, type ProductWorkQuery } from './components/ProductWorkFilters';
import { ProductWorkTable } from './components/ProductWorkTable';
import { ProductWorkPagination } from './components/ProductWorkPagination';
import { ProductWorkSummary } from './components/ProductWorkSummary';

type SortKey = NonNullable<ProductWorkQuery['sort']>;

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

function pickOrigin(value: string | null): ProductWorkQuery['origin'] | undefined {
  if (value === 'new' || value === 'original' || value === 'all') return value;
  return undefined;
}

function pickSort(value: string | null): SortKey | undefined {
  if (!value) return undefined;
  const allowed: SortKey[] = ['dueDate', 'updatedAt', 'priority'];
  return (allowed as string[]).includes(value) ? (value as SortKey) : undefined;
}

function toTs(value?: string | null) {
  if (!value) return 0;
  const d = new Date(value);
  const ts = d.getTime();
  return Number.isFinite(ts) ? ts : 0;
}

export function ProductWorkPage() {
  const { projects, projectObservations } = useOperations();
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

    const q: ProductWorkQuery = {
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

  const [error, setError] = useState<string | null>(null);

  const allItems = useMemo(() => buildWorkItemsFromProjects(projects, projectObservations), [projects, projectObservations]);

  const filtered = useMemo(() => {
    try {
      setError(null);
      let items: SubjectWorkItem[] = allItems;

      if (query.origin === 'new') items = items.filter((i) => Boolean(i.createdFromChange));
      else if (query.origin === 'original') items = items.filter((i) => !i.createdFromChange);

      if (query.status) items = items.filter((i) => i.operationalState === query.status);
      if (query.program) {
        const p = query.program.toLowerCase();
        items = items.filter((i) => i.program.toLowerCase().includes(p));
      }
      if (query.semester !== undefined) items = items.filter((i) => i.semesterNumber === Number(query.semester));
      if (query.priority) items = items.filter((i) => i.priority === query.priority);
      if (query.search) {
        const q = query.search.toLowerCase();
        items = items.filter(
          (i) =>
            i.subjectName.toLowerCase().includes(q) ||
            i.program.toLowerCase().includes(q) ||
            i.school.toLowerCase().includes(q),
        );
      }
      if (query.dueFrom) {
        const from = new Date(query.dueFrom).getTime();
        items = items.filter((i) => toTs(i.expectedDeliveryDate) >= from);
      }
      if (query.dueTo) {
        const to = new Date(query.dueTo).getTime();
        items = items.filter((i) => toTs(i.expectedDeliveryDate) <= to);
      }

      const sort = query.sort ?? 'updatedAt';
      items = [...items].sort((a, b) => {
        if (sort === 'dueDate') return toTs(a.expectedDeliveryDate) - toTs(b.expectedDeliveryDate);
        if (sort === 'priority') {
          const rank: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
          return (rank[a.priority] ?? 9) - (rank[b.priority] ?? 9);
        }
        return toTs(b.lastActivity ?? '') - toTs(a.lastActivity ?? '');
      });

      return items;
    } catch (err) {
      setError(getApiErrorMessage(err));
      return [];
    }
  }, [allItems, query]);

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

  const showPagination = total > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Bandeja de trabajo"
        title="Bandeja de revisión"
        description="Gestiona materias por estado, prioridad, fecha de entrega y cambios recientes."
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

      <ProductWorkFilters query={query} onChange={(patch) => updateParams(patch, { resetPage: true })} onClear={clearFilters} />

      <ProductWorkSummary total={total} query={query} onRemoveFilter={removeFilter} onClearAll={clearFilters} />

      <ProductWorkTable
        items={paged}
        isLoading={false}
        error={error}
        onClearFilters={clearFilters}
        backToDashboardFallback="/product/dashboard"
      />

      {showPagination && (
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
