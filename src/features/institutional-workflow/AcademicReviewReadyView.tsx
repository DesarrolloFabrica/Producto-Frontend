import { Link } from 'react-router-dom';
import { GraduationCap, ArrowRight } from 'lucide-react';
import type { OperationalWorkspaceDto } from '../../services/institutionalWorkflowApi';
import { InstitutionalStateBadge } from '../../components/status/InstitutionalStateBadge';
import { OperationalPipelineInstitutional } from './components/OperationalPipelineInstitutional';
import { SlaBadgeV2 } from '../operations-v2/components/SlaBadgeV2';
import type { SlaStatusV2 } from '../../types/operationalWorkflow';
import { Card } from '../../components/ui/Card';
import { semesterOperationsPath } from './institutionalNavigation';

type AcademicReviewReadyViewProps = {
  workspace: OperationalWorkspaceDto;
};

export function AcademicReviewReadyView({ workspace }: AcademicReviewReadyViewProps) {
  const semesterOpsUrl = semesterOperationsPath(workspace.projectId, workspace.semesterId);

  return (
    <div className="space-y-6">
      <Card className="border-emerald-200/80 bg-gradient-to-br from-emerald-50/80 via-white to-white p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200/80">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Revisión académica</p>
            <h2 className="mt-1 text-xl font-black text-slate-950">Revisión académica lista para iniciar</h2>
            <p className="mt-2 text-sm font-medium text-slate-600">
              Planeación validó LMS. Entre al centro operacional del semestre {workspace.semesterNumber}, pulse
              &quot;Iniciar revisión&quot; y luego abra el checklist de cada asignatura.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <InstitutionalStateBadge state={workspace.operationalState} />
              <SlaBadgeV2 status={workspace.slaStatus as SlaStatusV2} />
            </div>
          </div>
        </div>
        <div className="mt-6">
          <Link
            to={semesterOpsUrl}
            className="inline-flex items-center justify-center gap-1.5 rounded-[12px] bg-linear-to-br from-[#FF6B00] to-[#FF852D] px-5 py-2.5 text-xs font-bold text-white shadow-[0_4px_14px_0_rgba(255,107,0,0.39)]"
          >
            Ir al centro operacional del semestre
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Card>
      <OperationalPipelineInstitutional state={workspace.operationalState} />
    </div>
  );
}
