import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertTriangle, Clock3, Package } from "lucide-react";
import { MetricCard } from "../../components/cards/MetricCard";
import { OperationalTray } from "../../components/operational/OperationalTray";
import { ProjectsLoadNotice } from "../../components/feedback/ProjectsLoadNotice";
import { PageHeader } from "../../components/ui/PageHeader";
import { useOperations } from "../../features/operations/OperationsContext";
import { FactoryDashboardQuickNav } from "./factory/FactoryDashboardQuickNav";
import {
  chunkTrays,
  filterItemsBySearch,
  getTraysForView,
  parseFactoryDashboardView,
  type FactoryDashboardView,
} from "./factory/factoryDashboardViews";
import { useFactoryDashboard } from "./useFactoryDashboard";
import type { SubjectWorkItem } from "../operations/subjectOperationalState";

export function FactoryDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isLoadingProjects, projectsError, refreshProjects, backendEnabled } =
    useOperations();
  const {
    summary,
    allSubjects,
    newlyAddedPreview,
    correctionSentPreview,
    isLoading,
    error,
    loadSummary,
  } = useFactoryDashboard(backendEnabled);

  const view = parseFactoryDashboardView(searchParams.get("view"));
  const search = searchParams.get("search") ?? "";

  const groupedSubjects = useMemo(() => {
    const byDueDateAsc = (a: SubjectWorkItem, b: SubjectWorkItem) =>
      new Date(a.expectedDeliveryDate || 0).getTime() -
      new Date(b.expectedDeliveryDate || 0).getTime();
    const byActivityDesc = (a: SubjectWorkItem, b: SubjectWorkItem) =>
      new Date(b.lastActivity || 0).getTime() -
      new Date(a.lastActivity || 0).getTime();

    const remaining = [...allSubjects];
    const used = new Set<string>();
    const claim = (items: SubjectWorkItem[]) => {
      const out: SubjectWorkItem[] = [];
      for (const item of items) {
        if (used.has(item.subjectId)) continue;
        used.add(item.subjectId);
        out.push(item);
      }
      return out;
    };

    const corrections = claim(
      remaining
        .filter(
          (item) =>
            item.operationalState === "CHANGES_REQUESTED" ||
            item.openObservationsCount > 0,
        )
        .sort(byActivityDesc),
    );

    const inProduction = claim(
      remaining
        .filter((item) => item.operationalState === "IN_PRODUCTION")
        .sort(byDueDateAsc),
    );

    // Calcula la fecha actual.
    const today = new Date();

    // Calcula el límite máximo: hoy + 5 días.
    const fiveDaysFromToday = new Date(today);
    fiveDaysFromToday.setDate(today.getDate() + 5);

    const upcoming = claim(
      remaining
        .filter((item) => {
          // Si no tiene fecha esperada, no puede considerarse próxima a vencer.
          if (!item.expectedDeliveryDate) return false;

          // Convierte la fecha esperada a objeto Date para poder compararla.
          const expectedDate = new Date(item.expectedDeliveryDate);

          // Solo permite materias por iniciar o en producción.
          const isAllowedState =
            item.operationalState === "NOT_STARTED" ||
            item.operationalState === "IN_PRODUCTION";

          // Valida que la fecha esté entre hoy y los próximos 5 días.
          const isWithinFiveDays =
            expectedDate >= today && expectedDate <= fiveDaysFromToday;

          return isAllowedState && isWithinFiveDays;
        })
        .sort(byDueDateAsc),
    );

    const newlyAdded = claim(
      remaining.filter((item) => item.createdFromChange).sort(byActivityDesc),
    );

    const notStarted = claim(
      remaining
        .filter((item) => item.operationalState === "NOT_STARTED")
        .sort(byDueDateAsc),
    );

    return { corrections, inProduction, upcoming, newlyAdded, notStarted };
  }, [allSubjects]);

  const summaryCounts = useMemo(
    () => ({
      ...(summary?.countsByState ?? {}),
      CHANGES_REQUESTED: groupedSubjects.corrections.length,
      IN_PRODUCTION: groupedSubjects.inProduction.length,
      NOT_STARTED: groupedSubjects.notStarted.length,
    }),
    [summary?.countsByState, groupedSubjects],
  );
  const totalAssigned = summary?.totalAssigned ?? 0;

  const trayContext = useMemo(
    () => ({
      summary: summary
        ? {
            countsByState: summaryCounts,
            pendingCorrectionsTop: groupedSubjects.corrections.slice(0, 5),
            inProductionTop: groupedSubjects.inProduction.slice(0, 5),
            upcomingDeliveriesTop: groupedSubjects.upcoming.slice(0, 5),
            notStartedTop: groupedSubjects.notStarted.slice(0, 5),
            inReviewTop: summary.inReviewTop,
            recentlyCompletedTop: summary.recentlyCompletedTop,
            overdueOrDueSoonCount: groupedSubjects.upcoming.length,
          }
        : null,
      newlyAddedPreview: {
        items: groupedSubjects.newlyAdded.slice(0, 5),
        total: groupedSubjects.newlyAdded.length,
      },
      correctionSentPreview,
    }),
    [summary, summaryCounts, groupedSubjects, correctionSentPreview],
  );

  const visibleTrays = useMemo(
    () => getTraysForView(view, trayContext),
    [view, trayContext],
  );
  const trayRows = useMemo(() => chunkTrays(visibleTrays), [visibleTrays]);

  const setView = useCallback(
    (nextView: FactoryDashboardView) => {
      const next = new URLSearchParams(searchParams);
      if (nextView === "active") next.delete("view");
      else next.set("view", nextView);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const setSearch = useCallback(
    (value: string) => {
      const next = new URLSearchParams(searchParams);
      if (value) next.set("search", value);
      else next.delete("search");
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
          value={isLoading && !summary ? "—" : totalAssigned}
          icon={Package}
          tone="text-[#1E293B]"
          active={view === "all"}
          onClick={() => setView("all")}
        />
        <MetricCard
          variant="subjectPanel"
          label="Correcciones pendientes"
          value={
            isLoading && !summary ? "—" : groupedSubjects.corrections.length
          }
          icon={AlertTriangle}
          tone="text-rose-500"
          active={view === "corrections"}
          onClick={() => setView("corrections")}
        />
        <MetricCard
          variant="subjectPanel"
          label="En producción"
          value={
            isLoading && !summary ? "—" : groupedSubjects.inProduction.length
          }
          icon={Package}
          tone="text-orange-500"
          active={view === "active"}
          onClick={() => setView("active")}
        />
        <MetricCard
          variant="subjectPanel"
          label="Próximas / vencidas"
          value={isLoading && !summary ? "—" : groupedSubjects.upcoming.length}
          icon={Clock3}
          tone="text-amber-500"
          active={view === "active"}
          onClick={() => setView("active")}
        />
      </section>

      <FactoryDashboardQuickNav
        view={view}
        search={search}
        onViewChange={setView}
        onSearchChange={setSearch}
      />

      {trayRows.map((row, rowIndex) => (
        <section
          key={row.map((t) => t.id).join("-") || rowIndex}
          className="grid gap-4 md:grid-cols-2"
        >
          {row.map((tray) => {
            const totalCount = tray.getCount(trayContext);
            const allItems = tray.getItems(trayContext);
            const filteredItems = filterItemsBySearch(allItems, search);
            const displayCount = hasSearch ? filteredItems.length : totalCount;
            const emptyMessage =
              hasSearch && totalCount > 0 && filteredItems.length === 0
                ? "Sin coincidencias para la búsqueda."
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
