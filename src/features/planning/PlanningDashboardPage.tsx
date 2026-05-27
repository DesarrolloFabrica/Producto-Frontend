import { useCallback, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { History, RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { DashboardShell } from '../../components/layout/DashboardShell';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useToast } from '../../components/ui/ToastProvider';
import { projectRadicationApi } from '../../services/projectRadicationApi';
import { buildFromLocation } from '../../navigation/contextNavigation';
import { PlanningEmptyState } from './components/PlanningEmptyState';
import { PlanningKpiCards } from './components/PlanningKpiCards';
import { PlanningRadicationTable } from './components/PlanningRadicationTable';
import { PlanningWorkTable } from './components/PlanningWorkTable';
import { invalidatePlanningDashboard } from './planningInvalidation';
import {
  countPlanningRowsByFilter,
  parsePlanningFilter,
  PLANNING_INBOX_CATEGORIES,
  type PlanningDashboardFilter,
} from './planningTypes';
import { usePlanningDashboard } from './usePlanningDashboard';
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

const PLANNING_SECONDARY_FILTERS: PlanningDashboardFilter[] = ['tracking', 'returned'];

export function PlanningDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
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
    parseFilter: parsePlanningFilter,
    defaultFilter: 'all' as PlanningDashboardFilter,
  });
  const advanced = parseInboxAdvancedFilters(searchParams);
  const pageParam = parseInboxPage(searchParams);
  const [busyProjectId, setBusyProjectId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    visibleRows,
    categoryRows,
    allRows,
    kpis,
    hasNoPending,
    isLoading,
    error,
    refetchAll,
  } = usePlanningDashboard(filter, advanced);

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

  const categoryOptions = PLANNING_INBOX_CATEGORIES.map((category) => ({
    ...category,
    count: countPlanningRowsByFilter(allRows, category.id),
  }));

  const activeCategoryLabel =
    PLANNING_INBOX_CATEGORIES.find((category) => category.id === inboxFilter)?.label ?? 'Bandeja';

  const secondaryLinks = PLANNING_SECONDARY_FILTERS.map((id) => ({
    id,
    label: PLANNING_INBOX_CATEGORIES.find((category) => category.id === id)?.label ?? id,
    count: countPlanningRowsByFilter(allRows, id),
  }));

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetchAll();
    } finally {
      setIsRefreshing(false);
    }
  };

  const openOperationalFlow = (row: typeof visibleRows[number]) => {
    const url = 'actionUrl' in row ? row.actionUrl : null;
    if (!url) return;
    navigate(url, {
      state: { from: buildFromLocation(location) },
    });
  };

  const handleValidateRadication = async (projectId: string) => {
    setBusyProjectId(projectId);
    try {
      await projectRadicationApi.validate(projectId);
      showToast('Radicado validado y solicitud finalizada');
      await invalidatePlanningDashboard(queryClient);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Error al validar', 'error');
    } finally {
      setBusyProjectId(null);
    }
  };

  const handleReturnRadication = async (projectId: string, returnReason: string) => {
    setBusyProjectId(projectId);
    try {
      await projectRadicationApi.returnRadication(projectId, { returnReason });
      showToast('Radicado devuelto a Product');
      await invalidatePlanningDashboard(queryClient);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Error al devolver', 'error');
      throw e;
    } finally {
      setBusyProjectId(null);
    }
  };

  const showFilteredEmpty =
    !isLoading && !error && categoryRows.length > 0 && visibleRows.length === 0;

  const showEmpty =
    !isLoading && !error && visibleRows.length === 0 && filter !== 'all' && !showFilteredEmpty;

  const showEmptyAll =
    !isLoading && !error && visibleRows.length === 0 && filter === 'all' && hasNoPending && !showFilteredEmpty;

  const tableProps = {
    rows: paginatedRows,
    totalRows: visibleRows.length,
    isLoading,
    error,
    onOpenFlow: openOperationalFlow,
    onValidateRadication: (id: string) => void handleValidateRadication(id),
    onReturnRadication: handleReturnRadication,
    busyProjectId,
  };

  const showTable = !showEmpty && !showEmptyAll;

  return (
    <DashboardShell>
      <PageHeader
        roleAccent="planning"
        eyebrow="Operaciones"
        title="Planeación — Centro de validación"
        description="Seguimiento institucional de solicitudes, validaciones, radicación y cierre operativo."
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
            <Button type="button" className="gap-2" loading={isRefreshing} onClick={() => void handleRefresh()}>
              <RefreshCw className="h-4 w-4" />
              Refrescar
            </Button>
          </div>
        }
      />

      <PlanningKpiCards kpis={kpis} activeFilter={inboxFilter} onFilterChange={setInboxFilter} />

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
            secondaryLinks={secondaryLinks}
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
            Hay {categoryRows.length} solicitud(es) en esta categoría. Ajuste la búsqueda, el plazo SLA o limpie los filtros.
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

      {showEmpty || showEmptyAll ? (
        <PlanningEmptyState
          filter={filter}
          onViewRadications={() => setFilter('radication')}
          onViewHistory={() => setFilter('history')}
          onRefresh={() => void handleRefresh()}
          isRefreshing={isRefreshing}
        />
      ) : null}

      {showTable ? (
        <>
          {filter === 'radication' ? (
            <PlanningRadicationTable {...tableProps} />
          ) : (
            <PlanningWorkTable {...tableProps} />
          )}
          <OperationalInboxPagination
            page={safePage}
            totalPages={totalPages}
            totalItems={visibleRows.length}
            itemLabel={{ one: 'solicitud', other: 'solicitudes' }}
            onPageChange={setPage}
          />
        </>
      ) : null}
    </DashboardShell>
  );
}
