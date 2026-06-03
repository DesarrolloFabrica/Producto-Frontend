import type { Role } from '../../types/domain';
import type { RoleAccent } from '../../components/ui/tokens';

export function roleAccentForReports(role: Role | null): RoleAccent | undefined {
  switch (role) {
    case 'FABRICA':
      return 'factory';
    case 'PLANEACION':
    case 'LMS':
      return 'planning';
    case 'ADMIN':
    case 'PRODUCT':
    default:
      return 'product';
  }
}

export const reportFilterPanelClass =
  'overflow-hidden rounded-2xl border border-white/70 bg-gradient-to-br from-white/95 via-white/90 to-orange-50/30 p-4 shadow-[0_8px_30px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/40 backdrop-blur-md';

export const reportFieldClass =
  'h-9 w-full appearance-none rounded-xl border border-slate-200/80 bg-white/95 px-3 text-xs font-medium text-slate-700 shadow-sm outline-none transition-all hover:border-slate-300 focus:border-orange-300 focus:ring-2 focus:ring-orange-100/80';

export const reportFilterLabelClass =
  'mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500';

export const reportSearchInputClass =
  'h-11 w-full rounded-xl border border-slate-200/80 bg-white pl-10 pr-10 text-sm font-medium text-slate-800 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-orange-300 focus:ring-2 focus:ring-orange-100/80';

export const reportSearchDropdownClass =
  'absolute z-30 mt-1.5 max-h-64 w-full overflow-auto rounded-xl border border-slate-200/80 bg-white py-1 shadow-xl ring-1 ring-slate-200/50';

export const reportFiltersGridClass = 'grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5';
