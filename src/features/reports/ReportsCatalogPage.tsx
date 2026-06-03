import { useEffect, useState } from 'react';
import { DashboardShell } from '../../components/layout/DashboardShell';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { cn, text } from '../../components/ui/tokens';
import { useAuth } from '../auth/AuthContext';
import { reportingApi } from '../../services/reportingApi';
import type { ReportCatalogItem } from '../../services/types/reportingApi.types';
import { ReportCard } from './components/ReportCard';
import { ReportLoadingSkeleton } from './components/ReportLoadingSkeleton';
import { ReportScopeHint } from './components/ReportScopeHint';
import { roleAccentForReports } from './reportUi';

export function ReportsCatalogPage() {
  const { role } = useAuth();
  const [items, setItems] = useState<ReportCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    reportingApi
      .getCatalog()
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Error al cargar catálogo');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <DashboardShell>
      <PageHeader
        eyebrow="Analítica institucional"
        title="Reportes"
        description="Consulta y exporta reportes operativos e institucionales según tu rol."
        roleAccent={roleAccentForReports(role)}
      />
      <div className="space-y-4">
        <ReportScopeHint role={role} />
        {error ? (
          <Card variant="roleGlass" className="border border-red-200/60 bg-red-50/40 p-4">
            <p className="text-sm font-medium text-red-700">{error}</p>
          </Card>
        ) : null}
        {!loading && items.length > 0 ? (
          <p className={cn(text.label, 'normal-case tracking-normal text-slate-500')}>
            {items.length} reporte{items.length === 1 ? '' : 's'} disponibles
          </p>
        ) : null}
        {loading ? (
          <ReportLoadingSkeleton variant="catalog" />
        ) : items.length === 0 ? (
          <Card
            variant="roleGlass"
            className="flex flex-col items-center justify-center border border-dashed border-slate-200/80 px-6 py-14 text-center"
          >
            <p className="text-sm font-semibold text-slate-700">Sin reportes para tu rol</p>
            <p className="mt-1 max-w-md text-xs text-slate-500">
              No hay reportes habilitados. Si crees que es un error, contacta al administrador.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <ReportCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
