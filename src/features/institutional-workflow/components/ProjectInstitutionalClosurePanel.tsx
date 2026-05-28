import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { formatDate } from '../../../utils/formatters';
import { projectRadicationApi, type ProjectInstitutionalClosureDto } from '../../../services/projectRadicationApi';
import { projectRadicationKeys, RadicationProgressBar } from '../../project-radication/ProjectRadicationPanel';
import { OperationalPipelineInstitutional } from './OperationalPipelineInstitutional';
import { InstitutionalOperationalChecks } from './InstitutionalOperationalChecks';
import { InstitutionalClosureTimeline } from './InstitutionalClosureTimeline';
import type { OperationalCheckKeyV2 } from '../../../types/operationalWorkflow';
type ProjectInstitutionalClosurePanelProps = {
  projectId: string;
};

function mapClosureToChecks(data: ProjectInstitutionalClosureDto) {
  return data.checks.map((c) => ({
    key: c.key as OperationalCheckKeyV2,
    label: c.label,
    responsibleRole: c.responsibleRole,
    status: c.status as 'CHECKED' | 'PENDING' | 'RETURNED',
    checkedAt: c.checkedAt,
    checkedBy: c.checkedByName ? { id: '', name: c.checkedByName, role: c.responsibleRole } : null,
    comment: null,
    evidenceUrl: null,
    dueAt: null,
  }));
}

export function ProjectInstitutionalClosurePanel({ projectId }: ProjectInstitutionalClosurePanelProps) {
  const closureQuery = useQuery({
    queryKey: projectRadicationKeys.institutionalClosure(projectId),
    queryFn: () => projectRadicationApi.getInstitutionalClosure(projectId),
  });

  if (closureQuery.isLoading) {
    return (
      <Card className="flex items-center gap-2 p-6 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
        Cargando trazabilidad del proceso…
      </Card>
    );
  }

  if (closureQuery.isError || !closureQuery.data) {
    return (
      <Card className="border-amber-200 bg-amber-50/60 p-4 text-sm text-amber-900">
        No se pudo cargar el detalle de cierre institucional.
      </Card>
    );
  }

  const data = closureQuery.data;
  const checks = mapClosureToChecks(data);

  return (
    <Card className="overflow-hidden rounded-[20px] border border-emerald-200/80 bg-white shadow-sm">
      <div className="border-b border-emerald-100 bg-linear-to-r from-emerald-50/90 via-white to-white px-6 py-5 sm:px-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
              Proceso institucional
            </p>
            <h2 className="mt-1 text-lg font-black tracking-tight text-slate-900">Solicitud finalizada</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Trazabilidad completa del flujo end-to-end. Todos los hitos de validación quedaron registrados.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 ring-1 ring-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Finalizada
          </span>
        </div>
        {data.radicationNumber ? (
          <p className="mt-3 text-sm text-slate-700">
            Radicado institucional <strong>{data.radicationNumber}</strong>
            {data.radicatedAt ? ` · ${formatDate(data.radicatedAt)}` : ''}
          </p>
        ) : null}
        <div className="mt-4">
          <RadicationProgressBar approved={data.scopeSubjectsApproved} total={data.scopeSubjectsTotal} />
          <p className="mt-2 text-xs text-slate-500">
            {data.scopeSemesters} semestre(s) en alcance · {data.scopeSubjectsApproved}/{data.scopeSubjectsTotal}{' '}
            materias
          </p>
        </div>
      </div>

      <div className="space-y-6 p-6 sm:p-7">
        <OperationalPipelineInstitutional state="FINALIZED" />

        <div className="grid items-stretch gap-6 lg:grid-cols-2">
          <section className="flex h-full flex-col rounded-2xl border border-slate-200/80 bg-slate-50/40 p-5">
            <InstitutionalOperationalChecks checks={checks} />
          </section>

          <section className="flex h-full min-h-0 flex-col rounded-2xl border border-slate-200/80 bg-white p-5">
            <InstitutionalClosureTimeline
              className="h-full"
              events={data.timeline}
              rawCount={data.timelineRawCount}
            />
          </section>
        </div>
      </div>
    </Card>
  );
}
