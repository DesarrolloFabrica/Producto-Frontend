import { cn, radius, surface } from '../../../components/ui/tokens';
import { INBOX_PAGE_SIZE } from '../operationalInboxFilters';

export function OperationalInboxPagination({
  page,
  totalPages,
  totalItems,
  pageSize = INBOX_PAGE_SIZE,
  itemLabel,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize?: number;
  itemLabel: { one: string; other: string };
  onPageChange: (page: number) => void;
}) {
  if (totalItems <= pageSize) return null;

  const canPrev = page > 1;
  const canNext = page < totalPages;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);
  const label = totalItems === 1 ? itemLabel.one : itemLabel.other;

  const rangeLabel =
    start === end
      ? `Mostrando ${start} de ${totalItems} ${label}`
      : `Mostrando ${start}-${end} de ${totalItems} ${label}`;

  const btnBase =
    'h-9 rounded-xl px-3.5 text-xs font-bold ring-1 transition-colors disabled:cursor-not-allowed backdrop-blur-sm';

  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3 px-4 py-3', surface.roleGlass, radius.control)}>
      <p className="text-xs font-semibold text-slate-500">{rangeLabel}</p>
      <div className="flex flex-wrap items-center gap-2">
        <PaginationButton label="Primero" disabled={!canPrev} onClick={() => onPageChange(1)} className={btnBase} />
        <PaginationButton
          label="Anterior"
          disabled={!canPrev}
          onClick={() => onPageChange(page - 1)}
          className={btnBase}
        />
        <span className="px-2 text-xs font-bold tabular-nums text-slate-600">
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
          ? 'bg-white/25 text-slate-300 ring-white/40'
          : 'bg-white/55 text-slate-600 ring-white/55 hover:bg-white/75 hover:text-slate-900',
      )}
    >
      {label}
    </button>
  );
}
