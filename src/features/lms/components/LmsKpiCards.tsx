import { CheckCircle2, CloudUpload, Layers, RotateCcw, Upload } from 'lucide-react';
import { MetricCard } from '../../../components/cards/MetricCard';
import type { LmsDashboardFilter } from '../lmsTypes';

type Kpis = {
  pendingUpload: number;
  inUpload: number;
  completedUpload: number;
  returnedByPlanning: number;
  inProgressProjects: number;
  finalizedProjects: number;
};

const cards: Array<{
  filter: LmsDashboardFilter;
  label: string;
  description: string;
  key: keyof Kpis;
  icon: typeof Upload;
  tone: string;
}> = [
  {
    filter: 'pending',
    label: 'Pendientes de carga',
    description: 'Listas para iniciar carga LMS',
    key: 'pendingUpload',
    icon: Upload,
    tone: 'text-orange-500',
  },
  {
    filter: 'in-upload',
    label: 'En carga LMS',
    description: 'En gestión de publicación',
    key: 'inUpload',
    icon: CloudUpload,
    tone: 'text-amber-500',
  },
  {
    filter: 'completed',
    label: 'Cargas completadas',
    description: 'Enviadas a validación de Planeación',
    key: 'completedUpload',
    icon: CheckCircle2,
    tone: 'text-emerald-500',
  },
  {
    filter: 'returned',
    label: 'Devueltas por Planeación',
    description: 'Requieren corrección de carga',
    key: 'returnedByPlanning',
    icon: RotateCcw,
    tone: 'text-rose-500',
  },
  {
    filter: 'all',
    label: 'Proyectos en curso',
    description: 'Solicitudes activas con etapa LMS',
    key: 'inProgressProjects',
    icon: Layers,
    tone: 'text-slate-600',
  },
  {
    filter: 'history',
    label: 'Finalizadas',
    description: 'Solicitudes cerradas con participación LMS',
    key: 'finalizedProjects',
    icon: CheckCircle2,
    tone: 'text-emerald-600',
  },
];

export function LmsKpiCards({
  kpis,
  activeFilter,
  onFilterChange,
}: {
  kpis: Kpis;
  activeFilter: LmsDashboardFilter;
  onFilterChange: (filter: LmsDashboardFilter) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <MetricCard
          key={card.key}
          label={card.label}
          value={kpis[card.key]}
          icon={card.icon}
          tone={card.tone}
          active={activeFilter === card.filter}
          onClick={() => onFilterChange(card.filter)}
        />
      ))}
    </div>
  );
}
