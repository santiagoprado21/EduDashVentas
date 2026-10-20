import { Bar, BarChart, CartesianGrid, Cell, LabelList, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartTooltip from './ChartTooltip';
import { COLORS, OUT_OF_PERIOD_OPACITY, axisProps, legendProps, yAxisProps } from './theme';
import { fmtPct } from '../../lib/format';

interface Props {
  data: { label: string; actual: number | null; budget: number | null; pct: number | null; inPeriod: boolean }[];
}

const BUDGET_OPACITY = 0.55;

export default function BudgetChart({ data }: Props) {
  const pctByLabel = new Map(data.map((d) => [d.label, d.pct]));
  const footer = (label: string) => {
    const pct = pctByLabel.get(label);
    return pct == null ? null : `Cumplimiento ${fmtPct(pct, 0)}`;
  };

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} barGap={2} margin={{ top: 16, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={COLORS.grid} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis {...yAxisProps} />
        <Tooltip content={<ChartTooltip footer={footer} />} cursor={{ fill: COLORS.grid }} />
        <Legend {...legendProps} />
        <Bar dataKey="budget" name="Presupuesto" fill={COLORS.budget} fillOpacity={BUDGET_OPACITY} radius={[3, 3, 0, 0]}>
          {data.map((d) => (
            <Cell
              key={d.label}
              fillOpacity={d.inPeriod ? BUDGET_OPACITY : BUDGET_OPACITY * OUT_OF_PERIOD_OPACITY}
            />
          ))}
        </Bar>
        <Bar dataKey="actual" name="Ejecutado" fill={COLORS.primary} radius={[3, 3, 0, 0]}>
          {data.map((d) => (
            <Cell key={d.label} fillOpacity={d.inPeriod ? 1 : OUT_OF_PERIOD_OPACITY} />
          ))}
          <LabelList
            dataKey="pct"
            position="top"
            formatter={(v: number | null) => (v == null ? '' : fmtPct(v, 0))}
            style={{ fontSize: 9, fill: COLORS.label, fontWeight: 600 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
