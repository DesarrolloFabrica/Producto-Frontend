import type { Role } from '../types/domain';

export function homePathForRole(role: Role | null): string {
  switch (role) {
    case 'FABRICA':
      return '/factory/dashboard';
    case 'PLANEACION':
      return '/planning/dashboard';
    case 'LMS':
      return '/lms/dashboard';
    case 'ADMIN':
    case 'PRODUCT':
    default:
      return '/product/dashboard';
  }
}

/**
 * Evita que "Volver" envíe a paneles de otro rol (p. ej. /product tras sesión previa).
 * Rutas compartidas (/projects, /subjects) siguen permitidas.
 */
export function isPathAllowedForRole(path: string, role: Role | null): boolean {
  if (!path.startsWith('/')) return false;
  if (!role || role === 'ADMIN') return true;

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
