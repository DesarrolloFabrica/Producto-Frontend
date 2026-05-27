import type { ReactNode } from 'react';
import { cn, roleAccent, text, type RoleAccent } from './tokens';

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  roleAccent: accent,
  prominentEyebrow,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: string;
  action?: ReactNode;
  roleAccent?: RoleAccent;
  /** @deprecated Usar roleAccent; se mantiene compatibilidad visual unificada */
  prominentEyebrow?: boolean;
}) {
  const accentTokens = accent ? roleAccent[accent] : null;

  return (
    <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <div
          className={cn(
            'mb-3 inline-flex items-center gap-2 rounded-full border px-4 py-1.5',
            accentTokens ? cn(accentTokens.border, accentTokens.bg) : 'border-orange-100/80 bg-white/80',
            prominentEyebrow && 'shadow-sm',
          )}
        >
          <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', accentTokens?.dot ?? 'bg-orange-500')} />
          <span className={cn(text.eyebrow, accentTokens?.eyebrow)}>{eyebrow}</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-slate-950 lg:text-4xl">{title}</h1>
        {description && <p className={cn('mt-3 max-w-3xl', text.body)}>{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
