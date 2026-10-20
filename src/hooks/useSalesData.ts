import { useCallback, useEffect, useState } from 'react';

export interface SheetData {
  headers: string[];
  rows: Record<string, string>[];
  fetchedAt: string;
}

type State =
  | { status: 'loading'; data: SheetData | null }
  | { status: 'unauthorized'; data: null }
  | { status: 'ready'; data: SheetData }
  | { status: 'error'; data: SheetData | null; error: string };

export function useSalesData() {
  const [state, setState] = useState<State>({ status: 'loading', data: null });

  const load = useCallback(async (refresh = false) => {
    setState((s) => ({ status: 'loading', data: s.data }));
    try {
      const res = await fetch(`/api/sales${refresh ? '?refresh=1' : ''}`);
      if (res.status === 401) {
        setState({ status: 'unauthorized', data: null });
        return;
      }
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
    load();
  }, [load]);

  const logout = useCallback(async () => {
    await fetch('/api/logout', { method: 'POST' });
    setState({ status: 'unauthorized', data: null });
  }, []);

  return { ...state, refresh: () => load(true), reload: () => load(), logout };
}
