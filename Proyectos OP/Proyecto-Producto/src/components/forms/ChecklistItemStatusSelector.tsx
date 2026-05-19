import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useOperations } from '../../features/operations/OperationsContext';
import { useToast } from '../ui/ToastProvider';
import type { ChecklistStatus } from '../../types/domain';
import { checklistStatusLabels } from '../../utils/status';
import { cn } from '../ui/tokens';

interface ChecklistItemStatusSelectorProps {
  projectId: string;
  subjectId: string;
  checklistItemId: string;
  currentStatus: ChecklistStatus;
}

const statusOptions: ChecklistStatus[] = ['NO_EXISTE', 'PENDIENTE', 'EN_PRODUCCION', 'ENTREGADO', 'APROBADO'];

const dotTone: Record<ChecklistStatus, string> = {
  NO_EXISTE: 'bg-slate-400',
  PENDIENTE: 'bg-amber-500',
  EN_PRODUCCION: 'bg-orange-500',
  ENTREGADO: 'bg-blue-500',
  APROBADO: 'bg-emerald-500',
};

export function ChecklistItemStatusSelector({ projectId, subjectId, checklistItemId, currentStatus }: ChecklistItemStatusSelectorProps) {
  const { updateChecklistItem } = useOperations();
  const { showToast } = useToast();
  const [selectedStatus, setSelectedStatus] = useState<ChecklistStatus>(currentStatus);

  useEffect(() => {
    setSelectedStatus(currentStatus);
  }, [currentStatus]);

  const handleUpdate = () => {
    if (selectedStatus === currentStatus) return;
    updateChecklistItem(projectId, subjectId, checklistItemId, selectedStatus);
    showToast(`Checklist actualizado a: ${checklistStatusLabels[selectedStatus]}`);
  };

  return (
    <div className="flex min-w-0 flex-col gap-2.5 sm:flex-row sm:items-stretch sm:gap-3">
      <div className="relative min-w-0 flex-1">
        <span className={cn('pointer-events-none absolute left-4 top-1/2 z-10 h-2.5 w-2.5 -translate-y-1/2 rounded-full shadow-sm', dotTone[selectedStatus])} aria-hidden />
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value as ChecklistStatus)}
          className={cn(
            'h-11 w-full appearance-none rounded-[22px] border border-orange-100/90 bg-white pl-10 pr-10 text-xs font-bold text-slate-800 shadow-sm outline-none transition-all',
            'hover:border-orange-200 hover:shadow-md focus:border-orange-300 focus:ring-4 focus:ring-orange-100',
          )}
        >
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {checklistStatusLabels[status]}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-400" />
      </div>
      <button
        type="button"
        onClick={handleUpdate}
        disabled={selectedStatus === currentStatus}
        className={cn(
          'h-11 shrink-0 rounded-[22px] px-5 text-xs font-black uppercase tracking-wide transition-all sm:min-w-[7.5rem]',
          selectedStatus === currentStatus
            ? 'cursor-not-allowed border border-slate-100 bg-slate-100 text-slate-400'
            : 'border border-orange-400/30 bg-linear-to-br from-orange-400 to-orange-600 text-white shadow-lg shadow-orange-500/35 hover:from-orange-500 hover:to-orange-700',
        )}
      >
        Actualizar
      </button>
    </div>
  );
}
