import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartTooltip from './ChartTooltip';
import { COLORS, OUT_OF_PERIOD_OPACITY, axisProps, channelColor, legendProps, yAxisProps } from './theme';

interface Props {
  data: ({ label: string; inPeriod: boolean } & Record<string, number | string | boolean | null>)[];
  channels: string[];
}

export default function ChannelChart({ data, channels }: Props) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={COLORS.grid} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis {...yAxisProps} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: COLORS.grid }} />
        <Legend {...legendProps} />
        {channels.map((c, i) => (
          <Bar
            key={c}
            dataKey={c}
            name={c}
            stackId="channels"
            fill={channelColor(c, i)}
            radius={i === channels.length - 1 ? [3, 3, 0, 0] : undefined}
          >
            {data.map((d) => (
              <Cell key={d.label} fillOpacity={d.inPeriod ? 1 : OUT_OF_PERIOD_OPACITY} />
            ))}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
