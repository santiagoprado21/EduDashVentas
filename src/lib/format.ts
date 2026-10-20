const decimal = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 });
const integer = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });

export const fmtInt = (v: number) => integer.format(v);

export const fmtCOP = (v: number) => `$ ${integer.format(v)}`;

export function fmtCompact(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1e9) return `$ ${decimal.format(v / 1e9)} MM`;
  if (abs >= 1e6) return `$ ${decimal.format(v / 1e6)} M`;
  if (abs >= 1e3) return `$ ${integer.format(v / 1e3)} mil`;
  return `$ ${integer.format(v)}`;
}

export const fmtPct = (v: number, digits = 1) =>
  `${new Intl.NumberFormat('es-CO', { maximumFractionDigits: digits }).format(v * 100)}%`;

export const fmtDelta = (v: number) => `${v >= 0 ? '+' : ''}${fmtPct(v)}`;

export const fmtDate = (d: Date) =>
  d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
