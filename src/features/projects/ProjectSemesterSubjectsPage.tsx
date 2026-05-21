import { useState } from 'react';
import { Navigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, CalendarDays, CheckCircle2, MessageSquare, Plus, X, Loader2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { StatusBadge } from '../../components/status/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { ProjectsLoadNotice } from '../../components/feedback/ProjectsLoadNotice';
import { useOperations } from '../../features/operations/OperationsContext';
import { useEnsureProjectDetail } from '../operations/useEnsureProjectDetail';
import { useAuth } from '../auth/AuthContext';
import { formatDate } from '../../utils/formatters';
import { cn } from '../../components/ui/tokens';
import type { ChecklistItem, ChecklistStatus, Role, TopicChecklist, VirtualizationProject } from '../../types/domain';
import { FactorySemesterSubjectsView } from './FactorySemesterSubjectsView';

const subjectChecklistLabels = [
  'Presentacion de la asignatura',
  'Foro de presentacion',
  'Resultados de aprendizaje y competencias',
  'Evaluacion diagnostica de entrada',
  'Syllabus',
  'Lecturas y bibliografia',
  'Evaluaciones',
  'ACA Actividad de Conocimiento Aplicado',
  'Foro Taller',
  'Taller RAE',
  'Evaluacion diagnostica de salida',
  'Seminario Aleman',
];

function buildSubjectChecklist(seed: number): ChecklistItem[] {
  return subjectChecklistLabels.map((label, index) => ({
    id: `chk-${seed}-${index}`,
    label,
    status: 'PENDIENTE' as ChecklistStatus,
    ownerRole: 'PRODUCT' as Role,
    updatedAt: new Date().toISOString(),
    observations: '',
  }));
}

const topicChecklistLabels = ['Material descargable', 'Podcast', 'Videos', 'Infografias interactivas'];

function buildTopicChecklist(seed: number): ChecklistItem[] {
  return topicChecklistLabels.map((label, index) => ({
    id: `chk-topic-${seed}-${index}`,
    label,
    status: 'PENDIENTE' as ChecklistStatus,
    ownerRole: 'PRODUCT' as Role,
    updatedAt: new Date().toISOString(),
    observations: '',
  }));
}

function buildSubjectTopicChecklists(seed: number, topicNames: string[]): TopicChecklist[] {
  return topicNames.map((name, idx) => ({
    topicName: name,
    topicOrder: idx + 1,
    items: buildTopicChecklist(seed + idx),
  }));
}

export function ProjectSemesterSubjectsPage() {
  const { projectId, semesterNumber } = useParams();
  const { projectObservations, addSubjectToSemester, refreshProjects } = useOperations();
  const { role } = useAuth();
  const { project, isLoading, error } = useEnsureProjectDetail(projectId);
  const semesterNum = parseInt(semesterNumber ?? '0', 10);
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);

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

  if (!project || isNaN(semesterNum)) return <Navigate to="/projects" replace />;

  if (role === 'FABRICA') {
    return <FactorySemesterSubjectsView />;
  }

  const semester = project.semesters.find((s) => s.semesterNumber === semesterNum);
  const subjects = project.subjects.filter((s) => s.semesterNumber === semesterNum);

  const semesterProgress = subjects.length > 0
    ? Math.round(subjects.reduce((acc, s) => acc + (s.progress ?? 0), 0) / subjects.length)
    : 0;
  const openObservations = projectObservations.filter(
    (o) => o.projectId === project.id && o.status === 'ABIERTA' && subjects.some((s) => s.id === o.subjectId)
  ).length;

  return (
    <div className="space-y-7">
      <PageHeader
        prominentEyebrow
        eyebrow={`${project.school} · ${project.program}`}
        title={`Semestre ${semesterNum}`}
        description={`${project.modality} · Responsable Product: ${project.productOwner}`}
        action={
          <Link
            to={`/projects/${project.id}`}
            className="inline-flex items-center gap-1.5 rounded-2xl border border-orange-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition-all hover:border-orange-300 hover:text-orange-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Volver al proyecto
          </Link>
        }
      />

      <Card variant="subjectPanel" className="p-0 overflow-hidden">
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="grid min-w-0 flex-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Estado del proyecto">
                <StatusBadge status={project.status} />
              </Info>
              <Info label="Entrega esperada por Fábrica">{semester ? formatDate(semester.factoryExpectedDate) : formatDate(project.expectedDeliveryDate)}</Info>
              <Info label="Asignaturas">{subjects.length}</Info>
              <Info label="Observaciones abiertas">{openObservations}</Info>
            </div>
            <div className="flex min-w-[220px] flex-col gap-3">
              <div className="relative h-2.5 overflow-hidden rounded-[10px] bg-[#E2E8F0]">
                <div className="relative h-full rounded-[10px] bg-linear-to-r from-[#FF7E5F] to-[#FEB47B] progress-glass" style={{ width: `${semesterProgress}%` }} />
              </div>
              <p className="text-right text-xs font-black text-orange-600">{semesterProgress}% avance</p>
            </div>
          </div>
        </div>
      </Card>

      <Card variant="subjectPanel" className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />
          <div>
            <p className="text-sm font-bold text-slate-900">Revisión de asignaturas</p>
            <p className="text-xs font-medium text-slate-600">Revisa las asignaturas de este semestre y valida el checklist de entregables. Cada asignatura tiene su propio checklist y observaciones.</p>
          </div>
        </div>
      </Card>

      {subjects.length === 0 ? (
        <Card variant="subjectPanel" className="p-8 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-bold text-slate-700">Sin asignaturas registradas</p>
          <p className="mt-1 text-xs font-medium text-slate-500">Agrega la primera asignatura para comenzar la revisión.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {subjects.map((subject) => {
            const subjectChecklist = subject.checklist.length;
            const subjectProgress = subject.progress ?? 0;
            const subjectObservations = projectObservations.filter(
              (o) => o.subjectId === subject.id && o.status === 'ABIERTA'
            ).length;
            const topicCount = subject.contentTopics?.length ?? 0;

            return (
              <Card key={subject.id} variant="subjectPanel" className="p-5 transition-all hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#94A3B8]">Semestre {subject.semesterNumber}</p>
                    <h3 className="mt-1 text-base font-bold tracking-tight text-slate-950">{subject.name}</h3>
                  </div>
                  <StatusBadge status={subject.status} size="sm" />
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <div className="flex-1">
                    <ProgressBar value={subjectProgress} showLabel={false} size="sm" />
                  </div>
                  <span className="text-xs font-black text-orange-600">{subjectProgress}%</span>
                </div>

                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-slate-600">
                  <span className="inline-flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-orange-400" />
                    {subjectChecklist} entregables
                  </span>
                  {topicCount > 0 && (
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 text-orange-400" />
                      {topicCount} temas
                    </span>
                  )}
                  {subjectObservations > 0 && (
                    <span className="inline-flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5 text-amber-500" />
                      {subjectObservations} observaciones
                    </span>
                  )}
                </div>

                <div className="mt-5">
                  <Link
                    to={`/subjects/${subject.id}`}
                    className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-linear-to-br from-orange-400 to-orange-600 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-orange-500/30 transition-all hover:from-orange-500 hover:to-orange-700"
                  >
                    Gestionar revisión
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowAddSubjectModal(true)}
        className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50/20 py-4 text-sm font-bold text-orange-600 hover:border-orange-300 hover:bg-orange-50/40 transition-all"
      >
        <Plus className="h-4 w-4" /> Agregar asignatura
      </button>

      <AddSubjectModal
        isOpen={showAddSubjectModal}
        onClose={() => setShowAddSubjectModal(false)}
        project={project}
        semesterNumber={semesterNum}
        onAdd={(subject) => addSubjectToSemester(project.id, subject)}
      />
    </div>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#94A3B8]">{label}</p>
      <div className="text-sm font-medium text-[#1E293B]">{children}</div>
    </div>
  );
}

interface AddSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: VirtualizationProject;
  semesterNumber: number;
  onAdd: (subject: VirtualizationProject['subjects'][0]) => void;
}

function AddSubjectModal({ isOpen, onClose, project, semesterNumber, onAdd }: AddSubjectModalProps) {
  const [name, setName] = useState('');
  const [topics, setTopics] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const addTopic = () => setTopics((prev) => [...prev, '']);

  const updateTopic = (index: number, value: string) => {
    setTopics((prev) => prev.map((t, i) => (i === index ? value : t)));
  };

  const removeTopic = (index: number) => {
    setTopics((prev) => prev.filter((_, i) => i !== index));
  };

  const suggestTopics = () => setTopics(['Tema 1', 'Tema 2', 'Tema 3', 'Tema 4']);

  const validate = (): boolean => {
    const newErrors: string[] = [];
    if (!name.trim()) newErrors.push('Ingresa el nombre de la asignatura.');
    if (topics.length === 0) newErrors.push('Agrega al menos un tema.');
    topics.forEach((t, i) => {
      if (!t.trim()) newErrors.push(`El tema ${i + 1} no tiene nombre.`);
    });
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));

    const subject: VirtualizationProject['subjects'][0] = {
      id: `subj-${Date.now()}`,
      projectId: project.id,
      semesterNumber,
      name,
      status: 'PENDING',
      progress: 0,
      checklist: buildSubjectChecklist(Date.now()),
      generalObservations: '',
      contentTopics: topics,
      topicChecklists: buildSubjectTopicChecklists(Date.now(), topics),
    };

    onAdd(subject);
    setSaving(false);
    setName('');
    setTopics([]);
    setErrors([]);
    onClose();
  };

  const inputClass = 'w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 focus:outline-none transition-all';
  const labelClass = 'block mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Agregar asignatura" description="Agrega una nueva asignatura al semestre. Los entregables quedarán en Pendiente para revisión." size="md">
      <div className="space-y-5">
        {errors.length > 0 && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <p className="text-xs font-bold text-rose-700">Corrige los siguientes errores:</p>
            <ul className="mt-2 space-y-1">
              {errors.map((err, i) => (
                <li key={i} className="text-[11px] font-medium text-rose-600">• {err}</li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <label className={labelClass}>Nombre de la asignatura</label>
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Pensamiento Algoritmico" />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className={labelClass}>Temas / Gránulos</label>
            <div className="flex gap-2">
              {topics.length === 0 && (
                <button type="button" onClick={suggestTopics} className="text-[10px] font-bold text-orange-600 hover:text-orange-700">
                  Sugerir 4
                </button>
              )}
              <button type="button" onClick={addTopic} className="text-[10px] font-bold text-orange-600 hover:text-orange-700">
                + Tema
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {topics.map((topic, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-orange-100 text-[9px] font-bold text-orange-600">
                  {index + 1}
                </span>
                <input
                  className={cn(inputClass, 'flex-1 py-2 px-3 text-xs')}
                  value={topic}
                  onChange={(e) => updateTopic(index, e.target.value)}
                  placeholder={`Tema ${index + 1}`}
                />
                <button type="button" onClick={() => removeTopic(index)} className="shrink-0 text-slate-300 hover:text-rose-500">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {topics.length === 0 && (
              <p className="text-center text-xs font-medium text-slate-400 py-4">Agrega al menos un tema.</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button disabled={saving} onClick={handleSubmit}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {saving ? 'Guardando...' : 'Agregar asignatura'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
