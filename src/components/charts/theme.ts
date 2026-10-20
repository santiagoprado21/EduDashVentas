import { createElement } from 'react';
import { fmtCompact } from '../../lib/format';

export const COLORS = {
  primary: '#181856',
  comparison: '#599BE4',
  budget: '#89BF52',
  expense: '#D2312C',
  grid: '#EEF3F9',
  tick: '#9A9DB0',
  label: '#5F6378',
};

export const OUT_OF_PERIOD_OPACITY = 0.25;

export const SERIES = ['#181856', '#599BE4', '#89BF52', '#D2312C', '#EF7145', '#C042B6', '#469C6A', '#FBD94B'];

export const CHANNEL_COLORS: Record<string, string> = {
  'Colegio Bolívar': '#181856',
  'E-commerce': '#599BE4',
  'La Única': '#C042B6',
  Ferias: '#EF7145',
  'Sede Educambio': '#89BF52',
  Otros: '#9A9DB0',
  'Sin clasificar': '#D5DCE6',
};

export const channelColor = (channel: string, i = 0) => CHANNEL_COLORS[channel] ?? SERIES[i % SERIES.length];

export const axisProps = {
  tick: { fontSize: 9, fill: COLORS.tick },
  axisLine: false,
  tickLine: false,
} as const;

export const legendProps = {
  iconType: 'circle',
  iconSize: 7,
  wrapperStyle: { fontSize: 10, paddingTop: 8 },
  formatter: (value: string) => createElement('span', { style: { color: COLORS.label } }, value),
} as const;

export const yAxisProps = {
  ...axisProps,
  width: 56,
  tickFormatter: (v: number) => fmtCompact(v),
} as const;
