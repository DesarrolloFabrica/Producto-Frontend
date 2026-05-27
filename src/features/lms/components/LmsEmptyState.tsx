import { History, RefreshCw, RotateCcw } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import type { LmsDashboardFilter } from '../lmsTypes';

export function LmsEmptyState({
  filter,
  onViewHistory,
  onViewReturned,
  onRefresh,
  isRefreshing,
}: {
  filter: LmsDashboardFilter;
  onViewHistory: () => void;
  onViewReturned: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}) {
  const isHistory = filter === 'history' || filter === 'completed';
  const isReturned = filter === 'returned';

  const title = isHistory
    ? 'Sin cargas completadas recientes'
    : isReturned
      ? 'No hay devoluciones activas'
      : 'No tienes materias pendientes de carga en este momento';

  const description = isHistory
    ? 'Las materias que LMS confirme aparecerán aquí cuando avancen en el flujo institucional.'
    : isReturned
      ? 'Cuando Planeación devuelva una carga, la verás en esta bandeja para corregir y reenviar.'
      : 'Puedes revisar historial, devoluciones o solicitudes ya completadas.';

  return (
    <Card variant="roleGlass" className="border-dashed border-orange-200/50 p-8 text-center">
      <p className="text-base font-bold text-slate-900">{title}</p>
      <p className="mx-auto mt-2 max-w-lg text-sm font-medium text-slate-500">{description}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {!isHistory ? (
          <Button type="button" variant="secondary" className="gap-2" onClick={onViewHistory}>
            <History className="h-4 w-4" />
            Ver historial
          </Button>
        ) : null}
        {!isReturned ? (
          <Button type="button" variant="secondary" className="gap-2" onClick={onViewReturned}>
            <RotateCcw className="h-4 w-4" />
            Ver devueltas
          </Button>
        ) : null}
        <Button type="button" className="gap-2" onClick={onRefresh} disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>
    </Card>
  );
}
