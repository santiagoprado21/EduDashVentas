import { useMemo, useState } from 'react';
import { ArrowLeft, Store } from 'lucide-react';
import KpiCard from '../components/KpiCard';
import RankingTable from '../components/RankingTable';
import FilterSelect from '../components/FilterSelect';
import FairsChart from '../components/charts/FairsChart';
import DailyChart from '../components/charts/DailyChart';
import {
  parseFairs,
  rankExpenses,
  rankSales,
  salesByDay,
  summarizeAll,
  summarizeFair,
  type FairSale,
  type FairSummary,
  type FeriasPayload,
} from '../lib/ferias';
import { fmtCOP, fmtCompact, fmtInt, fmtPct } from '../lib/format';

const KIND_OPTIONS = [
  { value: 'all', label: 'Todas' },
  { value: 'Venta directa', label: 'Venta directa' },
  { value: 'Pedido', label: 'Pedidos' },
];

const shortDate = (d: Date | null) =>
  d ? d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) : '—';

function dateRange(s: FairSummary) {
  const { start, end } = s.fair;
  if (!start) return 'Sin fecha';
  if (!end || end.getTime() === start.getTime()) return shortDate(start);
  return `${shortDate(start)} – ${shortDate(end)}`;
}

function Kpis({ s, count }: { s: Omit<FairSummary, 'fair'>; count?: number }) {
  return (
    <div className="grid grid-cols-6 gap-3">
      <KpiCard label="Ventas" value={fmtCompact(s.sales)} hint={count != null ? `${count} ferias con ventas` : undefined} />
      <KpiCard label="Gastos" value={fmtCompact(s.expenses)} />
      <KpiCard
        label="Ganancia"
        value={fmtCompact(s.profit)}
        hint={s.margin != null ? `Margen ${fmtPct(s.margin, 0)}` : undefined}
      />
      <KpiCard label="Unidades" value={fmtInt(s.units)} />
      <KpiCard label="Ticket promedio" value={fmtCompact(s.avgTicket)} hint="Ventas directas" />
      <KpiCard label="Ventas por día" value={s.perDay != null ? fmtCompact(s.perDay) : '—'} />
    </div>
  );
}

