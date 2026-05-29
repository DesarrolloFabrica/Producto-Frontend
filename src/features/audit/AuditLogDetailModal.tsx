import { ArrowRight } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { ContextLink } from '../../navigation/ContextLink';
import { cn, radius } from '../../components/ui/tokens';
import { formatDateTime } from '../../utils/formatters';
import type { AuditLog } from '../../types/domain';

export function AuditLogDetailModal({
  log,
  onClose,
}: {
  log: AuditLog | null;
  onClose: () => void;
}) {
  if (!log) return null;

  const navigationUrl = log.subjectId
    ? `/subjects/${log.subjectId}`
    : log.projectId && log.semesterNumber != null
      ? `/projects/${log.projectId}/semesters/${log.semesterNumber}`
      : log.projectId
        ? `/projects/${log.projectId}`
        : null;

  return (
    <Modal
      isOpen={Boolean(log)}
      onClose={onClose}
      title={log.action}
      description={log.summary ?? 'Detalle del movimiento registrado en auditoría.'}
      size="md"
    >
      <div className="space-y-5 overflow-y-auto p-6 pt-0">
        <div className={cn('rounded-2xl bg-orange-50/80 px-4 py-3 ring-1 ring-orange-100', radius.control)}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-orange-600">Resumen del cambio</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {log.changeLabel ?? `${log.previousValue} → ${log.newValue}`}
          </p>
          <p className="mt-1 text-xs text-slate-500">{formatDateTime(log.createdAt)}</p>
        </div>

        <DetailSection title="Contexto">
          <DetailRow label="Acción" value={log.action} />
          {log.entityType ? <DetailRow label="Tipo" value={log.entityType} /> : null}
          {log.school ? <DetailRow label="Escuela" value={log.school} /> : null}
          {log.program ? <DetailRow label="Programa" value={log.program} /> : null}
          {log.semesterNumber != null ? <DetailRow label="Semestre" value={`Semestre ${log.semesterNumber}`} /> : null}
          {log.subjectName ? <DetailRow label="Materia" value={log.subjectName} /> : null}
          {log.scope ? <DetailRow label="Ámbito" value={log.scope} /> : null}
          <DetailRow label="Responsable" value={`${log.userName} · ${log.roleLabel ?? log.role}`} />
        </DetailSection>

        {log.details && log.details.length > 0 ? (
          <DetailSection title="Movimiento interno">
            {log.details.map((entry) => (
              <DetailRow key={`${entry.label}-${entry.value}`} label={entry.label} value={entry.value} />
            ))}
          </DetailSection>
        ) : null}

        {navigationUrl ? (
          <ContextLink
            to={navigationUrl}
            onClick={onClose}
            className={cn(
              'inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-700',
              radius.control,
            )}
          >
            Ir al contexto operativo
            <ArrowRight className="h-4 w-4" />
          </ContextLink>
        ) : null}
      </div>
    </Modal>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</p>
      <div className={cn('divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-slate-50/50', radius.control)}>
        {children}
      </div>
    </section>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 px-4 py-3 sm:grid-cols-[140px_1fr] sm:items-start">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-sm font-medium leading-5 text-slate-800">{value}</p>
    </div>
  );
}
