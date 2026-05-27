import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ProjectsLoadNotice } from '../../components/feedback/ProjectsLoadNotice';
import { useEnsureProjectDetail } from '../operations/useEnsureProjectDetail';

/**
 * Ruta legacy por número de semestre: redirige al centro operacional institucional (UUID).
 */
export function FactorySemesterSubjectsView() {
  const { projectId, semesterNumber } = useParams();
  const navigate = useNavigate();
  const semesterNum = parseInt(semesterNumber ?? '0', 10);
  const { project, isLoading, error, notFound } = useEnsureProjectDetail(projectId);

  const semester = project?.semesters.find((s) => s.semesterNumber === semesterNum);
  const targetUrl =
    project && semester ? `/projects/${project.id}/semesters/${semester.id}/operations` : null;

  useEffect(() => {
    if (targetUrl) {
      navigate(targetUrl, { replace: true });
    }
  }, [targetUrl, navigate]);

  if (isLoading || (targetUrl && !notFound)) {
    return (
      <div className="space-y-6">
        <ProjectsLoadNotice isLoading />
      </div>
    );
  }

  if (error || notFound || !project || Number.isNaN(semesterNum) || !semester) {
    return (
      <div className="space-y-6">
        <ProjectsLoadNotice
          error={error ?? 'No se encontró el semestre solicitado.'}
          isEmpty={!error}
          emptyMessage="No se encontró el semestre solicitado."
        />
      </div>
    );
  }

  return null;
}
