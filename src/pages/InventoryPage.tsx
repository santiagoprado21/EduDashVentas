import { useMemo, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, Boxes, Search } from 'lucide-react';
import KpiCard from '../components/KpiCard';
import RankingTable from '../components/RankingTable';
import FilterSelect from '../components/FilterSelect';
import type { SheetData } from '../hooks/useSalesData';
import {
  LOW_STOCK,
  STATUS_LABEL,
  parseInventory,
  rankInventory,
  type InventoryItem,
  type StockStatus,
} from '../lib/inventory';
import { fmtCOP, fmtCompact, fmtInt, fmtPct } from '../lib/format';

const ALL = 'all';
const ACTIVE = 'active';

const STATUS_OPTIONS = [
  { value: ACTIVE, label: 'Con movimiento' },
  { value: ALL, label: 'Todas' },
  ...(Object.keys(STATUS_LABEL) as StockStatus[]).map((s) => ({ value: s, label: STATUS_LABEL[s] })),
  { value: 'diff', label: 'Con descuadre' },
  { value: 'negative', label: 'Saldo negativo' },
];

const STATUS_STYLE: Record<StockStatus, string> = {
  ok: 'bg-brand-green/15 text-brand-green-dark',
  low: 'bg-brand-yellow/30 text-brand-navy',
  out: 'bg-brand-red/10 text-brand-red',
  idle: 'bg-brand-bg text-brand-text-muted',
};

function matchesStatus(i: InventoryItem, status: string) {
  if (status === ALL) return true;
  if (status === ACTIVE) return i.status !== 'idle';
  if (status === 'diff') return i.diff !== 0;
  if (status === 'negative') return i.balance < 0;
  return i.status === status;
}

const options = (values: string[]) => [
  { value: ALL, label: 'Todas' },
  ...[...new Set(values)].sort((a, b) => a.localeCompare(b, 'es')).map((v) => ({ value: v, label: v })),
];

