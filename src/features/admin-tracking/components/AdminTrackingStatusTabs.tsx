import { cn, radius, surface } from '../../../components/ui/tokens';
import {
  ADMIN_TRACKING_STATUS_OPTIONS,
  type AdminTrackingStatusFilter,
} from '../adminTrackingFilters';

const tabActiveClass = 'bg-white/75 text-orange-700 ring-orange-200/80 backdrop-blur-sm shadow-sm';

export function AdminTrackingStatusTabs({
  value,
  counts,
  onChange,
}: {
  value: AdminTrackingStatusFilter;
  counts: Record<AdminTrackingStatusFilter, number>;
  onChange: (status: AdminTrackingStatusFilter) => void;
}) {
  return (
    <div className={cn('inline-flex flex-wrap gap-1 p-1', surface.roleGlassTab, radius.control)}>
      {ADMIN_TRACKING_STATUS_OPTIONS.map((opt) => {
        const active = value === opt.id;
        const count = counts[opt.id];
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all',
              active
                ? cn('ring-1', tabActiveClass)
                : 'text-slate-600 hover:bg-white/45 hover:text-slate-800',
            )}
          >
            {opt.label}
            <span
              className={cn(
                'rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
                active ? 'bg-orange-100/80 text-orange-800' : 'bg-white/50 text-slate-500',
              )}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
