import { fmtDelta } from '../lib/format';

interface Props {
  label: string;
  value: string;
  delta?: number | null;
  deltaLabel?: string;
  hint?: string;
}

export default function KpiCard({ label, value, delta, deltaLabel, hint }: Props) {
  return (
    <div className="kpi-card">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-brand-text-muted">
        {label}
      </div>
      <div className="text-2xl font-bold text-brand-navy tracking-tight mt-1.5">{value}</div>
      {delta != null && (
        <div className="text-xs mt-0.5">
          <span className={delta >= 0 ? 'delta-positive' : 'delta-negative'}>{fmtDelta(delta)}</span>
          {deltaLabel && <span className="text-[10px] text-brand-text-muted ml-1">{deltaLabel}</span>}
        </div>
      )}
      {hint && <div className="text-[10px] text-brand-text-muted mt-0.5">{hint}</div>}
    </div>
  );
}
