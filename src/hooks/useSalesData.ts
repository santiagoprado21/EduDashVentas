import { useCallback, useEffect, useState } from 'react';

export interface SheetData {
  headers: string[];
  rows: Record<string, string>[];
  fetchedAt: string;
}

export interface ShopifyOrders {
  byInvoice: Record<string, 'ferias' | 'sede' | 'shopify'>;
  from: string | null;
}

export interface SalesPayload extends SheetData {
  /** null si el sheet de Shopify no está configurado o falló. */
  orders?: ShopifyOrders | null;
}

type State =
  | { status: 'loading'; data: SalesPayload | null }
  | { status: 'unauthorized'; data: null }
  | { status: 'ready'; data: SalesPayload }
  | { status: 'error'; data: SalesPayload | null; error: string };

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
