import { BarChart3 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';

export function ReportEmptyState({ onReset }: { onReset?: () => void }) {
  return (
    <Card
      variant="roleGlass"
      className="flex flex-col items-center justify-center border border-dashed border-slate-200/80 px-6 py-12 text-center"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 text-slate-400 ring-1 ring-slate-100">
        <BarChart3 className="h-5 w-5" />
      </span>
      <p className="mt-3 text-sm font-bold text-slate-800">
        Todavía no existen registros para este reporte.
      </p>
      {onReset ? (
        <Button type="button" variant="secondary" size="sm" className="mt-4" onClick={onReset}>
          Limpiar filtros
        </Button>
      ) : null}
    </Card>
  );
}
