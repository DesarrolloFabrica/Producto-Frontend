import { History, RefreshCw, FileCheck2 } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import type { PlanningDashboardFilter } from '../planningTypes';

export function PlanningEmptyState({
  filter,
  onViewRadications,
  onViewHistory,
  onRefresh,
  isRefreshing,
}: {
  filter: PlanningDashboardFilter;
  onViewRadications: () => void;
  onViewHistory: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}) {
  const isHistory = filter === 'history';
  const isRadication = filter === 'radication';
  const isReturned = filter === 'returned';

  const title = isHistory
    ? 'Sin solicitudes finalizadas recientes'
    : isRadication
      ? 'No hay radicaciones pendientes de revisión'
      : isReturned
        ? 'No hay devoluciones activas en seguimiento'
        : 'No tienes validaciones pendientes en este momento';

  const description = isHistory
    ? 'Cuando Planeación cierre solicitudes validando radicados, aparecerán aquí con trazabilidad.'
    : isRadication
      ? 'Product registrará el radicado cuando todas las materias estén listas. Puede revisar historial o solicitudes en curso.'
      : isReturned
        ? 'Las devoluciones recientes a Product, Fábrica o LMS se listan aquí cuando existan.'
        : 'Puedes revisar radicaciones, historial reciente o consultar solicitudes en curso.';

  return (
    <Card className="border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
      <p className="text-base font-bold text-slate-900">{title}</p>
      <p className="mx-auto mt-2 max-w-lg text-sm font-medium text-slate-500">{description}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {!isRadication ? (
          <Button type="button" variant="secondary" className="gap-2" onClick={onViewRadications}>
            <FileCheck2 className="h-4 w-4" />
            Ver radicaciones
          </Button>
        ) : null}
        {!isHistory ? (
          <Button type="button" variant="secondary" className="gap-2" onClick={onViewHistory}>
            <History className="h-4 w-4" />
            Ver historial
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
