import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  Clock3,
  Package,
} from 'lucide-react';
import { MetricCard } from '../../components/cards/MetricCard';
import { OperationalTray } from '../../components/operational/OperationalTray';
import { ProjectsLoadNotice } from '../../components/feedback/ProjectsLoadNotice';
import { PageHeader } from '../../components/ui/PageHeader';
import { useOperations } from '../../features/operations/OperationsContext';
import { FactoryDashboardQuickNav } from './factory/FactoryDashboardQuickNav';
import {
  chunkTrays,
  filterItemsBySearch,
  getTraysForView,
  parseFactoryDashboardView,
  type FactoryDashboardView,
} from './factory/factoryDashboardViews';
import { useFactoryDashboard } from './useFactoryDashboard';

export function FactoryDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isLoadingProjects, projectsError, refreshProjects, backendEnabled } = useOperations();
  const { summary, newlyAddedPreview, correctionSentPreview, isLoading, error, loadSummary } =
    useFactoryDashboard(backendEnabled);

  const view = parseFactoryDashboardView(searchParams.get('view'));
  const search = searchParams.get('search') ?? '';

  const summaryCounts = summary?.countsByState;
  const totalAssigned = summary?.totalAssigned ?? 0;

  const trayContext = useMemo(
    () => ({
      summary: summary
        ? {
            countsByState: summary.countsByState,
            pendingCorrectionsTop: summary.pendingCorrectionsTop,
            inProductionTop: summary.inProductionTop,
            upcomingDeliveriesTop: summary.upcomingDeliveriesTop,
            notStartedTop: summary.notStartedTop,
            inReviewTop: summary.inReviewTop,
            recentlyCompletedTop: summary.recentlyCompletedTop,
            overdueOrDueSoonCount: summary.overdueOrDueSoonCount,
          }
        : null,
      newlyAddedPreview,
      correctionSentPreview,
    }),
    [summary, newlyAddedPreview, correctionSentPreview],
  );

  const visibleTrays = useMemo(() => getTraysForView(view, trayContext), [view, trayContext]);
  const trayRows = useMemo(() => chunkTrays(visibleTrays), [visibleTrays]);

  const setView = useCallback(
    (nextView: FactoryDashboardView) => {
      const next = new URLSearchParams(searchParams);
      if (nextView === 'active') next.delete('view');
      else next.set('view', nextView);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const setSearch = useCallback(
    (value: string) => {
      const next = new URLSearchParams(searchParams);
      if (value) next.set('search', value);
      else next.delete('search');
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const hasSearch = search.trim().length > 0;

  return (
    <div className="space-y-7">
      <PageHeader
        prominentEyebrow
        eyebrow="Centro de control"
        title="Dashboard Factory"
        description="Resumen operativo por materia: correcciones, producción, vencimientos y revisiones."
      />

      {backendEnabled && (
        <ProjectsLoadNotice
          isLoading={isLoadingProjects}
          error={projectsError}
          onRefresh={() => void refreshProjects()}
        />
      )}

      {backendEnabled && (
        <ProjectsLoadNotice
          isLoading={isLoading && !summary}
          error={error}
          onRefresh={() => void loadSummary()}
        />
      )}

      <section className="grid gap-3 md:grid-cols-4">
        <MetricCard
          variant="subjectPanel"
          label="Total asignadas"
          value={isLoading && !summary ? '—' : totalAssigned}
          icon={Package}
          tone="text-[#1E293B]"
          active={view === 'all'}
          onClick={() => setView('all')}
        />
        <MetricCard
          variant="subjectPanel"
          label="Correcciones pendientes"
          value={isLoading && !summary ? '—' : (summaryCounts?.CHANGES_REQUESTED ?? 0)}
          icon={AlertTriangle}
          tone="text-rose-500"
          active={view === 'corrections'}
          onClick={() => setView('corrections')}
        />
        <MetricCard
          variant="subjectPanel"
          label="En producción"
          value={isLoading && !summary ? '—' : (summaryCounts?.IN_PRODUCTION ?? 0)}
          icon={Package}
          tone="text-orange-500"
          active={view === 'active'}
          onClick={() => setView('active')}
        />
        <MetricCard
          variant="subjectPanel"
          label="Próximas / vencidas"
          value={isLoading && !summary ? '—' : (summary?.overdueOrDueSoonCount ?? 0)}
          icon={Clock3}
          tone="text-amber-500"
          active={view === 'active'}
          onClick={() => setView('active')}
        />
      </section>

      <FactoryDashboardQuickNav
        view={view}
        search={search}
        onViewChange={setView}
        onSearchChange={setSearch}
      />

      {trayRows.map((row, rowIndex) => (
        <section key={row.map((t) => t.id).join('-') || rowIndex} className="grid gap-4 md:grid-cols-2">
          {row.map((tray) => {
            const totalCount = tray.getCount(trayContext);
            const allItems = tray.getItems(trayContext);
            const filteredItems = filterItemsBySearch(allItems, search);
            const displayCount = hasSearch ? filteredItems.length : totalCount;
            const emptyMessage =
              hasSearch && totalCount > 0 && filteredItems.length === 0
                ? 'Sin coincidencias para la búsqueda.'
                : tray.emptyMessage;

            return (
              <OperationalTray
                key={tray.id}
                title={tray.title}
                description={tray.description}
                count={displayCount}
                totalCount={totalCount}
                items={filteredItems}
                emptyMessage={emptyMessage}
                viewAllTo={tray.viewAllTo}
                icon={tray.icon}
                role="factory"
              />
            );
          })}
        </section>
      ))}

      {!isLoading && visibleTrays.length === 0 && (
        <p className="py-4 text-center text-sm text-[#94A3B8]">
          No hay bandejas para esta vista.
        </p>
      )}
    </div>
  );
}
