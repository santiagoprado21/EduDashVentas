import type { SheetData } from '../hooks/useSalesData';
import type { RankRow } from './metrics';

export const LOW_STOCK = 5;

export type StockStatus = 'ok' | 'low' | 'out' | 'idle';

export const STATUS_LABEL: Record<StockStatus, string> = {
  ok: 'Con stock',
  low: `Stock bajo (≤${LOW_STOCK})`,
  out: 'Agotado',
  idle: 'Sin movimiento',
};

export interface InventoryItem {
  sku: string;
  name: string;
  family: string;
  ruling: string;
  design: string;
  entries: number;
  exits: number;
  balance: number;
  counted: number;
  /** Saldo − conteo físico, igual que la columna DIFERENCIA del sheet. */
  diff: number;
  cost: number;
  value: number;
  balanceValue: number;
  status: StockStatus;
  sellThrough: number | null;
}

const FAMILIES: [RegExp, string][] = [
  [/^3-1[BCR]/, '1 materia'],
  [/^3-5[CRM]/, '5 materias'],
  [/^3-COS/, 'Cosidos'],
  [/^3-A/, 'Agendas'],
  [/^3-BIN/, 'Carpetas'],
  [/^3-PQ/, 'Paquetes de hojas'],
];

const RULINGS: [RegExp, string][] = [
  [/cuadros grandes/i, 'Cuadros grandes'],
  [/cuadros/i, 'Cuadros'],
  [/rayas/i, 'Rayas'],
  [/mixto/i, 'Mixto'],
  [/ferrocar+il/i, 'Ferrocarril'],
  [/en blanco|sin impresi[oó]n/i, 'Blanco'],
];

const NAME_NOISE =
  /\b(cuaderno|agenda|carpeta|paquete hojas|\d materias?|cosid[oa]|mediana|cuadros grandes|cuadros|rayas|mixto|en blanco|sin impresi[oó]n|ferrocar+il|primero|segundo|tercero|\d+ hojas|pequeño|\d+\s*[*x]\s*\d+( cm)?|50H|K5)\b/gi;

const titleCase = (s: string) => s.replace(/(^|\s)\p{Ll}/gu, (c) => c.toUpperCase());

const num = (v: string | undefined) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

function designOf(name: string, family: string) {
  if (family === 'Paquetes de hojas') return 'Paquete de hojas';
  const rest = name.replace(NAME_NOISE, ' ').replace(/\s+/g, ' ').trim();
  if (!rest) return 'Sin diseño';
  return rest === rest.toLowerCase() ? titleCase(rest) : rest;
}

export function parseInventory(data: SheetData): InventoryItem[] {
  return data.rows
    .filter((r) => (r['SKU'] ?? '').trim())
    .map((r) => {
      const sku = r['SKU'].trim();
      const name = (r['PRODUCTO'] ?? '').trim().replace(/\s+/g, ' ');
      const family = FAMILIES.find(([re]) => re.test(sku))?.[1] ?? 'Otros';
      const entries = num(r['ENTRADA']);
      const exits = num(r['SALIDAS']);
      const balance = num(r['SALDO']);
      const counted = num(r['CONFIRMACION']);
      const cost = num(r['COSTO UNT.']);
      return {
        sku,
        name,
        family,
        ruling: RULINGS.find(([re]) => re.test(name))?.[1] ?? '—',
        design: designOf(name, family),
        entries,
        exits,
        balance,
        counted,
        diff: num(r['DIFERENCIA']),
        cost,
        value: Math.max(counted, 0) * cost,
        balanceValue: num(r['TOTAL']),
        status:
          counted > LOW_STOCK ? 'ok' : counted > 0 ? 'low' : entries || exits ? 'out' : 'idle',
        sellThrough: entries > 0 ? exits / entries : null,
      } satisfies InventoryItem;
    });
}

/** Agrupa para RankingTable: net = valor del conteo, units = unidades contadas. */
export function rankInventory(items: InventoryItem[], keyOf: (i: InventoryItem) => string): RankRow[] {
  const total = items.reduce((s, i) => s + i.value, 0);
  const groups = new Map<string, { value: number; units: number; count: number }>();
  for (const i of items) {
    const key = keyOf(i);
    const g = groups.get(key) ?? { value: 0, units: 0, count: 0 };
    g.value += i.value;
    g.units += Math.max(i.counted, 0);
    g.count += 1;
    groups.set(key, g);
  }
  return [...groups.entries()]
    .map(([key, g]) => ({
      key,
      label: key,
      sub: `${g.count} ref.`,
      net: g.value,
      units: g.units,
      invoices: g.count,
      share: total ? g.value / total : 0,
    }))
    .sort((a, b) => b.net - a.net);
}
