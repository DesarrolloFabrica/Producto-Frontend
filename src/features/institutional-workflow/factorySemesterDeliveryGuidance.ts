import type { InstitutionalOperationalState } from '../../types/domain';
import { factorySemesterOperationsPath, semesterHubPath } from './institutionalNavigation';
import { isSemesterFactoryProductionActive } from './institutionalCopy';
import { isReducedInstitutionalFlow } from '../../config/env';

export type FactorySemesterDeliveryVariant = 'pending_subjects' | 'ready_to_deliver';

export interface FactorySemesterDeliveryGuidance {
  variant: FactorySemesterDeliveryVariant;
  title: string;
  message: string;
  buttonLabel: string;
  /** Ruta del CTA principal */
  href: string;
  subjectsReady: number;
  subjectsTotal: number;
  subjectsPending: number;
}

export function countFactoryReadySubjects<T extends { semesterNumber: number; factoryProductionStatus?: string | null; progress?: number }>(
  subjects: T[],
  semesterNumber: number,
  isComplete: (subject: T) => boolean,
): { ready: number; total: number } {
  const scoped = subjects.filter((s) => s.semesterNumber === semesterNumber);
  return {
    ready: scoped.filter(isComplete).length,
    total: scoped.length,
  };
}

export function resolveFactorySemesterDeliveryGuidance(params: {
  institutionalFlowActive: boolean;
  semesterOperationalState?: InstitutionalOperationalState | null;
  subjectsReady: number;
  subjectsTotal: number;
  deliverReady: boolean;
  projectId: string;
  semesterNumber: number;
}): FactorySemesterDeliveryGuidance | null {
  const {
    institutionalFlowActive,
    semesterOperationalState,
    subjectsReady,
    subjectsTotal,
    deliverReady,
    projectId,
    semesterNumber,
  } = params;

  if (!institutionalFlowActive || subjectsTotal === 0) return null;
  if (!isSemesterFactoryProductionActive(semesterOperationalState)) return null;

  const subjectsPending = Math.max(0, subjectsTotal - subjectsReady);
  const operationsPath = factorySemesterOperationsPath(projectId, semesterNumber);
  const subjectsPath = semesterHubPath(projectId, semesterNumber);
  const reducedFlow = isReducedInstitutionalFlow();

  if (deliverReady && subjectsPending === 0) {
    return {
      variant: 'ready_to_deliver',
      title: 'Paquete listo para entregar',
      message: reducedFlow
        ? `Las ${subjectsTotal} asignaturas del semestre tienen producción interna completa. Confirme la entrega en Flujo operacional para habilitar la revisión de Product.`
        : `Las ${subjectsTotal} asignaturas del semestre tienen producción interna completa. Confirme la entrega en Flujo operacional para que Planeación valide el paquete y avance el pipeline.`,
      buttonLabel: 'Confirmar entrega del semestre',
      href: operationsPath,
      subjectsReady,
      subjectsTotal,
      subjectsPending: 0,
    };
  }

  if (subjectsReady > 0) {
    const pendingLabel =
      subjectsPending === 1 ? '1 asignatura pendiente' : `${subjectsPending} asignaturas pendientes`;
    return {
      variant: 'pending_subjects',
      title:
        subjectsReady === subjectsTotal
          ? 'Complete la confirmación de entrega'
          : 'Producción del semestre en curso',
      message:
        subjectsReady === subjectsTotal
          ? 'Todas las asignaturas están completas. Revise el paquete y confirme la entrega en Flujo operacional cuando esté listo.'
          : `${subjectsReady} de ${subjectsTotal} asignaturas con producción interna completa. Complete ${pendingLabel} y luego confirme la entrega del semestre en Flujo operacional.`,
      buttonLabel:
        subjectsPending > 0 ? `Ver asignaturas (${pendingLabel})` : 'Ir a Flujo operacional',
      href: subjectsPending > 0 ? subjectsPath : operationsPath,
      subjectsReady,
      subjectsTotal,
      subjectsPending,
    };
  }

  return null;
}
