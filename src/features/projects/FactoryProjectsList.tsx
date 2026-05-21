import { Package, ArrowRight, MessageSquare, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../../components/status/StatusBadge';
import { Card } from '../../components/ui/Card';
import { useOperations } from '../../features/operations/OperationsContext';
import { formatDate } from '../../utils/formatters';
import { cn } from '../../components/ui/tokens';
import { useState } from 'react';

type FactoryFilter = 'all' | 'ready' | 'production' | 'corrections' | 'delivered';

const FILTERS: { key: FactoryFilter; label: string; icon: typeof Package; color: string; bg: string }[] = [
  { key: 'all', label: 'Todas', icon: Package, color: 'text-[#FF6B00]', bg: 'bg-[#FFEDD5]' },
  { key: 'ready', label: 'Listas para producir', icon: Package, color: 'text-[#FF6B00]', bg: 'bg-[#FFEDD5]' },
  { key: 'production', label: 'En producción', icon: ArrowRight, color: 'text-[#FF6B00]', bg: 'bg-[#FFEDD5]' },
  { key: 'corrections', label: 'Con correcciones', icon: MessageSquare, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  { key: 'delivered', label: 'Entregadas a Product', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
];

export function FactoryProjectsList() {
  const { projects, projectObservations } = useOperations();
  const [activeFilter, setActiveFilter] = useState<FactoryFilter>('all');

  const openProductObs = projectObservations.filter(
    (obs) => obs.role === 'PRODUCT' && (obs.status === 'ABIERTA' || obs.status === 'EN_CORRECCION')
  );

  const factoryProjects = projects.filter((p) =>
    ['READY_FOR_PRODUCTION', 'IN_PRODUCTION', 'FEEDBACK_PENDING', 'IN_REVIEW'].includes(p.status)
  );

  const filtered = factoryProjects.filter((p) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'ready') return p.status === 'READY_FOR_PRODUCTION';
    if (activeFilter === 'production') return p.status === 'IN_PRODUCTION';
    if (activeFilter === 'corrections') return p.status === 'FEEDBACK_PENDING' || openProductObs.some((o) => o.projectId === p.id);
    if (activeFilter === 'delivered') return p.status === 'IN_REVIEW';
    return true;
  });

  const counts = {
    ready: factoryProjects.filter((p) => p.status === 'READY_FOR_PRODUCTION').length,
    production: factoryProjects.filter((p) => p.status === 'IN_PRODUCTION').length,
    corrections: factoryProjects.filter((p) => p.status === 'FEEDBACK_PENDING' || openProductObs.some((o) => o.projectId === p.id)).length,
    delivered: factoryProjects.filter((p) => p.status === 'IN_REVIEW').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-[-0.02em] text-[#1E293B]">Solicitudes para producción</h1>
        <p className="mt-1 text-[0.9rem] text-[#64748B]">Gestiona las solicitudes enviadas por Product, entrega contenido y responde correcciones.</p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <FilterMetric label="Listas" value={counts.ready} icon={Package} color="text-[#FF6B00]" />
        <FilterMetric label="En producción" value={counts.production} icon={ArrowRight} color="text-[#FF6B00]" />
        <FilterMetric label="Con correcciones" value={counts.corrections} icon={MessageSquare} color="text-rose-500" />
        <FilterMetric label="Entregadas" value={counts.delivered} icon={CheckCircle2} color="text-emerald-500" />
      </section>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const Icon = f.icon;
          const isActive = activeFilter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={cn(
                'inline-flex items-center gap-2 rounded-[12px] px-4 py-2 text-sm font-medium transition-all',
                isActive
                  ? 'bg-[#FF6B00] text-white shadow-md shadow-[#FF6B00]/20'
                  : 'bg-white text-[#64748B] hover:bg-[#FFF7ED] hover:text-[#FF6B00]'
              )}
            >
              <Icon className={cn('h-4 w-4', isActive ? 'text-white' : f.color)} />
              {f.label}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="mb-3 h-8 w-8 text-[#CBD5E1]" />
          <p className="text-sm font-medium text-[#94A3B8]">No tienes solicitudes para este filtro.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((project) => {
            const obs = openProductObs.filter((o) => o.projectId === project.id);
            return (
              <div
                key={project.id}
                className="rounded-[20px] bg-white p-5 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_-10px_rgba(0,0,0,0.1)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold tracking-[-0.02em] text-[#1E293B] truncate">{project.program}</h3>
                    <p className="mt-1 text-[0.85rem] font-medium text-[#64748B]">{project.school}</p>
                  </div>
                  <StatusBadge status={project.status as any} />
                </div>

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#64748B]">
                  <span>{project.modality}</span>
                  <span>{project.semesters?.length ?? 1} semestre{(project.semesters?.length ?? 1) !== 1 ? 's' : ''}</span>
                  <span>{project.subjects.length} asignatura{project.subjects.length !== 1 ? 's' : ''}</span>
                </div>

                {obs.length > 0 && (
                  <div className="mt-3 rounded-[12px] bg-rose-50 px-3 py-2 text-xs text-rose-600 font-medium">
                    {obs.length} observacion{obs.length !== 1 ? 'es' : ''} abierta{obs.length !== 1 ? 's' : ''}
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-[#94A3B8]">{formatDate(project.expectedDeliveryDate)}</span>
                  <span className={cn(
                    'rounded-[12px] px-2.5 py-1 text-[11px] font-medium',
                    project.priority === 'CRITICAL' || project.priority === 'HIGH' ? 'bg-rose-50 text-rose-600' : project.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-500'
                  )}>
                    {project.priority ?? 'NORMAL'}
                  </span>
                </div>

                <div className="mt-4 flex justify-end">
                  <Link
                    to={`/projects/${project.id}`}
                    className="inline-flex items-center gap-1.5 rounded-[12px] bg-[#FF6B00] px-3 py-2 text-xs font-bold text-white shadow-lg shadow-[#FF6B00]/20 transition-all duration-200 hover:scale-105 hover:bg-[#E66000]"
                  >
                    Trabajar solicitud <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FilterMetric({ label, value, icon: Icon, color }: { label: string; value: number; icon: typeof Package; color: string }) {
  return (
    <div className="rounded-[16px] bg-white p-4 shadow-[0_2px_12px_-3px_rgba(0,0,0,0.06)]">
      <div className="flex items-center gap-2">
        <Icon className={cn('h-4 w-4', color)} />
        <span className="text-xs font-medium text-[#64748B]">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold tracking-[-0.02em] text-[#1E293B]">{value}</p>
    </div>
  );
}
