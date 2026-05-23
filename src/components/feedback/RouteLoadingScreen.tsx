import { Loader2 } from 'lucide-react';

export function RouteLoadingScreen({ message = 'Cargando...' }: { message?: string }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-4">
      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
        <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
        {message}
      </div>
    </div>
  );
}
