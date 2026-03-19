import { useState, useEffect, useCallback } from 'react';
import type { PageState } from '@/types';

export function usePageState<T>(loader: () => Promise<T> | T, deps: unknown[] = []): PageState<T> & { reload: () => void } {
  const [state, setState] = useState<PageState<T>>({
    data: null,
    isLoading: true,
    error: null,
    isEmpty: false,
  });

  const load = useCallback(async () => {
    setState((prev: PageState<T>) => ({ ...prev, isLoading: true, error: null }));
    try {
      // Simulate network delay
      await new Promise(r => setTimeout(r, 400));
      const data = await loader();
      const isEmpty = Array.isArray(data) ? data.length === 0 : !data;
      setState({ data, isLoading: false, error: null, isEmpty });
    } catch (err) {
      setState({ data: null, isLoading: false, error: (err as Error).message, isEmpty: false });
    }
  }, deps);

  useEffect(() => { load(); }, [load]);

  return { ...state, reload: load };
}
