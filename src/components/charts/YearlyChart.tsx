import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartTooltip from './ChartTooltip';
import { COLORS, axisProps, yAxisProps } from './theme';

interface Props {
  data: { year: number; net: number }[];
  selected: number;
  partialYear?: number;
  partialNote?: string;
}

export default function YearlyChart({ data, selected, partialYear, partialNote }: Props) {
  const rows = data.map((d) => ({ label: String(d.year), net: d.net, year: d.year }));
  const footer = (label: string) => (Number(label) === partialYear ? partialNote ?? null : null);

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={rows} margin={{ top: 16, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={COLORS.grid} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis {...yAxisProps} />
        <Tooltip content={<ChartTooltip footer={footer} />} cursor={{ fill: COLORS.grid }} />
        <Bar dataKey="net" name="Ventas netas" radius={[3, 3, 0, 0]}>
          {rows.map((r) => (
            <Cell key={r.year} fill={r.year === selected ? COLORS.primary : COLORS.comparison} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
