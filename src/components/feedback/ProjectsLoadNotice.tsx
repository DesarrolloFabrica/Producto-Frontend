import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';

interface ProjectsLoadNoticeProps {
  isLoading?: boolean;
  error?: string | null;
  isEmpty?: boolean;
  onRefresh?: () => void;
  emptyMessage?: string;
}

export function ProjectsLoadNotice({
  isLoading,
  error,
  isEmpty,
  onRefresh,
  emptyMessage = 'No hay solicitudes registradas todavía.',
}: ProjectsLoadNoticeProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
        <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
        Cargando solicitudes desde el servidor...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
        <div className="flex items-start gap-2 text-sm font-semibold text-rose-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
        {onRefresh && (
          <Button type="button" size="sm" variant="secondary" onClick={onRefresh}>
            <RefreshCw className="h-3.5 w-3.5" /> Reintentar
          </Button>
        )}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm font-semibold text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return null;
}
