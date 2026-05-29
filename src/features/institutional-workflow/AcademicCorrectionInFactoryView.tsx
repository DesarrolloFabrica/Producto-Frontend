import { Link } from 'react-router-dom';
import { Factory, ArrowLeft } from 'lucide-react';
import type { OperationalWorkspaceDto } from '../../services/institutionalWorkflowApi';
import { InstitutionalStateBadge } from '../../components/status/InstitutionalStateBadge';
import { Card } from '../../components/ui/Card';
import { semesterHubPath } from './institutionalNavigation';

type AcademicCorrectionInFactoryViewProps = {
  workspace: OperationalWorkspaceDto;
};

export function AcademicCorrectionInFactoryView({ workspace }: AcademicCorrectionInFactoryViewProps) {
  const semesterHubUrl = semesterHubPath(workspace.projectId, workspace.semesterNumber);

  return (
    <Card className="border-amber-200/80 bg-amber-50/50 p-6 sm:p-8">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
          <Factory className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-950">Corrección académica en Fábrica</h2>
          <p className="mt-2 text-sm font-medium text-slate-600">
            Solicitó correcciones académicas. Fábrica debe reentregar la producción antes de continuar la revisión.
          </p>
          <div className="mt-2">
            <InstitutionalStateBadge state={workspace.operationalState} />
          </div>
          {workspace.lastReturnReason ? (
            <p className="mt-2 text-sm text-rose-800">
              <strong>Motivo:</strong> {workspace.lastReturnReason}
            </p>
          ) : null}
          <Link
            to={semesterHubUrl}
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 underline-offset-2 hover:text-orange-600 hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver al semestre
          </Link>
        </div>
      </div>
    </Card>
  );
}
