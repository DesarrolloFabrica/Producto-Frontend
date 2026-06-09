import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Clock3, Package, Send, Sparkles } from 'lucide-react';
import { MetricCard } from '../../components/cards/MetricCard';
import { ProgramOperationalTray } from '../../components/operational/ProgramOperationalTray';
import type { OperationalTrayVariant } from '../../components/ui/OperationalTrayCard';
import { ProjectsLoadNotice } from '../../components/feedback/ProjectsLoadNotice';
import { PageHeader } from '../../components/ui/PageHeader';
import { useOperations } from '../../features/operations/OperationsContext';
import { buildFromLocation } from '../../navigation/contextNavigation';
import type { ProgramOperationalWorkItemDto } from '../../services/institutionalWorkflowApi';
import { FactoryDashboardQuickNav } from './factory/FactoryDashboardQuickNav';
import {
  filterFactoryProgramsBySearch,
  type FactoryProgramTrayFilter,
} from '../factory-work/factoryProgramWork';
import {
  parseFactoryDashboardView,
  type FactoryDashboardView,
} from './factory/factoryDashboardViews';
import { useFactoryDashboard } from './useFactoryDashboard';

const TRAY_BY_VIEW: Record<FactoryDashboardView, FactoryProgramTrayFilter[]> = {
  active: ['CHANGES_REQUESTED', 'IN_PRODUCTION', 'NOT_STARTED'],
  corrections: ['CHANGES_REQUESTED', 'CORRECTION_SENT'],
  review: ['IN_REVIEW'],
  completed: ['APPROVED'],
  all: ['CHANGES_REQUESTED', 'CORRECTION_SENT', 'IN_PRODUCTION', 'NOT_STARTED', 'IN_REVIEW', 'APPROVED'],
};

const TRAY_FOLDER_VARIANT: Record<FactoryProgramTrayFilter, OperationalTrayVariant> = {
  CHANGES_REQUESTED: 'corrections',
  CORRECTION_SENT: 'corrections',
  IN_PRODUCTION: 'production',
  NOT_STARTED: 'pending',
  IN_REVIEW: 'review',
  APPROVED: 'completed',
};

