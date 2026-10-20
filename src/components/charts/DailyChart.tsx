import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartTooltip from './ChartTooltip';
import { COLORS, axisProps, yAxisProps } from './theme';

export default function DailyChart({ data }: { data: { label: string; total: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={COLORS.grid} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis {...yAxisProps} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: COLORS.grid }} />
        <Bar dataKey="total" name="Ventas" fill={COLORS.primary} radius={[3, 3, 0, 0]} maxBarSize={56} />
      </BarChart>
    </ResponsiveContainer>
  );
}