function FairsTable({ rows, onSelect }: { rows: FairSummary[]; onSelect: (name: string) => void }) {
  return (
    <div className="card p-4">
      <h2 className="section-title">Ferias · haz clic para ver el detalle</h2>
      <table className="w-full text-[11px]">
        <thead>
          <tr className="border-b border-brand-border text-brand-text-secondary">
            {['Feria', 'Fecha', 'Días', 'Ventas', 'Gastos', 'Ganancia', 'Margen', 'Ventas/día', 'Unid.'].map((h, i) => (
              <th key={h} className={`font-semibold py-1.5 ${i < 2 ? 'text-left' : 'text-right'}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={r.fair.name}
              onClick={() => onSelect(r.fair.name)}
              className={`cursor-pointer hover:bg-brand-blue/10 ${i % 2 ? 'bg-brand-bg/40' : 'bg-white'}`}
            >
              <td className="py-1.5 pr-3">
                <div className="font-medium text-brand-navy">{r.fair.name}</div>
                {r.fair.city && <div className="text-[9px] text-brand-text-muted">{r.fair.city}</div>}
              </td>
              <td className="py-1.5 text-brand-text-secondary whitespace-nowrap">{dateRange(r)}</td>
              <td className="py-1.5 text-right tabular-nums">{r.fair.days || '—'}</td>
              <td className="py-1.5 text-right font-semibold tabular-nums" title={fmtCOP(r.sales)}>
                {r.sales ? fmtCompact(r.sales) : '—'}
              </td>
              <td className="py-1.5 text-right tabular-nums text-alert-critical" title={fmtCOP(r.expenses)}>
                {r.expenses ? fmtCompact(r.expenses) : '—'}
              </td>
              <td
                className={`py-1.5 text-right font-semibold tabular-nums ${r.profit < 0 ? 'text-alert-critical' : ''}`}
                title={fmtCOP(r.profit)}
              >
                {r.sales || r.expenses ? fmtCompact(r.profit) : '—'}
              </td>
              <td className="py-1.5 text-right tabular-nums">{r.margin != null ? fmtPct(r.margin, 0) : '—'}</td>
              <td className="py-1.5 text-right tabular-nums">{r.perDay != null && r.sales ? fmtCompact(r.perDay) : '—'}</td>
              <td className="py-1.5 text-right tabular-nums text-brand-text-secondary">{fmtInt(r.units)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SalesDetail({ sales }: { sales: FairSale[] }) {
  return (
    <div className="card overflow-hidden">
      <div className="px-4 pt-4 flex items-baseline justify-between">
        <h2 className="section-title">Detalle de ventas</h2>
        <span className="text-[10px] text-brand-text-muted">{sales.length} registros</span>
      </div>
      <div className="overflow-auto max-h-[420px]">
        <table className="w-full text-[11px]">
          <thead className="sticky top-0 bg-white">
            <tr className="border-b border-brand-border text-brand-text-secondary">
              {['Fecha', 'Producto', 'Diseño', 'Tipo', 'Unid.', 'Precio', 'Total', 'Pago', 'Notas'].map((h) => (
                <th key={h} className="text-left font-semibold px-4 py-2 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sales.map((s, i) => (
              <tr key={i} className={i % 2 ? 'bg-brand-bg/40' : 'bg-white'}>
                <td className="px-4 py-1.5 whitespace-nowrap text-brand-text-secondary">{shortDate(s.date)}</td>
                <td className="px-4 py-1.5 whitespace-nowrap text-brand-navy">{s.product}</td>
                <td className="px-4 py-1.5 whitespace-nowrap">{s.design}</td>
                <td className="px-4 py-1.5 whitespace-nowrap">
                  {s.type}
                  {s.ruling && <span className="text-brand-text-muted"> · {s.ruling}</span>}
                </td>
                <td className="px-4 py-1.5 tabular-nums">{s.qty}</td>
                <td className="px-4 py-1.5 tabular-nums whitespace-nowrap">{fmtCOP(s.price)}</td>
                <td className="px-4 py-1.5 tabular-nums whitespace-nowrap font-semibold">{fmtCOP(s.total)}</td>
                <td className="px-4 py-1.5 whitespace-nowrap">
                  {s.payment}
                  {s.kind === 'Pedido' && <span className="ml-1 text-[9px] font-semibold text-brand-blue">PEDIDO</span>}
                </td>
                <td className="px-4 py-1.5 text-brand-text-muted max-w-[260px] truncate" title={s.notes}>
                  {s.notes}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function FeriasPage({ data }: { data: FeriasPayload }) {
  const [selected, setSelected] = useState('all');
  const [kind, setKind] = useState('all');
  const ds = useMemo(() => parseFairs(data), [data]);

  const view = useMemo(() => {
    const sales = ds.sales.filter(
      (s) => (selected === 'all' || s.fair === selected) && (kind === 'all' || s.kind === kind),
    );
    const expenses = ds.expenses.filter((e) => selected === 'all' || e.fair === selected);
    const perFair = summarizeAll(ds, kind);
    const fair = ds.fairs.find((f) => f.name === selected);

    const totalDays = perFair.filter((f) => f.sales > 0).reduce((s, f) => s + f.fair.days, 0);
    const totals = fair
      ? summarizeFair(fair, sales, expenses)
      : { ...summarizeFair({ name: '', city: '', start: null, end: null, days: totalDays, notes: '' }, sales, expenses) };

    return {
      sales,
      expenses,
      perFair,
      fair,
      totals,
      withSales: perFair.filter((f) => f.sales > 0).length,
      chart: perFair
        .filter((f) => f.sales || f.expenses)
        .map((f) => ({ label: f.fair.name.replace(/ - .*$/, ''), sales: f.sales, expenses: f.expenses })),
      designs: rankSales(sales, (s) => s.design),
      types: rankSales(sales, (s) => s.type),
      payments: rankSales(sales, (s) => s.payment),
      byDay: salesByDay(sales),
      expenseRows: rankExpenses(expenses),
    };
  }, [ds, selected, kind]);

  const fairOptions = [
    { value: 'all', label: 'Todas' },
    ...ds.fairs.map((f) => ({ value: f.name, label: f.name })),
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="card px-4 py-3 flex flex-wrap items-center gap-x-5 gap-y-3">
        <Store size={13} className="text-brand-text-muted" />
        <FilterSelect label="Feria" value={selected} options={fairOptions} onChange={setSelected} />
        <FilterSelect label="Tipo de venta" value={kind} options={KIND_OPTIONS} onChange={setKind} />
        {selected !== 'all' && (
          <button
            className="ml-auto flex items-center gap-1 text-[10px] font-semibold text-brand-text-secondary border border-brand-border rounded-lg px-2 py-1.5 hover:text-brand-navy hover:border-brand-blue transition-colors"
            onClick={() => setSelected('all')}
          >
            <ArrowLeft size={11} />
            Todas las ferias
          </button>
        )}
      </div>

      {view.fair && (
        <div className="-mt-2 text-[11px] text-brand-text-muted">
          {[view.fair.city, dateRange(summarizeFair(view.fair, [], [])), view.fair.days ? `${view.fair.days} días` : null]
            .filter(Boolean)
            .join(' · ')}
          {view.fair.notes && <span className="ml-2 text-alert-warning">· {view.fair.notes}</span>}
        </div>
      )}

      <Kpis s={view.totals} count={selected === 'all' ? view.withSales : undefined} />

      {selected === 'all' ? (
        <>
          <div className="card p-4">
            <h2 className="section-title">Ventas y gastos por feria</h2>
            <FairsChart data={view.chart} />
          </div>
          <FairsTable rows={view.perFair} onSelect={setSelected} />
        </>
      ) : (
        view.byDay.length > 1 && (
          <div className="card p-4">
            <h2 className="section-title">Ventas por día</h2>
            <DailyChart data={view.byDay} />
          </div>
        )
      )}

      <div className="grid grid-cols-2 gap-5 items-start">
        <RankingTable title="Diseños más vendidos" keyLabel="Diseño" rows={view.designs} limit={12} />
        <RankingTable title="Por tipo de producto" keyLabel="Tipo" rows={view.types} />
      </div>

      <div className="grid grid-cols-2 gap-5 items-start">
        <RankingTable
          title="Métodos de pago"
          keyLabel="Método"
          rows={view.payments}
          note="Unid. = unidades vendidas"
        />
        <RankingTable
          title="Gastos por concepto"
          keyLabel="Concepto"
          rows={view.expenseRows}
          valueLabel="Gasto"
          unitsLabel="Registros"
        />
      </div>

      {selected !== 'all' && <SalesDetail sales={view.sales} />}
    </div>
  );
}
