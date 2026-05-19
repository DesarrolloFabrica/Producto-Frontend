import { GraduationCap } from 'lucide-react';

export function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-orange-400 to-orange-600 text-white shadow-lg shadow-orange-500/20">
        <GraduationCap className="h-6 w-6" />
      </div>
      <div className="leading-none">
        <p className="text-sm font-black tracking-tight text-slate-950">Fabrica Academica</p>
        <p className="mt-1 text-[9px] font-black uppercase tracking-[0.28em] text-slate-400">CUN</p>
      </div>
    </div>
  );
}
