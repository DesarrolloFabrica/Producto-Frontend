import type { ReactNode } from 'react';
import { text } from './tokens';

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  prominentEyebrow,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
  /** Estilo pill del login (MVP Operativo / Acceso temporal) */
  prominentEyebrow?: boolean;
}) {
  return (
    <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        {prominentEyebrow ? (
          <div className="mb-4 inline-flex items-center gap-2.5 rounded-full border border-orange-100 bg-white px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-orange-500 shadow-sm">
            <span className="h-2 w-2 shrink-0 rounded-full bg-orange-500" />
            {eyebrow}
          </div>
        ) : (
          <div className="mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-orange-500" />
            <span className={text.eyebrow}>{eyebrow}</span>
          </div>
        )}
        <h1 className="text-3xl font-black tracking-tight text-slate-950 lg:text-4xl">{title}</h1>
        {description && <p className="mt-3 max-w-3xl text-sm font-medium leading-7 text-[#475569]">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
