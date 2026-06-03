import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { DashboardShell } from '../../components/layout/DashboardShell';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { useToast } from '../../components/ui/ToastProvider';
import { cn, text } from '../../components/ui/tokens';
import { useAuth } from '../auth/AuthContext';
import { reportingApi } from '../../services/reportingApi';
import type { ReportCatalogItem, ReportFilterOptions, ReportFiltersState, ReportPreviewResponse } from '../../services/types/reportingApi.types';
import { DEFAULT_REPORT_FILTERS } from '../../services/types/reportingApi.types';
import { ReportEmptyState } from './components/ReportEmptyState';
import { ReportExportToolbar } from './components/ReportExportToolbar';
import { ReportFiltersPanel } from './components/ReportFiltersPanel';
import { ReportKpiHeader } from './components/ReportKpiHeader';
import { ReportLoadingSkeleton } from './components/ReportLoadingSkeleton';
import { ReportPreviewTable } from './components/ReportPreviewTable';
import { ReportScopeHint } from './components/ReportScopeHint';
import { filtersToExportParams, filtersToPreviewParams } from './reportFilterUtils';
import { REPORT_PREVIEW_PAGE_SIZE } from './reportLimits';
import { roleAccentForReports } from './reportUi';
import { filtersAreEqual, useDebouncedValue } from './useDebouncedValue';
import { OperationalInboxPagination } from '../operations-v2/components/OperationalInboxPagination';

const FILTER_DEBOUNCE_MS = 400;

