import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AppBootLoader } from '../../components/branding/AppBootLoader';
import { BOOT_EXIT_DURATION_MS } from './appBootConfig';
import { isBootPending } from './appBootStorage';
import { useAppBootReady } from './useAppBootReady';

interface AppBootContextValue {
  degraded: boolean;
}

const AppBootContext = createContext<AppBootContextValue | null>(null);

type BootPhase = 'loading' | 'exiting' | 'done';

export function AppBootProvider({ children }: { children: ReactNode }) {
  const [bootActive] = useState(() => isBootPending());
  const { ready, degraded } = useAppBootReady(bootActive);
  const [phase, setPhase] = useState<BootPhase>(() => (bootActive ? 'loading' : 'done'));

  useEffect(() => {
    if (!bootActive) {
      setPhase('done');
      return;
    }
    if (!ready) return;

    setPhase('exiting');
    const timer = window.setTimeout(() => setPhase('done'), BOOT_EXIT_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [bootActive, ready]);

  const value = useMemo(() => ({ degraded }), [degraded]);
  const showLoader = bootActive && phase !== 'done';

  if (showLoader) {
    return <AppBootLoader degraded={degraded} exiting={phase === 'exiting'} />;
  }

  return <AppBootContext.Provider value={value}>{children}</AppBootContext.Provider>;
}

export function AppBootGate({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useAppBoot() {
  const context = useContext(AppBootContext);
  return context ?? { degraded: false };
}
