import { BookOpen, Clock3, Eye, FolderKanban, MessageSquare, TrendingUp } from 'lucide-react';
import { useOperations } from '../../features/operations/OperationsContext';
import { Card } from '../ui/Card';
import { cn } from '../ui/tokens';

export function ProjectsSummary() {
  const { projects, projectObservations } = useOperations();

  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) =>
    ['IN_PRODUCTION', 'IN_REVIEW', 'DELIVERED_TO_LMS'].includes(p.status),
  ).length;
  const pendingReview = projects.filter(
    (p) => p.status === 'FEEDBACK_PENDING' || p.status === 'IN_REVIEW',
  ).length;
  const openObservations = projectObservations.filter(
    (o) => o.status === 'ABIERTA' || o.status === 'EN_CORRECCION',
  ).length;

  const upcomingDeliveries = projects.filter((p) => {
    const deliveryDate = new Date(p.expectedDeliveryDate);
    const now = new Date();
    const daysUntilDelivery = Math.ceil(
      (deliveryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    return daysUntilDelivery >= 0 && daysUntilDelivery <= 30;
  }).length;

  const schools = Array.from(new Set(projects.map((p) => p.school))).length;

  const stats = [
    { label: 'Total', value: totalProjects, icon: FolderKanban, tone: 'text-orange-600 bg-orange-50' },
    { label: 'En producción', value: activeProjects, icon: TrendingUp, tone: 'text-emerald-600 bg-emerald-50' },
    { label: 'Por revisar', value: pendingReview, icon: Eye, tone: 'text-violet-600 bg-violet-50' },
    { label: 'Observaciones', value: openObservations, icon: MessageSquare, tone: 'text-rose-600 bg-rose-50' },
    { label: 'Entregas 30d', value: upcomingDeliveries, icon: Clock3, tone: 'text-sky-600 bg-sky-50' },
    { label: 'Escuelas', value: schools, icon: BookOpen, tone: 'text-slate-600 bg-slate-100' },
  ];

  return (
    <Card className="overflow-hidden p-0">
      <div className="grid grid-cols-2 gap-2 border-b border-slate-100 bg-slate-50/40 p-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="flex items-center gap-2.5 rounded-lg border border-slate-200/60 bg-white px-2.5 py-2"
            >
              <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-md', stat.tone)}>
                <Icon className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                  {stat.label}
                </p>
                <p className="text-base font-bold tabular-nums leading-tight text-slate-900">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
