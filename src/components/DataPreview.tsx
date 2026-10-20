import type { SheetData } from '../hooks/useSalesData';

const PREVIEW_ROWS = 50;

export default function DataPreview({ data }: { data: SheetData }) {
  const rows = data.rows.slice(0, PREVIEW_ROWS);

  return (
    <div className="card overflow-hidden">
      <div className="px-4 pt-4 flex items-baseline justify-between">
        <h2 className="section-title">Datos del sheet</h2>
        <span className="text-[10px] text-brand-text-muted">
          {data.rows.length.toLocaleString('es-CO')} filas · {data.headers.length} columnas
        </span>
      </div>
      <div className="overflow-auto max-h-[60vh]">
        <table className="w-full text-[11px]">
          <thead className="sticky top-0 bg-white">
            <tr className="border-b border-brand-border">
              {data.headers.map((h) => (
                <th
                  key={h}
                  className="text-left font-semibold text-brand-text-secondary px-4 py-2 whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={i % 2 ? 'bg-brand-bg/40' : 'bg-white'}>
                {data.headers.map((h) => (
                  <td key={h} className="px-4 py-1.5 whitespace-nowrap text-brand-navy">
                    {row[h]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.rows.length > PREVIEW_ROWS && (
        <div className="px-4 py-2 border-t border-brand-border text-[10px] text-brand-text-muted">
          Mostrando las primeras {PREVIEW_ROWS} filas
        </div>
      )}
    </div>
  );
}
