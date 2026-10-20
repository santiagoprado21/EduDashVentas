import type { Dataset, Sale } from './sales';
import { MONTHS } from './metrics';

export type ClientType = 'all' | 'named' | 'generic';

export interface Filters {
  year: number;
  /** 'all', 'q1'..'q4' o 'm1'..'m12' */
  period: string;
  vendor: string;
  category: string;
  prefix: string;
  channel: string;
  clientType: ClientType;
}

export const DIMENSION_DEFAULTS = {
  period: 'all',
  vendor: 'all',
  category: 'all',
  prefix: 'all',
  channel: 'all',
  clientType: 'all' as ClientType,
};

export interface MonthRange {
  from: number;
  to: number;
}

export function periodRange(period: string): MonthRange {
  if (period.startsWith('q')) {
    const q = Number(period.slice(1));
    return { from: q * 3 - 2, to: q * 3 };
  }
  if (period.startsWith('m')) {
    const m = Number(period.slice(1));
    return { from: m, to: m };
  }
  return { from: 1, to: 12 };
}

export function periodLabel(period: string): string {
  if (period.startsWith('q')) return `Q${period.slice(1)}`;
  if (period.startsWith('m')) return MONTHS[Number(period.slice(1)) - 1];
  return 'Año completo';
}

export const PERIOD_OPTIONS = [
  { value: 'all', label: 'Año completo' },
  ...[1, 2, 3, 4].map((q) => ({ value: `q${q}`, label: `Q${q}` })),
  ...MONTHS.map((m, i) => ({ value: `m${i + 1}`, label: m })),
];

/** El presupuesto es del total, así que solo aplica sin filtros de dimensión. */
export const hasDimensionFilters = (f: Filters) =>
  f.vendor !== 'all' ||
  f.category !== 'all' ||
  f.prefix !== 'all' ||
  f.channel !== 'all' ||
  f.clientType !== 'all';

export const activeFilterCount = (f: Filters) =>
  (f.period !== 'all' ? 1 : 0) +
  (f.vendor !== 'all' ? 1 : 0) +
  (f.category !== 'all' ? 1 : 0) +
  (f.prefix !== 'all' ? 1 : 0) +
  (f.channel !== 'all' ? 1 : 0) +
  (f.clientType !== 'all' ? 1 : 0);

function matches(s: Sale, f: Filters): boolean {
  return (
    (f.vendor === 'all' || s.vendor === f.vendor) &&
    (f.category === 'all' || s.category === f.category) &&
    (f.prefix === 'all' || s.prefix === f.prefix) &&
    (f.channel === 'all' || s.channel === f.channel) &&
    (f.clientType === 'all' || (f.clientType === 'generic') === s.genericClient)
  );
}

/** Aplica los filtros de dimensión; año y periodo los maneja cada métrica. */
export function applyDimensionFilters(ds: Dataset, f: Filters): Dataset {
  if (!hasDimensionFilters(f)) return ds;
  return { ...ds, sales: ds.sales.filter((s) => matches(s, f)) };
}
