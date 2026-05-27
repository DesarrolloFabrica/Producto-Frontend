import { AlertTriangle, CornerDownLeft } from 'lucide-react';
import type { Role } from '../../../types/domain';
import { cn } from '../../../components/ui/tokens';
import { roleLabelV2 } from '../../operations-v2/rules/workflowRulesV2';
import type { OperationalRoleV2 } from '../../../types/operationalWorkflow';

const roleTone: Record<string, string> = {
  PRODUCT: 'bg-violet-50 text-violet-800 ring-violet-200/80',
  PLANEACION: 'bg-indigo-50 text-indigo-800 ring-indigo-200/80',
  FABRICA: 'bg-orange-50 text-orange-800 ring-orange-200/80',
  LMS: 'bg-sky-50 text-sky-800 ring-sky-200/80',
  ADMIN: 'bg-slate-50 text-slate-700 ring-slate-200/80',
};

export function AdminResponsibleRoleBadge({ role, compact }: { role: Role; compact?: boolean }) {
  const label = roleLabelV2(role as OperationalRoleV2);
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-semibold ring-1',
        compact ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs font-bold',
        roleTone[role] ?? roleTone.ADMIN,
      )}
    >
      {compact ? label : `Responsable: ${label}`}
    </span>
  );
}
