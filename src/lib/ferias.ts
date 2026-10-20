import type { SheetData } from '../hooks/useSalesData';
import type { RankRow } from './metrics';

export interface FeriasPayload {
  tabs: Record<string, SheetData>;
  fetchedAt: string;
}

export interface Fair {
  name: string;
  city: string;
  start: Date | null;
  end: Date | null;
  days: number;
  notes: string;
}

export interface FairSale {
  fair: string;
  date: Date | null;
  product: string;
  design: string;
  type: string;
  ruling: string;
  qty: number;
  price: number;
  total: number;
  payment: string;
  kind: string;
  notes: string;
}

export interface FairExpense {
  fair: string;
  date: Date | null;
  concept: string;
  amount: number;
  notes: string;
}

export interface FairsDataset {
  fairs: Fair[];
  sales: FairSale[];
  expenses: FairExpense[];
}

const num = (v: string | undefined) => {
  const n = Number(v);
  return v === '' || v == null || Number.isNaN(n) ? 0 : n;
};

function parseDate(v: string | undefined): Date | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec((v ?? '').trim());
  if (!m) return null;
  const year = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
  return new Date(year, Number(m[2]) - 1, Number(m[1]));
}

const text = (v: string | undefined, fallback = '') => (v ?? '').trim() || fallback;

export function parseFairs(payload: FeriasPayload): FairsDataset {
  const { Ferias, Ventas, Gastos } = payload.tabs;

  const sales: FairSale[] = (Ventas?.rows ?? []).map((r) => {
    const qty = num(r['Unidades']) || 1;
    const price = num(r['Precio unitario']);
    return {
      fair: text(r['Feria'], 'Sin feria'),
      date: parseDate(r['Fecha']),
      product: text(r['Producto'], 'Sin nombre'),
      design: text(r['Diseño'], 'Sin diseño'),
      type: text(r['Tipo'], 'Sin tipo'),
      ruling: text(r['Rayado']),
      qty,
      price,
      total: num(r['Total']) || qty * price,
      payment: text(r['Método de pago'], 'Sin registrar'),
      kind: text(r['Tipo de venta'], 'Venta directa'),
      notes: text(r['Notas']),
    };
  });

  const expenses: FairExpense[] = (Gastos?.rows ?? []).map((r) => ({
    fair: text(r['Feria'], 'Sin feria'),
    date: parseDate(r['Fecha']),
    concept: text(r['Concepto'], 'Otros'),
    amount: num(r['Valor']),
    notes: text(r['Notas']),
  }));

  const fairs: Fair[] = (Ferias?.rows ?? []).map((r) => ({
    name: text(r['Feria']),
    city: text(r['Ciudad']),
    start: parseDate(r['Fecha inicio']),
    end: parseDate(r['Fecha fin']),
    days: num(r['Días']),
    notes: text(r['Notas']),
  }));

  // Ferias que aparecen en Ventas o Gastos pero no en la pestaña Ferias
  const known = new Set(fairs.map((f) => f.name));
  for (const name of new Set([...sales.map((s) => s.fair), ...expenses.map((e) => e.fair)])) {
    if (!known.has(name)) fairs.push({ name, city: '', start: null, end: null, days: 0, notes: '' });
  }

  fairs.sort((a, b) => (a.start?.getTime() ?? Infinity) - (b.start?.getTime() ?? Infinity));
  return { fairs, sales, expenses };
}

export interface FairSummary {
  fair: Fair;
  sales: number;
  expenses: number;
  profit: number;
  margin: number | null;
  units: number;
  transactions: number;
  avgTicket: number;
  perDay: number | null;
}

export function summarizeFair(fair: Fair, sales: FairSale[], expenses: FairExpense[]): FairSummary {
  const total = sales.reduce((s, x) => s + x.total, 0);
  const cost = expenses.reduce((s, x) => s + x.amount, 0);
  const direct = sales.filter((s) => s.kind !== 'Pedido');
  const directTotal = direct.reduce((s, x) => s + x.total, 0);
  return {
    fair,
    sales: total,
    expenses: cost,
    profit: total - cost,
    margin: total ? (total - cost) / total : null,
    units: sales.reduce((s, x) => s + x.qty, 0),
    transactions: direct.length,
    avgTicket: direct.length ? directTotal / direct.length : 0,
    perDay: fair.days ? total / fair.days : null,
  };
}

export function summarizeAll(ds: FairsDataset, kind: string): FairSummary[] {
  return ds.fairs.map((f) =>
    summarizeFair(
      f,
      ds.sales.filter((s) => s.fair === f.name && (kind === 'all' || s.kind === kind)),
      ds.expenses.filter((e) => e.fair === f.name),
    ),
  );
}

/** Agrupa ventas en el formato de RankingTable; "Unid." son unidades vendidas. */
export function rankSales(sales: FairSale[], keyOf: (s: FairSale) => string): RankRow[] {
  const total = sales.reduce((s, x) => s + x.total, 0);
  const groups = new Map<string, { net: number; units: number; count: number }>();
  for (const s of sales) {
    const key = keyOf(s);
    const g = groups.get(key) ?? { net: 0, units: 0, count: 0 };
    g.net += s.total;
    g.units += s.qty;
    g.count += 1;
    groups.set(key, g);
  }
  return [...groups.entries()]
    .map(([key, g]) => ({
      key,
      label: key,
      net: g.net,
      units: g.units,
      invoices: g.count,
      share: total ? g.net / total : 0,
    }))
    .sort((a, b) => b.net - a.net);
}

export function rankExpenses(expenses: FairExpense[]): RankRow[] {
  const total = expenses.reduce((s, x) => s + x.amount, 0);
  const groups = new Map<string, { net: number; count: number }>();
  for (const e of expenses) {
    const g = groups.get(e.concept) ?? { net: 0, count: 0 };
    g.net += e.amount;
    g.count += 1;
    groups.set(e.concept, g);
  }
  return [...groups.entries()]
    .map(([key, g]) => ({ key, label: key, net: g.net, units: g.count, invoices: g.count, share: total ? g.net / total : 0 }))
    .sort((a, b) => b.net - a.net);
}

export function salesByDay(sales: FairSale[]) {
  const byDay = new Map<number, number>();
  for (const s of sales) {
    if (!s.date) continue;
    byDay.set(s.date.getTime(), (byDay.get(s.date.getTime()) ?? 0) + s.total);
  }
  return [...byDay.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([t, total]) => ({
      label: new Date(t).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }),
      total,
    }));
}
