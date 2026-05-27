import { useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { DashboardShell } from '../../components/layout/DashboardShell';
import { Button } from '../../components/ui/Button';
import { AdminExecutiveKpiStrip } from './components/AdminExecutiveKpiStrip';
import { AdminProgramsTrackingList } from './components/AdminProgramsTrackingList';
import { AdminTrackingFilters } from './components/AdminTrackingFilters';
import {
  ADMIN_TRACKING_PAGE_SIZE,
  DEFAULT_ADMIN_TRACKING_FILTERS,
  adminTrackingSafePage,
  adminTrackingTotalPages,
  extractModalityOptions,
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

  return (
    <DashboardShell className="space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
            Seguimiento institucional
          </p>
          <h1 className="text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
            Vista global de programas
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Monitoreo ejecutivo del flujo end-to-end. Solo lectura.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          disabled={isFetching}
          onClick={() => void refetch()}
          className="shrink-0 gap-2"
        >
          <RefreshCw className={isFetching ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
          Actualizar
        </Button>
      </header>

      <AdminExecutiveKpiStrip kpis={data.kpis} />

      {!isLoading && !error && data.rows.length > 0 ? (
        <AdminTrackingFilters
          filters={filters}
          modalityOptions={modalityOptions}
          visibleCount={filteredRows.length}
          totalCount={data.rows.length}
          onChange={setFilters}
          onClear={handleClearFilters}
        />
      ) : null}

      <AdminProgramsTrackingList
        rows={paginatedRows}
        totalRows={data.rows.length}
        filteredCount={filteredRows.length}
        page={safePage}
        totalPages={totalPages}
        isLoading={isLoading}
        error={error}
        onClearFilters={handleClearFilters}
        onPageChange={setPage}
      />
    </DashboardShell>
  );
}
