import type { PlanningWorkRow } from '../planningTypes';
import { PlanningWorkTable } from './PlanningWorkTable';

/** Vista de radicaciones pendientes; mismas filas de seguimiento marcadas para revisión interna. */
export function PlanningRadicationTable(
  props: {
    rows: PlanningWorkRow[];
    totalRows?: number;
    isLoading: boolean;
    error: string | null;
    onOpenFlow: (row: PlanningWorkRow) => void;
  },
) {
  return <PlanningWorkTable {...props} />;
}
