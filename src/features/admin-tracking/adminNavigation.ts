export const ADMIN_DASHBOARD_PATH = '/admin/dashboard';

export const ADMIN_PROGRAM_DETAIL_PATH = (projectId: string) => `/admin/programs/${projectId}`;

export const ADMIN_SEMESTER_DETAIL_PATH = (projectId: string, semesterId: string) =>
  `/admin/programs/${projectId}/semesters/${semesterId}`;
