import { useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { ContextLink } from '../../navigation/ContextLink';
import { DeepLinkNotFound } from '../../components/feedback/DeepLinkNotFound';
import { ProjectsLoadNotice } from '../../components/feedback/ProjectsLoadNotice';
import { useEnsureProjectDetail } from '../operations/useEnsureProjectDetail';
import { useParams } from 'react-router-dom';
import { StatusBadge } from '../../components/status/StatusBadge';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { ProjectChangeTrackingPanel } from '../../components/change-tracking/ProjectChangeTrackingPanel';
import { ChangeOriginBadge, ChangeOriginHint } from '../../components/change-tracking/ChangeOriginBadge';
import { EditProjectDrawer } from '../../components/forms/EditProjectDrawer';
import { ProjectInfoDrawer } from '../../components/forms/ProjectInfoDrawer';
import { Modal } from '../../components/ui/Modal';
import { useOperations } from '../../features/operations/OperationsContext';
import { SubjectMatterExpertPendingBanner } from '../../components/projects/SubjectMatterExpertPendingBanner';
import { formatProjectExpectedDelivery } from '../../utils/projectSme';
import { useAuth } from '../auth/AuthContext';
import { formatDate } from '../../utils/formatters';
import { ArrowRight, BookOpen, CalendarDays, ClipboardCheck, Eye, Plus, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/ToastProvider';
import { priorityLabels } from '../../utils/status';
import { cn } from '../../components/ui/tokens';
import type { VirtualizationProject } from '../../types/domain';
import { analyzeProductProject } from '../../features/operations/productDashboardState';
import { FactoryProjectDetail } from './FactoryProjectDetail';
import { useDismissNotificationsOnVisit } from '../notifications/useDismissNotificationsOnVisit';
import { SemesterSubjectsWizard, areAllSemesterSubjectsValid } from '../../components/forms/SemesterSubjectsWizard';
import {
  createInitialSemesterSubjects,
  type SemesterFormSubject,
} from '../../components/forms/semesterSubjectsForm';
import {
  ProjectRadicationPanel,
  ProjectRadicationScopeLockHint,
  projectRadicationKeys,
  scrollToRadicationSection,
} from '../project-radication/ProjectRadicationPanel';
import { ProjectInstitutionalClosurePanel } from '../institutional-workflow/components/ProjectInstitutionalClosurePanel';
import { useQuery } from '@tanstack/react-query';
import { projectRadicationApi } from '../../services/projectRadicationApi';

/** Scroll al panel cuando se llega con /projects/:id#radication (RR no hace scroll al hash). */
function useScrollToRadicationOnHash(enabled: boolean, panelReady: boolean) {
  const location = useLocation();

  useEffect(() => {
    if (!enabled || location.hash !== '#radication') return;

    const tryScroll = () => scrollToRadicationSection('auto');

    if (panelReady && tryScroll()) return undefined;

    const retry = window.setTimeout(() => tryScroll(), panelReady ? 0 : 200);
    const retryLate = window.setTimeout(() => tryScroll(), 500);
    return () => {
      window.clearTimeout(retry);
      window.clearTimeout(retryLate);
    };
  }, [enabled, panelReady, location.pathname, location.hash]);
}

/** Redirige ?tab=summary (vista antigua) a la URL unificada sin query. */
function useLegacySummaryTabRedirect(projectId: string | undefined) {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (!projectId || searchParams.get('tab') !== 'summary') return;
    const next = new URLSearchParams(searchParams);
    next.delete('tab');
    setSearchParams(next, { replace: true });
  }, [projectId, searchParams, setSearchParams]);
}

