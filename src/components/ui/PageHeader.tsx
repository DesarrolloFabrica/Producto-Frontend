import type { ReactNode } from 'react';
import { cn, roleAccent, text, type RoleAccent } from './tokens';

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  roleAccent: accent,
  prominentEyebrow,
  variant = 'default',
}: {
  eyebrow: string;
  title: ReactNode;
  description?: string;
  action?: ReactNode;
  roleAccent?: RoleAccent;
  /** @deprecated Usar roleAccent; se mantiene compatibilidad visual unificada */
  prominentEyebrow?: boolean;
  variant?: 'default' | 'executive';
}) {
  const accentTokens = accent ? roleAccent[accent] : null;
  const isExecutive = variant === 'executive';

  return (
    <header
      className={cn(
        'flex flex-col lg:flex-row lg:items-end lg:justify-between',
        isExecutive ? 'gap-3' : 'gap-5',
      )}
    >
      <div>
        <div
          className={cn(
            'mb-2.5 inline-flex items-center gap-1.5 rounded-full border backdrop-blur-sm',
            isExecutive ? 'px-2.5 py-1' : 'mb-3 gap-2 px-4 py-1.5 backdrop-blur-md',
            accentTokens ? cn(accentTokens.border, accentTokens.bg, 'bg-white/50') : 'border-slate-200/70 bg-white/70',
            prominentEyebrow && !isExecutive && 'shadow-sm',
            isExecutive && 'shadow-[0_1px_2px_rgba(15,23,42,0.03)]',
          )}
        >
          <span
            className={cn(
              'shrink-0 rounded-full',
              isExecutive ? 'h-1 w-1' : 'h-1.5 w-1.5',
              accentTokens?.dot ?? 'bg-[var(--fac-primary)]',
            )}
          />
          <span
            className={cn(
              isExecutive
                ? 'text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500'
                : text.eyebrow,
              accentTokens?.eyebrow,
              isExecutive && !accentTokens && 'text-[var(--fac-primary)]/90',
            )}
          >
            {eyebrow}
          </span>
        </div>
        <h1
          className={cn(
            'font-bold tracking-tight text-slate-950',
            isExecutive ? 'text-2xl lg:text-[1.75rem]' : 'text-3xl font-black lg:text-4xl',
          )}
        >
          {title}
        </h1>
        {description && (
          <p
            className={cn(
              isExecutive
                ? 'mt-1.5 max-w-2xl text-[13px] leading-snug text-slate-500'
                : cn('mt-3 max-w-3xl', text.body),
            )}
          >
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
