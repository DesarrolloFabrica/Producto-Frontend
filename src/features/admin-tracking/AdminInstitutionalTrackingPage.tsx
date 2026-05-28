import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, CornerDownLeft, RefreshCw } from 'lucide-react';
import { DashboardKpiGrid, DashboardShell } from '../../components/layout/DashboardShell';
import { MetricCard } from '../../components/cards/MetricCard';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { OperationalInboxPagination } from '../operations-v2/components/OperationalInboxPagination';
import { AdminProgramsTrackingTable } from './components/AdminProgramsTrackingTable';
import { AdminTrackingFilters } from './components/AdminTrackingFilters';
import { AdminTrackingStatusTabs } from './components/AdminTrackingStatusTabs';
import {
  ADMIN_TRACKING_PAGE_SIZE,
  DEFAULT_ADMIN_TRACKING_FILTERS,
  adminTrackingSafePage,
  adminTrackingTotalPages,
  countAdminRowsByStatus,
  extractModalityOptions,
  extractSchoolOptions,
  filterAdminTrackingRows,
  paginateAdminTrackingRows,
  type AdminTrackingFiltersState,
} from './adminTrackingFilters';
import { useAdminInstitutionalTracking } from './hooks/useAdminInstitutionalTracking';

export function AdminInstitutionalTrackingPage() {
  const { data, isLoading, error, refetch, isFetching } = useAdminInstitutionalTracking(true);
  const [filters, setFilters] = useState<AdminTrackingFiltersState>(DEFAULT_ADMIN_TRACKING_FILTERS);
  const [page, setPage] = useState(1);

  const modalityOptions = useMemo(() => extractModalityOptions(data.rows), [data.rows]);
  const schoolOptions = useMemo(() => extractSchoolOptions(data.rows), [data.rows]);
  const statusCounts = useMemo(() => countAdminRowsByStatus(data.rows), [data.rows]);

  const filteredRows = useMemo(
    () => filterAdminTrackingRows(data.rows, filters),
    [data.rows, filters],
  );

  const safePage = useMemo(
    () => adminTrackingSafePage(page, filteredRows.length, ADMIN_TRACKING_PAGE_SIZE),
    [page, filteredRows.length],
  );

  useEffect(() => {
    if (safePage !== page) setPage(safePage);
  }, [safePage, page]);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  const paginatedRows = useMemo(
    () => paginateAdminTrackingRows(filteredRows, safePage, ADMIN_TRACKING_PAGE_SIZE),
    [filteredRows, safePage],
  );

  const totalPages = adminTrackingTotalPages(filteredRows.length, ADMIN_TRACKING_PAGE_SIZE);

  const handleClearFilters = () => {
    setFilters(DEFAULT_ADMIN_TRACKING_FILTERS);
    setPage(1);
  };

  const handleStatusTab = (status: AdminTrackingFiltersState['status']) => {
    setFilters((prev) => ({ ...prev, status }));
    setPage(1);
  };

  return (
    <DashboardShell>
      <PageHeader
        eyebrow="Seguimiento institucional"
        title="Vista global de programas"
        description="Monitoreo ejecutivo del flujo end-to-end. Acceso de solo lectura con detalle completo por solicitud."
        action={
          <Button
            variant="secondary"
            size="sm"
            disabled={isFetching}
            onClick={() => void refetch()}
            className="gap-2"
          >
            <RefreshCw className={isFetching ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
            Actualizar
          </Button>
        }
      />

      <DashboardKpiGrid>
        <MetricCard
          label="Activos"
          value={data.kpis.active}
          icon={Activity}
          tone="text-sky-500"
          active={filters.status === 'in_progress'}
          onClick={() => handleStatusTab('in_progress')}
        />
        <MetricCard
          label="Vencidos"
          value={data.kpis.overdue}
          icon={AlertTriangle}
          tone="text-rose-500"
          active={filters.status === 'overdue'}
          onClick={() => handleStatusTab('overdue')}
        />
        <MetricCard
          label="Devolución"
          value={data.kpis.returned}
          icon={CornerDownLeft}
          tone="text-amber-500"
          active={filters.status === 'returned'}
          onClick={() => handleStatusTab('returned')}
        />
        <MetricCard
          label="Finalizados"
          value={data.kpis.finalized}
          icon={CheckCircle2}
          tone="text-emerald-500"
          active={filters.status === 'finalized'}
          onClick={() => handleStatusTab('finalized')}
        />
      </DashboardKpiGrid>

      {!isLoading && !error && data.rows.length > 0 ? (
        <div className="space-y-3">
          <AdminTrackingStatusTabs
            value={filters.status}
            counts={statusCounts}
            onChange={handleStatusTab}
          />
          <AdminTrackingFilters
            filters={filters}
            modalityOptions={modalityOptions}
            schoolOptions={schoolOptions}
            visibleCount={filteredRows.length}
            totalCount={data.rows.length}
            onChange={setFilters}
            onClear={handleClearFilters}
          />
        </div>
      ) : null}

      <AdminProgramsTrackingTable
        rows={paginatedRows}
        totalRows={data.rows.length}
        filteredCount={filteredRows.length}
        isLoading={isLoading}
        error={error}
        onClearFilters={handleClearFilters}
      />

      <OperationalInboxPagination
        page={safePage}
        totalPages={totalPages}
        totalItems={filteredRows.length}
        pageSize={ADMIN_TRACKING_PAGE_SIZE}
        itemLabel={{ one: 'programa', other: 'programas' }}
        onPageChange={setPage}
      />
    </DashboardShell>
  );
}