export function ProjectDetailPage() {
  const { projectId } = useParams();
  const { addSemesterToProject, refreshProjects, projectObservations, confirmSubjectMatterExpertFromApi } =
    useOperations();
  const { showToast } = useToast();
  const { role } = useAuth();
  const { project, isLoading, error, notFound } = useEnsureProjectDetail(projectId);
  useDismissNotificationsOnVisit({ projectId: project?.id });
  useLegacySummaryTabRedirect(projectId);
  const [showInfoDrawer, setShowInfoDrawer] = useState(false);
  const [showAddSemesterModal, setShowAddSemesterModal] = useState(false);

  const institutionalReadinessQuery = useQuery({
    queryKey: projectRadicationKeys.readiness(projectId ?? ''),
    queryFn: () => projectRadicationApi.getReadiness(projectId!),
    enabled: Boolean(projectId) && role !== 'FABRICA',
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <ProjectsLoadNotice isLoading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <ProjectsLoadNotice error={error} onRefresh={() => void refreshProjects()} />
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <DeepLinkNotFound
        title="Proyecto no encontrado"
        description={error ?? 'No pudimos cargar el proyecto de esta URL.'}
        backTo="/projects"
        onRetry={() => void refreshProjects()}
      />
    );
  }

  if (role === 'FABRICA') {
    return <FactoryProjectDetail />;
  }

  const projectInsight = analyzeProductProject(project, projectObservations);

  const isInstitutionalFinalized =
    institutionalReadinessQuery.data?.projectInstitutionalState === 'FINALIZED';

  return (
    <div className="space-y-6">
      <PageHeader
        prominentEyebrow
        eyebrow={project.school}
        title={project.program}
        description={`${project.modality} · Responsable Product: ${project.productOwner}`}
      />

      <SubjectMatterExpertPendingBanner
        project={project}
        onConfirm={async () => {
          await confirmSubjectMatterExpertFromApi(project.id);
          showToast('Experto temático confirmado. La solicitud quedó activa.');
        }}
      />

      <Card className="overflow-hidden rounded-[20px] border-none bg-white shadow-[0_10px_25px_-5px_rgba(0,0,0,0.02)]">
        <div className="p-6 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status={projectInsight.displayStatus as any} />
                <span className="text-xs font-medium text-slate-400">·</span>
                <span className="text-xs font-medium text-slate-500">Prioridad: {priorityLabels[project.priority]}</span>
              </div>
              <div className="mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-2 lg:grid-cols-4">
                <InfoCompact label="Entrega esperada">
                  {formatProjectExpectedDelivery(project)}
                </InfoCompact>
                <InfoCompact label="Solicitud creada">{formatDate(project.createdAt)}</InfoCompact>
                <InfoCompact label="Semestres">{project.semesters.map((s) => s.semesterNumber).join(', ')}</InfoCompact>
                <InfoCompact label="Progreso">{project.progress}%</InfoCompact>
              </div>
            </div>
            <div className="flex w-full min-w-[200px] flex-col gap-3 sm:w-auto">
              <div className="relative h-2 overflow-hidden rounded-[100px] bg-slate-100">
                <div
                  className="absolute left-0 top-0 h-full rounded-[100px] bg-linear-to-r from-orange-400 to-orange-500"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
              <Button
                variant="secondary"
                className="w-full py-2.5 text-xs font-bold"
                onClick={() => setShowInfoDrawer(true)}
              >
                <Eye className="h-3.5 w-3.5" /> Ver información
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <ProjectChangeTrackingPanel project={project} />

      {isInstitutionalFinalized ? (
        <ProjectInstitutionalClosurePanel projectId={project.id} />
      ) : (
        <ProjectSemestersWorkspace
          project={project}
          projectId={project.id}
          projectInsight={projectInsight}
          onAddSemester={() => setShowAddSemesterModal(true)}
        />
      )}

      <ProjectInfoDrawer isOpen={showInfoDrawer} onClose={() => setShowInfoDrawer(false)} project={project} />
      <EditProjectDrawer isOpen={false} onClose={() => {}} project={project} />
      <AddSemesterModal
        isOpen={showAddSemesterModal}
        onClose={() => setShowAddSemesterModal(false)}
        project={project}
        onAdd={(payload) => addSemesterToProject(project.id, payload)}
        onSuccess={() => showToast('Modificación guardada y notificada a Fábrica.')}
        onError={(message) => showToast(message, 'error')}
      />
    </div>
  );
}

function InfoCompact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">{label}</p>
      <p className="text-sm font-semibold text-slate-700">{children}</p>
    </div>
  );
}