export function FactoryDashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isLoadingProjects, projectsError, refreshProjects, backendEnabled } = useOperations();
  const { trays, programCounts, newlyAddedPrograms, isLoading, error, loadSummary } =
    useFactoryDashboard(backendEnabled);

  const view = parseFactoryDashboardView(searchParams.get('view'));
  const search = searchParams.get('search') ?? '';

  const openProgram = (item: ProgramOperationalWorkItemDto) => {
    navigate(item.actionUrl, {
      state: { from: buildFromLocation(location) },
    });
  };

  const filterTray = (key: FactoryProgramTrayFilter) =>
    filterFactoryProgramsBySearch(trays[key], search);

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

  const visibleTrayKeys = TRAY_BY_VIEW[view];

  const viewCounts = useMemo(
    () => ({
      active:
        trays.CHANGES_REQUESTED.length + trays.IN_PRODUCTION.length + trays.NOT_STARTED.length,
      corrections: trays.CHANGES_REQUESTED.length + trays.CORRECTION_SENT.length,
      review: trays.IN_REVIEW.length,
      completed: trays.APPROVED.length,
      all: programCounts.total,
    }),
    [trays, programCounts.total],
  );

  const trayConfigs = useMemo(
    () => [
      {
        key: 'CHANGES_REQUESTED' as const,
        title: 'Correcciones pendientes',
        description: 'Programas con observaciones abiertas de Product.',
        emptyMessage: 'Sin correcciones pendientes.',
        viewAllTo: '/factory/work?status=CHANGES_REQUESTED',
        icon: AlertTriangle,
        views: ['active', 'corrections', 'all'] as FactoryDashboardView[],
      },
      {
        key: 'CORRECTION_SENT' as const,
        title: 'Correcciones enviadas',
        description: 'Programas con corrección aplicada esperando validación de Product.',
        emptyMessage: 'Sin correcciones enviadas.',
        viewAllTo: '/factory/work?status=CORRECTION_SENT',
        icon: Send,
        views: ['corrections', 'all'] as FactoryDashboardView[],
        hideWhenEmpty: true,
      },
      {
        key: 'IN_PRODUCTION' as const,
        title: 'En producción',
        description: 'Programas con semestres activos en producción.',
        emptyMessage: 'Sin programas en producción.',
        viewAllTo: '/factory/work?status=IN_PRODUCTION',
        icon: Package,
        views: ['active', 'all'] as FactoryDashboardView[],
      },
      {
        key: 'NOT_STARTED' as const,
        title: 'Por iniciar',
        description: 'Programas con semestres pendientes de iniciar producción.',
        emptyMessage: 'Sin programas por iniciar.',
        viewAllTo: '/factory/work?status=NOT_STARTED',
        icon: Clock3,
        views: ['active', 'all'] as FactoryDashboardView[],
      },
      {
        key: 'IN_REVIEW' as const,
        title: 'En seguimiento',
        description: 'Programas fuera de producción activa de Fábrica.',
        emptyMessage: 'Sin programas en seguimiento.',
        viewAllTo: '/factory/work?status=IN_REVIEW',
        icon: Send,
        views: ['review', 'all'] as FactoryDashboardView[],
      },
      {
        key: 'APPROVED' as const,
        title: 'Completados',
        description: 'Programas con producción finalizada y aprobada por Product.',
        emptyMessage: 'Sin programas completados.',
        viewAllTo: '/factory/work?status=APPROVED',
        icon: CheckCircle2,
        views: ['completed', 'all'] as FactoryDashboardView[],
      },
    ],
    [],
  );

  const visibleTrays = trayConfigs.filter((tray) => {
    if (!tray.views.includes(view)) return false;
    if (tray.hideWhenEmpty && trays[tray.key].length === 0) return false;
    return visibleTrayKeys.includes(tray.key);
  });

  const refreshAll = () => {
    void refreshProjects();
    void loadSummary();
  };

  return (
    <div className="space-y-5">
      <PageHeader
        variant="executive"
        prominentEyebrow
        eyebrow="Centro de control"
        title="Dashboard Factory"
        description="Resumen operativo por programa: correcciones, producción, vencimientos y seguimiento."
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
          isLoading={isLoading}
          error={error}
          onRefresh={() => void loadSummary()}
        />
      )}

      <section className="grid gap-3.5 sm:grid-cols-2 md:grid-cols-4 md:gap-4">
        <MetricCard
          executive
          featured
          label="Programas asignados"
          value={isLoading ? '—' : programCounts.total}
          icon={Package}
          tone="text-[#1E293B]"
          active={view === 'all'}
          onClick={() => setView('all')}
        />
        <MetricCard
          executive
          label="Correcciones pendientes"
          value={isLoading ? '—' : programCounts.corrections}
          icon={AlertTriangle}
          tone="text-rose-500"
          active={view === 'corrections'}
          onClick={() => setView('corrections')}
        />
        <MetricCard
          executive
          label="En producción"
          value={isLoading ? '—' : programCounts.inProduction}
          icon={Package}
          tone="text-orange-500"
          active={view === 'active'}
          onClick={() => setView('active')}
        />
        <MetricCard
          executive
          label="Próximas / vencidas"
          value={isLoading ? '—' : programCounts.upcoming}
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
        viewCounts={viewCounts}
      />

      {visibleTrays.length > 0 ? (
        <section className="grid gap-4 md:grid-cols-2">
          {visibleTrays.map((tray) => {
            const allItems = filterTray(tray.key);
            const totalCount = trays[tray.key].length;
            const displayCount = search.trim() ? allItems.length : totalCount;
            const emptyMessage =
              search.trim() && totalCount > 0 && allItems.length === 0
                ? 'Sin coincidencias para la búsqueda.'
                : tray.emptyMessage;

            return (
              <ProgramOperationalTray
                key={tray.key}
                title={tray.title}
                description={tray.description}
                count={displayCount}
                items={allItems}
                emptyMessage={emptyMessage}
                viewAllTo={tray.viewAllTo}
                onOpenProgram={openProgram}
                icon={tray.icon}
                folderVariant={TRAY_FOLDER_VARIANT[tray.key]}
              />
            );
          })}
        </section>
      ) : (
        !isLoading && (
          <p className="py-4 text-center text-sm text-[#94A3B8]">No hay bandejas para esta vista.</p>
        )
      )}

      {programCounts.newlyAdded > 0 && (view === 'active' || view === 'all') && (
        <section className="grid gap-4 md:grid-cols-2">
          <ProgramOperationalTray
            title="Nuevas agregadas"
            description="Programas con semestres o materias agregadas después de la solicitud inicial."
            count={
              search.trim()
                ? filterFactoryProgramsBySearch(newlyAddedPrograms, search).length
                : programCounts.newlyAdded
            }
            items={filterFactoryProgramsBySearch(newlyAddedPrograms, search)}
            emptyMessage="Sin programas nuevos."
            viewAllTo="/factory/work?origin=new"
            onOpenProgram={openProgram}
            icon={Sparkles}
            folderVariant="pending"
          />
        </section>
      )}
    </div>
  );
}
