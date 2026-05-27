import { ChevronDown, MoreVertical } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { OperationalActionV2 } from '../../../types/operationalWorkflow';
import { Button } from '../../../components/ui/Button';
import { cn } from '../../../components/ui/tokens';
import { actionLabelV2 } from '../rules/workflowRulesV2';

function actionStyle(action: OperationalActionV2): { variant: 'primary' | 'secondary' | 'danger' } {
  if (action.includes('RETURN')) return { variant: 'secondary' };
  if (action === 'PRODUCT_REQUEST_CHANGES') return { variant: 'secondary' };
  return { variant: 'primary' };
}

export function OperationalActionsV2({
  primaryAction,
  actions,
  disabled,
  onAction,
  size = 'sm',
}: {
  primaryAction: OperationalActionV2;
  actions: OperationalActionV2[];
  disabled?: boolean;
  onAction: (action: OperationalActionV2) => void;
  size?: 'sm' | 'md';
}) {
  const [open, setOpen] = useState(false);
  const menuActions = useMemo(() => actions.filter((a) => a !== primaryAction), [actions, primaryAction]);

  return (
    <div className="relative inline-flex items-center gap-1">
      <Button
        size={size}
        variant={actionStyle(primaryAction).variant}
        onClick={() => onAction(primaryAction)}
        disabled={disabled}
      >
        {actionLabelV2(primaryAction)}
        <ChevronDown className="h-3.5 w-3.5 opacity-80" />
      </Button>

      {menuActions.length > 0 ? (
        <button
          type="button"
          className={cn(
            'inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/70 bg-white text-slate-500 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-700',
            disabled && 'cursor-not-allowed opacity-60',
          )}
          onClick={() => !disabled && setOpen((v) => !v)}
          title="Mas acciones"
          disabled={disabled}
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      ) : null}

      {open ? (
        <>
          <div className="fixed inset-0 z-[59]" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-[60] w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="border-b border-slate-100 px-4 py-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Acciones</p>
            </div>
            <div className="p-2">
              {menuActions.map((a) => (
                <button
                  key={a}
                  type="button"
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[11px] font-bold text-slate-700 transition-colors hover:bg-slate-50"
                  onClick={() => {
                    setOpen(false);
                    onAction(a);
                  }}
                >
                  <span className="truncate">{actionLabelV2(a)}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
