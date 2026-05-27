import type { PlanningWorkRow } from '../planningTypes';
import { PlanningWorkTable } from './PlanningWorkTable';

/** Vista enfocada en radicaciones; reutiliza la tabla unificada. */
export function PlanningRadicationTable(props: {
  rows: PlanningWorkRow[];
  isLoading: boolean;
  error: string | null;
  onOpenFlow: (subjectId: string) => void;
  onValidateRadication: (projectId: string) => void;
  onReturnRadication: (projectId: string, reason: string) => Promise<void>;
  busyProjectId: string | null;
}) {
  const radicationRows = props.rows.filter((r) => r.kind === 'radication');
  return <PlanningWorkTable {...props} rows={radicationRows} />;
}
