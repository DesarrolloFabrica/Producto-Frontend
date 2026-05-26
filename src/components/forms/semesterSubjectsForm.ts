export const MAX_SUBJECTS_PER_SEMESTER = 30;

export interface SemesterFormSubject {
  id: string;
  name: string;
  topics: string[];
}

export function createEmptySemesterSubject(): SemesterFormSubject {
  return { id: `subj-${Date.now()}-${Math.random()}`, name: '', topics: [] };
}

export function createInitialSemesterSubjects(count = 1): SemesterFormSubject[] {
  return Array.from({ length: count }, () => createEmptySemesterSubject());
}

export function semesterSubjectHasContent(subject: SemesterFormSubject): boolean {
  return Boolean(subject.name.trim()) || subject.topics.some((topic) => topic.trim());
}

export function resizeSemesterSubjects(current: SemesterFormSubject[], targetCount: number): SemesterFormSubject[] {
  const safeCount = Math.min(MAX_SUBJECTS_PER_SEMESTER, Math.max(1, targetCount));
  if (safeCount <= current.length) {
    return current.slice(0, safeCount);
  }
  return [
    ...current,
    ...Array.from({ length: safeCount - current.length }, () => createEmptySemesterSubject()),
  ];
}
