import { Package, ArrowRight, MessageSquare, CheckCircle2, AlertTriangle, Clock3 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { ProjectsLoadNotice } from '../../components/feedback/ProjectsLoadNotice';
import { useOperations } from '../../features/operations/OperationsContext';
import { analyzeFactoryProjects } from '../../features/operations/factoryProjectState';
import { getProjectModificationLabel } from '../../features/operations/modificationBadges';
import { getProjectSubjects } from '../../features/operations/subjectOperationalState';
import { cn } from '../../components/ui/tokens';
import { useMemo, useState } from 'react';
import { useFactoryProgramsQuery } from '../queries/useFactoryProgramsQuery';
import { toFactoryProgramOperationsNav } from '../factory-work/factoryProgramNavigation';
import { isFactoryProgramFullyComplete } from '../factory-work/factoryProgramWork';
import { FactoryInsightCard, FactoryProgramCard } from './components/FactoryProgramCard';
import type { SubjectOperationalState } from '../operations/subjectOperationalState';

type FactoryFilter = 'all' | 'ready' | 'production' | 'corrections' | 'waiting' | 'completed';

const FILTERS: { key: FactoryFilter; label: string; icon: typeof Package; color: string }[] = [
  { key: 'all', label: 'Activas', icon: Package, color: 'text-[#FF6B00]' },
  { key: 'ready', label: 'Listas para producir', icon: Package, color: 'text-[#FF6B00]' },
  { key: 'production', label: 'En producción', icon: ArrowRight, color: 'text-[#FF6B00]' },
  { key: 'corrections', label: 'Con correcciones', icon: MessageSquare, color: 'text-rose-500' },
  { key: 'waiting', label: 'En seguimiento', icon: Clock3, color: 'text-sky-500' },
  { key: 'completed', label: 'Completadas', icon: CheckCircle2, color: 'text-emerald-500' },
];

const FILTER_TO_STATUS: Partial<Record<FactoryFilter, SubjectOperationalState>> = {
  ready: 'NOT_STARTED',
  production: 'IN_PRODUCTION',
  corrections: 'CHANGES_REQUESTED',
  waiting: 'IN_REVIEW',
  completed: 'APPROVED',
};

export function FactoryProjectsList() {
  const location = useLocation();
  const { projects, projectObservations, notifications, isLoadingProjects, projectsError, refreshProjects, backendEnabled } =
    useOperations();
  const [activeFilter, setActiveFilter] = useState<FactoryFilter>('all');

  const factoryProgramsQuery = useFactoryProgramsQuery({ page: 1, limit: 100 }, backendEnabled);

  const factoryData = useMemo(
    () => analyzeFactoryProjects(projects, projectObservations),
    [projects, projectObservations],
  );

  const allFactoryPrograms = factoryProgramsQuery.data?.items ?? [];
  const factoryPrograms = useMemo(() => {
    if (activeFilter === 'all') {
      return allFactoryPrograms.filter((program) => !isFactoryProgramFullyComplete(program));
    }
    if (activeFilter === 'completed') {
      return allFactoryPrograms.filter((program) => isFactoryProgramFullyComplete(program));
    }
    const status = FILTER_TO_STATUS[activeFilter];
    if (!status) return allFactoryPrograms;
    return allFactoryPrograms.filter((program) =>
      program.semesters.some((semester) => semester.operationalState === status),
    );
  }, [activeFilter, allFactoryPrograms]);

  const filtered = factoryData.insights.filter((insight) => {
    if (activeFilter === 'all') return insight.bucket !== 'FULLY_APPROVED';
    if (activeFilter === 'ready') {
      return (
        insight.bucket === 'NEEDS_WORK' &&
        insight.project.status === 'READY_FOR_PRODUCTION'
      );
    }
    if (activeFilter === 'production') {
      return insight.bucket === 'NEEDS_WORK' && insight.project.status === 'IN_PRODUCTION';
    }
    if (activeFilter === 'corrections') return insight.bucket === 'HAS_CORRECTIONS';
    if (activeFilter === 'waiting') return insight.bucket === 'WAITING_PRODUCT';
    if (activeFilter === 'completed') return insight.bucket === 'FULLY_APPROVED';
    return true;
  });

  const counts = backendEnabled
    ? {
        ready: allFactoryPrograms.filter((p) =>
          p.semesters.some((s) => s.operationalState === 'NOT_STARTED'),
        ).length,
        production: allFactoryPrograms.filter((p) =>
          p.semesters.some((s) => s.operationalState === 'IN_PRODUCTION'),
        ).length,
        corrections: allFactoryPrograms.filter((p) =>
          p.semesters.some((s) => s.operationalState === 'CHANGES_REQUESTED'),
        ).length,
        waiting: allFactoryPrograms.filter((p) =>
          p.semesters.some((s) => s.operationalState === 'IN_REVIEW'),
        ).length,
        completed: allFactoryPrograms.filter((p) => isFactoryProgramFullyComplete(p)).length,
      }
    : {
        ready: factoryData.needsWork.filter((i) => i.project.status === 'READY_FOR_PRODUCTION').length,
        production: factoryData.needsWork.filter((i) => i.project.status === 'IN_PRODUCTION').length,
        corrections: factoryData.hasCorrections.length,
        waiting: factoryData.waitingProduct.length,
        completed: factoryData.fullyApproved.length,
      };

  const showFactoryPrograms = backendEnabled;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-[-0.02em] text-[#1E293B]">Programas en producción</h1>
        <p className="mt-1 text-[0.9rem] text-[#64748B]">
          Trabaja por programa: revisa el avance macro y entra al detalle de cada semestre desde el centro operacional.
        </p>
      </div>

      {backendEnabled && (
        <ProjectsLoadNotice
          isLoading={factoryProgramsQuery.isLoading && factoryPrograms.length === 0}
          error={factoryProgramsQuery.error ? 'No se pudieron cargar los programas.' : null}
          isEmpty={!factoryProgramsQuery.isLoading && factoryPrograms.length === 0}
          onRefresh={() => void factoryProgramsQuery.refetch()}
          emptyMessage="No hay programas visibles para Fábrica en este momento."
        />
      )}

      {!backendEnabled && (
        <ProjectsLoadNotice
          isLoading={isLoadingProjects && projects.length === 0}
          error={projectsError}
          isEmpty={!isLoadingProjects && !projectsError && factoryData.insights.length === 0}
          onRefresh={() => void refreshProjects()}
          emptyMessage="No hay solicitudes visibles para Fábrica en este momento."
        />
      )}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <FilterMetric label="Listas" value={counts.ready} icon={Package} color="text-[#FF6B00]" />
        <FilterMetric label="En producción" value={counts.production} icon={ArrowRight} color="text-[#FF6B00]" />
        <FilterMetric label="Correcciones" value={counts.corrections} icon={MessageSquare} color="text-rose-500" />
        <FilterMetric label="En revisión" value={counts.waiting} icon={Clock3} color="text-sky-500" />
        <FilterMetric label="Completadas" value={counts.completed} icon={CheckCircle2} color="text-emerald-500" />
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
                  : 'bg-white text-[#64748B] hover:bg-[#FFF7ED] hover:text-[#FF6B00]',
              )}
            >
              <Icon className={cn('h-4 w-4', isActive ? 'text-white' : f.color)} />
              {f.label}
            </button>
          );
        })}
      </div>

      {showFactoryPrograms ? (
        factoryPrograms.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="mb-3 h-8 w-8 text-[#CBD5E1]" />
            <p className="text-sm font-medium text-[#94A3B8]">No tienes programas para este filtro.</p>
          </Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {factoryPrograms.map((program) => (
              <FactoryProgramCard
                key={program.projectId}
                program={program}
                operationsNav={toFactoryProgramOperationsNav(program, location.pathname)}
                isComplete={isFactoryProgramFullyComplete(program)}
              />
            ))}
          </div>
        )
      ) : filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="mb-3 h-8 w-8 text-[#CBD5E1]" />
          <p className="text-sm font-medium text-[#94A3B8]">No tienes solicitudes para este filtro.</p>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((insight) => {
            const { project } = insight;
            return (
              <FactoryInsightCard
                key={project.id}
                insight={insight}
                project={project}
                subjectCount={getProjectSubjects(project).length}
                modificationLabel={getProjectModificationLabel(notifications, project.id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function FilterMetric({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: typeof Package;
  color: string;
}) {
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
