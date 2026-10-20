import type { SalesPayload, ShopifyOrders } from '../hooks/useSalesData';

export interface Sale {
  date: Date;
  year: number;
  month: number;
  day: number;
  quarter: number;
  vendor: string;
  client: string;
  clientId: string;
  genericClient: boolean;
  invoice: string;
  prefix: string;
  item: string;
  ref: string;
  category: string;
  channel: string;
  qty: number;
  gross: number;
  net: number;
}

export interface Budget {
  year: number;
  month: number;
  amount: number;
}

export interface Dataset {
  sales: Sale[];
  budgets: Budget[];
  years: number[];
  vendors: string[];
  /** Años con ventas por vendedor, de más reciente a más antiguo. */
  vendorYears: Record<string, number[]>;
  categories: string[];
  prefixes: string[];
  channels: string[];
  /** Desde cuándo hay pedidos de Shopify para asignar canal; null = sin canales. */
  channelsFrom: Date | null;
  lastDate: Date;
}

const num = (v: string | undefined) => {
  const n = Number(v);
  return v === '' || v == null || Number.isNaN(n) ? 0 : n;
};

/** Fecha Emisión viene como dd/mm/yy. */
function parseDate(v: string): Date | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(v.trim());
  if (!m) return null;
  const year = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
  return new Date(year, Number(m[2]) - 1, Number(m[1]));
}

const GENERIC_CLIENT_ID = '222222222';
const GENERIC_CLIENT_NAME = /^(venta\b|consumidor final)/i;

const CATEGORY_BY_WORD: Record<string, string> = {
  cuaderno: 'Cuadernos',
  cuadernos: 'Cuadernos',
  agenda: 'Agendas',
  agendas: 'Agendas',
  kit: 'Kits',
  folder: 'Folders',
  pañoleta: 'Pañoletas',
  calendario: 'Calendarios',
  hojas: 'Hojas',
  domicilio: 'Domicilios',
};

function categoryOf(item: string): string {
  const word = item.trim().split(/\s+/)[0]?.toLowerCase() ?? '';
  return CATEGORY_BY_WORD[word] ?? 'Otros';
}

export const UNCLASSIFIED = 'Sin clasificar';

/** Facturas de ferias que no quedaron marcadas como "Ferias" en Shopify. */
const FERIA_INVOICES = new Set(['EDU2145', 'EDU2183']);

/** Mismas reglas y orden que la hoja Metodologia de "Rentabilidad por canal". */
function channelOf(item: string, client: string, invoice: string, orders: ShopifyOrders | null, covered: boolean) {
  if (/\bCB\b/.test(item)) return 'Colegio Bolívar';
  if (/ferias y ferias/i.test(client)) return 'La Única';
  if (!orders || !covered) return UNCLASSIFIED;
  const kind = orders.byInvoice[invoice];
  if (kind === 'ferias' || FERIA_INVOICES.has(invoice)) return 'Ferias';
  if (kind === 'sede') return 'Sede Educambio';
  if (kind) return 'E-commerce';
  return 'Otros';
}

/** Ordena por venta total descendente. */
function byNet(sales: Sale[], keyOf: (s: Sale) => string): string[] {
  const totals = new Map<string, number>();
  for (const s of sales) totals.set(keyOf(s), (totals.get(keyOf(s)) ?? 0) + s.net);
  return [...totals.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k);
}

export function parseDataset(data: SalesPayload): Dataset {
  const sales: Sale[] = [];
  const budgets: Budget[] = [];
  const orders = data.orders ?? null;
  const channelsFrom = orders?.from ? new Date(`${orders.from}T00:00:00`) : null;

  for (const r of data.rows) {
    if (r['Anulada']?.trim()) continue;
    const date = parseDate(r['Fecha Emisión'] ?? '');
    if (!date) continue;

    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const gross = num(r['Subtotal Item']);
    const net = gross * (1 - num(r['Dcto Item']));

    if (r['Tipo Venta'] === 'Presupuesto') {
      budgets.push({ year, month, amount: net });
      continue;
    }

    const client = (r['Nombre Cliente'] ?? '').trim();
    const clientId = (r['# ID'] ?? '').trim();
    const invoiceNo = (r['# Factura'] ?? '').trim();
    const prefix = (r['Prefijo'] ?? '').trim();
    const item = (r['Nombre Item'] ?? '').trim();

    sales.push({
      date,
      year,
      month,
      day: date.getDate(),
      quarter: Math.ceil(month / 3),
      vendor: (r['Vendedor'] ?? '').trim() || 'Sin vendedor',
      client: client || 'Sin nombre',
      clientId,
      genericClient: !client || clientId === GENERIC_CLIENT_ID || GENERIC_CLIENT_NAME.test(client),
      invoice: invoiceNo ? `${prefix}-${invoiceNo}` : `${r['Fecha Emisión']}|${client}`,
      prefix: prefix || 'Sin prefijo',
      item: item || 'Sin nombre',
      ref: (r['Referencia'] ?? '').trim(),
      category: categoryOf(item),
      channel: channelOf(
        item,
        client,
        `${prefix}${invoiceNo}`.toUpperCase(),
        orders,
        channelsFrom != null && date >= channelsFrom,
      ),
      qty: num(r['Q Item']),
      gross,
      net,
    });
  }

  const lastDate = sales.reduce((max, s) => (s.date > max ? s.date : max), new Date(0));
  const years = [...new Set(sales.map((s) => s.year))].sort((a, b) => b - a);

  const vendorYearSets = new Map<string, Set<number>>();
  for (const s of sales) {
    if (s.net <= 0) continue;
    let set = vendorYearSets.get(s.vendor);
    if (!set) vendorYearSets.set(s.vendor, (set = new Set()));
    set.add(s.year);
  }
  const vendorYears = Object.fromEntries(
    [...vendorYearSets].map(([v, set]) => [v, [...set].sort((a, b) => b - a)]),
  );

  return {
    sales,
    budgets,
    years,
    vendors: byNet(sales, (s) => s.vendor),
    vendorYears,
    categories: byNet(sales, (s) => s.category),
    prefixes: byNet(sales, (s) => s.prefix),
    channels: byNet(sales, (s) => s.channel).filter((c) => c !== UNCLASSIFIED),
    channelsFrom,
    lastDate,
  };
}
