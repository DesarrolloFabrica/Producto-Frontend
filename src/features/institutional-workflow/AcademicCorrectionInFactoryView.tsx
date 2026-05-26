import { Link } from 'react-router-dom';
import { Factory, ArrowRight } from 'lucide-react';
import type { OperationalWorkspaceDto } from '../../services/institutionalWorkflowApi';
import { institutionalStateLabel } from './institutionalCopy';
import { Card } from '../../components/ui/Card';

type AcademicCorrectionInFactoryViewProps = {
  workspace: OperationalWorkspaceDto;
};

export function AcademicCorrectionInFactoryView({ workspace }: AcademicCorrectionInFactoryViewProps) {
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
          <p className="mt-2 text-xs font-bold text-amber-800">
            {institutionalStateLabel(workspace.operationalState)}
          </p>
          {workspace.lastReturnReason ? (
            <p className="mt-2 text-sm text-rose-800">
              <strong>Motivo:</strong> {workspace.lastReturnReason}
            </p>
          ) : null}
          <Link
            to={`/subjects/${workspace.subjectId}/operations`}
            className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-[12px] border border-[#CBD5E1] bg-white px-4 py-2 text-xs font-bold text-[#475569] hover:bg-[#F1F5F9]"
          >
            Ver flujo operacional
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </Card>
  );
}