function ProjectSemestersWorkspace({
  project,
  projectId,
  projectInsight,
  onAddSemester,
}: {
  project: ReturnType<typeof useOperations>['projects'][number];
  projectId: string;
  projectInsight: ReturnType<typeof analyzeProductProject>;
  onAddSemester: () => void;
}) {
  const { role } = useAuth();
  const showRadication = role === 'PRODUCT' || role === 'ADMIN';

  const readinessQuery = useQuery({
    queryKey: projectRadicationKeys.readiness(projectId),
    queryFn: () => projectRadicationApi.getReadiness(projectId),
    enabled: showRadication,
  });

  const scopeLocked = Boolean(readinessQuery.data?.institutionalScopeLockedAt);
  const radicationPanelReady =
    !readinessQuery.isLoading && readinessQuery.data?.projectInstitutionalState != null;
  useScrollToRadicationOnHash(showRadication, radicationPanelReady);
  const radicationBySemester = new Map(
    (readinessQuery.data?.bySemester ?? []).map((sem) => [sem.semesterNumber, sem]),
  );

  const existingNumbers = project.semesters.map((s) => s.semesterNumber);
  const availableSemesters = Array.from({ length: 10 }, (_, i) => i + 1).filter((n) => !existingNumbers.includes(n));
  const canAddSemester = availableSemesters.length > 0 && !scopeLocked;

  const subjectsBySemester = project.semesters.map((semester) => {
    const subjects = project.subjects.filter((s) => s.semesterNumber === semester.semesterNumber);
    return { semester, subjects };
  });

  return (
    <section className="space-y-5">
      {showRadication && <ProjectRadicationPanel projectId={projectId} />}

      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Semestres a virtualizar</p>
          <p className="mt-1 text-sm font-medium text-slate-500">Gestiona las entregas por semestre, asignaturas y temas.</p>
        </div>
        {canAddSemester && (
          <Button onClick={onAddSemester} className="shadow-lg shadow-orange-500/25">
            <Plus className="h-3.5 w-3.5" /> Agregar semestre
          </Button>
        )}
      </div>

      {scopeLocked && <ProjectRadicationScopeLockHint projectId={projectId} />}

      {subjectsBySemester.length === 0 ? (
        <Card className="rounded-[20px] border-none bg-white p-8 text-center shadow-sm">
          <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-bold text-slate-700">No hay semestres registrados</p>
          <p className="mt-1 text-xs font-medium text-slate-500">Agrega el primer semestre para comenzar la producción.</p>
          {canAddSemester && (
            <Button onClick={onAddSemester} className="mt-4" variant="secondary">
              <Plus className="h-3.5 w-3.5" /> Agregar semestre
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {subjectsBySemester.map(({ semester, subjects }) => {
            const totalChecklist = subjects.reduce((acc, s) => acc + s.checklist.length, 0);
            const semesterProgress =
              subjects.length > 0
                ? Math.round(subjects.reduce((acc, s) => acc + (s.progress ?? 0), 0) / subjects.length)
                : 0;
            const radicationSem = radicationBySemester.get(semester.semesterNumber);

            return (
              <Card
                key={semester.id}
                className="rounded-[20px] border-none bg-white shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02),0_2px_4px_-1px_rgba(0,0,0,0.01)]"
              >
                <div className="p-6 sm:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Semestre</p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-black tracking-tight text-slate-900">
                          Semestre {semester.semesterNumber}
                        </h3>
                        {semester.createdFromChange && <ChangeOriginBadge kind="semester" />}
                      </div>
                      {semester.createdFromChange && <ChangeOriginHint kind="semester" />}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge status={semester.status} />
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500">
                        <CalendarDays className="h-3 w-3" /> Entrega: {formatDate(semester.factoryExpectedDate)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <div className="relative h-2 flex-1 overflow-hidden rounded-[100px] bg-slate-100">
                      <div
                        className="absolute left-0 top-0 h-full rounded-[100px] bg-linear-to-r from-orange-400 to-orange-500"
                        style={{ width: `${semesterProgress}%` }}
                      />
                    </div>
                    <span className="text-xs font-black text-orange-600">{semesterProgress}%</span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-4 text-xs font-medium text-slate-600">
                    <span className="inline-flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-orange-400" />
                      {subjects.length} asignatura{subjects.length !== 1 ? 's' : ''}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <ClipboardCheck className="h-3.5 w-3.5 text-orange-400" />
                      {totalChecklist} entregables
                    </span>
                    {radicationSem && radicationSem.total > 0 && (
                      <span className="inline-flex items-center gap-1.5 text-slate-500">
                        Alcance: {radicationSem.approved}/{radicationSem.total} aprobadas
                      </span>
                    )}
                  </div>

                  {semester.observations && (
                    <p className="mt-4 rounded-[12px] bg-slate-50 p-3 text-xs font-medium text-slate-600">
                      {semester.observations}
                    </p>
                  )}

                  {subjects.length > 0 && (
                    <div className="mt-5">
                      <ContextLink
                        to={`/projects/${project.id}/semesters/${semester.semesterNumber}`}
                        className="inline-flex items-center gap-1.5 rounded-2xl bg-linear-to-br from-orange-400 to-orange-500 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-orange-500/30 transition-all hover:from-orange-500 hover:to-orange-600"
                      >
                        <Eye className="h-3.5 w-3.5" /> Ver asignaturas
                        <ArrowRight className="h-3.5 w-3.5" />
                      </ContextLink>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {availableSemesters.length === 0 && project.semesters.length > 0 && (
        <Card className="rounded-[20px] border-none bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-bold text-slate-700">Todos los semestres están registrados</p>
          <p className="mt-1 text-xs font-medium text-slate-500">No hay más semestres disponibles para agregar.</p>
        </Card>
      )}
    </section>
  );
}

interface AddSemesterModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: VirtualizationProject;
  onAdd: (payload: {
    semesterNumber: number;
    factoryExpectedDate: string;
    subjects: { name: string; topics?: string[] }[];
    changeReason?: string;
  }) => Promise<void>;
  onSuccess: () => void;
  onError: (message: string) => void;
}

function AddSemesterModal({ isOpen, onClose, project, onAdd, onSuccess, onError }: AddSemesterModalProps) {
  const existingNumbers = project.semesters.map((s) => s.semesterNumber);
  const availableSemesters = Array.from({ length: 10 }, (_, i) => i + 1).filter((n) => !existingNumbers.includes(n));

  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
  const [expectedDate, setExpectedDate] = useState(project.expectedDeliveryDate);
  const [changeReason, setChangeReason] = useState('');
  const [subjects, setSubjects] = useState<SemesterFormSubject[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const selectSemester = (num: number) => {
    setSelectedSemester(num);
    setSubjects(createInitialSemesterSubjects(1));
    setErrors([]);
  };

  const canSubmitSemester =
    selectedSemester !== null && areAllSemesterSubjectsValid([{ number: selectedSemester, subjects }]);

  const validate = (): boolean => {
    const newErrors: string[] = [];
    if (!selectedSemester) newErrors.push('Selecciona un semestre.');
    if (!expectedDate) newErrors.push('Ingresa la fecha de entrega esperada del semestre.');
    if (subjects.length < 1) newErrors.push('Define al menos una asignatura para el nuevo semestre.');
    subjects.forEach((subj) => {
      if (!subj.name.trim()) newErrors.push('Una asignatura no tiene nombre.');
    });
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !selectedSemester) return;
    setSaving(true);
    try {
      await onAdd({
        semesterNumber: selectedSemester,
        factoryExpectedDate: expectedDate,
        subjects: subjects.map((subj) => ({
          name: subj.name.trim(),
          topics: [],
        })),
        changeReason: changeReason.trim() || undefined,
      });
      onSuccess();
      setSelectedSemester(null);
      setSubjects([]);
      setErrors([]);
      setChangeReason('');
      onClose();
    } catch (error) {
      onError(error instanceof Error ? error.message : 'No se pudo guardar la modificación.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setSelectedSemester(null);
    setExpectedDate(project.expectedDeliveryDate);
    setSubjects([]);
    setChangeReason('');
    setErrors([]);
    onClose();
  };

  const inputClass =
    'w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 focus:outline-none transition-all';
  const labelClass = 'block mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400';

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Agregar semestre"
      description="Define el semestre, la fecha de entrega y cuántas asignaturas incluirá. Las materias de un semestre no se pueden ampliar después de crearlo."
      size="lg"
    >
      <div className="space-y-5">
        {errors.length > 0 && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <p className="text-xs font-bold text-rose-700">Corrige los siguientes errores:</p>
            <ul className="mt-2 space-y-1">
              {errors.map((err, i) => (
                <li key={i} className="text-[11px] font-medium text-rose-600">
                  • {err}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <label className={labelClass}>Semestre disponible</label>
          <div className="grid grid-cols-5 gap-2">
            {availableSemesters.map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => selectSemester(num)}
                className={cn(
                  'flex items-center justify-center rounded-xl border py-3 text-xs font-bold transition-all',
                  selectedSemester === num
                    ? 'border-orange-300 bg-orange-50 text-orange-700 ring-1 ring-orange-200'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300',
                )}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClass}>Fecha entrega esperada del semestre</label>
          <input
            required
            type="date"
            className={inputClass}
            value={expectedDate}
            onChange={(e) => setExpectedDate(e.target.value)}
          />
          <p className="mt-1 text-[10px] font-medium text-slate-400">
            Esta fecha será la entrega operativa para este semestre.
          </p>
        </div>

        <div>
          <label className={labelClass}>Motivo del cambio</label>
          <textarea
            className={cn(inputClass, 'min-h-24 resize-y')}
            value={changeReason}
            onChange={(e) => setChangeReason(e.target.value)}
            placeholder="Opcional: describe por qué se agrega este semestre"
          />
        </div>

        {selectedSemester !== null && (
          <>
            <div className="border-t border-slate-100" />

            <SemesterSubjectsWizard
              singleSemester
              singleSemesterLabel={`Asignaturas del semestre ${selectedSemester}`}
              semesters={[{ number: selectedSemester, subjects }]}
              onSemestersChange={(next) => {
                const row = next[0];
                if (row) setSubjects(row.subjects);
              }}
              inputClass={inputClass}
            />
          </>
        )}

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button disabled={saving || !canSubmitSemester} onClick={handleSubmit}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {saving ? 'Guardando...' : 'Agregar semestre'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
