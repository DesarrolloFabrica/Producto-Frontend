import { Link } from 'react-router-dom';
import { Clock3, GitBranch } from 'lucide-react';
import type { OperationalWorkspaceDto } from '../../services/institutionalWorkflowApi';
import { institutionalStateLabel } from './institutionalCopy';
import { OperationalPipelineInstitutional } from './components/OperationalPipelineInstitutional';
import { OperationalTimelineExecutive } from './components/OperationalTimelineExecutive';
import { SlaBadgeV2 } from '../operations-v2/components/SlaBadgeV2';
import type { SlaStatusV2 } from '../../types/operationalWorkflow';
import { Card } from '../../components/ui/Card';
import type { InstitutionalOperationalState } from '../../types/domain';

function progressBullets(state: InstitutionalOperationalState): string[] {
  const preFactory = [
    'PENDING_PLANNING_INITIAL_VALIDATION',
    'RETURNED_TO_PRODUCT_FROM_PLANNING',
  ].includes(state);
  const inFactory = ['PENDING_FACTORY', 'IN_FACTORY_PRODUCTION', 'RETURNED_TO_FACTORY_FROM_PLANNING', 'CHANGES_REQUESTED_BY_PRODUCT'].includes(state);
  const inProductionValidation = state === 'PENDING_PLANNING_PRODUCTION_VALIDATION';
  const inLms = [
    'PENDING_LMS_UPLOAD',
    'IN_LMS_UPLOAD',
    'PENDING_PLANNING_LMS_VALIDATION',
    'RETURNED_TO_LMS_FROM_PLANNING',
  ].includes(state);

  if (preFactory) {
    return ['Solicitud en validación inicial de Planeación', 'Fábrica y LMS pendientes', 'Product será notificado al habilitarse la revisión académica'];
  }
  if (inFactory) {
    return ['Producción en curso o pendiente en Fábrica', 'LMS y validación académica pendientes', 'Product será notificado automáticamente'];
  }
  if (inProductionValidation) {
    return ['Producción completada', 'Planeación validando entrega de producción', 'Product será notificado tras validación LMS'];
  }
  if (inLms) {
    return ['Producción completada', state === 'PENDING_PLANNING_LMS_VALIDATION' ? 'Planeación validando LMS' : 'LMS en carga o pendiente', 'Product será notificado automáticamente'];
  }
  return ['Flujo institucional en progreso', 'Revisión académica aún no habilitada', 'Consulte el centro operacional para detalle'];
}

type AcademicInstitutionalWaitingViewProps = {
  workspace: OperationalWorkspaceDto;
  subjectName: string;
  program: string;
  school: string;
};

export function AcademicInstitutionalWaitingView({
  workspace,
  subjectName,
  program,
  school,
}: AcademicInstitutionalWaitingViewProps) {
  const bullets = progressBullets(workspace.operationalState);
  const timelineItems = (workspace.timeline ?? []).slice(-5).map((t) => ({
    id: t.id,
    occurredAt: t.createdAt,
    from: t.fromState,
    to: t.toState,
    action: t.action,
    actor: { id: '', name: t.actorName, role: t.actorRole },
    comment: t.comment,
    returnReason: t.returnReason,
    durationLabel: null,
  }));

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-orange-50/30 p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 ring-1 ring-orange-200/80">
            <Clock3 className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Flujo institucional</p>
            <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">
              Revisión académica aún no habilitada
            </h2>
            <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">
              La materia continúa en flujo institucional. Planeación y LMS deben finalizar validaciones antes de
              habilitar la revisión de Product.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700 ring-1 ring-slate-200/80">
                {institutionalStateLabel(workspace.operationalState)}
              </span>
              <SlaBadgeV2 status={workspace.slaStatus as SlaStatusV2} />
            </div>
          </div>
        </div>

        <ul className="mt-6 space-y-2">
          {bullets.map((line) => (
            <li key={line} className="flex items-start gap-2 text-sm font-medium text-slate-700">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400" />
              {line}
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to={`/subjects/${workspace.subjectId}/operations`}
            className="inline-flex items-center justify-center gap-1.5 rounded-[12px] bg-linear-to-br from-[#FF6B00] to-[#FF852D] px-4 py-2 text-xs font-bold text-white shadow-[0_4px_14px_0_rgba(255,107,0,0.39)]"
          >
            <GitBranch className="h-4 w-4" />
            Ver flujo operacional
          </Link>
        </div>
      </Card>

      <OperationalPipelineInstitutional state={workspace.operationalState} />

      {timelineItems.length > 0 ? (
        <OperationalTimelineExecutive items={timelineItems} compact />
      ) : null}

      <p className="text-center text-xs text-slate-400">
        {subjectName} · {program} · {school}
      </p>
    </div>
  );
}
