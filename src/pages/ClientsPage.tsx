import { useMemo } from 'react';
import RankingTable from '../components/RankingTable';
import type { Dataset } from '../lib/sales';
import { periodLabel, periodRange, type Filters } from '../lib/filters';
import { rankBy, salesFor } from '../lib/metrics';
import { fmtCompact, fmtPct } from '../lib/format';

interface Props {
  ds: Dataset;
  filters: Filters;
}

export default function ClientsPage({ ds, filters }: Props) {
  const { year, period } = filters;
  const { rows, genericNet, total } = useMemo(() => {
    const sales = salesFor(ds, year, periodRange(period));
    const total = sales.reduce((sum, s) => sum + s.net, 0);
    const genericNet = sales.filter((s) => s.genericClient).reduce((sum, s) => sum + s.net, 0);
    const rows = rankBy(sales, (s) => (s.genericClient ? null : s.clientId || s.client), {
      labelOf: (s) => s.client,
      total,
    });
    return { rows, genericNet, total };
  }, [ds, year, period]);

  const periodText = period === 'all' ? String(year) : `${periodLabel(period)} ${year}`;

  return (
    <RankingTable
      title={`Top clientes · ${periodText}`}
      keyLabel="Cliente"
      rows={rows}
      limit={25}
      note={`Ventas genéricas / consumidor final: ${fmtCompact(genericNet)} (${fmtPct(total ? genericNet / total : 0)})`}
    />
  );
}
