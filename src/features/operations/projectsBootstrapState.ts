let bootstrappedUserId: string | null = null;

export function shouldRunProjectsBootstrap(userId: string | undefined): boolean {
  if (!userId) {
    bootstrappedUserId = null;
    return false;
  }
  if (bootstrappedUserId === userId) return false;
  bootstrappedUserId = userId;
  return true;
}

export function resetProjectsBootstrap(): void {
  bootstrappedUserId = null;
}
