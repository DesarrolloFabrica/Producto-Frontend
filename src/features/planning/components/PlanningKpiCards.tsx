import {
  CheckCircle2,
  ClipboardCheck,
  Factory,
  FileCheck2,
  Layers,
  Upload,
} from 'lucide-react';
import { MetricCard } from '../../../components/cards/MetricCard';
import type { PlanningDashboardFilter } from '../planningTypes';

type Kpis = {
  initialValidations: number;
  productionValidations: number;
  lmsValidations: number;
  radicationsPending: number;
  inProgress: number;
  finalized: number;
};

const cards: Array<{
  filter: PlanningDashboardFilter;
  label: string;
  key: keyof Kpis;
  icon: typeof ClipboardCheck;
  tone: string;
}> = [
  {
    filter: 'initial',
    label: 'Validación inicial',
    key: 'initialValidations',
    icon: ClipboardCheck,
    tone: 'text-orange-500',
  },
  {
    filter: 'production',
    label: 'Validación producción',
    key: 'productionValidations',
    icon: Factory,
    tone: 'text-amber-500',
  },
  {
    filter: 'lms',
    label: 'Validación LMS',
    key: 'lmsValidations',
    icon: Upload,
    tone: 'text-slate-600',
  },
  {
    filter: 'radication',
    label: 'Radicaciones por revisar',
    key: 'radicationsPending',
    icon: FileCheck2,
    tone: 'text-rose-500',
  },
  {
    filter: 'all',
    label: 'Solicitudes en curso',
    key: 'inProgress',
    icon: Layers,
    tone: 'text-orange-500',
  },
  {
    filter: 'history',
    label: 'Solicitudes finalizadas',
    key: 'finalized',
    icon: CheckCircle2,
    tone: 'text-emerald-500',
  },
];

export function PlanningKpiCards({
  kpis,
  activeFilter,
  onFilterChange,
}: {
  kpis: Kpis;
  activeFilter: PlanningDashboardFilter;
  onFilterChange: (filter: PlanningDashboardFilter) => void;
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
