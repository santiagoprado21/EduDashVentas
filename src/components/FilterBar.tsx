import { SlidersHorizontal, X } from 'lucide-react';
import FilterSelect from './FilterSelect';
import type { Dataset } from '../lib/sales';
import {
  DIMENSION_DEFAULTS,
  PERIOD_OPTIONS,
  activeFilterCount,
  type ClientType,
  type Filters,
} from '../lib/filters';

interface Props {
  ds: Dataset;
  filters: Filters;
  onChange: (next: Filters) => void;
}

const all = (label: string) => ({ value: 'all', label });
const toOptions = (values: string[]) => values.map((v) => ({ value: v, label: v }));

function yearSpan(years: number[] = []): string {
  if (!years.length) return 'sin ventas';
  const min = years[years.length - 1];
  const max = years[0];
  return min === max ? String(max) : `${min}–${max}`;
}

export default function FilterBar({ ds, filters, onChange }: Props) {
  const set = <K extends keyof Filters>(key: K, value: Filters[K]) => onChange({ ...filters, [key]: value });
  const active = activeFilterCount(filters);
  const years = filters.vendor === 'all' ? ds.years : ds.vendorYears[filters.vendor] ?? ds.years;

  const setVendor = (vendor: string) => {
    const vendorYears = vendor === 'all' ? ds.years : ds.vendorYears[vendor] ?? [];
    const year = vendorYears.includes(filters.year) || !vendorYears.length ? filters.year : vendorYears[0];
    onChange({ ...filters, vendor, year });
  };

  return (
    <div className="card px-4 py-3 mb-5 flex flex-wrap items-center gap-x-5 gap-y-3">
      <SlidersHorizontal size={13} className="text-brand-text-muted" />
      <FilterSelect
        label="Año"
        value={String(filters.year)}
        options={years.map((y) => ({ value: String(y), label: String(y) }))}
        onChange={(v) => set('year', Number(v))}
      />
      <FilterSelect
        label="Periodo"
        value={filters.period}
        options={PERIOD_OPTIONS}
        onChange={(v) => set('period', v)}
      />
      <div className="h-5 w-px bg-brand-border" />
      <FilterSelect
        label="Vendedor"
        value={filters.vendor}
        options={[
          all('Todos'),
          ...ds.vendors.map((v) => ({ value: v, label: `${v} · ${yearSpan(ds.vendorYears[v])}` })),
        ]}
        onChange={setVendor}
      />
      <FilterSelect
        label="Categoría"
        value={filters.category}
        options={[all('Todas'), ...toOptions(ds.categories)]}
        onChange={(v) => set('category', v)}
      />
      {ds.channels.length > 0 && (
        <FilterSelect
          label="Canal"
          value={filters.channel}
          options={[all('Todos'), ...toOptions(ds.channels)]}
          onChange={(v) => set('channel', v)}
        />
      )}
      <FilterSelect
        label="Prefijo"
        value={filters.prefix}
        options={[all('Todos'), ...toOptions(ds.prefixes)]}
        onChange={(v) => set('prefix', v)}
      />
      <FilterSelect
        label="Cliente"
        value={filters.clientType}
        options={[
          all('Todos'),
          { value: 'named', label: 'Identificados' },
          { value: 'generic', label: 'Genéricos' },
        ]}
        onChange={(v) => set('clientType', v as ClientType)}
      />
      {active > 0 && (
        <button
          className="ml-auto flex items-center gap-1 text-[10px] font-semibold text-brand-text-secondary border border-brand-border rounded-lg px-2 py-1.5 hover:text-brand-navy hover:border-brand-blue transition-colors"
          onClick={() => onChange({ ...filters, ...DIMENSION_DEFAULTS })}
        >
          <X size={11} />
          Limpiar ({active})
        </button>
      )}
    </div>
  );
}
