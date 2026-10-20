import type { Dataset, Sale } from './sales';
import type { MonthRange } from './filters';

export const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const FULL_YEAR: MonthRange = { from: 1, to: 12 };

export interface Cutoff {
  month: number;
  day: number;
  partial: boolean;
}

/** Hasta qué fecha comparar: el último dato si el año está en curso, o el año completo. */
export function cutoffFor(ds: Dataset, year: number): Cutoff {
  if (year === ds.lastDate.getFullYear()) {
    return { month: ds.lastDate.getMonth() + 1, day: ds.lastDate.getDate(), partial: true };
  }
  return { month: 12, day: 31, partial: false };
}

const withinCutoff = (s: Sale, c: Cutoff) =>
  s.month < c.month || (s.month === c.month && s.day <= c.day);

const inRange = (month: number, r: MonthRange) => month >= r.from && month <= r.to;

export function salesFor(ds: Dataset, year: number, range: MonthRange = FULL_YEAR, cutoff?: Cutoff): Sale[] {
  return ds.sales.filter(
    (s) => s.year === year && inRange(s.month, range) && (!cutoff || withinCutoff(s, cutoff)),
  );
}

export interface Summary {
  net: number;
  gross: number;
  discountPct: number;
  invoices: number;
  units: number;
  clients: number;
  avgTicket: number;
}

export function summarize(sales: Sale[]): Summary {
  let net = 0;
  let gross = 0;
  let units = 0;
  const invoices = new Set<string>();
  const clients = new Set<string>();
  for (const s of sales) {
    net += s.net;
    gross += s.gross;
    units += s.qty;
    invoices.add(s.invoice);
    if (!s.genericClient) clients.add(s.clientId || s.client);
  }
  return {
    net,
    gross,
    discountPct: gross ? 1 - net / gross : 0,
    invoices: invoices.size,
    units,
    clients: clients.size,
    avgTicket: invoices.size ? net / invoices.size : 0,
  };
}

export const delta = (cur: number, prev: number) => (prev ? (cur - prev) / prev : null);

export function monthlySeries(ds: Dataset, year: number, range: MonthRange) {
  const cutoff = cutoffFor(ds, year);
  const cur = new Array(12).fill(0);
  const prev = new Array(12).fill(0);
  for (const s of ds.sales) {
    if (s.year === year) cur[s.month - 1] += s.net;
    else if (s.year === year - 1) prev[s.month - 1] += s.net;
  }
  return MONTHS.map((label, i) => ({
    label,
    actual: i + 1 > cutoff.month ? null : cur[i],
    prev: prev[i] || null,
    inPeriod: inRange(i + 1, range),
  }));
}

export function quarterlyBudget(ds: Dataset, year: number, range: MonthRange) {
  const actual = [0, 0, 0, 0];
  const budget = [0, 0, 0, 0];
  for (const s of ds.sales) if (s.year === year) actual[s.quarter - 1] += s.net;
  for (const b of ds.budgets) if (b.year === year) budget[Math.ceil(b.month / 3) - 1] += b.amount;
  return actual.map((a, i) => ({
    label: `Q${i + 1}`,
    actual: a || null,
    budget: budget[i] || null,
    pct: budget[i] ? a / budget[i] : null,
    inPeriod: i * 3 + 3 >= range.from && i * 3 + 1 <= range.to,
  }));
}

/** Cumplimiento sobre meses cerrados del periodo, para no castigar el mes en curso. */
export function budgetAttainment(ds: Dataset, year: number, range: MonthRange) {
  const cutoff = cutoffFor(ds, year);
  const lastClosed = Math.min(range.to, cutoff.partial ? cutoff.month - 1 : 12);
  if (lastClosed < range.from) return null;
  const closed = { from: range.from, to: lastClosed };

  const budget = ds.budgets
    .filter((b) => b.year === year && inRange(b.month, closed))
    .reduce((sum, b) => sum + b.amount, 0);
  if (!budget) return null;

  const actual = salesFor(ds, year, closed).reduce((sum, s) => sum + s.net, 0);
  return { actual, budget, pct: actual / budget, range: closed };
}

export function yearlyTotals(ds: Dataset, range: MonthRange) {
  const totals = new Map<number, number>();
  for (const s of ds.sales) {
    if (!inRange(s.month, range)) continue;
    totals.set(s.year, (totals.get(s.year) ?? 0) + s.net);
  }
  return [...totals.entries()].sort((a, b) => a[0] - b[0]).map(([year, net]) => ({ year, net }));
}

export interface RankRow {
  key: string;
  label: string;
  sub?: string;
  net: number;
  units: number;
  invoices: number;
  share: number;
}

export function rankBy(
  sales: Sale[],
  keyOf: (s: Sale) => string | null,
  opts: { labelOf?: (s: Sale) => string; subOf?: (s: Sale) => string; total?: number } = {},
): RankRow[] {
  const total = opts.total ?? sales.reduce((sum, s) => sum + s.net, 0);
  const groups = new Map<
    string,
    { label: string; sub?: string; net: number; units: number; invoices: Set<string> }
  >();
  for (const s of sales) {
    const key = keyOf(s);
    if (key == null) continue;
    let g = groups.get(key);
    if (!g) {
      g = { label: opts.labelOf?.(s) ?? key, sub: opts.subOf?.(s), net: 0, units: 0, invoices: new Set() };
      groups.set(key, g);
    }
    g.net += s.net;
    g.units += s.qty;
    g.invoices.add(s.invoice);
  }
  return [...groups.entries()]
    .map(([key, g]) => ({
      key,
      label: g.label,
      sub: g.sub,
      net: g.net,
      units: g.units,
      invoices: g.invoices.size,
      share: total ? g.net / total : 0,
    }))
    .sort((a, b) => b.net - a.net);
}
