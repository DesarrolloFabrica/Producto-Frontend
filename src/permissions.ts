export const PRODUCTO_C_DIGITAL_USERS_ACCESS = 'PRODUCTO_C_DIGITAL_USERS_ACCESS';

export function hasPermission(
  user: { permissions?: string[] | null } | null | undefined,
  permission: string,
): boolean {
  return Boolean(user?.permissions?.includes(permission));
}
