import { useCallback, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { History, RefreshCw, RotateCcw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { DashboardShell } from '../../components/layout/DashboardShell';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/ToastProvider';
import { institutionalWorkflowApi } from '../../services/institutionalWorkflowApi';
import type { InstitutionalOperationalAction } from '../../types/domain';
import { buildFromLocation } from '../../navigation/contextNavigation';
import { invalidateInstitutionalWorkflowQueries } from '../institutional-workflow/institutionalQueryUtils';
import { LmsEmptyState } from './components/LmsEmptyState';
import { LmsKpiCards } from './components/LmsKpiCards';
import { LmsRecentActivity } from './components/LmsRecentActivity';
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
import { OperationalInboxPagination } from '../operations-v2/components/OperationalInboxPagination';
import {
  DEFAULT_INBOX_ADVANCED_FILTERS,
  inboxSafePage,
  inboxTotalPages,
  paginateInboxRows,
  parseInboxAdvancedFilters,
  parseInboxPage,
  type InboxAdvancedFilters,
} from '../operations-v2/operationalInboxFilters';

export function LmsDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const filter = parseLmsFilter(searchParams.get('filter'));
  const advanced = parseInboxAdvancedFilters(searchParams);
  const pageParam = parseInboxPage(searchParams);
  const [busySubjectId, setBusySubjectId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { visibleRows, categoryRows, allRows, kpis, recentActivity, isLoading, error, refetchAll } =
    useLmsDashboard(filter, advanced);

  const setFilter = useCallback(
    (next: LmsDashboardFilter) => {
      const params = new URLSearchParams(searchParams);
      if (next === 'all') params.delete('filter');
      else params.set('filter', next);
      params.delete('page');
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams],
  );

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

  const handleTransition = async (
    row: (typeof visibleRows)[number],
    action: InstitutionalOperationalAction,
  ) => {
    const subjectId = row.subjectId;
    setBusySubjectId(subjectId);
    try {
      const result = row.semesterId
        ? await institutionalWorkflowApi.transitionSemester(row.semesterId, { action })
        : await institutionalWorkflowApi.transition(subjectId, { action });
      if (action === 'LMS_START_UPLOAD') {
        showToast('Carga LMS iniciada');
      } else if (action === 'LMS_CONFIRM_UPLOAD') {
        showToast('Carga/publicación confirmada — enviada a Planeación');
      }
      await invalidateLmsDashboard(queryClient);
      await invalidateInstitutionalWorkflowQueries(queryClient, {
        subjectId,
        projectId: result.projectId,
        role: 'LMS',
      });
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'No se pudo ejecutar la acción', 'error');
    } finally {
      setBusySubjectId(null);
    }
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

      <LmsKpiCards kpis={kpis} activeFilter={filter} onFilterChange={setFilter} />

      <OperationalInboxFilterBar
        accent="lms"
        categories={categoryOptions}
        activeCategory={filter}
        onCategoryChange={setFilter}
        advanced={advanced}
        onAdvancedChange={setAdvanced}
        totalInCategory={categoryRows.length}
        visibleCount={visibleRows.length}
      />

      {showFilteredEmpty ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-8 text-center shadow-sm">
          <p className="text-sm font-semibold text-slate-800">Ningún registro coincide con los filtros aplicados</p>
          <p className="mt-1 text-xs text-slate-500">
            Hay {categoryRows.length} asignatura(s) en esta categoría. Ajuste la búsqueda, el plazo SLA o limpie los filtros.
          </p>
          <Button
            type="button"
            variant="secondary"
            className="mt-4"
            onClick={() => setAdvanced(DEFAULT_INBOX_ADVANCED_FILTERS)}
          >
            Limpiar filtros avanzados
          </Button>
        </div>
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
            busySubjectId={busySubjectId}
            onOpenFlow={openOperationalFlow}
            onTransition={(row, action) => void handleTransition(row, action)}
          />
          <OperationalInboxPagination
            page={safePage}
            totalPages={totalPages}
            totalItems={visibleRows.length}
            itemLabel={{ one: 'asignatura', other: 'asignaturas' }}
            onPageChange={setPage}
          />
        </>
      ) : null}

      {filter !== 'history' ? <LmsRecentActivity items={recentActivity} /> : null}
    </DashboardShell>
  );
}