function Badge({ status }: { status: StockStatus }) {
  return (
    <span className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-semibold whitespace-nowrap ${STATUS_STYLE[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

function ShortList({
  title,
  note,
  items,
  columns,
}: {
  title: string;
  note: string;
  items: InventoryItem[];
  columns: { label: string; value: (i: InventoryItem) => ReactNode }[];
}) {
  return (
    <div className="card p-4">
      <h2 className="section-title">{title}</h2>
      {items.length === 0 ? (
        <div className="text-[11px] text-brand-text-muted py-6 text-center">Nada por aquí</div>
      ) : (
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-brand-border text-brand-text-secondary">
              <th className="text-left font-semibold py-1.5">Producto</th>
              {columns.map((c) => (
                <th key={c.label} className="text-right font-semibold py-1.5 w-16">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((i, n) => (
              <tr key={i.sku} className={n % 2 ? 'bg-brand-bg/40' : 'bg-white'}>
                <td className="py-1.5 pr-3">
                  <div className="text-brand-navy truncate max-w-[300px]" title={i.name}>
                    {i.name}
                  </div>
                  <div className="text-[9px] text-brand-text-muted">{i.sku}</div>
                </td>
                {columns.map((c) => (
                  <td key={c.label} className="py-1.5 text-right tabular-nums">
                    {c.value(i)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="text-[10px] text-brand-text-muted mt-3">{note}</p>
    </div>
  );
}

type SortKey = 'name' | 'entries' | 'exits' | 'balance' | 'counted' | 'diff' | 'cost' | 'value' | 'sellThrough';

const COLUMNS: { key: SortKey; label: string; title?: string }[] = [
  { key: 'name', label: 'Producto' },
  { key: 'entries', label: 'Entrada' },
  { key: 'exits', label: 'Salidas' },
  { key: 'balance', label: 'Saldo', title: 'Entrada − Salidas' },
  { key: 'counted', label: 'Conteo', title: 'Confirmación (conteo físico)' },
  { key: 'diff', label: 'Dif.', title: 'Saldo − Conteo' },
  { key: 'sellThrough', label: 'Rotación', title: 'Salidas / Entrada' },
  { key: 'cost', label: 'Costo' },
  { key: 'value', label: 'Valor', title: 'Conteo × Costo' },
];

function InventoryTable({ items }: { items: InventoryItem[] }) {
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: 'value', desc: true });

  const sorted = useMemo(() => {
    const dir = sort.desc ? -1 : 1;
    return [...items].sort((a, b) => {
      if (sort.key === 'name') return dir * a.name.localeCompare(b.name, 'es');
      return dir * ((a[sort.key] ?? -1) - (b[sort.key] ?? -1));
    });
  }, [items, sort]);

  const toggle = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, desc: !s.desc } : { key, desc: key !== 'name' }));

  return (
    <div className="card overflow-hidden">
      <div className="px-4 pt-4 flex items-baseline justify-between">
        <h2 className="section-title">Referencias</h2>
        <span className="text-[10px] text-brand-text-muted">{items.length} SKUs · clic en una columna para ordenar</span>
      </div>
      <div className="overflow-auto max-h-[560px]">
        <table className="w-full text-[11px]">
          <thead className="sticky top-0 bg-white z-10">
            <tr className="border-b border-brand-border text-brand-text-secondary">
              {COLUMNS.map((c) => (
                <th
                  key={c.key}
                  title={c.title}
                  onClick={() => toggle(c.key)}
                  className={`font-semibold px-3 py-2 whitespace-nowrap cursor-pointer select-none hover:text-brand-navy ${
                    c.key === 'name' ? 'text-left pl-4' : 'text-right'
                  }`}
                >
                  <span className="inline-flex items-center gap-0.5">
                    {c.label}
                    {sort.key === c.key && (sort.desc ? <ArrowDown size={10} /> : <ArrowUp size={10} />)}
                  </span>
                </th>
              ))}
              <th className="font-semibold px-3 py-2 text-left">Estado</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((i, n) => (
              <tr key={i.sku} className={n % 2 ? 'bg-brand-bg/40' : 'bg-white'}>
                <td className="pl-4 pr-3 py-1.5">
                  <div className="text-brand-navy">{i.name}</div>
                  <div className="text-[9px] text-brand-text-muted">
                    {i.sku} · {i.family}
                  </div>
                </td>
                <td className="px-3 py-1.5 text-right tabular-nums">{fmtInt(i.entries)}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{fmtInt(i.exits)}</td>
                <td className={`px-3 py-1.5 text-right tabular-nums ${i.balance < 0 ? 'text-alert-critical font-semibold' : ''}`}>
                  {fmtInt(i.balance)}
                </td>
                <td className="px-3 py-1.5 text-right tabular-nums font-semibold">{fmtInt(i.counted)}</td>
                <td className={`px-3 py-1.5 text-right tabular-nums ${i.diff ? 'text-alert-warning font-semibold' : 'text-brand-text-muted'}`}>
                  {i.diff ? fmtInt(i.diff) : '—'}
                </td>
                <td className="px-3 py-1.5 text-right tabular-nums text-brand-text-secondary">
                  {i.sellThrough != null ? fmtPct(i.sellThrough, 0) : '—'}
                </td>
                <td className="px-3 py-1.5 text-right tabular-nums whitespace-nowrap">{fmtCOP(i.cost)}</td>
                <td className="px-3 py-1.5 text-right tabular-nums whitespace-nowrap font-semibold">
                  {i.value ? fmtCOP(i.value) : '—'}
                </td>
                <td className="px-3 py-1.5">
                  <Badge status={i.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function InventoryPage({ data }: { data: SheetData }) {
  const items = useMemo(() => parseInventory(data), [data]);
  const [family, setFamily] = useState(ALL);
  const [ruling, setRuling] = useState(ALL);
  const [status, setStatus] = useState(ACTIVE);
  const [query, setQuery] = useState('');

  const view = useMemo(() => {
    const q = query.trim().toLowerCase();
    const scoped = items.filter(
      (i) =>
        (family === ALL || i.family === family) &&
        (ruling === ALL || i.ruling === ruling) &&
        (!q || i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q)),
    );
    const shown = scoped.filter((i) => matchesStatus(i, status));
    const count = (s: StockStatus) => scoped.filter((i) => i.status === s).length;
    const diffs = scoped.filter((i) => i.diff !== 0);

    return {
      shown,
      value: scoped.reduce((s, i) => s + i.value, 0),
      balanceValue: scoped.reduce((s, i) => s + i.balanceValue, 0),
      units: scoped.reduce((s, i) => s + Math.max(i.counted, 0), 0),
      balanceUnits: scoped.reduce((s, i) => s + i.balance, 0),
      inStock: count('ok') + count('low'),
      active: scoped.filter((i) => i.status !== 'idle').length,
      out: count('out'),
      low: count('low'),
      diffs: diffs.length,
      diffUnits: diffs.reduce((s, i) => s + Math.abs(i.diff), 0),
      families: rankInventory(shown, (i) => i.family),
      designs: rankInventory(shown, (i) => i.design),
      restock: scoped
        .filter((i) => (i.status === 'out' || i.status === 'low') && i.exits > 0)
        .sort((a, b) => b.exits - a.exits)
        .slice(0, 10),
      mismatches: [...diffs].sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff)).slice(0, 10),
    };
  }, [items, family, ruling, status, query]);

  return (
    <div className="flex flex-col gap-5">
      <div className="card px-4 py-3 flex flex-wrap items-center gap-x-5 gap-y-3">
        <Boxes size={13} className="text-brand-text-muted" />
        <FilterSelect label="Familia" value={family} options={options(items.map((i) => i.family))} onChange={setFamily} />
        <FilterSelect label="Hoja" value={ruling} options={options(items.map((i) => i.ruling))} onChange={setRuling} />
        <FilterSelect label="Estado" value={status} options={STATUS_OPTIONS} onChange={setStatus} />
        <label className="ml-auto relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar producto o SKU"
            className="w-56 bg-brand-bg border border-brand-border rounded-lg text-[11px] text-brand-navy pl-7 pr-3 py-1.5 placeholder:text-brand-text-muted hover:border-brand-blue focus:outline-none focus:border-brand-navy transition-colors"
          />
        </label>
      </div>

      <div className="grid grid-cols-6 gap-3">
        <KpiCard label="Valor inventario" value={fmtCompact(view.value)} hint={`Según saldo: ${fmtCompact(view.balanceValue)}`} />
        <KpiCard label="Unidades en bodega" value={fmtInt(view.units)} hint={`Saldo calculado: ${fmtInt(view.balanceUnits)}`} />
        <KpiCard label="Referencias con stock" value={fmtInt(view.inStock)} hint={`de ${fmtInt(view.active)} con movimiento`} />
        <KpiCard label="Agotadas" value={fmtInt(view.out)} hint="Tuvieron movimiento" />
        <KpiCard label="Stock bajo" value={fmtInt(view.low)} hint={`${LOW_STOCK} unidades o menos`} />
        <KpiCard label="Descuadres" value={fmtInt(view.diffs)} hint={`${fmtInt(view.diffUnits)} unidades de diferencia`} />
      </div>

      <div className="grid grid-cols-2 gap-5 items-start">
        <RankingTable title="Valor por familia" keyLabel="Familia" rows={view.families} valueLabel="Valor" />
        <RankingTable title="Valor por diseño" keyLabel="Diseño" rows={view.designs} valueLabel="Valor" limit={12} />
      </div>

      <div className="grid grid-cols-2 gap-5 items-start">
        <ShortList
          title="Por reponer"
          note={`Agotadas o con ${LOW_STOCK} unidades o menos, ordenadas por lo que más ha salido.`}
          items={view.restock}
          columns={[
            { label: 'Salidas', value: (i) => fmtInt(i.exits) },
            { label: 'Conteo', value: (i) => <span className="font-semibold">{fmtInt(i.counted)}</span> },
          ]}
        />
        <ShortList
          title="Descuadres más grandes"
          note="Diferencia = saldo (entrada − salidas) − conteo físico. Negativa: hay más en bodega de lo registrado."
          items={view.mismatches}
          columns={[
            { label: 'Saldo', value: (i) => fmtInt(i.balance) },
            { label: 'Conteo', value: (i) => fmtInt(i.counted) },
            { label: 'Dif.', value: (i) => <span className="font-semibold text-alert-warning">{fmtInt(i.diff)}</span> },
          ]}
        />
      </div>

      <InventoryTable items={view.shown} />
    </div>
  );
}
