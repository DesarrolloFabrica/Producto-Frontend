export const SUBJECT_TOPICS_MIN = 4;
export const SUBJECT_TOPICS_MAX = 6;
export const SUBJECT_TOPICS_SUGGESTED = 5;

export const SUBJECT_TOPICS_RANGE_MESSAGE =
  'Cada asignatura debe tener entre 4 y 6 temas. Recomendado: 5.';

export const SUBJECT_TOPICS_HELPER =
  'Recomendamos 5 temas por asignatura. Puedes usar mínimo 4 y máximo 6.';

export function buildSuggestedTopicNames(count = SUBJECT_TOPICS_SUGGESTED): string[] {
  return Array.from({ length: count }, (_, index) => `Tema ${index + 1}`);
}

/** Completa hasta 5 temas sin duplicar nombres ya existentes. */
export function buildSuggestedTopicsToReachFive(currentTopics: string[]): string[] {
  const result = [...currentTopics];
  let candidateIndex = 1;

  while (result.length < SUBJECT_TOPICS_SUGGESTED && result.length < SUBJECT_TOPICS_MAX) {
    const candidate = `Tema ${candidateIndex}`;
    const exists = result.some((topic) => topic.trim().toLowerCase() === candidate.toLowerCase());
    if (!exists) {
      result.push(candidate);
    }
    candidateIndex += 1;
    if (candidateIndex > 30) break;
  }

  return result;
}

export function validateSubjectTopicsCount(count: number): string | null {
  if (count < SUBJECT_TOPICS_MIN || count > SUBJECT_TOPICS_MAX) {
    return SUBJECT_TOPICS_RANGE_MESSAGE;
  }
  return null;
}

export function getSubjectTopicsCounterLabel(count: number): string {
  if (count < SUBJECT_TOPICS_MIN) return `${count}/${SUBJECT_TOPICS_MIN} mínimo`;
  if (count === SUBJECT_TOPICS_SUGGESTED) return '5 temas sugeridos';
  if (count >= SUBJECT_TOPICS_MAX) return `${count}/${SUBJECT_TOPICS_MAX} máximo`;
  return `${count} temas`;
}

export function canAddMoreTopics(count: number): boolean {
  return count < SUBJECT_TOPICS_MAX;
}

export function isSubjectTopicsFormValid(topics: string[]): boolean {
  const filled = topics.map((topic) => topic.trim()).filter(Boolean);
  return (
    filled.length >= SUBJECT_TOPICS_MIN &&
    filled.length <= SUBJECT_TOPICS_MAX &&
    topics.every((topic) => topic.trim().length > 0)
  );
}

export function validateSubjectTopicsList(
  topics: string[],
  subjectName?: string,
): string[] {
  const errors: string[] = [];
  const label = subjectName?.trim() ? `"${subjectName.trim()}"` : 'la asignatura';
  const nonEmpty = topics.map((topic) => topic.trim()).filter(Boolean);
  const rangeError = validateSubjectTopicsCount(nonEmpty.length);
  if (rangeError) {
    errors.push(`${rangeError} (${label})`);
  }
  topics.forEach((topic, index) => {
    if (!topic.trim()) {
      errors.push(`El tema ${index + 1} de ${label} no tiene nombre.`);
    }
  });
  return errors;
}
