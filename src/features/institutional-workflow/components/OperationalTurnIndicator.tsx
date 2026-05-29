import { ClipboardCheck, Clock3 } from 'lucide-react';
import type { InstitutionalOperationalState, Role } from '../../../types/domain';
import { cn } from '../../../components/ui/tokens';
import { institutionalStateLabel } from '../institutionalCopy';
import { roleLabelV2 } from '../../operations-v2/rules/workflowRulesV2';
import type { OperationalRoleV2 } from '../../../types/operationalWorkflow';

const ROLE_RING: Record<string, string> = {
  PLANEACION: 'ring-indigo-200/80',
  FABRICA: 'ring-orange-200/80',
  PRODUCT: 'ring-violet-200/80',
  LMS: 'ring-sky-200/80',
};

const ROLE_BG: Record<string, string> = {
  PLANEACION: 'bg-indigo-50',
  FABRICA: 'bg-orange-50',
  PRODUCT: 'bg-violet-50',
  LMS: 'bg-sky-50',
};

const ROLE_TEXT: Record<string, string> = {
  PLANEACION: 'text-indigo-900',
  FABRICA: 'text-orange-900',
  PRODUCT: 'text-violet-900',
  LMS: 'text-sky-900',
};

function turnActionHint(state: InstitutionalOperationalState, responsibleRole: Role): string {
  switch (state) {
    case 'PENDING_PLANNING_INITIAL_VALIDATION':
    case 'RETURNED_TO_PRODUCT_FROM_PLANNING':
      return responsibleRole === 'PLANEACION'
        ? 'Revise el alcance inicial del programa y valide o devuelva a Producto.'
        : 'Planeación debe validar el alcance inicial.';
    case 'PENDING_FACTORY':
    case 'RETURNED_TO_FACTORY_FROM_PLANNING':
      return responsibleRole === 'FABRICA'
        ? 'Inicie o retome la producción de las asignaturas del semestre.'
        : 'Fábrica debe iniciar o retomar la producción.';
    case 'CHANGES_REQUESTED_BY_PRODUCT':
      return responsibleRole === 'FABRICA'
        ? 'Aplique las correcciones solicitadas por Producto.'
        : 'Fábrica debe aplicar correcciones de Producto.';
    case 'IN_FACTORY_PRODUCTION':
      return responsibleRole === 'FABRICA'
        ? 'Complete la producción interna y confirme la entrega del semestre.'
        : 'Fábrica está produciendo el contenido.';
    case 'PENDING_PLANNING_PRODUCTION_VALIDATION':
      return responsibleRole === 'PLANEACION'
        ? 'Valide la entrega de producción o devuelva correcciones a Fábrica.'
        : 'Planeación debe validar la producción entregada.';
    case 'PENDING_LMS_UPLOAD':
    case 'RETURNED_TO_LMS_FROM_PLANNING':
      return responsibleRole === 'LMS'
        ? 'Cargue el contenido en la plataforma LMS.'
        : 'LMS debe cargar el contenido en la plataforma.';
    case 'IN_LMS_UPLOAD':
      return responsibleRole === 'LMS'
        ? 'Finalice la carga y confirme la publicación en LMS.'
        : 'LMS está cargando el contenido.';
    case 'PENDING_PLANNING_LMS_VALIDATION':
      return responsibleRole === 'PLANEACION'
        ? 'Revise la carga en LMS y valide o devuelva al equipo LMS.'
        : 'Planeación debe validar la carga en LMS.';
    case 'PENDING_PRODUCT_ACADEMIC_REVIEW':
    case 'IN_PRODUCT_ACADEMIC_REVIEW':
      return responsibleRole === 'PRODUCT'
        ? 'Revise el checklist académico y apruebe o solicite correcciones.'
        : 'Producto debe completar la revisión académica.';
    case 'PENDING_PROJECT_RADICATION':
      return responsibleRole === 'PRODUCT'
        ? 'Complete la radicación institucional del programa.'
        : 'Producto debe radicar el programa.';
    case 'FINALIZED':
      return 'Flujo institucional finalizado.';
    default:
      return institutionalStateLabel(state);
  }
}

