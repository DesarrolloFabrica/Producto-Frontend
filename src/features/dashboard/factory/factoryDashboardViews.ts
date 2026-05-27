import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Package,
  Send,
  Sparkles,
} from 'lucide-react';
import type { SubjectWorkItem } from '../../operations/subjectOperationalState';
import type { CorrectionSentPreview, NewlyAddedPreview } from '../useFactoryDashboard';

export type FactoryDashboardView = 'active' | 'corrections' | 'review' | 'completed' | 'all';

export const FACTORY_DASHBOARD_VIEWS: { id: FactoryDashboardView; label: string }[] = [
  { id: 'active', label: 'Activas' },
  { id: 'corrections', label: 'Correcciones' },
  { id: 'review', label: 'En revisión' },
  { id: 'completed', label: 'Completadas' },
  { id: 'all', label: 'Todas' },
];

const VALID_VIEWS = new Set<string>(FACTORY_DASHBOARD_VIEWS.map((v) => v.id));

export function parseFactoryDashboardView(value: string | null): FactoryDashboardView {
  if (value && VALID_VIEWS.has(value)) return value as FactoryDashboardView;
  return 'active';
}

export function filterItemsBySearch(items: SubjectWorkItem[], search: string): SubjectWorkItem[] {
  const q = search.trim().toLowerCase();
  if (!q) return items;
  return items.filter(
    (item) =>
      item.subjectName.toLowerCase().includes(q) ||
      item.program.toLowerCase().includes(q) ||
      item.school.toLowerCase().includes(q),
  );
}

export type FactorySummaryData = {
  countsByState: Record<string, number> | undefined;
  pendingCorrectionsTop: SubjectWorkItem[];
  inProductionTop: SubjectWorkItem[];
  upcomingDeliveriesTop: SubjectWorkItem[];
  notStartedTop: SubjectWorkItem[];
  inReviewTop: SubjectWorkItem[];
  recentlyCompletedTop: SubjectWorkItem[];
  overdueOrDueSoonCount: number;
};

export type FactoryDashboardTrayContext = {
  summary: FactorySummaryData | null;
  newlyAddedPreview: NewlyAddedPreview;
  correctionSentPreview: CorrectionSentPreview;
};

export type FactoryDashboardTrayConfig = {
  id: string;
  views: FactoryDashboardView[];
  title: string;
  description: string;
  emptyMessage: string;
  viewAllTo: string;
  icon: LucideIcon;
  getItems: (ctx: FactoryDashboardTrayContext) => SubjectWorkItem[];
  getCount: (ctx: FactoryDashboardTrayContext) => number;
  hideWhenEmpty?: boolean;
};

export const FACTORY_DASHBOARD_TRAYS: FactoryDashboardTrayConfig[] = [
  {
    id: 'pending-corrections',
    views: ['active', 'corrections', 'all'],
    title: 'Correcciones pendientes',
    description: 'Materias con observaciones abiertas de Product.',
    emptyMessage: 'Sin correcciones pendientes.',
    viewAllTo: '/factory/work?status=CHANGES_REQUESTED',
    icon: AlertTriangle,
    getItems: (ctx) => ctx.summary?.pendingCorrectionsTop ?? [],
    getCount: (ctx) => ctx.summary?.countsByState?.CHANGES_REQUESTED ?? 0,
  },
  {
    id: 'correction-sent',
    views: ['corrections', 'all'],
    title: 'Correcciones enviadas',
    description: 'Materias con corrección aplicada esperando validación de Product.',
    emptyMessage: 'Sin correcciones enviadas.',
    viewAllTo: '/factory/work?status=CORRECTION_SENT',
    icon: Send,
    getItems: (ctx) => ctx.correctionSentPreview.items,
    getCount: (ctx) => ctx.correctionSentPreview.total,
    hideWhenEmpty: true,
  },
  {
    id: 'in-production',
    views: ['active', 'all'],
    title: 'En producción',
    description: 'Materias activas en producción.',
    emptyMessage: 'Sin materias en producción.',
    viewAllTo: '/factory/work?status=IN_PRODUCTION',
    icon: Package,
    getItems: (ctx) => ctx.summary?.inProductionTop ?? [],
    getCount: (ctx) => ctx.summary?.countsByState?.IN_PRODUCTION ?? 0,
  },
  {
    id: 'upcoming',
    views: ['active', 'all'],
    title: 'Próximas a vencer',
    description: 'Materias por iniciar o en producción, ordenadas por fecha.',
    emptyMessage: 'Sin vencimientos próximos.',
    viewAllTo: '/factory/work?sort=dueDate',
    icon: Clock3,
    getItems: (ctx) => ctx.summary?.upcomingDeliveriesTop ?? [],
    getCount: (ctx) => ctx.summary?.overdueOrDueSoonCount ?? 0,
  },
  {
    id: 'newly-added',
    views: ['active', 'all'],
    title: 'Nuevas agregadas',
    description: 'Materias agregadas después de la solicitud inicial.',
    emptyMessage: 'Sin materias nuevas.',
    viewAllTo: '/factory/work?origin=new',
    icon: Sparkles,
    getItems: (ctx) => ctx.newlyAddedPreview.items,
    getCount: (ctx) => ctx.newlyAddedPreview.total,
  },
  {
    id: 'not-started',
    views: ['active', 'all'],
    title: 'Por iniciar',
    description: 'Materias pendientes de iniciar producción.',
    emptyMessage: 'Sin materias por iniciar.',
    viewAllTo: '/factory/work?status=NOT_STARTED',
    icon: Clock3,
    getItems: (ctx) => ctx.summary?.notStartedTop ?? [],
    getCount: (ctx) => ctx.summary?.countsByState?.NOT_STARTED ?? 0,
  },
  {
    id: 'in-review',
    views: ['review', 'all'],
    title: 'En seguimiento',
    description: 'Paquetes fuera de producción activa de Fábrica.',
    emptyMessage: 'Sin materias en revisión.',
    viewAllTo: '/factory/work?status=IN_REVIEW',
    icon: Send,
    getItems: (ctx) => ctx.summary?.inReviewTop ?? [],
    getCount: (ctx) => ctx.summary?.countsByState?.IN_REVIEW ?? 0,
  },
  {
    id: 'completed',
    views: ['completed', 'all'],
    title: 'Completadas recientes',
    description: 'Materias aprobadas por Product.',
    emptyMessage: 'Sin materias completadas recientemente.',
    viewAllTo: '/factory/work?status=APPROVED&sort=updatedAt',
    icon: CheckCircle2,
    getItems: (ctx) => ctx.summary?.recentlyCompletedTop ?? [],
    getCount: (ctx) => ctx.summary?.countsByState?.APPROVED ?? 0,
  },
];

export function getTraysForView(
  view: FactoryDashboardView,
  ctx: FactoryDashboardTrayContext,
): FactoryDashboardTrayConfig[] {
  return FACTORY_DASHBOARD_TRAYS.filter((tray) => {
    if (!tray.views.includes(view)) return false;
    if (tray.hideWhenEmpty && tray.getCount(ctx) === 0) return false;
    return true;
  });
}

export function chunkTrays<T>(items: T[], size = 2): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
}
