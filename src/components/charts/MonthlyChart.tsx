import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartTooltip from './ChartTooltip';
import { COLORS, OUT_OF_PERIOD_OPACITY, axisProps, legendProps, yAxisProps } from './theme';

interface Props {
  data: { label: string; actual: number | null; prev: number | null; inPeriod: boolean }[];
  year: number;
}

export default function MonthlyChart({ data, year }: Props) {
  const opacity = (inPeriod: boolean) => (inPeriod ? 1 : OUT_OF_PERIOD_OPACITY);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} barGap={2} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={COLORS.grid} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis {...yAxisProps} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: COLORS.grid }} />
        <Legend {...legendProps} />
        <Bar dataKey="prev" name={String(year - 1)} fill={COLORS.comparison} radius={[3, 3, 0, 0]}>
          {data.map((d) => (
            <Cell key={d.label} fillOpacity={opacity(d.inPeriod)} />
          ))}
        </Bar>
        <Bar dataKey="actual" name={String(year)} fill={COLORS.primary} radius={[3, 3, 0, 0]}>
          {data.map((d) => (
            <Cell key={d.label} fillOpacity={opacity(d.inPeriod)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
