import { cn } from '../ui/tokens';

export type ChangeOriginKind = 'semester' | 'subject';

const badgeStyles: Record<ChangeOriginKind, string> = {
  semester: 'bg-violet-50 text-violet-700 ring-violet-200/80',
  subject: 'bg-cyan-50 text-cyan-800 ring-cyan-200/80',
};

const badgeLabels: Record<ChangeOriginKind, string> = {
  semester: 'NUEVO',
  subject: 'AGREGADA',
};

export function ChangeOriginBadge({
  kind,
  className,
}: {
  kind: ChangeOriginKind;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ring-1',
        badgeStyles[kind],
        className,
      )}
    >
      {badgeLabels[kind]}
    </span>
  );
}

export function ChangeOriginHint({ kind }: { kind: ChangeOriginKind }) {
  const text =
    kind === 'semester'
      ? 'Semestre agregado posteriormente por Product.'
      : 'Materia agregada posteriormente por Product.';
  return <p className="text-[10px] font-medium leading-relaxed text-slate-500">{text}</p>;
}

export function ChangeOriginCardAccent({ isNew }: { isNew: boolean }) {
  if (!isNew) return null;
  return (
    <span
      className="absolute left-0 top-3 bottom-3 w-1 rounded-full bg-gradient-to-b from-cyan-400 to-violet-400"
      aria-hidden
    />
  );
}
