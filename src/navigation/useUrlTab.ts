import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Tab activo sincronizado con ?tab= en la URL (persiste F5 y retorno contextual).
 */
export function useUrlTab<T extends string>(validTabs: readonly T[], defaultTab: T) {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = useMemo(() => {
    const raw = searchParams.get('tab');
    return (validTabs as readonly string[]).includes(raw ?? '') ? (raw as T) : defaultTab;
  }, [searchParams, validTabs, defaultTab]);

  const setActiveTab = useCallback(
    (tab: T) => {
      const next = new URLSearchParams(searchParams);
      if (tab === defaultTab) {
        next.delete('tab');
      } else {
        next.set('tab', tab);
      }
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams, defaultTab],
  );

  return [activeTab, setActiveTab] as const;
}
