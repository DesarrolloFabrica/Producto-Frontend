import { useCallback, useEffect, useMemo } from 'react';
import type { SetURLSearchParams } from 'react-router-dom';
import { parseInboxPanel, type InboxPanelMode } from './operationalInboxPanel';

export const EXPLORE_FILTER_PARAM = 'exploreFilter';

export function useOperationalInboxPanelState<T extends string>({
  searchParams,
  setSearchParams,
  parseFilter,
  defaultFilter,
}: {
  searchParams: URLSearchParams;
  setSearchParams: SetURLSearchParams;
  parseFilter: (value: string | null) => T;
  defaultFilter: T;
}) {
  const panel = parseInboxPanel(searchParams.get('panel'));

  const inboxFilter = useMemo(
    () => parseFilter(searchParams.get('filter')),
    [searchParams, parseFilter],
  );

  const exploreFilter = useMemo(() => {
    const explicit = searchParams.get(EXPLORE_FILTER_PARAM);
    if (explicit) return parseFilter(explicit);
    if (panel === 'explore' && searchParams.get('filter')) {
      return parseFilter(searchParams.get('filter'));
    }
    return defaultFilter;
  }, [searchParams, panel, parseFilter, defaultFilter]);

  const activeFilter = panel === 'explore' ? exploreFilter : inboxFilter;

  useEffect(() => {
    const legacyFilter = searchParams.get('filter');
    const hasExploreFilter = searchParams.get(EXPLORE_FILTER_PARAM);
    if (panel !== 'explore' || !legacyFilter || hasExploreFilter) return;

    const params = new URLSearchParams(searchParams);
    params.set(EXPLORE_FILTER_PARAM, legacyFilter);
    params.delete('filter');
    setSearchParams(params, { replace: true });
  }, [panel, searchParams, setSearchParams]);

  const setInboxFilter = useCallback(
    (next: T) => {
      const params = new URLSearchParams(searchParams);
      if (next === defaultFilter) params.delete('filter');
      else params.set('filter', next);
      params.delete('page');
      params.delete('panel');
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams, defaultFilter],
  );

  const setExploreFilter = useCallback(
    (next: T) => {
      const params = new URLSearchParams(searchParams);
      if (next === defaultFilter) params.delete(EXPLORE_FILTER_PARAM);
      else params.set(EXPLORE_FILTER_PARAM, next);
      params.delete('filter');
      params.delete('page');
      params.set('panel', 'explore');
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams, defaultFilter],
  );

  const clearExploreFilter = useCallback(() => {
    setExploreFilter(defaultFilter);
  }, [setExploreFilter, defaultFilter]);

  const clearInboxFilter = useCallback(() => {
    setInboxFilter(defaultFilter);
  }, [setInboxFilter, defaultFilter]);

  const setPanel = useCallback(
    (next: InboxPanelMode) => {
      const params = new URLSearchParams(searchParams);
      if (next === 'inbox') params.delete('panel');
      else params.set('panel', next);
      params.delete('page');
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const hasExploreCategoryFilter = exploreFilter !== defaultFilter;

  return {
    panel,
    inboxFilter,
    exploreFilter,
    activeFilter,
    hasExploreCategoryFilter,
    setInboxFilter,
    setExploreFilter,
    clearExploreFilter,
    clearInboxFilter,
    setPanel,
  };
}
