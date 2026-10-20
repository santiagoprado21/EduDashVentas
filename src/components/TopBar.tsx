import { LogOut, RefreshCw } from 'lucide-react';

interface Props {
  fetchedAt?: string;
  loading: boolean;
  onRefresh: () => void;
  onLogout: () => void;
}

export default function TopBar({ fetchedAt, loading, onRefresh, onLogout }: Props) {
  return (
    <header
      className="fixed top-0 left-0 right-0 bg-white border-b-2 border-brand-red z-30 flex items-center"
      style={{ height: 'var(--topbar-height)' }}
    >
      <div
        className="h-full flex items-center gap-2.5 px-4 border-r border-brand-border"
        style={{ width: 'var(--sidebar-width)' }}
      >
        <div className="w-6 h-6 bg-brand-red rounded flex items-center justify-center">
          <span className="text-white font-black text-[10px]">V</span>
        </div>
        <div className="leading-tight">
          <div className="text-[12px] font-bold text-brand-navy tracking-tight">Ventas</div>
          <div className="text-[9px] text-brand-text-muted">Histórico</div>
        </div>
      </div>

      <div className="flex-1 flex items-center gap-4 px-6">
        <div className="ml-auto flex items-center gap-3">
          {fetchedAt && (
            <span className="text-[10px] text-brand-text-muted">
              Actualizado {new Date(fetchedAt).toLocaleTimeString('es-CO')}
            </span>
          )}
          <button className="btn-secondary" onClick={onRefresh} disabled={loading}>
            <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
            Refrescar
          </button>
          <button className="btn-secondary" onClick={onLogout} title="Cerrar sesión">
            <LogOut size={11} />
            Salir
          </button>
        </div>
      </div>
    </header>
  );
}
