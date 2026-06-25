export const PRODUCTO_C_DIGITAL_USERS_ACCESS = 'PRODUCTO_C_DIGITAL_USERS_ACCESS';
export const PRODUCTO_C_DIGITAL_USERS_EXCLUSIVE = 'PRODUCTO_C_DIGITAL_USERS_EXCLUSIVE';

export const C_DIGITAL_USERS_PERMISSIONS = [
  PRODUCTO_C_DIGITAL_USERS_ACCESS,
  PRODUCTO_C_DIGITAL_USERS_EXCLUSIVE,
] as const;

export function hasPermission(
  user: { permissions?: string[] | null } | null | undefined,
  permission: string,
): boolean {
  return Boolean(user?.permissions?.includes(permission));
}

export function hasCDigitalUsersPermission(
  user: { permissions?: string[] | null } | null | undefined,
): boolean {
  return C_DIGITAL_USERS_PERMISSIONS.some((permission) => hasPermission(user, permission));
}

export function isCDigitalExclusiveUser(
  user: { permissions?: string[] | null } | null | undefined,
): boolean {
  return hasPermission(user, PRODUCTO_C_DIGITAL_USERS_EXCLUSIVE);
}
