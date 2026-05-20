import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { SemesterWorkflowCard } from '../../components/cards/SemesterWorkflowCard';
import { StatusBadge } from '../../components/status/StatusBadge';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { Tabs } from '../../components/ui/Tabs';
import { EditProjectDrawer } from '../../components/forms/EditProjectDrawer';
import { ProjectInfoDrawer } from '../../components/forms/ProjectInfoDrawer';
import { Modal } from '../../components/ui/Modal';
import { useOperations } from '../../features/operations/OperationsContext';
import { useAuth } from '../auth/AuthContext';
import { formatDate } from '../../utils/formatters';
import { ArrowRight, BookOpen, CalendarDays, CheckCircle2, ClipboardCheck, Eye, FileText, MessageSquare, Plus, X, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { priorityLabels } from '../../utils/status';
import { cn } from '../../components/ui/tokens';
import type { ChecklistItem, ChecklistStatus, Role, VirtualizationProject } from '../../types/domain';
import { FactoryProjectDetail } from './FactoryProjectDetail';

const tabs = [
  { id: 'summary', label: 'Resumen' },
  { id: 'semesters', label: 'Semestres', flow: true },
];

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

const topicChecklistLabels = [
  'Material descargable',
  'Podcast',
  'Videos',
  'Infografias interactivas',
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

export function ProjectDetailPage() {
  const { projectId } = useParams();
  const { projects, addSemesterToProject } = useOperations();
  const { role } = useAuth();
  const project = projects.find((item) => item.id === projectId);
  const [activeTab, setActiveTab] = useState('summary');
  const [showInfoDrawer, setShowInfoDrawer] = useState(false);
  const [showAddSemesterModal, setShowAddSemesterModal] = useState(false);

  if (!project) return <Navigate to="/projects" replace />;

  if (role === 'FABRICA') {
    return <FactoryProjectDetail />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        prominentEyebrow
        eyebrow={project.school}
        title={project.program}
        description={`${project.modality} · Responsable Product: ${project.productOwner}`}
      />

      {/* Executive Summary Card */}
      <Card className="overflow-hidden rounded-[20px] border-none bg-white shadow-[0_10px_25px_-5px_rgba(0,0,0,0.02)]">
        <div className="p-6 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status={project.status} />
                <span className="text-xs font-medium text-slate-400">·</span>
                <span className="text-xs font-medium text-slate-500">Prioridad: {priorityLabels[project.priority]}</span>
              </div>
              <div className="mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-2 lg:grid-cols-4">
                <InfoCompact label="Entrega esperada">{formatDate(project.expectedDeliveryDate)}</InfoCompact>
                <InfoCompact label="Solicitud creada">{formatDate(project.createdAt)}</InfoCompact>
                <InfoCompact label="Semestres">{project.semesters.map((s) => s.semesterNumber).join(', ')}</InfoCompact>
                <InfoCompact label="Progreso">{project.progress}%</InfoCompact>
              </div>
            </div>
              <div className="flex w-full min-w-[200px] flex-col gap-3 sm:w-auto">
                <div className="relative h-2 overflow-hidden rounded-[100px] bg-slate-100">
                  <div className="absolute left-0 top-0 h-full rounded-[100px] bg-linear-to-r from-orange-400 to-orange-500" style={{ width: `${project.progress}%` }} />
                </div>
                <Button variant="secondary" className="w-full py-2.5 text-xs font-bold" onClick={() => setShowInfoDrawer(true)}>
                  <Eye className="h-3.5 w-3.5" /> Ver información
                </Button>
              </div>
          </div>
        </div>
      </Card>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'summary' && <Summary project={project} />}
      {activeTab === 'semesters' && (
        <Semesters project={project} onAddSemester={() => setShowAddSemesterModal(true)} />
      )}

      <ProjectInfoDrawer isOpen={showInfoDrawer} onClose={() => setShowInfoDrawer(false)} project={project} />
      <EditProjectDrawer isOpen={false} onClose={() => {}} project={project} />
      <AddSemesterModal
        isOpen={showAddSemesterModal}
        onClose={() => setShowAddSemesterModal(false)}
        project={project}
        onAdd={(semester, subjects) => addSemesterToProject(project.id, semester, subjects)}
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

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">{label}</p>
      <div className="text-sm font-medium text-slate-700">{children}</div>
    </div>
  );
}

function Summary({ project }: { project: ReturnType<typeof useOperations>['projects'][number] }) {
  const hasSyllabus = project.links.some((l) => l.type === 'SYLLABUS');
  const syllabusLink = project.links.find((l) => l.type === 'SYLLABUS');

  return (
    <section className="tab-content-active space-y-5">
      {/* Informacion base */}
      <Card className="rounded-[20px] border-none bg-white shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02),0_2px_4px_-1px_rgba(0,0,0,0.01)]">
        <div className="p-6 sm:p-7">
          <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Solicitud</p>
          <h2 className="mt-1 text-lg font-black tracking-tight text-slate-900">Información base</h2>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Info label="Escuela">{project.school}</Info>
            <Info label="Programa">{project.program}</Info>
            <Info label="Modalidad">{project.modality}</Info>
            <Info label="Prioridad">{priorityLabels[project.priority]}</Info>
            <Info label="Fecha entrega Fábrica">{formatDate(project.expectedDeliveryDate)}</Info>
            <Info label="Responsable Product">{project.productOwner}</Info>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">Syllabus</p>
              <div className="flex items-center gap-2">
                {hasSyllabus ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm font-medium text-slate-700">Sí</span>
                    {syllabusLink && (
                      <a href={syllabusLink.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700">
                        <FileText className="h-3.5 w-3.5" /> Abrir link
                      </a>
                    )}
                  </>
                ) : (
                  <span className="text-sm font-medium text-slate-500">Sin syllabus registrado</span>
                )}
              </div>
            </div>
            <Info label="Semestres seleccionados">{project.semesters.map((s) => `Semestre ${s.semesterNumber}`).join(', ')}</Info>
          </div>

          {project.observations && (
            <div className="mt-6">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">Observaciones iniciales</p>
              <p className="rounded-[12px] bg-slate-50 p-4 text-sm font-medium leading-relaxed text-slate-600">{project.observations}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Avance general */}
      <Card className="rounded-[20px] border-none bg-white shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02),0_2px_4px_-1px_rgba(0,0,0,0.01)]">
        <div className="p-6 sm:p-7">
          <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Estado</p>
          <h2 className="mt-1 text-lg font-black tracking-tight text-slate-900">Avance general</h2>

          <div className="mt-6 flex items-center gap-4">
            <div className="flex-1">
              <div className="relative h-2 overflow-hidden rounded-[100px] bg-slate-100">
                <div className="absolute left-0 top-0 h-full rounded-[100px] bg-linear-to-r from-orange-400 to-orange-500" style={{ width: `${project.progress}%` }} />
              </div>
            </div>
            <span className="text-sm font-black text-orange-600">{project.progress}%</span>
          </div>

          <div className="mt-4">
            <StatusBadge status={project.status} />
          </div>
        </div>
      </Card>

      {/* Próximos pasos */}
      <Card className="rounded-[20px] border-none bg-white shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02),0_2px_4px_-1px_rgba(0,0,0,0.01)]">
        <div className="p-6 sm:p-7">
          <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Revisión</p>
          <h2 className="mt-1 text-lg font-black tracking-tight text-slate-900">Próximos pasos</h2>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <NextStepCard icon={ClipboardCheck} title="Revisar contenido entregado" description="Valida los entregables de Fábrica por asignatura y tema." />
            <NextStepCard icon={BookOpen} title="Validar checklist de asignaturas" description="Revisa cada item del checklist y marca aprobado o rechazado." />
            <NextStepCard icon={MessageSquare} title="Registrar observaciones" description="Si algo falta o necesita corrección, deja observaciones claras." />
            <NextStepCard icon={CheckCircle2} title="Cerrar solicitud" description="Cuando todo esté aprobado, cierra la solicitud como completada." />
          </div>
        </div>
      </Card>
    </section>
  );
}

function NextStepCard({ icon: Icon, title, description }: { icon: typeof ClipboardCheck; title: string; description: string }) {
  return (
    <div className="group rounded-[16px] border border-slate-100 bg-white p-4 shadow-sm transition-all hover:border-orange-200 hover:bg-orange-50/30 hover:shadow-md">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-all group-hover:bg-orange-500 group-hover:text-white">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900">{title}</p>
          <p className="mt-1 text-xs font-medium leading-relaxed text-slate-600">{description}</p>
        </div>
      </div>
    </div>
  );
}

function Semesters({ project, onAddSemester }: { project: ReturnType<typeof useOperations>['projects'][number]; onAddSemester: () => void }) {
  const existingNumbers = project.semesters.map((s) => s.semesterNumber);
  const availableSemesters = Array.from({ length: 10 }, (_, i) => i + 1).filter((n) => !existingNumbers.includes(n));

  const subjectsBySemester = project.semesters.map((semester) => {
    const subjects = project.subjects.filter((s) => s.semesterNumber === semester.semesterNumber);
    return { semester, subjects };
  });

  return (
    <div className="tab-content-active space-y-5">
      {/* Header con boton Agregar semestre */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Semestres a virtualizar</p>
          <p className="mt-1 text-sm font-medium text-slate-500">Gestiona las entregas por semestre, asignaturas y temas.</p>
        </div>
        {availableSemesters.length > 0 && (
          <Button onClick={onAddSemester} className="shadow-lg shadow-orange-500/25">
            <Plus className="h-3.5 w-3.5" /> Agregar semestre
          </Button>
        )}
      </div>

      {/* Lista de semestres */}
      {subjectsBySemester.length === 0 ? (
        <Card className="rounded-[20px] border-none bg-white p-8 text-center shadow-sm">
          <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-bold text-slate-700">No hay semestres registrados</p>
          <p className="mt-1 text-xs font-medium text-slate-500">Agrega el primer semestre para comenzar la producción.</p>
          {availableSemesters.length > 0 && (
            <Button onClick={onAddSemester} className="mt-4" variant="secondary">
              <Plus className="h-3.5 w-3.5" /> Agregar semestre
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {subjectsBySemester.map(({ semester, subjects }) => {
            const totalChecklist = subjects.reduce((acc, s) => acc + s.checklist.length, 0);
            const approvedChecklist = subjects.reduce((acc, s) => acc + s.checklist.filter((c) => c.status === 'APROBADO').length, 0);
            const semesterProgress = totalChecklist > 0 ? Math.round((approvedChecklist / totalChecklist) * 100) : 0;

            return (
              <Card key={semester.id} className="rounded-[20px] border-none bg-white shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02),0_2px_4px_-1px_rgba(0,0,0,0.01)]">
                <div className="p-6 sm:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Semestre</p>
                      <h3 className="mt-0.5 text-xl font-black tracking-tight text-slate-900">Semestre {semester.semesterNumber}</h3>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge status={semester.factoryStatus} />
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500">
                        <CalendarDays className="h-3 w-3" /> Entrega: {formatDate(semester.factoryExpectedDate)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <div className="relative h-2 flex-1 overflow-hidden rounded-[100px] bg-slate-100">
                      <div className="absolute left-0 top-0 h-full rounded-[100px] bg-linear-to-r from-orange-400 to-orange-500" style={{ width: `${semesterProgress}%` }} />
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
                  </div>

                  {semester.observations && (
                    <p className="mt-4 rounded-[12px] bg-slate-50 p-3 text-xs font-medium text-slate-600">{semester.observations}</p>
                  )}

                  {subjects.length > 0 && (
                    <div className="mt-5">
                      <Link
                        to={`/projects/${project.id}/semesters/${semester.semesterNumber}`}
                        className="inline-flex items-center gap-1.5 rounded-2xl bg-linear-to-br from-orange-400 to-orange-500 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-orange-500/30 transition-all hover:from-orange-500 hover:to-orange-600"
                      >
                        <Eye className="h-3.5 w-3.5" /> Ver asignaturas
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
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
    </div>
  );
}

interface AddSemesterModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: VirtualizationProject;
  onAdd: (semester: VirtualizationProject['semesters'][0], subjects: VirtualizationProject['subjects']) => void;
}

interface FormSubject {
  id: string;
  name: string;
  topics: string[];
}

function AddSemesterModal({ isOpen, onClose, project, onAdd }: AddSemesterModalProps) {
  const existingNumbers = project.semesters.map((s) => s.semesterNumber);
  const availableSemesters = Array.from({ length: 10 }, (_, i) => i + 1).filter((n) => !existingNumbers.includes(n));

  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
  const [expectedDate, setExpectedDate] = useState(project.expectedDeliveryDate);
  const [subjects, setSubjects] = useState<FormSubject[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const addSubject = () => {
    setSubjects((prev) => [...prev, { id: `subj-${Date.now()}`, name: '', topics: [] }]);
  };

  const updateSubjectName = (id: string, name: string) => {
    setSubjects((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)));
  };

  const removeSubject = (id: string) => {
    setSubjects((prev) => prev.filter((s) => s.id !== id));
  };

  const addTopic = (subjectId: string) => {
    setSubjects((prev) =>
      prev.map((s) => (s.id === subjectId ? { ...s, topics: [...s.topics, ''] } : s)),
    );
  };

  const updateTopic = (subjectId: string, index: number, name: string) => {
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === subjectId
          ? { ...s, topics: s.topics.map((t, i) => (i === index ? name : t)) }
          : s,
      ),
    );
  };

  const removeTopic = (subjectId: string, index: number) => {
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === subjectId ? { ...s, topics: s.topics.filter((_, i) => i !== index) } : s,
      ),
    );
  };

  const suggestTopics = (subjectId: string) => {
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === subjectId
          ? { ...s, topics: ['Tema 1', 'Tema 2', 'Tema 3', 'Tema 4'] }
          : s,
      ),
    );
  };

  const validate = (): boolean => {
    const newErrors: string[] = [];
    if (!selectedSemester) newErrors.push('Selecciona un semestre.');
    if (!expectedDate) newErrors.push('Ingresa la fecha de entrega esperada del semestre.');
    if (subjects.length === 0) newErrors.push('Agrega al menos una asignatura.');
    subjects.forEach((subj) => {
      if (!subj.name.trim()) newErrors.push('Una asignatura no tiene nombre.');
      if (subj.topics.length === 0) newErrors.push(`La asignatura "${subj.name || '(sin nombre)'}" debe tener al menos un tema.`);
      subj.topics.forEach((t, i) => {
        if (!t.trim()) newErrors.push(`El tema ${i + 1} de "${subj.name}" no tiene nombre.`);
      });
    });
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !selectedSemester) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));

    const semester: VirtualizationProject['semesters'][0] = {
      id: `sem-${Date.now()}`,
      semesterNumber: selectedSemester,
      curriculumStatus: 'PENDIENTE' as ChecklistStatus,
      factoryStatus: 'PENDIENTE' as ChecklistStatus,
      factoryExpectedDate: expectedDate,
      continuationDate: '',
      observations: '',
    };

    const newSubjects: VirtualizationProject['subjects'] = subjects.map((subj) => ({
      id: `subj-${Date.now()}-${subj.id.slice(-4)}`,
      projectId: project.id,
      semesterNumber: selectedSemester,
      name: subj.name,
      status: 'PENDIENTE' as ChecklistStatus,
      progress: 0,
      checklist: buildSubjectChecklist(Date.now() + Math.random()),
      generalObservations: '',
      contentTopics: subj.topics,
    }));

    onAdd(semester, newSubjects);
    setSaving(false);
    setSelectedSemester(null);
    setSubjects([]);
    setErrors([]);
    onClose();
  };

  const handleClose = () => {
    setSelectedSemester(null);
    setExpectedDate(project.expectedDeliveryDate);
    setSubjects([]);
    setErrors([]);
    onClose();
  };

  const inputClass = 'w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 focus:outline-none transition-all';
  const labelClass = 'block mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Agregar semestre" description="Este semestre se agregará como una nueva entrega operativa. Define la fecha esperada de entrega y las asignaturas correspondientes." size="lg">
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
          <label className={labelClass}>Semestre disponible</label>
          <div className="grid grid-cols-5 gap-2">
            {availableSemesters.map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setSelectedSemester(num)}
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
          <p className="mt-1 text-[10px] font-medium text-slate-400">Esta fecha será la entrega operativa para este semestre.</p>
        </div>

        <div className="border-t border-slate-100" />

        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Asignaturas</p>
          <button type="button" onClick={addSubject} className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-600 hover:text-orange-700">
            <Plus className="h-3 w-3" /> Agregar asignatura
          </button>
        </div>

        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
          {subjects.map((subj, idx) => (
            <div key={subj.id} className="rounded-xl border border-orange-100/60 bg-orange-50/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">Asignatura {idx + 1}</span>
                {subjects.length > 1 && (
                  <button type="button" onClick={() => removeSubject(subj.id)} className="text-slate-400 hover:text-rose-500">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <input
                className={cn(inputClass, 'bg-white')}
                value={subj.name}
                onChange={(e) => updateSubjectName(subj.id, e.target.value)}
                placeholder="Nombre de la asignatura"
              />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Temas</p>
                  <div className="flex gap-2">
                    {subj.topics.length === 0 && (
                      <button type="button" onClick={() => suggestTopics(subj.id)} className="text-[10px] font-bold text-orange-600 hover:text-orange-700">
                        Sugerir 4
                      </button>
                    )}
                    <button type="button" onClick={() => addTopic(subj.id)} className="text-[10px] font-bold text-orange-600 hover:text-orange-700">
                      + Tema
                    </button>
                  </div>
                </div>
                {subj.topics.map((topic, tIdx) => (
                  <div key={tIdx} className="flex items-center gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-orange-100 text-[9px] font-bold text-orange-600">
                      {tIdx + 1}
                    </span>
                    <input
                      className={cn(inputClass, 'flex-1 py-2 px-3 text-xs')}
                      value={topic}
                      onChange={(e) => updateTopic(subj.id, tIdx, e.target.value)}
                      placeholder={`Tema ${tIdx + 1}`}
                    />
                    <button type="button" onClick={() => removeTopic(subj.id, tIdx)} className="shrink-0 text-slate-300 hover:text-rose-500">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {subjects.length === 0 && (
            <p className="text-center text-xs font-medium text-slate-400 py-4">Agrega al menos una asignatura para este semestre.</p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={handleClose}>Cancelar</Button>
          <Button disabled={saving} onClick={handleSubmit}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {saving ? 'Guardando...' : 'Agregar semestre'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
