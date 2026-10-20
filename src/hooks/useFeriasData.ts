import { useCallback, useEffect, useState } from 'react';
import type { FeriasPayload } from '../lib/ferias';

type State =
  | { status: 'loading'; data: FeriasPayload | null }
  | { status: 'ready'; data: FeriasPayload }
  | { status: 'error'; data: FeriasPayload | null; error: string };

/** Solo se monta con sesión válida; el 401 lo maneja useSalesData. */
export function useFeriasData(enabled: boolean) {
  const [state, setState] = useState<State>({ status: 'loading', data: null });

  const load = useCallback(async (refresh = false) => {
    setState((s) => ({ status: 'loading', data: s.data }));
    try {
      const res = await fetch(`/api/ferias${refresh ? '?refresh=1' : ''}`);
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
  }, []);

  useEffect(() => {
    if (enabled) load();
  }, [enabled, load]);

  return { ...state, refresh: () => load(true) };
}
