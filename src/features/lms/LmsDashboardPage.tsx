import { useCallback, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { History, RefreshCw, RotateCcw } from 'lucide-react';
import { DashboardShell } from '../../components/layout/DashboardShell';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { buildFromLocation } from '../../navigation/contextNavigation';
import { LmsEmptyState } from './components/LmsEmptyState';
import { LmsKpiCards } from './components/LmsKpiCards';
import { LmsWorkTable } from './components/LmsWorkTable';
import { invalidateLmsDashboard } from './lmsInvalidation';
import {
  countLmsRowsByFilter,
  LMS_INBOX_CATEGORIES,
  parseLmsFilter,
  type LmsDashboardFilter,
} from './lmsTypes';
import { useLmsDashboard } from './useLmsDashboard';
import { OperationalInboxFilterBar } from '../operations-v2/components/OperationalInboxFilterBar';
import { OperationalInboxContextBar } from '../operations-v2/components/OperationalInboxContextBar';
import { OperationalInboxViewTabs } from '../operations-v2/components/OperationalInboxViewTabs';
import { OperationalInboxPagination } from '../operations-v2/components/OperationalInboxPagination';
import {
  DEFAULT_INBOX_ADVANCED_FILTERS,
  hasActiveInboxAdvancedFilters,
  inboxSafePage,
  inboxTotalPages,
  paginateInboxRows,
  parseInboxAdvancedFilters,
  parseInboxPage,
  type InboxAdvancedFilters,
} from '../operations-v2/operationalInboxFilters';
import { useOperationalInboxPanelState } from '../operations-v2/useOperationalInboxPanelState';

export function LmsDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    panel,
    inboxFilter,
    exploreFilter,
    activeFilter: filter,
    hasExploreCategoryFilter,
    setInboxFilter,
    setExploreFilter,
    clearExploreFilter,
    clearInboxFilter,
    setPanel,
  } = useOperationalInboxPanelState({
    searchParams,
    setSearchParams,
    parseFilter: parseLmsFilter,
    defaultFilter: 'all' as LmsDashboardFilter,
  });
  const advanced = parseInboxAdvancedFilters(searchParams);
  const pageParam = parseInboxPage(searchParams);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { visibleRows, categoryRows, allRows, kpis, isLoading, error, refetchAll } =
    useLmsDashboard(filter, advanced);

  const setFilter = setInboxFilter;

  const setAdvanced = useCallback(
    (next: InboxAdvancedFilters) => {
      const params = new URLSearchParams(searchParams);
      if (next.query) params.set('q', next.query);
      else params.delete('q');
      if (next.sla !== 'all') params.set('sla', next.sla);
      else params.delete('sla');
      if (next.sort !== DEFAULT_INBOX_ADVANCED_FILTERS.sort) params.set('sort', next.sort);
      else params.delete('sort');
      params.delete('page');
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const setPage = useCallback(
    (nextPage: number) => {
      const params = new URLSearchParams(searchParams);
      if (nextPage <= 1) params.delete('page');
      else params.set('page', String(nextPage));
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const safePage = useMemo(
    () => inboxSafePage(pageParam, visibleRows.length),
    [pageParam, visibleRows.length],
  );
  const paginatedRows = useMemo(
    () => paginateInboxRows(visibleRows, safePage),
    [visibleRows, safePage],
  );
  const totalPages = inboxTotalPages(visibleRows.length);

  const categoryOptions = LMS_INBOX_CATEGORIES.map((category) => ({
    ...category,
    count: countLmsRowsByFilter(allRows, category.id),
  }));

  const activeCategoryLabel =
    LMS_INBOX_CATEGORIES.find((category) => category.id === inboxFilter)?.label ?? 'Bandeja';

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetchAll();
    } finally {
      setIsRefreshing(false);
    }
  };

  const openOperationalFlow = (actionUrl: string) => {
    navigate(actionUrl, {
      state: { from: buildFromLocation(location) },
    });
  };

  const showFilteredEmpty =
    !isLoading && !error && categoryRows.length > 0 && visibleRows.length === 0;

  const showEmpty = !isLoading && !error && visibleRows.length === 0 && !showFilteredEmpty;

  return (
    <DashboardShell>
      <PageHeader
        roleAccent="lms"
        eyebrow="Operaciones"
        title="LMS — Carga y publicación"
        description="Gestión de materias listas para carga, publicación en C-Digital/LMS y seguimiento de devoluciones."
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              className="gap-2"
              onClick={() => setFilter('history')}
            >
              <History className="h-4 w-4" />
              Ver historial
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="gap-2"
              onClick={() => setFilter('returned')}
            >
              <RotateCcw className="h-4 w-4" />
              Ver devueltas
            </Button>
            <Button type="button" className="gap-2" loading={isRefreshing} onClick={() => void handleRefresh()}>
              <RefreshCw className="h-4 w-4" />
              Refrescar
            </Button>
          </div>
        }
      />

      <LmsKpiCards kpis={kpis} activeFilter={inboxFilter} onFilterChange={setInboxFilter} />

      <div className="space-y-4">
        <OperationalInboxViewTabs
          mode={panel}
          onChange={setPanel}
          hasActiveAdvancedFilters={hasActiveInboxAdvancedFilters(advanced)}
          hasExploreCategoryFilter={hasExploreCategoryFilter}
        />

        {panel === 'inbox' ? (
          <OperationalInboxContextBar
            categoryLabel={activeCategoryLabel}
            activeCategory={inboxFilter}
            defaultCategory="all"
            onSecondarySelect={setInboxFilter}
            onClearCategory={clearInboxFilter}
            advanced={advanced}
            onAdvancedChange={setAdvanced}
            totalInCategory={categoryRows.length}
            visibleCount={visibleRows.length}
          />
        ) : (
          <OperationalInboxFilterBar
            categories={categoryOptions}
            activeCategory={exploreFilter}
            defaultCategory="all"
            onCategoryChange={setExploreFilter}
            onClearCategory={clearExploreFilter}
            advanced={advanced}
            onAdvancedChange={setAdvanced}
            totalInCategory={categoryRows.length}
            visibleCount={visibleRows.length}
          />
        )}
      </div>

      {showFilteredEmpty ? (
        <Card variant="roleGlass" className="px-5 py-8 text-center">
          <p className="text-sm font-semibold text-slate-800">Ningún registro coincide con los filtros aplicados</p>
          <p className="mt-1 text-xs text-slate-500">
            Hay {categoryRows.length} programa(s) en esta categoría. Ajuste la búsqueda, el plazo SLA o limpie los filtros.
          </p>
          <Button
            type="button"
            variant="secondary"
            className="mt-4"
            onClick={() => setAdvanced(DEFAULT_INBOX_ADVANCED_FILTERS)}
          >
            Limpiar filtros avanzados
          </Button>
        </Card>
      ) : null}

      {showEmpty ? (
        <LmsEmptyState
          filter={filter}
          onViewHistory={() => setFilter('history')}
          onViewReturned={() => setFilter('returned')}
          onRefresh={() => void handleRefresh()}
          isRefreshing={isRefreshing}
        />
      ) : null}

      {!showEmpty ? (
        <>
          <LmsWorkTable
            rows={paginatedRows}
            totalRows={visibleRows.length}
            isLoading={isLoading}
            error={error}
            onOpenFlow={openOperationalFlow}
          />
          <OperationalInboxPagination
            page={safePage}
            totalPages={totalPages}
            totalItems={visibleRows.length}
            itemLabel={{ one: 'programa', other: 'programas' }}
            onPageChange={setPage}
          />
        </>
      ) : null}
    </DashboardShell>
  );
}
