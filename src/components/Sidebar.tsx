import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface Props {
  items: NavItem[];
  active: string;
  onSelect: (id: string) => void;
}

export default function Sidebar({ items, active, onSelect }: Props) {
  return (
    <aside
      className="fixed left-0 top-0 h-full bg-white border-r border-brand-border"
      style={{ width: 'var(--sidebar-width)', paddingTop: 'var(--topbar-height)' }}
    >
      <nav className="p-3 flex flex-col gap-1">
        {items.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`nav-item ${active === id ? 'active' : ''}`}
            onClick={() => onSelect(id)}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
