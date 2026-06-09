import { cn, radius, surface } from '../../../components/ui/tokens';

export function FactoryWorkPagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const canPrev = page > 1;
  const canNext = page < totalPages;
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = totalItems === 0 ? 0 : Math.min(page * pageSize, totalItems);

  const rangeLabel =
    totalItems === 0
      ? 'Mostrando 0 de 0 programas'
      : start === end
        ? `Mostrando ${start} de ${totalItems} programa${totalItems === 1 ? '' : 's'}`
        : `Mostrando ${start}–${end} de ${totalItems} programas`;

  const btnBase =
    'h-8 rounded-lg px-3 text-[11px] font-semibold ring-1 transition-colors disabled:cursor-not-allowed backdrop-blur-sm';

  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3 px-4 py-2.5', surface.roleGlass, radius.control)}>
      <p className="text-xs font-medium text-slate-500">{rangeLabel}</p>
      <div className="flex flex-wrap items-center gap-1.5">
        <PaginationButton label="Primero" disabled={!canPrev} onClick={() => onPageChange(1)} className={btnBase} />
        <PaginationButton
          label="Anterior"
          disabled={!canPrev}
          onClick={() => onPageChange(page - 1)}
          className={btnBase}
        />
        <span className="px-2 text-[11px] font-semibold tabular-nums text-slate-600">
          {page} / {totalPages}
        </span>
        <PaginationButton
          label="Siguiente"
          disabled={!canNext}
          onClick={() => onPageChange(page + 1)}
          className={btnBase}
        />
        <PaginationButton
          label="Último"
          disabled={!canNext}
          onClick={() => onPageChange(totalPages)}
          className={btnBase}
        />
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
          ? 'bg-white/20 text-slate-300 ring-white/30'
          : 'bg-white/55 text-slate-600 ring-white/55 hover:bg-white/80 hover:text-slate-900',
      )}
    >
      {label}
    </button>
  );
}