export function ReportDetailPage() {
  const { reportId } = useParams<{ reportId: string }>();
  const { role } = useAuth();
  const { showToast } = useToast();
  const [catalogItem, setCatalogItem] = useState<ReportCatalogItem | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [filters, setFilters] = useState<ReportFiltersState>({ ...DEFAULT_REPORT_FILTERS });
  const [page, setPage] = useState(1);
  const [preview, setPreview] = useState<ReportPreviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [filterOptions, setFilterOptions] = useState<ReportFilterOptions | null>(null);
  const [filterOptionsLoading, setFilterOptionsLoading] = useState(false);

  const debouncedFilters = useDebouncedValue(filters, FILTER_DEBOUNCE_MS);
  const filtersPending = !filtersAreEqual(filters, debouncedFilters);
  const prevDebouncedRef = useRef(debouncedFilters);

  useEffect(() => {
    setCatalogLoading(true);
    reportingApi
      .getCatalog()
      .then((items) => {
        const found = items.find((i) => i.id === reportId);
        setCatalogItem(found ?? null);
      })
      .finally(() => setCatalogLoading(false));
  }, [reportId]);

  useEffect(() => {
    if (!reportId || !catalogItem) return;
    let cancelled = false;
    setFilterOptionsLoading(true);
    reportingApi
      .getFilterOptions(reportId)
      .then((options) => {
        if (!cancelled) setFilterOptions(options);
      })
      .catch(() => {
        if (!cancelled) setFilterOptions(null);
      })
      .finally(() => {
        if (!cancelled) setFilterOptionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reportId, catalogItem]);

  useEffect(() => {
    if (!filtersAreEqual(prevDebouncedRef.current, debouncedFilters)) {
      setPage(1);
      prevDebouncedRef.current = debouncedFilters;
    }
  }, [debouncedFilters]);

  const previewParams = useMemo(
    () => filtersToPreviewParams(debouncedFilters, page, REPORT_PREVIEW_PAGE_SIZE),
    [debouncedFilters, page],
  );

  const exportParams = useMemo(
    () => filtersToExportParams(debouncedFilters),
    [debouncedFilters],
  );

  const loadPreview = useCallback(async () => {
    if (!reportId || !catalogItem) return;
    setLoading(true);
    try {
      const data = await reportingApi.getPreview(reportId, previewParams);
      setPreview(data);
    } catch (e) {
      setPreview(null);
      showToast(
        e instanceof Error ? e.message : 'No se pudo cargar la vista previa del reporte.',
        'error',
      );
    } finally {
      setLoading(false);
    }
  }, [reportId, catalogItem, previewParams, showToast]);

  useEffect(() => {
    void loadPreview();
  }, [loadPreview]);

  const handleResetFilters = () => {
    setFilters({ ...DEFAULT_REPORT_FILTERS });
    setPage(1);
  };

  const handleExportExcel = async () => {
    if (!reportId) return;
    setExporting(true);
    try {
      await reportingApi.downloadExport(reportId, 'xlsx', exportParams);
      showToast('Excel descargado correctamente.');
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : 'No se pudo exportar el reporte a Excel.',
        'error',
      );
    } finally {
      setExporting(false);
    }
  };

  const totalPages = preview ? Math.max(1, Math.ceil(preview.total / REPORT_PREVIEW_PAGE_SIZE)) : 1;
  const hasData = Boolean(preview && preview.total > 0 && preview.rows.length > 0);
  const showEmpty = Boolean(preview && !loading && !filtersPending && preview.total === 0);

  if (catalogLoading) {
    return (
      <DashboardShell>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
          Cargando reporte…
        </div>
        <div className="mt-4">
          <ReportLoadingSkeleton variant="table" />
        </div>
      </DashboardShell>
    );
  }

  if (!catalogItem) {
    return (
      <DashboardShell>
        <Card variant="roleGlass" className="p-6 text-center">
          <p className="text-sm font-semibold text-slate-700">Reporte no encontrado</p>
          <p className="mt-1 text-xs text-slate-500">No tienes permiso o el identificador no existe.</p>
          <Link
            to="/reports"
            className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-orange-600 hover:text-orange-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al catálogo
          </Link>
        </Card>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <Link
        to="/reports"
        className="mb-2 inline-flex items-center gap-1.5 rounded-lg px-1.5 py-0.5 text-[11px] font-bold text-slate-500 transition-colors hover:bg-white/60 hover:text-orange-600"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Catálogo
      </Link>

      <PageHeader
        eyebrow="Reporte institucional"
        title={catalogItem.name}
        description={catalogItem.description}
        roleAccent={roleAccentForReports(role)}
        action={
          <ReportExportToolbar
            report={catalogItem}
            exporting={exporting}
            onExportExcel={() => void handleExportExcel()}
          />
        }
      />

      <div className="mt-3 space-y-3">
        <ReportScopeHint role={role} />
        <ReportFiltersPanel
          report={catalogItem}
          filters={filters}
          filterOptions={filterOptions}
          filterOptionsLoading={filterOptionsLoading}
          filtersPending={filtersPending || loading}
          previewTotal={preview?.total}
          onChange={setFilters}
          onClearAll={handleResetFilters}
        />

        {loading || filtersPending ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[72px] animate-pulse rounded-xl bg-slate-100/80" />
              ))}
            </div>
            <ReportLoadingSkeleton variant="table" />
          </>
        ) : null}

        {!loading && !filtersPending && hasData && preview && reportId ? (
          <>
            <ReportKpiHeader reportId={reportId} preview={preview} />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className={cn(text.label, 'mb-0')}>Detalle de registros</p>
              <span className="text-[11px] font-semibold tabular-nums text-slate-500">
                {preview.rows.length} de {preview.total} · página {page}
              </span>
            </div>
            <ReportPreviewTable columns={preview.columns} rows={preview.rows} />
            {totalPages > 1 ? (
              <OperationalInboxPagination
                page={page}
                totalPages={totalPages}
                totalItems={preview.total}
                pageSize={REPORT_PREVIEW_PAGE_SIZE}
                itemLabel={{ one: 'registro', other: 'registros' }}
                onPageChange={setPage}
              />
            ) : null}
          </>
        ) : null}

        {showEmpty ? <ReportEmptyState onReset={handleResetFilters} /> : null}
      </div>
    </DashboardShell>
  );
}
