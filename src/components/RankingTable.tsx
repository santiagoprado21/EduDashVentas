import type { RankRow } from '../lib/metrics';
import { fmtCompact, fmtCOP, fmtInt, fmtPct } from '../lib/format';

interface Props {
  title: string;
  keyLabel: string;
  rows: RankRow[];
  metric?: 'net' | 'units';
  limit?: number;
  note?: string;
}

export default function RankingTable({ title, keyLabel, rows, metric = 'net', limit = 10, note }: Props) {
  const totalUnits = rows.reduce((sum, r) => sum + r.units, 0);
  const shareOf = (r: RankRow) => (metric === 'net' ? r.share : totalUnits ? r.units / totalUnits : 0);
  const sorted = metric === 'net' ? rows : [...rows].sort((a, b) => b.units - a.units);
  const visible = sorted.slice(0, limit);
  const maxShare = Math.max(0, ...visible.map(shareOf));

  return (
    <div className="card p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="section-title">{title}</h2>
        {note && <span className="text-[10px] text-brand-text-muted">{note}</span>}
      </div>
      {visible.length === 0 ? (
        <div className="text-[11px] text-brand-text-muted py-6 text-center">Sin ventas en este periodo</div>
      ) : (
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-brand-border text-brand-text-secondary">
              <th className="text-left font-semibold py-1.5 w-6">#</th>
              <th className="text-left font-semibold py-1.5">{keyLabel}</th>
              <th className="text-right font-semibold py-1.5">Ventas</th>
              <th className="text-right font-semibold py-1.5 w-14">Unid.</th>
              <th className="text-left font-semibold py-1.5 pl-4 w-36">
                Part. {metric === 'net' ? 'ventas' : 'unidades'}
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r, i) => {
              const share = shareOf(r);
              return (
                <tr key={r.key} className={i % 2 ? 'bg-brand-bg/40' : 'bg-white'}>
                  <td className="py-1.5 text-brand-text-muted tabular-nums">{i + 1}</td>
                  <td className="py-1.5 pr-3">
                    <div className="text-brand-navy font-medium truncate max-w-[260px]" title={r.label}>
                      {r.label}
                    </div>
                    {r.sub && <div className="text-[9px] text-brand-text-muted">{r.sub}</div>}
                  </td>
                  <td
                    className="py-1.5 text-right font-semibold tabular-nums whitespace-nowrap"
                    title={fmtCOP(r.net)}
                  >
                    {fmtCompact(r.net)}
                  </td>
                  <td className="py-1.5 text-right tabular-nums text-brand-text-secondary">
                    {fmtInt(r.units)}
                  </td>
                  <td className="py-1.5 pl-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-brand-bg overflow-hidden">
                        <div
                          className="h-full rounded-full bg-brand-navy"
                          style={{ width: `${maxShare ? (share / maxShare) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-brand-text-secondary tabular-nums w-9 text-right">
                        {fmtPct(share)}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
