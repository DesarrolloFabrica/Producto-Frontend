import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import type { OperationalWorkspaceDto } from '../../services/institutionalWorkflowApi';
import { Card } from '../../components/ui/Card';

type Props = {
  workspace: OperationalWorkspaceDto;
};

export function PendingProjectRadicationView({ workspace }: Props) {
  return (
    <Card className="overflow-hidden border-emerald-200/80 bg-gradient-to-br from-emerald-50/80 via-white to-white p-6 sm:p-8">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Aprobación académica</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">Asignatura aprobada</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Esta materia quedó aprobada académicamente y está pendiente de la radicación del proyecto completo.
            Product debe registrar el radicado cuando todas las materias del alcance inicial estén listas.
          </p>
          <Link
            to={`/projects/${workspace.projectId}?tab=summary`}
            className="mt-4 inline-flex text-sm font-bold text-orange-600 hover:text-orange-700"
          >
            Ver progreso de la solicitud →
          </Link>
        </div>
      </div>
    </Card>
  );
}
