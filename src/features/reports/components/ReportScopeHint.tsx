import { Info } from 'lucide-react';
import { cn, text } from '../../../components/ui/tokens';
import type { Role } from '../../../types/domain';

const MESSAGES: Partial<Record<Role, string>> = {
  PRODUCT: 'Solo verás solicitudes y programas donde eres responsable Product.',
  FABRICA: 'Solo verás producción y semestres en tu ámbito de Fábrica.',
  ADMIN: 'Vista institucional: todos los programas y exportaciones de auditoría disponibles.',
};

export function ReportScopeHint({ role }: { role: Role | null }) {
  const message = role ? MESSAGES[role] : null;
  if (!message) return null;

  return (
    <p
      className={cn(
        text.body,
        'flex items-center gap-2 rounded-lg border border-white/50 bg-white/40 px-3 py-2 text-[11px] text-slate-600',
      )}
    >
      <Info className="h-3.5 w-3.5 shrink-0 text-orange-500" />
      {message}
    </p>
  );
}
