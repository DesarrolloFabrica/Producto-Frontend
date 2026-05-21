import { useState } from 'react';
import { motion } from 'motion/react';
import { History, Link as LinkIcon, ListChecks, UserCog } from 'lucide-react';
import { MetricCard } from '../../components/cards/MetricCard';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { cn } from '../../components/ui/tokens';
import { EmptyState } from '../../components/ui/EmptyState';
import { useOperations } from '../../features/operations/OperationsContext';
import { useContextPanel } from '../../features/context-panel/ContextPanelProvider';
import { formatDate } from '../../utils/formatters';
import { OperationalHelp } from '../../components/operational/OperationalHelp';
import { getAuditOperationalImpact } from '../operations/operationalRules';
import { fadeUp, softScale } from '../../components/motion/presets';

type EntityFilter = 'Todos' | 'Proyecto' | 'Materia' | 'Link' | 'Checklist' | 'Comentario' | 'Observacion';
const filters: EntityFilter[] = ['Todos', 'Proyecto', 'Materia', 'Link', 'Checklist', 'Comentario', 'Observacion'];

export function AuditPage() {
  const [filter, setFilter] = useState<EntityFilter>('Todos');
  const { auditLogs, projects } = useOperations();
  const { openContextPanel } = useContextPanel();
  const filtered = auditLogs.filter((log) => filter === 'Todos' || log.entityType === filter);
  const grouped = filtered.reduce<Record<string, typeof filtered>>((acc, log) => {
    const date = formatDate(log.createdAt);
    acc[date] = [...(acc[date] ?? []), log];
    return acc;
  }, {});

  const handleContext = (log: (typeof filtered)[0]) => {
    if (log.entityType === 'Proyecto') {
      const project = projects.find((p) => p.program === log.entityName || log.entityName.includes(p.program));
      if (project) {
        openContextPanel('project', project.id);
        return;
      }
    }
    openContextPanel('project', log.entityName);
  };

  return (
    <div className="space-y-7">
      <PageHeader
        prominentEyebrow
        eyebrow="Trazabilidad institucional"
        title="Auditoría"
        description="Historial operacional agrupado por fecha con claridad sobre valor anterior, valor nuevo y responsable del cambio."
      />
      <OperationalHelp topic="audit" />

      <section className="grid gap-3 md:grid-cols-4">
        <MetricCard variant="subjectPanel" label="Cambios registrados" value={auditLogs.length} icon={History} />
        <MetricCard variant="subjectPanel" label="Cambios Product" value={auditLogs.filter((log) => log.role === 'PRODUCT').length} icon={UserCog} />
        <MetricCard variant="subjectPanel" label="Cambios Fábrica" value={auditLogs.filter((log) => log.role === 'FABRICA').length} icon={ListChecks} />
        <MetricCard variant="subjectPanel" label="Links actualizados" value={auditLogs.filter((log) => log.entityType === 'Link').length} icon={LinkIcon} />
      </section>

      <div className="rounded-[28px] border border-orange-100/90 bg-white/90 p-1.5 shadow-[inset_0_2px_8px_rgba(249,115,22,0.06),0_8px_28px_rgba(249,115,22,0.08)]">
        <div className="flex flex-wrap gap-1.5">
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={cn(
                'rounded-[22px] border border-transparent px-4 py-2.5 text-[9px] font-black uppercase tracking-widest transition-all',
                'hover:border-orange-100 hover:bg-orange-50/50 hover:text-slate-900',
                filter === item && 'border-orange-200 bg-white text-orange-700 shadow-md ring-2 ring-orange-100/80',
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={History} title="Sin registros de auditoría" description="No hay cambios que coincidan con el filtro seleccionado." cardVariant="subjectPanel" />
      ) : (
        <Card variant="subjectPanel" className="overflow-hidden p-0">
          <div className="border-b border-orange-100/90 bg-linear-to-r from-orange-50/70 via-white to-transparent px-5 py-4 sm:px-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Historial</p>
            <p className="mt-0.5 text-sm font-black tracking-tight text-slate-950">Línea de tiempo</p>
          </div>
          <div className="space-y-6 p-5 sm:p-6">
            {Object.entries(grouped).map(([date, logs]) => (
              <section key={date} className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="h-px flex-1 bg-orange-100" />
                  <h2 className="rounded-full bg-orange-50/80 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-orange-600 ring-1 ring-orange-200/80">{date}</h2>
                  <span className="h-px flex-1 bg-orange-100" />
                </div>
                <div className="space-y-3">
                  {logs.map((log) => (
                    <AuditItem key={log.id} log={log} onContext={() => handleContext(log)} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function AuditItem({ log, onContext }: { log: ReturnType<typeof useOperations>['auditLogs'][number]; onContext: () => void }) {
  const impact = getAuditOperationalImpact(log);
  return (
    <motion.div {...fadeUp} {...softScale} className="relative pl-5">
      <span className="absolute left-0 top-4 h-2.5 w-2.5 rounded-full bg-orange-500 shadow-[0_0_0_4px_rgba(249,115,22,0.12)]" />
      <div className="grid gap-3 rounded-[20px] border border-orange-100/90 bg-white/90 p-3.5 shadow-sm transition-all hover:border-orange-200 hover:shadow-md lg:grid-cols-12 lg:items-start">
        <div className="lg:col-span-3">
          <button type="button" onClick={onContext} className="text-left transition-colors hover:text-orange-600">
            <p className="line-clamp-1 text-sm font-black tracking-tight text-slate-950">{log.entityName}</p>
            <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
              {log.entityType} / {log.action}
            </p>
          </button>
        </div>
        <div className="lg:col-span-2">
          <Label text="Responsable" value={`${log.userName} (${log.role})`} />
        </div>
        <div className="lg:col-span-2">
          <Label text="Que cambio" value={impact.change} highlight />
        </div>
        <div className="lg:col-span-2">
          <Label text="Por que importa" value={impact.importance} />
        </div>
        <div className="lg:col-span-3">
          <Label text="Consecuencia" value={impact.consequence} />
        </div>
      </div>
    </motion.div>
  );
}

function Label({ text, value, highlight }: { text: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">{text}</p>
      <p className={cn('mt-1 line-clamp-2 text-xs font-semibold leading-5', highlight ? 'rounded-lg bg-orange-50 px-2 py-1 text-orange-800 ring-1 ring-orange-100' : 'text-slate-800')}>{value}</p>
    </div>
  );
}
