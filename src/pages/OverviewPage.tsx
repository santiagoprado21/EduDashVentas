import { useMemo } from 'react';
import KpiCard from '../components/KpiCard';
import RankingTable from '../components/RankingTable';
import MonthlyChart from '../components/charts/MonthlyChart';
import BudgetChart from '../components/charts/BudgetChart';
import YearlyChart from '../components/charts/YearlyChart';
import ChannelChart from '../components/charts/ChannelChart';
import { UNCLASSIFIED, type Dataset } from '../lib/sales';
import { hasDimensionFilters, periodLabel, periodRange, type Filters } from '../lib/filters';
import {
  MONTHS,
  budgetAttainment,
  channelMonthly,
  cutoffFor,
  delta,
  monthlySeries,
  quarterlyBudget,
  rankBy,
  salesFor,
  summarize,
  yearlyTotals,
} from '../lib/metrics';
import { fmtCompact, fmtDate, fmtDelta, fmtInt, fmtPct } from '../lib/format';

interface Props {
  ds: Dataset;
  filters: Filters;
}

export default function OverviewPage({ ds, filters }: Props) {
  const { year, period, vendor } = filters;

  const m = useMemo(() => {
    const range = periodRange(period);
    const cutoff = cutoffFor(ds, year);
    const current = salesFor(ds, year, range);
    const previous = salesFor(ds, year - 1, range, cutoff.partial ? cutoff : undefined);

    const channelsYear = ds.channelsFrom?.getFullYear() ?? Infinity;
    const prevByChannel = new Map<string, number>();
    if (year - 1 >= channelsYear) {
      for (const s of previous) prevByChannel.set(s.channel, (prevByChannel.get(s.channel) ?? 0) + s.net);
    }
    const channels = rankBy(current, (s) => s.channel).map((r) => {
      const p = prevByChannel.get(r.key);
      return p ? { ...r, sub: `${fmtDelta((r.net - p) / p)} vs ${year - 1}` } : r;
    });

    return {
      channels,
      channelsCovered: year >= channelsYear,
      channelMonthly: channelMonthly(ds, year, range, channels.map((c) => c.key)),
      range,
      cutoff,
      cur: summarize(current),
      prev: summarize(previous),
      hasPrev: previous.length > 0,
      monthly: monthlySeries(ds, year, range),
      quarterly: quarterlyBudget(ds, year, range),
      attainment: budgetAttainment(ds, year, range),
      yearly: yearlyTotals(ds, range),
      vendors: rankBy(current, (s) => s.vendor),
      categories: rankBy(current, (s) => s.category),
    };
  }, [ds, year, period]);

  const { cur, prev, cutoff, attainment } = m;
  const dimensionFiltered = hasDimensionFilters(filters);
  const periodText = period === 'all' ? String(year) : `${periodLabel(period)} ${year}`;
  const vsLabel = m.hasPrev
    ? cutoff.partial
      ? `vs ${year - 1} a la misma fecha`
      : `vs ${year - 1}`
    : undefined;
  const d = (a: number, b: number) => (m.hasPrev ? delta(a, b) : null);
  const showBudget = !dimensionFiltered && m.quarterly.some((q) => q.budget);
  const partialNote = cutoff.partial ? `Hasta ${fmtDate(ds.lastDate)}` : undefined;

  const attainmentHint = dimensionFiltered
    ? 'Solo sin filtros de vendedor, categoría, canal, prefijo o cliente'
    : attainment
      ? `${MONTHS[attainment.range.from - 1]}–${MONTHS[attainment.range.to - 1]} · meta ${fmtCompact(attainment.budget)}`
      : 'Sin presupuesto en meses cerrados';

  return (
    <div className="flex flex-col gap-5">
      {cutoff.partial && (
        <div className="text-[11px] text-brand-text-muted -mt-3">
          Año en curso · datos hasta el {fmtDate(ds.lastDate)}
        </div>
      )}

      <div className="grid grid-cols-6 gap-3">
        <KpiCard
          label="Ventas netas"
          value={fmtCompact(cur.net)}
          delta={d(cur.net, prev.net)}
          deltaLabel={vsLabel}
          hint={`Descuento prom. ${fmtPct(cur.discountPct)}`}
        />
        <KpiCard
          label="Cumplimiento ppto."
          value={!dimensionFiltered && attainment ? fmtPct(attainment.pct, 0) : '—'}
          hint={attainmentHint}
        />
        <KpiCard
          label="Facturas"
          value={fmtInt(cur.invoices)}
          delta={d(cur.invoices, prev.invoices)}
          deltaLabel={vsLabel}
        />
        <KpiCard
          label="Ticket promedio"
          value={fmtCompact(cur.avgTicket)}
          delta={d(cur.avgTicket, prev.avgTicket)}
          deltaLabel={vsLabel}
        />
        <KpiCard
          label="Unidades"
          value={fmtInt(cur.units)}
          delta={d(cur.units, prev.units)}
          deltaLabel={vsLabel}
        />
        <KpiCard
          label="Clientes"
          value={fmtInt(cur.clients)}
          delta={d(cur.clients, prev.clients)}
          deltaLabel={vsLabel}
          hint="Sin ventas genéricas"
        />
      </div>

      <div className="card p-4">
        <h2 className="section-title">
          Ventas por mes · {year} vs {year - 1}
        </h2>
        <MonthlyChart data={m.monthly} year={year} />
      </div>

      {ds.channels.length > 0 && (
        <div className="grid grid-cols-2 gap-5 items-start">
          <RankingTable
            title={`Canales · ${periodText}`}
            keyLabel="Canal"
            rows={m.channels}
            note={
              m.channelsCovered
                ? undefined
                : `Antes de ${ds.channelsFrom?.getFullYear()} no hay pedidos de Shopify para cruzar: solo se identifican Colegio Bolívar y La Única`
            }
          />
          <div className="card p-4">
            <h2 className="section-title">Ventas por canal y mes · {year}</h2>
            <ChannelChart data={m.channelMonthly} channels={m.channels.map((c) => c.key)} />
            {m.channels.some((c) => c.key === UNCLASSIFIED) && m.channelsCovered && (
              <p className="text-[10px] text-brand-text-muted mt-2">
                "{UNCLASSIFIED}" son ventas anteriores al primer pedido de Shopify
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-5">
        <div className="card p-4">
          <h2 className="section-title">Ejecutado vs presupuesto · {year}</h2>
          {showBudget ? (
            <BudgetChart data={m.quarterly} />
          ) : (
            <div className="h-[240px] flex items-center justify-center text-center px-6 text-[11px] text-brand-text-muted">
              {dimensionFiltered
                ? 'El presupuesto es del total: quita los filtros de vendedor, categoría, canal, prefijo y cliente'
                : `No hay presupuesto cargado para ${year}`}
            </div>
          )}
        </div>
        <div className="card p-4">
          <h2 className="section-title">
            Ventas por año{period !== 'all' && ` · solo ${periodLabel(period)}`}
          </h2>
          <YearlyChart
            data={m.yearly}
            selected={year}
            partialYear={ds.lastDate.getFullYear()}
            partialNote={partialNote}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5 items-start">
        <RankingTable title={`Categorías · ${periodText}`} keyLabel="Categoría" rows={m.categories} />
        {vendor === 'all' ? (
          <RankingTable title={`Vendedores · ${periodText}`} keyLabel="Vendedor" rows={m.vendors} />
        ) : (
          <RankingTable
            title={`Vendedor · ${periodText}`}
            keyLabel="Vendedor"
            rows={m.vendors}
            note="Filtrado"
          />
        )}
      </div>
    </div>
  );
}
