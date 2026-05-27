import { useMemo, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react';
import { cn } from '../ui/tokens';
import {
  MAX_SUBJECTS_PER_SEMESTER,
  countIncompleteSemesterSubjects,
  isSemesterSubjectsStepValid,
  resizeSemesterSubjects,
  semesterSubjectHasContent,
  type SemesterFormSubject,
} from './semesterSubjectsForm';

export interface SemesterSubjectsWizardSemester {
  number: number;
  subjects: SemesterFormSubject[];
}

type SemesterSubjectsWizardProps = {
  semesters: SemesterSubjectsWizardSemester[];
  onSemestersChange: (semesters: SemesterSubjectsWizardSemester[]) => void;
  inputClass: string;
  /** Single-semester mode (AddSemesterModal): hides semester tabs */
  singleSemester?: boolean;
  singleSemesterLabel?: string;
};

export function SemesterSubjectsWizard({
  semesters,
  onSemestersChange,
  inputClass,
  singleSemester = false,
  singleSemesterLabel,
}: SemesterSubjectsWizardProps) {
  const sorted = useMemo(
    () => [...semesters].sort((a, b) => a.number - b.number),
    [semesters],
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const safeIndex = sorted.length === 0 ? 0 : Math.min(activeIndex, sorted.length - 1);
  const activeSemester = sorted[safeIndex];

  const totalSubjects = sorted.reduce((acc, sem) => acc + sem.subjects.length, 0);
  const incompleteSubjects = sorted.reduce(
    (acc, sem) => acc + countIncompleteSemesterSubjects(sem.subjects),
    0,
  );

  const updateSemester = (
    semesterNumber: number,
    updater: (sem: SemesterSubjectsWizardSemester) => SemesterSubjectsWizardSemester,
  ) => {
    onSemestersChange(
      semesters.map((sem) => (sem.number === semesterNumber ? updater(sem) : sem)),
    );
  };

  const changeSubjectCount = (semesterNumber: number, nextCount: number) => {
    const semester = semesters.find((sem) => sem.number === semesterNumber);
    if (!semester) return;

    const safeCount = Math.min(MAX_SUBJECTS_PER_SEMESTER, Math.max(1, nextCount));
    if (safeCount === semester.subjects.length) return;

    if (safeCount < semester.subjects.length) {
      const removed = semester.subjects.slice(safeCount);
      if (removed.some(semesterSubjectHasContent)) {
        const confirmed = window.confirm(
          `Vas a reducir a ${safeCount} asignatura(s) en el semestre ${semesterNumber}. Se eliminarán ${removed.length} asignatura(s) con información ingresada. ¿Continuar?`,
        );
        if (!confirmed) return;
      }
    }

    updateSemester(semesterNumber, (sem) => ({
      ...sem,
      subjects: resizeSemesterSubjects(sem.subjects, safeCount),
    }));
  };

  const updateSubjectName = (semesterNumber: number, subjectId: string, name: string) => {
    updateSemester(semesterNumber, (sem) => ({
      ...sem,
      subjects: sem.subjects.map((s) => (s.id === subjectId ? { ...s, name } : s)),
    }));
  };

  if (sorted.length === 0) {
    return null;
  }

  const activeValid = activeSemester ? isSemesterSubjectsStepValid(activeSemester.subjects) : false;

  return (
    <div className="space-y-4">
      {!singleSemester && sorted.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {sorted.map((sem, index) => {
            const complete = isSemesterSubjectsStepValid(sem.subjects);
            return (
              <button
                key={sem.number}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={cn(
                  'rounded-xl border px-3 py-2 text-xs font-bold transition-all',
                  safeIndex === index
                    ? 'border-orange-300 bg-orange-50 text-orange-700 ring-1 ring-orange-200'
                    : complete
                      ? 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      : 'border-amber-200 bg-amber-50/50 text-amber-800 hover:border-amber-300',
                )}
              >
                Semestre {sem.number}
                {!complete && <span className="ml-1 text-[10px] opacity-70">· incompleto</span>}
              </button>
            );
          })}
        </div>
      )}

      {activeSemester && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-bold text-slate-900">
                {singleSemesterLabel ?? `Semestre ${activeSemester.number}`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Número de asignaturas
              </span>
              <div className="flex items-center rounded-xl border border-slate-200 bg-white">
                <button
                  type="button"
                  onClick={() => changeSubjectCount(activeSemester.number, activeSemester.subjects.length - 1)}
                  disabled={activeSemester.subjects.length <= 1}
                  className="flex h-9 w-9 items-center justify-center text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Reducir asignaturas"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <input
                  type="number"
                  min={1}
                  max={MAX_SUBJECTS_PER_SEMESTER}
                  value={activeSemester.subjects.length}
                  onChange={(e) => {
                    const parsed = Number(e.target.value);
                    if (!Number.isFinite(parsed)) return;
                    changeSubjectCount(activeSemester.number, parsed);
                  }}
                  className="h-9 w-12 border-x border-slate-200 bg-white text-center text-sm font-bold text-slate-900 focus:outline-none"
                  aria-label={`Número de asignaturas del semestre ${activeSemester.number}`}
                />
                <button
                  type="button"
                  onClick={() => changeSubjectCount(activeSemester.number, activeSemester.subjects.length + 1)}
                  disabled={activeSemester.subjects.length >= MAX_SUBJECTS_PER_SEMESTER}
                  className="flex h-9 w-9 items-center justify-center text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Aumentar asignaturas"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4 p-4 max-h-[min(420px,50vh)] overflow-y-auto">
            {activeSemester.subjects.map((subj, subjIdx) => (
              <div
                key={subj.id}
                className="rounded-xl border border-orange-100/60 bg-orange-50/20 p-4 space-y-3"
              >
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">
                  Asignatura {subjIdx + 1}
                </span>
                <input
                  className={cn(inputClass, 'bg-white')}
                  value={subj.name}
                  onChange={(e) => updateSubjectName(activeSemester.number, subj.id, e.target.value)}
                  placeholder="Nombre de la asignatura"
                />
              </div>
            ))}
          </div>

          {!singleSemester && sorted.length > 1 && (
            <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-4 py-3 bg-slate-50/50">
              <button
                type="button"
                disabled={safeIndex <= 0}
                onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
                className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold text-slate-600 hover:bg-white disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Semestre anterior
              </button>
              <span className="text-[10px] font-bold text-slate-500">
                {safeIndex + 1} / {sorted.length}
                {!activeValid && ' · completa los nombres'}
              </span>
              <button
                type="button"
                disabled={safeIndex >= sorted.length - 1}
                onClick={() => setActiveIndex((i) => Math.min(sorted.length - 1, i + 1))}
                className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold text-slate-600 hover:bg-white disabled:opacity-40"
              >
                Siguiente semestre
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}

      <div className="rounded-xl bg-slate-50 px-4 py-3 flex flex-wrap gap-4 text-xs font-medium text-slate-600">
        <span>
          {sorted.length} semestre{sorted.length !== 1 ? 's' : ''}
        </span>
        <span>
          {totalSubjects} asignatura{totalSubjects !== 1 ? 's' : ''}
        </span>
        {incompleteSubjects > 0 && (
          <span className="text-amber-700 font-bold">
            {incompleteSubjects} sin nombre
          </span>
        )}
        {activeSemester && (
          <span className="text-slate-500">
            Actual: semestre {activeSemester.number}
          </span>
        )}
      </div>
    </div>
  );
}

/** Validates all semesters in a create-project flow */
export function areAllSemesterSubjectsValid(semesters: SemesterSubjectsWizardSemester[]): boolean {
  return (
    semesters.length > 0 &&
    semesters.every((sem) => sem.subjects.length >= 1 && isSemesterSubjectsStepValid(sem.subjects))
  );
}
