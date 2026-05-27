import { useCallback, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { History, RefreshCw, RotateCcw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/ToastProvider';
import { institutionalWorkflowApi } from '../../services/institutionalWorkflowApi';
import type { InstitutionalOperationalAction } from '../../types/domain';
import { buildFromLocation } from '../../navigation/contextNavigation';
import { invalidateInstitutionalWorkflowQueries } from '../institutional-workflow/institutionalQueryUtils';
import { LmsEmptyState } from './components/LmsEmptyState';
import { LmsFilterChips } from './components/LmsFilterChips';
import { LmsKpiCards } from './components/LmsKpiCards';
import { LmsRecentActivity } from './components/LmsRecentActivity';
import { LmsWorkTable } from './components/LmsWorkTable';
import { invalidateLmsDashboard } from './lmsInvalidation';
import { parseLmsFilter, type LmsDashboardFilter } from './lmsTypes';
import { useLmsDashboard } from './useLmsDashboard';

export function LmsDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const filter = parseLmsFilter(searchParams.get('filter'));
  const [busySubjectId, setBusySubjectId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { visibleRows, kpis, recentActivity, isLoading, error, refetchAll } = useLmsDashboard(filter);

  const setFilter = useCallback(
    (next: LmsDashboardFilter) => {
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

  const openOperationalFlow = (subjectId: string) => {
    navigate(`/subjects/${subjectId}/operations`, {
      state: { from: buildFromLocation(location) },
    });
  };

  const handleTransition = async (
    subjectId: string,
    action: InstitutionalOperationalAction,
  ) => {
    setBusySubjectId(subjectId);
    try {
      const result = await institutionalWorkflowApi.transition(subjectId, { action });
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

  const showEmpty =
    !isLoading && !error && visibleRows.length === 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 lg:px-6">
      <PageHeader
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
            <Button type="button" className="gap-2" onClick={() => void handleRefresh()} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refrescar
            </Button>
          </div>
        }
      />

      <LmsKpiCards kpis={kpis} activeFilter={filter} onFilterChange={setFilter} />

      <LmsFilterChips active={filter} onChange={setFilter} />

      {showEmpty ? (
        <LmsEmptyState
          filter={filter}
          onViewHistory={() => setFilter('history')}
          onViewReturned={() => setFilter('returned')}
          onRefresh={() => void handleRefresh()}
          isRefreshing={isRefreshing}
        />
      ) : null}

      <LmsWorkTable
        rows={visibleRows}
        isLoading={isLoading}
        error={error}
        busySubjectId={busySubjectId}
        onOpenFlow={openOperationalFlow}
        onTransition={(subjectId, action) => void handleTransition(subjectId, action)}
      />

      <LmsRecentActivity items={recentActivity} />
    </div>
  );
}
