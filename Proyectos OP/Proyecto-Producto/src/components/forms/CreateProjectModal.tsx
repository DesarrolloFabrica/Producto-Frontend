import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Loader2, ChevronDown, ChevronUp, X, Check, FileText, Calendar } from 'lucide-react';
import { useOperations } from '../../features/operations/OperationsContext';
import { useToast } from '../ui/ToastProvider';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import type { Priority, VirtualizationProject, ChecklistItem, ChecklistStatus, Role, LinkResource } from '../../types/domain';
import { cn } from '../ui/tokens';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormSubject {
  id: string;
  name: string;
  topics: FormTopic[];
}

interface FormTopic {
  id: string;
  name: string;
}

interface FormSemester {
  number: number;
  subjects: FormSubject[];
}

const schools = [
  'Escuela de Ingenierias',
  'Escuela de Ciencias Administrativas',
  'Escuela de Comunicacion y Bellas Artes',
  'Escuela de Ciencias de la Salud',
  'Escuela de Derecho y Ciencias Politicas',
  'Escuela de Educacion',
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

export function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
  const { createProject } = useOperations();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const [school, setSchool] = useState('');
  const [program, setProgram] = useState('');
  const [modality, setModality] = useState('Virtual');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [productOwner, setProductOwner] = useState('');
  const [observations, setObservations] = useState('');

  const [hasSyllabus, setHasSyllabus] = useState<boolean | null>(null);
  const [syllabusLink, setSyllabusLink] = useState('');

  const [selectedSemesters, setSelectedSemesters] = useState<number[]>([]);
  const [semesters, setSemesters] = useState<FormSemester[]>([]);
  const [expandedSemesters, setExpandedSemesters] = useState<number[]>([]);

  const toggleSemester = (num: number) => {
    setSelectedSemesters((prev) => {
      if (prev.includes(num)) {
        setSemesters((s) => s.filter((sem) => sem.number !== num));
        setExpandedSemesters((e) => e.filter((n) => n !== num));
        return prev.filter((n) => n !== num);
      }
      return [...prev, num].sort((a, b) => a - b);
    });
  };

  const addSubject = (semesterNum: number) => {
    setSemesters((prev) =>
      prev.map((sem) =>
        sem.number === semesterNum
          ? {
              ...sem,
              subjects: [
                ...sem.subjects,
                { id: `subj-${Date.now()}-${Math.random()}`, name: '', topics: [] },
              ],
            }
          : sem,
      ),
    );
    if (!expandedSemesters.includes(semesterNum)) {
      setExpandedSemesters((e) => [...e, semesterNum]);
    }
  };

  const updateSubjectName = (semesterNum: number, subjectId: string, name: string) => {
    setSemesters((prev) =>
      prev.map((sem) =>
        sem.number === semesterNum
          ? {
              ...sem,
              subjects: sem.subjects.map((s) => (s.id === subjectId ? { ...s, name } : s)),
            }
          : sem,
      ),
    );
  };

  const removeSubject = (semesterNum: number, subjectId: string) => {
    setSemesters((prev) =>
      prev.map((sem) =>
        sem.number === semesterNum
          ? { ...sem, subjects: sem.subjects.filter((s) => s.id !== subjectId) }
          : sem,
      ),
    );
  };

  const addTopic = (semesterNum: number, subjectId: string) => {
    setSemesters((prev) =>
      prev.map((sem) =>
        sem.number === semesterNum
          ? {
              ...sem,
              subjects: sem.subjects.map((s) =>
                s.id === subjectId
                  ? {
                      ...s,
                      topics: [
                        ...s.topics,
                        { id: `topic-${Date.now()}-${Math.random()}`, name: '' },
                      ],
                    }
                  : s,
              ),
            }
          : sem,
      ),
    );
  };

  const updateTopicName = (semesterNum: number, subjectId: string, topicId: string, name: string) => {
    setSemesters((prev) =>
      prev.map((sem) =>
        sem.number === semesterNum
          ? {
              ...sem,
              subjects: sem.subjects.map((s) =>
                s.id === subjectId
                  ? {
                      ...s,
                      topics: s.topics.map((t) => (t.id === topicId ? { ...t, name } : t)),
                    }
                  : s,
              ),
            }
          : sem,
      ),
    );
  };

  const removeTopic = (semesterNum: number, subjectId: string, topicId: string) => {
    setSemesters((prev) =>
      prev.map((sem) =>
        sem.number === semesterNum
          ? {
              ...sem,
              subjects: sem.subjects.map((s) =>
                s.id === subjectId
                  ? { ...s, topics: s.topics.filter((t) => t.id !== topicId) }
                  : s,
              ),
            }
          : sem,
      ),
    );
  };

  const toggleExpandSemester = (num: number) => {
    setExpandedSemesters((prev) =>
      prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num],
    );
  };

  const validate = (): boolean => {
    const newErrors: string[] = [];
    if (!school.trim()) newErrors.push('Selecciona una escuela.');
    if (!program.trim()) newErrors.push('Ingresa el nombre del programa.');
    if (!expectedDeliveryDate) newErrors.push('Selecciona la fecha de entrega esperada por Fábrica.');
    if (!productOwner.trim()) newErrors.push('Ingresa el responsable Product.');
    if (hasSyllabus === null) newErrors.push('Indica si la solicitud tiene syllabus.');
    if (hasSyllabus === true && !syllabusLink.trim()) newErrors.push('Ingresa el link del syllabus.');
    if (selectedSemesters.length === 0) newErrors.push('Selecciona al menos un semestre.');

    semesters.forEach((sem) => {
      if (sem.subjects.length === 0) {
        newErrors.push(`El semestre ${sem.number} debe tener al menos una asignatura.`);
      }
      sem.subjects.forEach((subj) => {
        if (!subj.name.trim()) {
          newErrors.push(`Una asignatura del semestre ${sem.number} no tiene nombre.`);
        }
        if (subj.topics.length === 0) {
          newErrors.push(`La asignatura "${subj.name || '(sin nombre)'}" del semestre ${sem.number} debe tener al menos un tema.`);
        }
        subj.topics.forEach((topic) => {
          if (!topic.name.trim()) {
            newErrors.push(`Un tema de la asignatura "${subj.name}" del semestre ${sem.number} no tiene nombre.`);
          }
        });
      });
    });

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));

    const allSubjects: VirtualizationProject['subjects'] = [];
    const semesterData: VirtualizationProject['semesters'] = [];
    let linkIndex = 0;

    semesters.forEach((sem) => {
      semesterData.push({
        id: `sem-${Date.now()}-${sem.number}`,
        semesterNumber: sem.number,
        curriculumStatus: 'PENDIENTE' as ChecklistStatus,
        factoryStatus: 'PENDIENTE' as ChecklistStatus,
        factoryExpectedDate: expectedDeliveryDate,
        continuationDate: '',
        observations: '',
      });

      sem.subjects.forEach((subj) => {
        const subjectId = `subj-${Date.now()}-${sem.number}-${subj.id.slice(-4)}`;
        const checklist = buildSubjectChecklist(Date.now() + linkIndex++);

        const contentTopics = subj.topics.map((t) => t.name);

        allSubjects.push({
          id: subjectId,
          projectId: '',
          semesterNumber: sem.number,
          name: subj.name,
          status: 'PENDIENTE' as ChecklistStatus,
          progress: 0,
          checklist,
          generalObservations: '',
          contentTopics,
        });
      });
    });

    const links: LinkResource[] = [];
    if (hasSyllabus && syllabusLink.trim()) {
      links.push({
        id: `lnk-${Date.now()}`,
        title: 'Syllabus del programa',
        url: syllabusLink,
        type: 'SYLLABUS',
        uploadedBy: 'PRODUCT' as Role,
        createdAt: new Date().toISOString(),
      });
    }

    const projectId = `vp-${Date.now()}`;
    allSubjects.forEach((s) => { s.projectId = projectId; });

    const newProject: VirtualizationProject = {
      id: projectId,
      school,
      program,
      modality,
      requestType: 'Virtualizacion completa',
      priority,
      status: 'READY_FOR_PRODUCTION',
      progress: 0,
      createdAt: new Date().toISOString(),
      expectedDeliveryDate,
      productOwner,
      factoryOwner: 'Por asignar',
      observations,
      semesters: semesterData,
      subjects: allSubjects,
      links,
    };

    createProject(newProject);
    showToast('Solicitud creada correctamente');
    setSaving(false);

    setSchool('');
    setProgram('');
    setModality('Virtual');
    setPriority('MEDIUM');
    setExpectedDeliveryDate('');
    setProductOwner('');
    setObservations('');
    setHasSyllabus(null);
    setSyllabusLink('');
    setSelectedSemesters([]);
    setSemesters([]);
    setExpandedSemesters([]);
    setErrors([]);

    onClose();
  };

  const inputClass = 'w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 focus:outline-none transition-all';
  const labelClass = 'block mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400';

  const totalSubjects = semesters.reduce((acc, sem) => acc + sem.subjects.length, 0);
  const totalTopics = semesters.reduce((acc, sem) => acc + sem.subjects.reduce((a, s) => a + s.topics.length, 0), 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Crear Solicitud" description="Registra una nueva solicitud de virtualizacion académica." size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.length > 0 && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <p className="text-xs font-bold text-rose-700">Corrige los siguientes errores antes de crear la solicitud:</p>
            <ul className="mt-2 space-y-1">
              {errors.map((err, i) => (
                <li key={i} className="text-[11px] font-medium text-rose-600">• {err}</li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Paso 1</p>
          <h3 className="text-sm font-black text-slate-950">Información general</h3>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass}>Escuela</label>
            <select className={inputClass} value={school} onChange={(e) => setSchool(e.target.value)}>
              <option value="">Seleccionar escuela...</option>
              {schools.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Programa</label>
            <input required className={inputClass} value={program} onChange={(e) => setProgram(e.target.value)} placeholder="Ej: Ingenieria de Sistemas" />
          </div>
          <div>
            <label className={labelClass}>Modalidad</label>
            <select className={inputClass} value={modality} onChange={(e) => setModality(e.target.value)}>
              <option>Virtual</option>
              <option>Híbrida</option>
              <option>Presencial</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Prioridad</label>
            <select className={inputClass} value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
              <option value="LOW">Baja</option>
              <option value="MEDIUM">Media</option>
              <option value="HIGH">Alta</option>
              <option value="CRITICAL">Crítica</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Fecha Entrega Esperada por Fábrica</label>
            <input required type="date" className={cn(inputClass, 'border-orange-200 bg-orange-50/30')} value={expectedDeliveryDate} onChange={(e) => setExpectedDeliveryDate(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Responsable Product</label>
            <input required className={inputClass} value={productOwner} onChange={(e) => setProductOwner(e.target.value)} placeholder="Nombre completo" />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Observaciones Iniciales <span className="text-slate-300 font-normal">(opcional)</span></label>
            <textarea className={cn(inputClass, 'min-h-[70px] resize-none')} value={observations} onChange={(e) => setObservations(e.target.value)} placeholder="Contexto o detalles importantes..." />
          </div>
        </div>

        <div className="border-t border-slate-100" />

        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Paso 2</p>
          <h3 className="text-sm font-black text-slate-950">Syllabus</h3>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setHasSyllabus(true)}
            className={cn(
              'flex-1 rounded-2xl border p-4 text-left transition-all',
              hasSyllabus === true
                ? 'border-orange-300 bg-orange-50 ring-2 ring-orange-100'
                : 'border-slate-200 bg-white hover:border-slate-300',
            )}
          >
            <div className="flex items-center gap-2">
              <FileText className={cn('h-4 w-4', hasSyllabus === true ? 'text-orange-500' : 'text-slate-400')} />
              <span className="text-sm font-bold text-slate-900">Con syllabus</span>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setHasSyllabus(false)}
            className={cn(
              'flex-1 rounded-2xl border p-4 text-left transition-all',
              hasSyllabus === false
                ? 'border-orange-300 bg-orange-50 ring-2 ring-orange-100'
                : 'border-slate-200 bg-white hover:border-slate-300',
            )}
          >
            <div className="flex items-center gap-2">
              <X className={cn('h-4 w-4', hasSyllabus === false ? 'text-orange-500' : 'text-slate-400')} />
              <span className="text-sm font-bold text-slate-900">Sin syllabus</span>
            </div>
          </button>
        </div>

        {hasSyllabus === true && (
          <div>
            <label className={labelClass}>Link del Syllabus <span className="text-rose-500">*</span></label>
            <input
              required
              className={cn(inputClass, 'border-orange-200')}
              value={syllabusLink}
              onChange={(e) => setSyllabusLink(e.target.value)}
              placeholder="https://drive.google.com/..."
            />
          </div>
        )}

        {hasSyllabus === false && (
          <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500">Se registrará como "Sin syllabus". Podrás agregarlo más adelante.</p>
        )}

        <div className="border-t border-slate-100" />

        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Paso 3</p>
          <h3 className="text-sm font-black text-slate-950">Semestres a virtualizar</h3>
          <p className="mt-1 text-[11px] font-medium text-slate-500">Selecciona los semestres que se incluirán en esta solicitud.</p>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => {
                toggleSemester(num);
                if (!semesters.find((s) => s.number === num)) {
                  setSemesters((prev) => [...prev, { number: num, subjects: [] }]);
                }
              }}
              className={cn(
                'flex items-center justify-center gap-1 rounded-xl border py-3 text-xs font-bold transition-all',
                selectedSemesters.includes(num)
                  ? 'border-orange-300 bg-orange-50 text-orange-700 ring-1 ring-orange-200'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300',
              )}
            >
              {selectedSemesters.includes(num) && <Check className="h-3 w-3" />}
              {num}
            </button>
          ))}
        </div>

        <AnimatePresence>
          {semesters.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-3">
                {semesters.map((sem) => {
                  const isExpanded = expandedSemesters.includes(sem.number);
                  return (
                    <div key={sem.number} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                      <button
                        type="button"
                        onClick={() => toggleExpandSemester(sem.number)}
                        className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-slate-50"
                      >
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-orange-500" />
                          <span className="text-sm font-bold text-slate-900">Semestre {sem.number}</span>
                          <span className="text-[10px] font-medium text-slate-400">
                            {sem.subjects.length} asignatura{sem.subjects.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                      </button>

                      {isExpanded && (
                        <div className="border-t border-slate-100 p-4 space-y-4">
                          {sem.subjects.map((subj, subjIdx) => (
                            <div key={subj.id} className="rounded-xl border border-orange-100/60 bg-orange-50/20 p-4 space-y-3">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">Asignatura {subjIdx + 1}</span>
                                {sem.subjects.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeSubject(sem.number, subj.id)}
                                    className="text-slate-400 hover:text-rose-500 transition-colors"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>

                              <input
                                className={cn(inputClass, 'bg-white')}
                                value={subj.name}
                                onChange={(e) => updateSubjectName(sem.number, subj.id, e.target.value)}
                                placeholder="Nombre de la asignatura"
                              />

                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Temas / Gránulos</p>
                                  <button
                                    type="button"
                                    onClick={() => addTopic(sem.number, subj.id)}
                                    className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-600 hover:text-orange-700"
                                  >
                                    <Plus className="h-3 w-3" /> Agregar tema
                                  </button>
                                </div>

                                {subj.topics.length === 0 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const defaultTopics = ['Tema 1', 'Tema 2', 'Tema 3', 'Tema 4'];
                                      defaultTopics.forEach((name, idx) => {
                                        const topicId = `topic-${Date.now()}-${idx}`;
                                        setSemesters((prev) =>
                                          prev.map((s) =>
                                            s.number === sem.number
                                              ? {
                                                  ...s,
                                                  subjects: s.subjects.map((sub) =>
                                                    sub.id === subj.id
                                                      ? {
                                                          ...sub,
                                                          topics: [
                                                            ...sub.topics,
                                                            { id: topicId, name },
                                                          ],
                                                        }
                                                      : sub,
                                                  ),
                                                }
                                              : s,
                                          ),
                                        );
                                      });
                                    }}
                                    className="w-full rounded-xl border border-dashed border-slate-200 bg-slate-50 py-2 text-[10px] font-bold text-slate-400 hover:border-orange-200 hover:text-orange-500 transition-all"
                                  >
                                    Sugerir 4 temas base
                                  </button>
                                )}

                                <div className="space-y-2">
                                  {subj.topics.map((topic, topicIdx) => (
                                    <div key={topic.id} className="flex items-center gap-2">
                                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-orange-100 text-[9px] font-bold text-orange-600">
                                        {topicIdx + 1}
                                      </span>
                                      <input
                                        className={cn(inputClass, 'flex-1 py-2 px-3 text-xs')}
                                        value={topic.name}
                                        onChange={(e) => updateTopicName(sem.number, subj.id, topic.id, e.target.value)}
                                        placeholder={`Nombre del tema ${topicIdx + 1}`}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => removeTopic(sem.number, subj.id, topic.id)}
                                        className="shrink-0 text-slate-300 hover:text-rose-500 transition-colors"
                                      >
                                        <X className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={() => addSubject(sem.number)}
                            className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-orange-200 bg-orange-50/30 py-3 text-xs font-bold text-orange-600 hover:border-orange-300 hover:bg-orange-50/50 transition-all"
                          >
                            <Plus className="h-3.5 w-3.5" /> Agregar asignatura
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {semesters.length > 0 && (
          <div className="rounded-xl bg-slate-50 px-4 py-3 flex flex-wrap gap-4 text-xs font-medium text-slate-600">
            <span>{selectedSemesters.length} semestre{selectedSemesters.length !== 1 ? 's' : ''}</span>
            <span>{totalSubjects} asignatura{totalSubjects !== 1 ? 's' : ''}</span>
            <span>{totalTopics} tema{totalTopics !== 1 ? 's' : ''}</span>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <motion.button type="submit" disabled={saving} whileHover={!saving ? { scale: 1.02 } : {}} whileTap={!saving ? { scale: 0.98 } : {}} className={cn('flex items-center gap-2 py-3 px-6 rounded-2xl text-sm font-black uppercase tracking-widest text-white transition-all', saving ? 'bg-slate-300 cursor-not-allowed' : 'liquid-button')}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {saving ? 'Creando...' : 'Crear Solicitud'}
          </motion.button>
        </div>
      </form>
    </Modal>
  );
}
