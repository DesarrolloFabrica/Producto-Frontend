import { Shield, UserCog } from 'lucide-react';
import type { OperationalRoleV2 } from '../../../types/operationalWorkflow';
import { cn } from '../../../components/ui/tokens';

const roles: OperationalRoleV2[] = ['PRODUCT', 'FABRICA', 'LMS', 'PLANEACION', 'ADMIN'];

function roleTone(role: OperationalRoleV2): { bg: string; text: string; ring: string } {
  switch (role) {
    case 'PLANEACION':
      return { bg: 'bg-sky-50', text: 'text-sky-700', ring: 'ring-sky-200/80' };
    case 'LMS':
      return { bg: 'bg-violet-50', text: 'text-violet-700', ring: 'ring-violet-200/80' };
    case 'FABRICA':
      return { bg: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-orange-200/80' };
    case 'PRODUCT':
      return { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200/80' };
    default:
      return { bg: 'bg-slate-50', text: 'text-slate-700', ring: 'ring-slate-200/80' };
  }
}

export function RoleSwitcherV2({
  value,
  onChange,
  className,
}: {
  value: OperationalRoleV2;
  onChange: (role: OperationalRoleV2) => void;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-2', className)}>
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
          <UserCog className="h-4 w-4" />
        </div>
        <div className="leading-tight">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Vista por rol · Demo</p>
          <p className="text-xs font-bold text-slate-900">Selector de rol (mock)</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1 rounded-2xl border border-slate-200/60 bg-white/70 p-1.5 shadow-sm">
        {roles.map((role) => {
          const active = role === value;
          const tone = roleTone(role);
          return (
            <button
              key={role}
              type="button"
              onClick={() => onChange(role)}
              className={cn(
                'inline-flex h-8 items-center gap-1.5 rounded-xl px-3 text-[11px] font-black transition-colors ring-1',
                active
                  ? cn(tone.bg, tone.text, tone.ring)
                  : 'bg-white text-slate-500 ring-slate-200/70 hover:bg-slate-50 hover:text-slate-700',
              )}
              title={`Cambiar a ${role}`}
            >
              {role === 'ADMIN' ? <Shield className="h-3.5 w-3.5" /> : null}
              {role === 'PLANEACION' ? 'PLANEACIÓN' : role === 'FABRICA' ? 'FÁBRICA' : role}
            </button>
          );
        })}
      </div>
    </div>
  );
}
