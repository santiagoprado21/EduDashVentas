import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, LayoutDashboard, Package, Table2, Users } from 'lucide-react';
import TopBar from './components/TopBar';
import Sidebar, { type NavItem } from './components/Sidebar';
import FilterBar from './components/FilterBar';
import DataPreview from './components/DataPreview';
import OverviewPage from './pages/OverviewPage';
import ProductsPage from './pages/ProductsPage';
import ClientsPage from './pages/ClientsPage';
import { useSalesData } from './hooks/useSalesData';
import { parseDataset } from './lib/sales';
import { DIMENSION_DEFAULTS, applyDimensionFilters, type Filters } from './lib/filters';

const easing = [0.16, 1, 0.3, 1] as const;

const NAV: NavItem[] = [
  { id: 'overview', label: 'Resumen', icon: LayoutDashboard },
  { id: 'products', label: 'Productos', icon: Package },
  { id: 'clients', label: 'Clientes', icon: Users },
  { id: 'data', label: 'Datos', icon: Table2 },
];

type FilterState = Omit<Filters, 'year'> & { year: number | null };

export default function App() {
  const [tab, setTab] = useState('overview');
  const [filterState, setFilterState] = useState<FilterState>({ year: null, ...DIMENSION_DEFAULTS });
  const sales = useSalesData();
  const current = NAV.find((n) => n.id === tab)!;

  const ds = useMemo(() => (sales.data ? parseDataset(sales.data) : null), [sales.data]);
  const filters: Filters = {
    ...filterState,
    year: filterState.year ?? ds?.years[0] ?? new Date().getFullYear(),
  };
  const filtered = useMemo(
    () => (ds ? applyDimensionFilters(ds, filters) : null),
    [ds, filters.vendor, filters.category, filters.prefix, filters.clientType],
  );

  return (
    <div className="min-h-screen bg-brand-bg">
      <TopBar
        fetchedAt={sales.data?.fetchedAt}
        loading={sales.status === 'loading'}
        onRefresh={sales.refresh}
      />
      <Sidebar items={NAV} active={tab} onSelect={setTab} />

      <main
        style={{
          paddingLeft: 'calc(var(--sidebar-width) + 2rem)',
          paddingTop: 'calc(var(--topbar-height) + 2rem)',
          paddingRight: '2rem',
          paddingBottom: '3rem',
        }}
      >
        <motion.h1
          key={tab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="text-lg font-bold text-brand-navy tracking-tight mb-5"
        >
          {current.label}
        </motion.h1>

        {sales.status === 'error' && (
          <div className="card mb-5 p-4 flex items-start gap-3 border-red-200 bg-red-50">
            <AlertTriangle size={14} className="text-alert-critical mt-0.5" />
            <div>
              <div className="text-[12px] font-semibold text-red-700">
                No se pudo leer el sheet
              </div>
              <div className="text-[11px] text-red-600 mt-0.5">{sales.error}</div>
            </div>
          </div>
        )}

        {!sales.data && sales.status === 'loading' && (
          <div className="flex flex-col items-center py-24 gap-3">
            <div className="w-8 h-8 border-2 border-brand-border border-t-brand-navy rounded-full animate-spin" />
            <span className="text-[12px] text-brand-text-muted">Cargando datos…</span>
          </div>
        )}

        {ds && tab !== 'data' && <FilterBar ds={ds} filters={filters} onChange={setFilterState} />}

        <AnimatePresence mode="wait">
          {sales.data && filtered && (
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3, ease: easing }}
            >
              {tab === 'overview' && <OverviewPage ds={filtered} filters={filters} />}
              {tab === 'products' && <ProductsPage ds={filtered} filters={filters} />}
              {tab === 'clients' && <ClientsPage ds={filtered} filters={filters} />}
              {tab === 'data' && <DataPreview data={sales.data} />}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
