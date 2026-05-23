import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  MessageSquare,
  Package,
  Send,
} from 'lucide-react';
import { MetricCard } from '../../components/cards/MetricCard';
import { PageHeader } from '../../components/ui/PageHeader';
import { ProjectsLoadNotice } from '../../components/feedback/ProjectsLoadNotice';
import { useOperations } from '../../features/operations/OperationsContext';
import {
  buildWorkItemsFromProjects,
  groupSubjectsByOperationalState,
  type SubjectOperationalState,
  type SubjectWorkItem,
} from '../../features/operations/subjectOperationalState';
import {
  FactoryDashboardFilters,
  filterWorkItemsByTab,
  type DashboardTab,
} from './factory/FactoryDashboardFilters';
import { FactoryDashboardTray } from './factory/FactoryDashboardTray';
import { FactorySubjectWorkRow } from './factory/FactorySubjectWorkRow';
import { useFactoryDashboard } from './useFactoryDashboard';
import type { FactorySubjectsQuery } from '../../services/factoryApi';

export function FactoryDashboardPage() {
  const { projects, projectObservations, isLoadingProjects, projectsError, refreshProjects, backendEnabled } =
    useOperations();
  const factoryDashboard = useFactoryDashboard(backendEnabled);

  const [activeTab, setActiveTab] = useState<DashboardTab>('active');
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState<SubjectOperationalState | 'ALL'>('ALL');

  const clientWorkItems = useMemo(
    () => buildWorkItemsFromProjects(projects, projectObservations),
    [projects, projectObservations],
  );

  const useRemoteList = backendEnabled && (activeTab !== 'active' || search || stateFilter !== 'ALL');

  useEffect(() => {
    if (!useRemoteList) return;
    const query: FactorySubjectsQuery = {
      page: 1,
      limit: 100,
      search: search || undefined,
      status: stateFilter !== 'ALL' ? stateFilter : undefined,
    };
    if (activeTab === 'corrections') query.status = undefined;
    void factoryDashboard.loadSubjects(query);
  }, [useRemoteList, activeTab, search, stateFilter, factoryDashboard.loadSubjects]);

  const allWorkItems = factoryDashboard.remoteItems ?? clientWorkItems;

  const filteredItems = useMemo(() => {
    let items = filterWorkItemsByTab(allWorkItems, activeTab);
    if (stateFilter !== 'ALL') {
      items = items.filter((i) => i.operationalState === stateFilter);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      items = items.filter(
        (i) =>
          i.subjectName.toLowerCase().includes(q) ||
          i.program.toLowerCase().includes(q) ||
          i.school.toLowerCase().includes(q),
      );
    }
    return items;
  }, [allWorkItems, activeTab, stateFilter, search]);

  const groups = useMemo(
    () => groupSubjectsByOperationalState(clientWorkItems),
    [clientWorkItems],
  );

  const summaryCounts = factoryDashboard.summary?.countsByState;

  const activeCount =
    groups.CHANGES_REQUESTED.length +
    groups.IN_PRODUCTION.length +
    groups.NOT_STARTED.length +
    groups.IN_REVIEW.length +
    groups.CORRECTION_SENT.length;

  const completedRecent = useMemo(() => {
    if (factoryDashboard.summary?.recentlyCompleted.length) {
      return factoryDashboard.summary.recentlyCompleted;
    }
    return [...groups.APPROVED]
      .sort((a, b) => (b.lastActivity ?? '').localeCompare(a.lastActivity ?? ''))
      .slice(0, 5);
  }, [factoryDashboard.summary, groups.APPROVED]);

  const upcoming = useMemo(() => {
    const now = new Date();
    return allWorkItems
      .filter((i) => i.operationalState === 'NOT_STARTED' || i.operationalState === 'IN_PRODUCTION')
      .map((item) => ({
        item,
        daysLeft: Math.ceil(
          (new Date(item.expectedDeliveryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        ),
      }))
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, 5);
  }, [allWorkItems]);

  const showTrayLayout = activeTab === 'active' && !search && stateFilter === 'ALL';

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Bandeja de trabajo"
        title="Solicitudes de producción"
        description="Gestiona cada asignatura según su estado operacional real."
      />

      {backendEnabled && (
        <ProjectsLoadNotice
          isLoading={isLoadingProjects && projects.length === 0}
          error={projectsError}
          onRefresh={() => void refreshProjects()}
        />
      )}

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard
          label="Correcciones pendientes"
          value={summaryCounts?.CHANGES_REQUESTED ?? groups.CHANGES_REQUESTED.length}
          icon={AlertTriangle}
          tone="text-rose-500"
        />
        <MetricCard
          label="En producción"
          value={summaryCounts?.IN_PRODUCTION ?? groups.IN_PRODUCTION.length}
          icon={Package}
          tone="text-[#FF6B00]"
        />
        <MetricCard
          label="En revisión Product"
          value={summaryCounts?.IN_REVIEW ?? groups.IN_REVIEW.length}
          icon={Send}
          tone="text-sky-500"
        />
        <MetricCard
          label="Completadas"
          value={summaryCounts?.APPROVED ?? groups.APPROVED.length}
          icon={CheckCircle2}
          tone="text-emerald-500"
        />
      </section>

      <FactoryDashboardFilters
        activeTab={activeTab}
        onTabChange={setActiveTab}
        search={search}
        onSearchChange={setSearch}
        stateFilter={stateFilter}
        onStateFilterChange={setStateFilter}
      />

      {showTrayLayout ? (
        <section className="space-y-6">
          <FactoryDashboardTray
            title="Correcciones pendientes"
            description="Materias con observaciones abiertas de Product"
            icon={AlertTriangle}
            iconClassName="flex h-9 w-9 items-center justify-center rounded-[12px] bg-rose-500/10 text-rose-500"
            items={groups.CHANGES_REQUESTED}
            emptyMessage="No hay correcciones pendientes."
          />
          <FactoryDashboardTray
            title="En producción"
            description="Materias activas en producción"
            icon={Package}
            iconClassName="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#FFEDD5] text-[#FF6B00]"
            items={groups.IN_PRODUCTION}
            emptyMessage="No hay materias en producción."
          />
          <FactoryDashboardTray
            title="Por iniciar"
            description="Materias pendientes de iniciar producción"
            icon={Clock3}
            iconClassName="flex h-9 w-9 items-center justify-center rounded-[12px] bg-slate-500/10 text-slate-500"
            items={groups.NOT_STARTED}
            emptyMessage="No hay materias por iniciar."
          />
          <FactoryDashboardTray
            title="En revisión Product"
            description="Esperando validación de Product"
            icon={Send}
            iconClassName="flex h-9 w-9 items-center justify-center rounded-[12px] bg-sky-500/10 text-sky-500"
            items={groups.IN_REVIEW}
            emptyMessage="No hay materias en revisión."
          />
          {groups.CORRECTION_SENT.length > 0 && (
            <FactoryDashboardTray
              title="Correcciones enviadas"
              description="Esperando validación de Product por observación"
              icon={MessageSquare}
              iconClassName="flex h-9 w-9 items-center justify-center rounded-[12px] bg-amber-500/10 text-amber-500"
              items={groups.CORRECTION_SENT}
              emptyMessage="No hay correcciones enviadas."
            />
          )}
          {(completedRecent.length > 0 || activeCount === 0) && (
            <FactoryDashboardTray
              title="Completadas recientes"
              description="Materias aprobadas por Product"
              icon={CheckCircle2}
              iconClassName="flex h-9 w-9 items-center justify-center rounded-[12px] bg-emerald-500/10 text-emerald-500"
              items={completedRecent}
              emptyMessage="No hay materias completadas recientemente."
              limit={5}
            />
          )}
          {upcoming.length > 0 && (
            <FactoryDashboardTray
              title="Próximos vencimientos"
              description="Materias por iniciar o en producción, ordenadas por fecha"
              icon={Clock3}
              iconClassName="flex h-9 w-9 items-center justify-center rounded-[12px] bg-amber-500/10 text-amber-500"
              items={upcoming.map((u) => u.item)}
              emptyMessage="No hay vencimientos próximos."
              limit={5}
            />
          )}
        </section>
      ) : (
        <FilteredWorkList items={filteredItems} />
      )}
    </div>
  );
}

function FilteredWorkList({ items }: { items: SubjectWorkItem[] }) {
  if (items.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-[#94A3B8]">
        No hay materias que coincidan con los filtros seleccionados.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <FactorySubjectWorkRow key={item.subjectId} item={item} />
      ))}
    </div>
  );
}
