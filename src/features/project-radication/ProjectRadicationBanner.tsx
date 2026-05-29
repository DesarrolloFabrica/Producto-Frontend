import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, FileCheck2, Loader2, RefreshCw, Send } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { projectRadicationApi } from '../../services/projectRadicationApi';
import { cn } from '../../components/ui/tokens';
import { projectRadicationKeys } from './ProjectRadicationPanel';

export function projectRadicationUrl(projectId: string): string {
  return `/projects/${projectId}#radication`;
}

type MacroProgressHint = {
  completedSubjects: number;
  totalSubjects: number;
  completedSemesters: number;
  totalSemesters: number;
};

type ProjectRadicationBannerProps = {
  projectId: string;
  className?: string;
  macroProgress?: MacroProgressHint;
};

function isMacroScopeComplete(hint?: MacroProgressHint): boolean {
  if (!hint || hint.totalSubjects <= 0 || hint.totalSemesters <= 0) return false;
  return (
    hint.completedSubjects >= hint.totalSubjects && hint.completedSemesters >= hint.totalSemesters
  );
}

export function ProjectRadicationBanner({
  projectId,
  className,
  macroProgress,
}: ProjectRadicationBannerProps) {
  const { role } = useAuth();
  const showRadication = role === 'PRODUCT';
  const macroComplete = isMacroScopeComplete(macroProgress);

  const readinessQuery = useQuery({
    queryKey: projectRadicationKeys.readiness(projectId),
    queryFn: () => projectRadicationApi.getReadiness(projectId),
    enabled: showRadication && Boolean(projectId),
    retry: 1,
  });

  if (!showRadication) return null;

  const data = readinessQuery.data;

  if (readinessQuery.isLoading) {
    return (
      <Card className={cn('flex items-center gap-2 p-4 text-sm text-slate-500', className)}>
        <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
        Verificando cierre de solicitud…
      </Card>
    );
  }

  if (readinessQuery.isError) {
    return (
      <Card className={cn('border-amber-200 bg-amber-50/70 p-4', className)}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-bold text-amber-950">No se pudo verificar el cierre</p>
              <p className="mt-1 text-xs text-amber-900">
                {macroComplete
                  ? 'El avance macro está completo. Puede abrir el panel de radicación para registrar el cierre.'
                  : 'Intente de nuevo o abra el panel de radicación desde la solicitud.'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="gap-1.5"
              onClick={() => void readinessQuery.refetch()}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reintentar
            </Button>
            <Link
              to={projectRadicationUrl(projectId)}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-linear-to-br from-[#FF6B00] to-[#FF852D] px-4 py-2 text-xs font-bold text-white shadow-sm"
            >
              <Send className="h-3.5 w-3.5" />
              Panel de radicación
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  if (!data) return null;

  const hasInstitutionalRadication =
    data.projectInstitutionalState !== null ||
    data.scope.subjectsTotal > 0 ||
    macroComplete;

  if (!hasInstitutionalRadication) return null;

  const canRadicate = data.canRegisterRadication || data.canResubmitRadication;
  const scopeComplete =
    data.scope.subjectsTotal > 0 && data.scope.subjectsApproved >= data.scope.subjectsTotal;
  const isPendingPlanning = data.projectInstitutionalState === 'PENDING_PLANNING_RADICATION_CHECK';
  const isFinalized = data.projectInstitutionalState === 'FINALIZED';

  if (isFinalized) {
    return (
      <Card className={cn('border-emerald-200 bg-emerald-50/80 p-4', className)}>
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <div>
            <p className="text-sm font-bold text-emerald-900">Solicitud finalizada</p>
            <p className="mt-1 text-xs text-emerald-800">
              Planeación validó el radicado. Consulte el detalle en la solicitud.
            </p>
            <Link
              to={projectRadicationUrl(projectId)}
              className="mt-2 inline-flex text-xs font-bold text-orange-600 hover:text-orange-700"
            >
              Ver radicación →
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  if (isPendingPlanning) {
    return (
      <Card className={cn('border-sky-200 bg-sky-50/80 p-4', className)}>
        <p className="text-sm font-bold text-sky-900">Radicado enviado a Planeación</p>
        <p className="mt-1 text-xs text-sky-800">En validación final. No requiere más acciones de Product.</p>
        <Link
          to={projectRadicationUrl(projectId)}
          className="mt-2 inline-flex text-xs font-bold text-orange-600 hover:text-orange-700"
        >
          Ver detalle de radicación →
        </Link>
      </Card>
    );
  }

  if (canRadicate) {
    return (
      <Card
        className={cn(
          'overflow-hidden border-2 border-emerald-300/70 bg-linear-to-br from-emerald-50/90 via-white to-orange-50/40 p-5 shadow-sm',
          className,
        )}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <FileCheck2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
                Cierre de solicitud
              </p>
              <p className="mt-0.5 text-sm font-bold text-slate-900">
                {data.canResubmitRadication ? 'Corregir y radicar de nuevo' : 'Lista para radicar'}
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Alcance: {data.scope.subjectsApproved}/{data.scope.subjectsTotal} materias aprobadas ·{' '}
                {data.scope.semesters} semestre(s). Registre el radicado institucional para enviar a Planeación.
              </p>
            </div>
          </div>
          <Link
            to={projectRadicationUrl(projectId)}
            className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-linear-to-br from-[#FF6B00] to-[#FF852D] px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition hover:from-[#E66000] hover:to-[#FF6B00] sm:w-auto"
          >
            <Send className="h-4 w-4" />
            Radicar solicitud
          </Link>
        </div>
      </Card>
    );
  }

  if (scopeComplete || macroComplete) {
    return (
      <Card className={cn('border-amber-200 bg-amber-50/60 p-4', className)}>
        <p className="text-sm font-bold text-amber-950">Cierre académico en curso</p>
        <p className="mt-1 text-xs text-amber-900">
          Las materias están aprobadas. Complete la revisión académica de cada semestre o abra el panel de
          radicación para sincronizar el estado.
        </p>
        {data.blockers.length > 0 && (
          <ul className="mt-2 space-y-1 text-xs text-amber-900/90">
            {data.blockers.slice(0, 3).map((b) => (
              <li key={b}>• {b}</li>
            ))}
          </ul>
        )}
        <Link
          to={projectRadicationUrl(projectId)}
          className="mt-3 inline-flex text-xs font-bold text-orange-600 hover:text-orange-700"
        >
          Ir al panel de radicación →
        </Link>
      </Card>
    );
  }

  return (
    <Card className={cn('border-slate-200/80 bg-slate-50/50 p-4', className)}>
      <p className="text-xs text-slate-600">
        Radicación institucional disponible cuando el alcance esté completo.
      </p>
      <Link
        to={projectRadicationUrl(projectId)}
        className="mt-2 inline-flex text-xs font-bold text-orange-600 hover:text-orange-700"
      >
        Ver panel de radicación →
      </Link>
    </Card>
  );
}
