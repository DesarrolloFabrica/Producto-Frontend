import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Loader2, Check, FileText, X, Calendar } from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';
import type { CreateProjectFormInput } from '../../features/operations/apiMappers';
import { getApiErrorMessage } from '../../features/operations/apiMappers';
import { useOperations } from '../../features/operations/OperationsContext';
import { useToast } from '../ui/ToastProvider';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import {
  SemesterSubjectsWizard,
  areAllSemesterSubjectsValid,
  type SemesterSubjectsWizardSemester,
} from './SemesterSubjectsWizard';
import { createEmptySemesterSubject, type SemesterFormSubject } from './semesterSubjectsForm';
import type {
  VirtualizationProject,
  ChecklistItem,
  ChecklistStatus,
  Role,
  LinkResource,
  TopicChecklist,
  SubjectMatterExpertType,
} from '../../types/domain';
import { cn } from '../ui/tokens';
import {
  addBusinessDays,
  FACTORY_DELIVERY_BUSINESS_DAYS,
  toDateInputValue,
} from '../../utils/businessDays';
import { formatDate } from '../../utils/formatters';

const DEFAULT_PRIORITY = 'MEDIUM' as const;

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormSemester extends SemesterSubjectsWizardSemester {
  number: number;
  subjects: SemesterFormSubject[];
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

function createInitialSemester(number: number): FormSemester {
  return { number, subjects: [createEmptySemesterSubject()] };
}

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

export function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
  const { createProject, createProjectFromApi, backendEnabled } = useOperations();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const [school, setSchool] = useState('');
  const [program, setProgram] = useState('');
  const [modality, setModality] = useState('Virtual');
  const [subjectMatterExpertType, setSubjectMatterExpertType] =
    useState<SubjectMatterExpertType>('INTERNAL');
  const [productOwner, setProductOwner] = useState(user?.name ?? '');

  useEffect(() => {
    if (isOpen && user?.name && !productOwner.trim()) {
      setProductOwner(user.name);
    }
  }, [isOpen, user?.name, productOwner]);

  const [observations, setObservations] = useState('');
  const [hasSyllabus, setHasSyllabus] = useState<boolean | null>(null);

  const isInternalExpert = subjectMatterExpertType === 'INTERNAL';
  const isExternalExpert = subjectMatterExpertType === 'EXTERNAL';
  const previewDeliveryDate = useMemo(() => {
    if (!isInternalExpert) return '';
    return toDateInputValue(addBusinessDays(new Date(), FACTORY_DELIVERY_BUSINESS_DAYS));
  }, [isInternalExpert]);
  const [syllabusLink, setSyllabusLink] = useState('');
  const [selectedSemesters, setSelectedSemesters] = useState<number[]>([]);
  const [semesters, setSemesters] = useState<FormSemester[]>([]);

  const sortedSemesters = [...semesters].sort((a, b) => a.number - b.number);

  const toggleSemester = (num: number) => {
    if (selectedSemesters.includes(num)) {
      setSelectedSemesters((prev) => prev.filter((n) => n !== num));
      setSemesters((prev) => prev.filter((sem) => sem.number !== num));
      return;
    }

    setSelectedSemesters((prev) => [...prev, num].sort((a, b) => a - b));
    setSemesters((prev) => {
      if (prev.some((sem) => sem.number === num)) return prev;
      return [...prev, createInitialSemester(num)].sort((a, b) => a.number - b.number);
    });
  };

  const isFormSemestersValid =
    selectedSemesters.length > 0 &&
    semesters.length === selectedSemesters.length &&
    areAllSemesterSubjectsValid(semesters);

  const validate = (): boolean => {
    const newErrors: string[] = [];
    if (!school.trim()) newErrors.push('Selecciona una escuela.');
    if (!program.trim()) newErrors.push('Ingresa el nombre del programa.');
    if (!productOwner.trim()) newErrors.push('Ingresa el responsable Product.');
    if (hasSyllabus === null) newErrors.push('Indica si la solicitud tiene syllabus.');
    if (hasSyllabus === true && !syllabusLink.trim()) newErrors.push('Ingresa el link del syllabus.');
    if (selectedSemesters.length === 0) newErrors.push('Selecciona al menos un semestre.');

    semesters.forEach((sem) => {
      if (sem.subjects.length < 1) {
        newErrors.push(`El semestre ${sem.number} debe tener al menos una asignatura.`);
      }
      sem.subjects.forEach((subj, index) => {
        if (!subj.name.trim()) {
          newErrors.push(`La asignatura ${index + 1} del semestre ${sem.number} no tiene nombre.`);
        }
      });
    });

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setErrors([]);

    try {
      if (backendEnabled) {
        const formInput: CreateProjectFormInput = {
          school,
          program,
          modality,
          subjectMatterExpertType,
          priority: DEFAULT_PRIORITY,
          observations: observations.trim() || undefined,
          hasSyllabus,
          syllabusUrl: syllabusLink.trim() || undefined,
          semesters: sortedSemesters.map((sem) => ({
            number: sem.number,
            subjects: sem.subjects.map((subj) => ({
              name: subj.name.trim(),
              topics: [],
            })),
          })),
        };

        await createProjectFromApi(formInput);
        showToast('Solicitud creada correctamente');
        resetForm();
        onClose();
        return;
      }

      const allSubjects: VirtualizationProject['subjects'] = [];
      const semesterData: VirtualizationProject['semesters'] = [];
      let linkIndex = 0;

      sortedSemesters.forEach((sem) => {
        semesterData.push({
          id: `sem-${Date.now()}-${sem.number}`,
          semesterNumber: sem.number,
          status: 'PENDING',
          curriculumStatus: 'PENDIENTE' as ChecklistStatus,
          factoryStatus: 'PENDIENTE' as ChecklistStatus,
          factoryExpectedDate: isExternalExpert ? '' : previewDeliveryDate,
          continuationDate: '',
          observations: '',
        });

        sem.subjects.forEach((subj) => {
          const subjectId = `subj-${Date.now()}-${sem.number}-${subj.id.slice(-4)}`;
          const checklist = buildSubjectChecklist(Date.now() + linkIndex++);
          const contentTopics: string[] = [];
          const topicChecklists: TopicChecklist[] = [];

          allSubjects.push({
            id: subjectId,
            projectId: '',
            semesterNumber: sem.number,
            name: subj.name.trim(),
            status: 'PENDING',
            progress: 0,
            checklist,
            generalObservations: '',
            contentTopics,
            topicChecklists,
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
      allSubjects.forEach((s) => {
        s.projectId = projectId;
      });

      const newProject: VirtualizationProject = {
        id: projectId,
        school,
        program,
        modality,
        requestType: 'Virtualizacion completa',
        priority: DEFAULT_PRIORITY,
        status: isExternalExpert ? 'PENDING_SUBJECT_MATTER_EXPERT' : 'READY_FOR_PRODUCTION',
        progress: 0,
        createdAt: new Date().toISOString(),
        expectedDeliveryDate: previewDeliveryDate,
        subjectMatterExpertType,
        subjectMatterExpertStatus: isExternalExpert ? 'PENDING' : 'READY',
        activatedAt: isInternalExpert ? new Date().toISOString() : null,
        expertConfirmedAt: isInternalExpert ? new Date().toISOString() : null,
        productOwner,
        factoryOwner: 'Por asignar',
        observations,
        semesters: semesterData,
        subjects: allSubjects,
        links,
      };

      createProject(newProject);
      showToast('Solicitud creada correctamente');
      resetForm();
      onClose();
    } catch (error) {
      setErrors([getApiErrorMessage(error)]);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setSchool('');
    setProgram('');
    setModality('Virtual');
    setSubjectMatterExpertType('INTERNAL');
    setProductOwner(user?.name ?? '');
    setObservations('');
    setHasSyllabus(null);
    setSyllabusLink('');
    setSelectedSemesters([]);
    setSemesters([]);
    setErrors([]);
  };

  const inputClass =
    'w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 focus:outline-none transition-all';
  const labelClass = 'block mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Crear Solicitud"
      description="Registra una nueva solicitud de virtualizacion académica."
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.length > 0 && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <p className="text-xs font-bold text-rose-700">
              Corrige los siguientes errores antes de crear la solicitud:
            </p>
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
          <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Paso 1</p>
          <h3 className="text-sm font-black text-slate-950">Información general</h3>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass}>Escuela</label>
            <select className={inputClass} value={school} onChange={(e) => setSchool(e.target.value)}>
              <option value="">Seleccionar escuela...</option>
              {schools.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Programa</label>
            <input
              required
              className={inputClass}
              value={program}
              onChange={(e) => setProgram(e.target.value)}
              placeholder="Ej: Ingenieria de Sistemas"
            />
          </div>
          <div>
            <label className={labelClass}>Modalidad</label>
            <select className={inputClass} value={modality} onChange={(e) => setModality(e.target.value)}>
              <option>Virtual</option>
              <option>Híbrida</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Experto temático</label>
            <div className="flex gap-2">
              {(['INTERNAL', 'EXTERNAL'] as const).map((type) => {
                const selected = subjectMatterExpertType === type;
                const label = type === 'INTERNAL' ? 'Interno' : 'Externo';
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSubjectMatterExpertType(type)}
                    className={cn(
                      'flex-1 rounded-2xl border px-4 py-3 text-sm font-bold transition-all',
                      selected
                        ? 'border-orange-300 bg-orange-50 text-orange-700 ring-2 ring-orange-100'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {isInternalExpert ? (
              <p className="mt-1.5 text-[11px] font-medium text-slate-500">
                La solicitud se activará inmediatamente.
              </p>
            ) : (
              <p className="mt-1.5 rounded-xl bg-violet-50 px-3 py-2 text-[11px] font-medium leading-relaxed text-violet-800">
                La solicitud quedará pausada hasta confirmar el experto temático. Los{' '}
                {FACTORY_DELIVERY_BUSINESS_DAYS} días hábiles empezarán a contar desde la activación.
              </p>
            )}
          </div>
          <div>
            <label className={labelClass}>Fecha Entrega Esperada por Fábrica</label>
            <div
              className={cn(
                inputClass,
                'flex items-center gap-2 border-orange-200 bg-orange-50/30 text-slate-700',
              )}
              aria-live="polite"
            >
              <Calendar className="h-4 w-4 shrink-0 text-orange-500" />
              {isInternalExpert && previewDeliveryDate ? (
                <span className="font-bold">
                  Entrega estimada: {formatDate(previewDeliveryDate)}
                </span>
              ) : isExternalExpert ? (
                <span className="font-bold text-violet-700">Pendiente de activación</span>
              ) : (
                <span className="font-medium text-slate-400">—</span>
              )}
            </div>
            <p className="mt-1.5 text-[11px] font-medium leading-relaxed text-slate-500">
              Se calcula automáticamente a {FACTORY_DELIVERY_BUSINESS_DAYS} días hábiles desde la
              activación de la solicitud.
            </p>
          </div>
          <div>
            <label className={labelClass}>Responsable Product</label>
            <input
              required
              className={inputClass}
              value={productOwner}
              onChange={(e) => setProductOwner(e.target.value)}
              placeholder="Nombre completo"
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>
              Observaciones Iniciales <span className="text-slate-300 font-normal">(opcional)</span>
            </label>
            <textarea
              className={cn(inputClass, 'min-h-[70px] resize-none')}
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Contexto o detalles importantes..."
            />
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
            <label className={labelClass}>
              Link del Syllabus <span className="text-rose-500">*</span>
            </label>
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
          <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500">
            Se registrará como &quot;Sin syllabus&quot;. Podrás agregarlo más adelante.
          </p>
        )}

        <div className="border-t border-slate-100" />

        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Paso 3</p>
          <h3 className="text-sm font-black text-slate-950">Semestres a virtualizar</h3>
          <p className="mt-1 text-[11px] font-medium text-slate-500">
            Selecciona los semestres, define cuántas asignaturas tiene cada uno y completa el nombre de cada una.
          </p>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => toggleSemester(num)}
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
          {sortedSemesters.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <SemesterSubjectsWizard
                semesters={sortedSemesters}
                onSemestersChange={setSemesters}
                inputClass={inputClass}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <motion.button
            type="submit"
            disabled={saving || !isFormSemestersValid}
            whileHover={!saving && isFormSemestersValid ? { scale: 1.02 } : {}}
            whileTap={!saving && isFormSemestersValid ? { scale: 0.98 } : {}}
            className={cn(
              'flex items-center gap-2 py-3 px-6 rounded-2xl text-sm font-black uppercase tracking-widest text-white transition-all',
              saving || !isFormSemestersValid
                ? 'bg-slate-300 cursor-not-allowed'
                : 'liquid-button',
            )}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {saving ? 'Creando...' : 'Crear Solicitud'}
          </motion.button>
        </div>
      </form>
    </Modal>
  );
}
