import { Link } from 'react-router-dom';
import { Clock3, ArrowLeft } from 'lucide-react';
import type { OperationalWorkspaceDto } from '../../services/institutionalWorkflowApi';
import { InstitutionalStateBadge } from '../../components/status/InstitutionalStateBadge';
import { OperationalPipelineInstitutional } from './components/OperationalPipelineInstitutional';
import { OperationalTimelineExecutive } from './components/OperationalTimelineExecutive';
import { SlaBadgeV2 } from '../operations-v2/components/SlaBadgeV2';
import type { SlaStatusV2 } from '../../types/operationalWorkflow';
import { Card } from '../../components/ui/Card';
import type { InstitutionalOperationalState } from '../../types/domain';
import { semesterHubPath } from './institutionalNavigation';
import { isReducedInstitutionalFlow } from '../../config/env';

function progressBullets(state: InstitutionalOperationalState): string[] {
  const reducedFlow = isReducedInstitutionalFlow();
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
    if (reducedFlow) {
      return ['Producción en curso o pendiente en Fábrica', 'Product será notificado al finalizar producción', 'La radicación cerrará la solicitud'];
    }
    return ['Producción en curso o pendiente en Fábrica', 'LMS y validación académica pendientes', 'Product será notificado automáticamente'];
  }
  if (inProductionValidation) {
    return ['Producción completada', 'Planeación validando entrega de producción', 'Product será notificado tras validación LMS'];
  }
  if (inLms) {
    return ['Producción completada', state === 'PENDING_PLANNING_LMS_VALIDATION' ? 'Planeación validando LMS' : 'LMS en carga o pendiente', 'Product será notificado automáticamente'];
  }
  return ['Flujo institucional en progreso', 'Revisión académica aún no habilitada', 'Consulte el flujo operacional del semestre para más detalle'];
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
  const semesterHubUrl = semesterHubPath(workspace.projectId, workspace.semesterNumber);

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
              {isReducedInstitutionalFlow()
                ? 'La materia continúa en producción de Fábrica. Product será notificado cuando pueda revisar y radicar.'
                : 'La materia continúa en flujo institucional. Planeación y LMS deben finalizar validaciones antes de habilitar la revisión de Product.'}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <InstitutionalStateBadge state={workspace.operationalState} />
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

        <div className="mt-6">
          <Link
            to={semesterHubUrl}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 underline-offset-2 hover:text-orange-600 hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver al semestre
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
