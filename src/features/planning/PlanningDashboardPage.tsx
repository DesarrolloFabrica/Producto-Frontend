import { useCallback, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { History, RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { DashboardShell } from '../../components/layout/DashboardShell';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/ToastProvider';
import { projectRadicationApi } from '../../services/projectRadicationApi';
import { buildFromLocation } from '../../navigation/contextNavigation';
import { PlanningEmptyState } from './components/PlanningEmptyState';
import { PlanningFilterChips } from './components/PlanningFilterChips';
import { PlanningKpiCards } from './components/PlanningKpiCards';
import { PlanningRadicationTable } from './components/PlanningRadicationTable';
import { PlanningRecentActivity } from './components/PlanningRecentActivity';
import { PlanningWorkTable } from './components/PlanningWorkTable';
import { invalidatePlanningDashboard } from './planningInvalidation';
import { parsePlanningFilter, type PlanningDashboardFilter } from './planningTypes';
import { usePlanningDashboard } from './usePlanningDashboard';

export function PlanningDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const filter = parsePlanningFilter(searchParams.get('filter'));
  const [busyProjectId, setBusyProjectId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    visibleRows,
    kpis,
    recentActivity,
    hasNoPending,
    isLoading,
    error,
    refetchAll,
  } = usePlanningDashboard(filter);

  const setFilter = useCallback(
    (next: PlanningDashboardFilter) => {
      const params = new URLSearchParams(searchParams);
      if (next === 'all') params.delete('filter');
      else params.set('filter', next);
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetchAll();
    } finally {
      setIsRefreshing(false);
    }
  };

  const openOperationalFlow = (row: typeof visibleRows[number]) => {
    if (row.kind !== 'subject' && row.kind !== 'returned') return;
    navigate(row.actionUrl, {
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

  const showEmpty =
    !isLoading && !error && visibleRows.length === 0 && filter !== 'all';

  const showEmptyAll =
    !isLoading && !error && visibleRows.length === 0 && filter === 'all' && hasNoPending;

  const tableProps = {
    rows: visibleRows,
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

      <PlanningKpiCards kpis={kpis} activeFilter={filter} onFilterChange={setFilter} />

      <PlanningFilterChips active={filter} onChange={setFilter} />

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
        filter === 'radication' ? (
          <PlanningRadicationTable {...tableProps} />
        ) : (
          <PlanningWorkTable {...tableProps} />
        )
      ) : null}

      {filter !== 'history' && filter !== 'radication' ? (
        <PlanningRecentActivity items={recentActivity} />
      ) : null}

      {filter === 'history' && recentActivity.length > 0 ? (
        <PlanningRecentActivity items={recentActivity} />
      ) : null}
    </DashboardShell>
  );
}