export function OperationalTurnIndicator({
  operationalState,
  responsibleRole,
  viewerRole,
  variant = 'card',
  className,
}: {
  operationalState: InstitutionalOperationalState;
  responsibleRole: Role;
  viewerRole?: Role | null;
  variant?: 'card' | 'compact' | 'inline';
  className?: string;
}) {
  const stateLabel = institutionalStateLabel(operationalState);
  const roleLabel = roleLabelV2(responsibleRole as OperationalRoleV2);
  const isFinalized = operationalState === 'FINALIZED';
  const isYourTurn = Boolean(viewerRole && viewerRole === responsibleRole && !isFinalized);
  const hint = turnActionHint(operationalState, responsibleRole);

  if (variant === 'compact') {
    if (isFinalized) {
      return (
        <span
          className={cn(
            'inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-200/80',
            className,
          )}
        >
          Finalizado
        </span>
      );
    }

    if (isYourTurn) {
      return (
        <div className={cn('flex flex-wrap items-center gap-2', className)}>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-700 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
            <ClipboardCheck className="h-3 w-3" />
            Acción pendiente
          </span>
          <span
            className={cn(
              'inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1',
              ROLE_BG[responsibleRole],
              ROLE_TEXT[responsibleRole],
              ROLE_RING[responsibleRole],
            )}
          >
            {roleLabel}
          </span>
          <span className="text-[11px] font-medium text-slate-600">{stateLabel}</span>
        </div>
      );
    }

    return (
      <div className={cn('flex flex-wrap items-center gap-2', className)}>
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-200/80">
          <Clock3 className="h-3 w-3" />
          Responsable: {roleLabel}
        </span>
        <span className="text-[11px] font-medium text-slate-500">{stateLabel}</span>
        {viewerRole && viewerRole !== responsibleRole ? (
          <span className="text-[10px] text-slate-400">· Sin intervención de su equipo</span>
        ) : null}
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <span className={cn('inline-flex flex-wrap items-center gap-2 text-xs', className)}>
        {isYourTurn ? (
          <span className="font-semibold text-emerald-800">Acción pendiente de su equipo</span>
        ) : (
          <span className="text-slate-500">
            Responsable: <span className="font-semibold text-slate-700">{roleLabel}</span>
          </span>
        )}
        <span className="text-slate-400">·</span>
        <span className="text-slate-600">{stateLabel}</span>
      </span>
    );
  }

  if (isFinalized) {
    return (
      <div
        className={cn(
          'rounded-xl border border-emerald-200/80 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-900',
          className,
        )}
      >
        <p className="font-semibold">Programa finalizado</p>
        <p className="mt-1 text-xs text-emerald-800">El flujo institucional de este semestre está cerrado.</p>
      </div>
    );
  }

  if (isYourTurn) {
    return (
      <div
        className={cn(
          'rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3.5 shadow-sm',
          className,
        )}
      >
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-sm">
            <ClipboardCheck className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
              Acción pendiente de su equipo
            </p>
            <p className="mt-0.5 text-sm font-semibold text-slate-900">{stateLabel}</p>
            <p className="mt-1 text-xs leading-relaxed text-emerald-950/80">{hint}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-3.5',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1',
            ROLE_BG[responsibleRole] ?? 'bg-slate-100',
            ROLE_TEXT[responsibleRole] ?? 'text-slate-700',
            ROLE_RING[responsibleRole] ?? 'ring-slate-200',
          )}
        >
          <Clock3 className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Responsable actual: <span className="text-slate-800">{roleLabel}</span>
          </p>
          <p className="mt-0.5 text-sm font-semibold text-slate-800">{stateLabel}</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">{hint}</p>
          {viewerRole && viewerRole !== responsibleRole ? (
            <p className="mt-2 text-[11px] font-medium text-slate-400">
              Sin intervención requerida de su equipo en esta etapa.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
