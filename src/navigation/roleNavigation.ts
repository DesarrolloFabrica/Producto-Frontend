import type { Role } from '../types/domain';
import { ADMIN_DASHBOARD_PATH } from '../features/admin-tracking/adminNavigation';
import { isCDigitalExclusiveUser } from '../permissions';

const C_DIGITAL_HOME_PATH = '/usuarios-c-digital';

const ADMIN_ALLOWED_PREFIXES = ['/admin', '/notifications', '/audit', '/reports'] as const;

export function homePathForRole(role: Role | null): string {
  switch (role) {
    case 'FABRICA':
      return '/factory/dashboard';
    case 'PLANEACION':
      return '/planning/dashboard';
    case 'LMS':
      return '/lms/dashboard';
    case 'ADMIN':
      return ADMIN_DASHBOARD_PATH;
    case 'PRODUCT':
    default:
      return '/product/dashboard';
  }
}

export function homePathForUser(
  user: { role: Role; permissions?: string[] | null } | null | undefined,
): string {
  if (isCDigitalExclusiveUser(user)) {
    return C_DIGITAL_HOME_PATH;
  }
  return homePathForRole(user?.role ?? null);
}

function isAdminAllowedPath(path: string): boolean {
  return ADMIN_ALLOWED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

/**
 * Evita que "Volver" envíe a paneles de otro rol (p. ej. /product tras sesión previa).
 * ADMIN queda restringido a /admin/*, notificaciones y auditoría.
 */
export function isPathAllowedForRole(path: string, role: Role | null): boolean {
  if (!path.startsWith('/')) return false;

  if (role === 'ADMIN') {
    return isAdminAllowedPath(path);
  }

  if (path === '/admin' || path.startsWith('/admin/')) {
    return false;
  }

  if (!role) return true;

  const ownSegment =
    role === 'PLANEACION' ? 'planning' : role === 'FABRICA' ? 'factory' : role.toLowerCase();

  const roleDashboards = ['product', 'factory', 'planning', 'lms'] as const;
  for (const segment of roleDashboards) {
    if (segment === ownSegment) continue;
    if (path === `/${segment}` || path.startsWith(`/${segment}/`)) {
      return false;
    }
  }

  return true;
}

export function isPathAllowedForUser(
  path: string,
  user: { role: Role; permissions?: string[] | null } | null | undefined,
): boolean {
  if (isCDigitalExclusiveUser(user)) {
    return path === C_DIGITAL_HOME_PATH;
  }
  return isPathAllowedForRole(path, user?.role ?? null);
}
