import type { TooltipProps } from 'recharts';
import { fmtCOP } from '../../lib/format';

export default function ChartTooltip({
  active,
  payload,
  label,
  footer,
}: TooltipProps<number, string> & { footer?: (label: string) => string | null }) {
  if (!active || !payload?.length) return null;
  const note = footer?.(String(label));

  return (
    <div className="bg-white border border-brand-border rounded-lg shadow-card-hover px-3 py-2 text-[11px]">
      <div className="font-semibold text-brand-navy mb-1">{label}</div>
      {payload.map((p) =>
        p.value == null ? null : (
          <div key={p.dataKey as string} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-brand-text-secondary">{p.name}</span>
            <span className="ml-auto pl-3 font-semibold tabular-nums">{fmtCOP(p.value)}</span>
          </div>
        ),
      )}
      {note && <div className="text-[10px] text-brand-text-muted mt-1">{note}</div>}
    </div>
  );
}
