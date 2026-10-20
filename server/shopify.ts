import { fetchSheet } from './sheets.js';

export type OrderKind = 'ferias' | 'sede' | 'shopify';

export interface ShopifyOrders {
  /** Factura (Prefijo + # Factura, p. ej. POSE374) → tipo del primer pedido con esa factura. */
  byInvoice: Record<string, OrderKind>;
  /** Fecha del primer pedido (yyyy-mm-dd); antes de eso no hay cruce posible. */
  from: string | null;
}

function isoDate(v: string): string | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(v.trim());
  return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : null;
}

/** Solo devuelve el tipo de pedido por factura: correos y direcciones no salen del servidor. */
export async function fetchShopifyOrders(sheetId: string, range: string): Promise<ShopifyOrders> {
  const { rows } = await fetchSheet(sheetId, range);
  const byInvoice: Record<string, OrderKind> = {};
  let from: string | null = null;

  for (const r of rows) {
    const invoice = (r['Factura No.'] ?? '').trim().toUpperCase();
    if (!invoice) continue;
    const kind: OrderKind =
      (r['Billing Name'] ?? '').trim().toLowerCase() === 'ferias'
        ? 'ferias'
        : /@educambio\.org$/i.test((r['Email'] ?? '').trim())
          ? 'sede'
          : 'shopify';
    byInvoice[invoice] ??= kind;

    const date = isoDate(r['Created at'] ?? '');
    if (date && (!from || date < from)) from = date;
  }

  return { byInvoice, from };
}
