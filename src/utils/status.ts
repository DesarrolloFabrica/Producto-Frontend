import type { ChecklistStatus, Priority, ProjectStatus, SemesterStatus, SubjectStatus } from '../types/domain';

export const projectStatusLabels: Record<ProjectStatus, string> = {
  PENDING_SYLLABUS: 'Pend. syllabus',
  PENDING_SUBJECT_MATTER_EXPERT: 'Pend. experto',
  READY_FOR_PRODUCTION: 'Listo fabrica',
  IN_PRODUCTION: 'En produccion',
  IN_REVIEW: 'En revision',
  DELIVERED_TO_LMS: 'Entregado LMS',
  FEEDBACK_PENDING: 'Obs. pendientes',
  CLOSED: 'Finalizada',
};

export const subjectStatusLabels: Record<SubjectStatus, string> = {
  PENDING: 'Pendiente',
  IN_PRODUCTION: 'En produccion',
  SUBMITTED: 'Entregada',
  IN_REVIEW: 'En revision',
  CHANGES_REQUESTED: 'Correcciones',
  APPROVED: 'Aprobada',
  DELIVERED: 'Entregada LMS',
};

export const semesterStatusLabels: Record<SemesterStatus, string> = {
  PENDING: 'Pendiente',
  IN_PRODUCTION: 'En produccion',
  PARTIAL_REVIEW: 'Revision parcial',
  CHANGES_REQUESTED: 'Correcciones',
  APPROVED: 'Aprobado',
  DELIVERED: 'Entregado',
};

export const checklistStatusLabels: Record<ChecklistStatus, string> = {
  NO_EXISTE: 'No existe',
  PENDIENTE: 'Pendiente',
  EN_PRODUCCION: 'En produccion',
  ENTREGADO: 'Entregado',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
};

export const priorityLabels: Record<Priority, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  CRITICAL: 'Critica',
};

export const projectStatusTone: Record<ProjectStatus, string> = {
  PENDING_SYLLABUS: 'bg-amber-50 text-amber-600 border-amber-100',
  PENDING_SUBJECT_MATTER_EXPERT: 'bg-violet-50 text-violet-700 border-violet-100',
  READY_FOR_PRODUCTION: 'bg-blue-50 text-blue-600 border-blue-100',
  IN_PRODUCTION: 'bg-orange-50 text-orange-600 border-orange-100',
  IN_REVIEW: 'bg-purple-50 text-purple-600 border-purple-100',
  DELIVERED_TO_LMS: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  FEEDBACK_PENDING: 'bg-rose-50 text-rose-600 border-rose-100',
  CLOSED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export const subjectStatusTone: Record<SubjectStatus, string> = {
  PENDING: 'bg-slate-100 text-slate-600 border-slate-200',
  IN_PRODUCTION: 'bg-orange-50 text-orange-600 border-orange-100',
  SUBMITTED: 'bg-blue-50 text-blue-600 border-blue-100',
  IN_REVIEW: 'bg-purple-50 text-purple-600 border-purple-100',
  CHANGES_REQUESTED: 'bg-rose-50 text-rose-600 border-rose-100',
  APPROVED: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  DELIVERED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export const semesterStatusTone: Record<SemesterStatus, string> = {
  PENDING: 'bg-slate-100 text-slate-600 border-slate-200',
  IN_PRODUCTION: 'bg-orange-50 text-orange-600 border-orange-100',
  PARTIAL_REVIEW: 'bg-purple-50 text-purple-600 border-purple-100',
  CHANGES_REQUESTED: 'bg-rose-50 text-rose-600 border-rose-100',
  APPROVED: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  DELIVERED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export const checklistStatusTone: Record<ChecklistStatus, string> = {
  NO_EXISTE: 'bg-slate-100 text-slate-500 border-slate-200',
  PENDIENTE: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]',
  EN_PRODUCCION: 'bg-[#FFEDD5] text-[#9A3412] border-[#FED7AA]',
  ENTREGADO: 'bg-[#E0F2FE] text-[#0369A1] border-[#BAE6FD]',
  APROBADO: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  RECHAZADO: 'bg-rose-50 text-rose-600 border-rose-100',
};

export const priorityTone: Record<Priority, string> = {
  LOW: 'bg-slate-100 text-slate-500 border-slate-200',
  MEDIUM: 'bg-[#E0F2FE] text-[#075985] border-[#BAE6FD]',
  HIGH: 'bg-[#FFEDD5] text-[#9A3412] border-[#FED7AA]',
  CRITICAL: 'bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]',
};

export const isProjectLate = (expectedDate: string, status: ProjectStatus) =>
  !['DELIVERED_TO_LMS', 'CLOSED'].includes(status) && new Date(expectedDate) < new Date('2026-05-12');
