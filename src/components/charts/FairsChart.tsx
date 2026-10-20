import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartTooltip from './ChartTooltip';
import { COLORS, axisProps, legendProps, yAxisProps } from './theme';

interface Props {
  data: { label: string; sales: number; expenses: number }[];
}

export default function FairsChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} barGap={2} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={COLORS.grid} />
        <XAxis dataKey="label" {...axisProps} interval={0} />
        <YAxis {...yAxisProps} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: COLORS.grid }} />
        <Legend {...legendProps} />
        <Bar dataKey="sales" name="Ventas" fill={COLORS.primary} radius={[3, 3, 0, 0]} />
        <Bar dataKey="expenses" name="Gastos" fill={COLORS.expense} fillOpacity={0.8} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
