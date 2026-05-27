import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../../components/ui/tokens';
import { ADMIN_TRACKING_PAGE_SIZE } from '../adminTrackingFilters';

export function AdminTrackingPagination({
  page,
  totalPages,
  totalItems,
  pageSize = ADMIN_TRACKING_PAGE_SIZE,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
}) {
  const canPrev = page > 1;
  const canNext = page < totalPages;
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);
  const rangeLabel =
    totalItems === 0
      ? 'Sin programas'
      : start === end
        ? `Mostrando ${start} de ${totalItems} programas`
        : `Mostrando ${start}-${end} de ${totalItems} programas`;

  const btnClass =
    'inline-flex h-8 w-8 items-center justify-center rounded-lg border text-slate-600 transition-colors';

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/50 px-3 py-2">
      <p className="text-[11px] font-semibold text-slate-500">{rangeLabel}</p>

      {totalItems > pageSize ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={!canPrev}
            aria-label="Página anterior"
            className={cn(
              btnClass,
              canPrev
                ? 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                : 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300',
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <p className="min-w-[88px] text-center text-xs font-semibold tabular-nums text-slate-700">
            Página {page} de {totalPages}
          </p>

          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={!canNext}
            aria-label="Página siguiente"
            className={cn(
              btnClass,
              canNext
                ? 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                : 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300',
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
