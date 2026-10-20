import { useMemo } from 'react';
import RankingTable from '../components/RankingTable';
import type { Dataset, Sale } from '../lib/sales';
import { periodLabel, periodRange, type Filters } from '../lib/filters';
import { rankBy, salesFor } from '../lib/metrics';
import { fmtCompact } from '../lib/format';

interface Props {
  ds: Dataset;
  filters: Filters;
}

const isShipping = (s: Sale) => s.category === 'Domicilios';

export default function ProductsPage({ ds, filters }: Props) {
  const { year, period } = filters;
  const { rows, shippingNet } = useMemo(() => {
    const sales = salesFor(ds, year, periodRange(period)).filter((s) => s.net > 0);
    const products = sales.filter((s) => !isShipping(s));
    const shippingNet = sales.filter(isShipping).reduce((sum, s) => sum + s.net, 0);
    return { rows: rankBy(products, (s) => s.item, { subOf: (s) => s.ref }), shippingNet };
  }, [ds, year, period]);

  const periodText = period === 'all' ? String(year) : `${periodLabel(period)} ${year}`;
  const note = `${rows.length} productos · domicilios aparte (${fmtCompact(shippingNet)})`;

  return (
    <div className="grid grid-cols-2 gap-5 items-start">
      <RankingTable
        title={`Top productos por ventas · ${periodText}`}
        keyLabel="Producto"
        rows={rows}
        limit={20}
        note={note}
      />
      <RankingTable
        title={`Top productos por unidades · ${periodText}`}
        keyLabel="Producto"
        rows={rows}
        metric="units"
        limit={20}
      />
    </div>
  );
}
