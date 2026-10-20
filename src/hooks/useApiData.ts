import { useCallback, useEffect, useState } from 'react';

type State<T> =
  | { status: 'loading'; data: T | null }
  | { status: 'ready'; data: T }
  | { status: 'error'; data: T | null; error: string };

/** Solo se monta con sesión válida; el 401 lo maneja useSalesData. */
export function useApiData<T>(url: string, enabled: boolean) {
  const [state, setState] = useState<State<T>>({ status: 'loading', data: null });

  const load = useCallback(
    async (refresh = false) => {
      setState((s) => ({ status: 'loading', data: s.data }));
      try {
        const res = await fetch(`${url}${refresh ? '?refresh=1' : ''}`);
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
        setState({ status: 'ready', data: body });
      } catch (err) {
        setState((s) => ({
          status: 'error',
          data: s.data,
          error: err instanceof Error ? err.message : String(err),
        }));
      }
    },
    [url],
  );

  useEffect(() => {
    if (enabled) load();
  }, [enabled, load]);

  return { ...state, refresh: () => load(true) };
}
