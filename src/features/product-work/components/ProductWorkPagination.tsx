import { cn } from '../../../components/ui/tokens';

export function ProductWorkPagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  entityLabel = 'materias',
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  entityLabel?: string;
}) {
  const canPrev = page > 1;
  const canNext = page < totalPages;
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = totalItems === 0 ? 0 : Math.min(page * pageSize, totalItems);
  const singular = entityLabel.endsWith('s') ? entityLabel.slice(0, -1) : entityLabel;
  const plural = entityLabel;

  const rangeLabel =
    totalItems === 0
      ? `Mostrando 0 de 0 ${plural}`
      : start === end
        ? `Mostrando ${start} de ${totalItems} ${totalItems === 1 ? singular : plural}`
        : `Mostrando ${start}-${end} de ${totalItems} ${plural}`;

  const btnBase =
    'h-9 rounded-[12px] px-3.5 text-xs font-bold ring-1 transition-colors disabled:cursor-not-allowed';

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-slate-200/50 bg-white/80 px-4 py-3">
      <p className="text-xs font-semibold text-[#64748B]">{rangeLabel}</p>
      <div className="flex flex-wrap items-center gap-2">
        <PaginationButton label="Primero" disabled={!canPrev} onClick={() => onPageChange(1)} className={btnBase} />
        <PaginationButton
          label="Anterior"
          disabled={!canPrev}
          onClick={() => onPageChange(page - 1)}
          className={btnBase}
        />
        <PaginationButton
          label="Siguiente"
          disabled={!canNext}
          onClick={() => onPageChange(page + 1)}
          className={btnBase}
        />
        <PaginationButton label="Ultimo" disabled={!canNext} onClick={() => onPageChange(totalPages)} className={btnBase} />
      </div>
    </div>
  );
}

function PaginationButton({
  label,
  disabled,
  onClick,
  className,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  className: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        className,
        disabled
          ? 'bg-slate-50/80 text-slate-300 ring-slate-100'
          : 'bg-white text-[#64748B] ring-slate-200/60 hover:bg-slate-50 hover:text-[#1E293B]',
      )}
    >
      {label}
    </button>
  );
}

