const BOOT_PENDING_KEY = 'producto_boot_pending';

export function isBootPending(): boolean {
  try {
    return sessionStorage.getItem(BOOT_PENDING_KEY) === '1';
  } catch {
    return false;
  }
}

export function markBootPending(): void {
  try {
    sessionStorage.setItem(BOOT_PENDING_KEY, '1');
  } catch {
    // ignore
  }
}

export function clearBootPending(): void {
  try {
    sessionStorage.removeItem(BOOT_PENDING_KEY);
  } catch {
    // ignore
  }
}
