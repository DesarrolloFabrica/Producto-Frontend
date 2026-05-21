import { BookOpen, Clock3, Eye, FolderKanban, MessageSquare, TrendingUp } from 'lucide-react';
import { useOperations } from '../../features/operations/OperationsContext';
import { Card } from '../ui/Card';
import { cn } from '../ui/tokens';

export function ProjectsSummary() {
  const { projects, projectObservations } = useOperations();

  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => ['IN_PRODUCTION', 'IN_REVIEW', 'DELIVERED_TO_LMS'].includes(p.status)).length;
  const pendingReview = projects.filter((p) => p.status === 'FEEDBACK_PENDING' || p.status === 'IN_REVIEW').length;
  const openObservations = projectObservations.filter((o) => o.status === 'ABIERTA' || o.status === 'EN_CORRECCION').length;
  
  const upcomingDeliveries = projects.filter((p) => {
    const deliveryDate = new Date(p.expectedDeliveryDate);
    const now = new Date();
    const daysUntilDelivery = Math.ceil((deliveryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilDelivery >= 0 && daysUntilDelivery <= 30;
  }).length;

  const schools = Array.from(new Set(projects.map((p) => p.school))).length;

  const stats = [
    {
      label: 'Total proyectos',
      value: totalProjects,
      icon: FolderKanban,
      borderColor: 'border-orange-200/60',
      bgColor: 'bg-orange-500/3',
      iconColor: 'text-orange-600',
      description: 'En portafolio académico',
    },
    {
      label: 'En producción',
      value: activeProjects,
      icon: TrendingUp,
      borderColor: 'border-emerald-200/60',
      bgColor: 'bg-emerald-500/3',
      iconColor: 'text-emerald-600',
      description: 'Activos en Fábrica',
    },
    {
      label: 'Por revisar',
      value: pendingReview,
      icon: Eye,
      borderColor: 'border-violet-200/60',
      bgColor: 'bg-violet-500/3',
      iconColor: 'text-violet-600',
      description: 'Pendientes de validación',
    },
    {
      label: 'Observaciones',
      value: openObservations,
      icon: MessageSquare,
      borderColor: 'border-rose-200/60',
      bgColor: 'bg-rose-500/3',
      iconColor: 'text-rose-600',
      description: 'Abiertas actualmente',
    },
    {
      label: 'Entregas próximas',
      value: upcomingDeliveries,
      icon: Clock3,
      borderColor: 'border-sky-200/60',
      bgColor: 'bg-sky-500/3',
      iconColor: 'text-sky-600',
      description: 'Próximos 30 días',
    },
    {
      label: 'Escuelas',
      value: schools,
      icon: BookOpen,
      borderColor: 'border-slate-200/60',
      bgColor: 'bg-slate-500/3',
      iconColor: 'text-slate-600',
      description: 'Participando',
    },
  ];

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/60 bg-white/60 px-5 py-4 sm:px-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">Resumen</p>
          <h2 className="mt-0.5 text-sm font-bold tracking-[-0.02em] text-slate-900">Portafolio académico</h2>
          <p className="mt-1 text-[11px] font-medium text-slate-500">Métricas clave de virtualización</p>
        </div>
        <span className="rounded-[12px] bg-white/80 px-3 py-1.5 text-[10px] font-bold text-slate-500 ring-1 ring-slate-200/50">{totalProjects} proyectos</span>
      </div>
      <div className="grid grid-cols-6 gap-5 bg-slate-50/60 p-5">
        {stats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </div>
    </Card>
  );
}

function StatCard({ stat }: { stat: { label: string; value: number; icon: any; borderColor: string; bgColor: string; iconColor: string; description: string } }) {
  const Icon = stat.icon;

  return (
    <div className={cn('group relative overflow-hidden rounded-2xl border bg-white p-4 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg', stat.borderColor)}>
      <div className="flex items-start justify-between">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-full', stat.bgColor, stat.iconColor)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{stat.label}</p>
        <p className="mt-1 text-[2rem] font-bold leading-none tracking-[-0.05em] text-slate-900">{stat.value}</p>
        <p className="mt-2 text-[10px] font-medium text-slate-400">{stat.description}</p>
      </div>
    </div>
  );
}
