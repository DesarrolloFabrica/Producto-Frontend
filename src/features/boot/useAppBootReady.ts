import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthContext';
import type { Role } from '../../types/domain';
import {
  areBootQueriesSettled,
  BOOT_MAX_DURATION_MS,
  BOOT_MIN_DURATION_MS,
  prefetchBootQueries,
} from './appBootConfig';
import { clearBootPending } from './appBootStorage';

export function useAppBootReady(enabled: boolean) {
  const { user, role, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [ready, setReady] = useState(!enabled);
  const [degraded, setDegraded] = useState(false);
  const startedAtRef = useRef<number | null>(null);
  const prefetchStartedRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      setReady(true);
      setDegraded(false);
      return;
    }

    setReady(false);
    setDegraded(false);
    startedAtRef.current = Date.now();
    prefetchStartedRef.current = false;
  }, [enabled, user?.id]);

  useEffect(() => {
    if (!enabled || authLoading || !user) return;

    if (!prefetchStartedRef.current) {
      prefetchStartedRef.current = true;
      void prefetchBootQueries(queryClient, role as Role | null);
    }

    let cancelled = false;
    const tick = () => {
      if (cancelled) return;

      const startedAt = startedAtRef.current ?? Date.now();
      const elapsed = Date.now() - startedAt;
      const queriesSettled = areBootQueriesSettled(queryClient, role as Role | null);
      const minElapsed = elapsed >= BOOT_MIN_DURATION_MS;
      const maxElapsed = elapsed >= BOOT_MAX_DURATION_MS;

      if (minElapsed && (queriesSettled || maxElapsed)) {
        if (maxElapsed && !queriesSettled) {
          setDegraded(true);
        }
        clearBootPending();
        setReady(true);
        return;
      }

      window.setTimeout(tick, 80);
    };

    const timer = window.setTimeout(tick, 80);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [enabled, authLoading, user, role, queryClient]);

  return { ready, degraded };
}
