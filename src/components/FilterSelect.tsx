import { ChevronDown } from 'lucide-react';

interface Props {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

export default function FilterSelect({ label, value, options, onChange }: Props) {
  return (
    <label className="flex items-center gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-brand-text-muted">
        {label}
      </span>
      <span className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none bg-brand-bg border border-brand-border rounded-lg text-[11px] font-semibold text-brand-navy pl-3 pr-7 py-1.5 hover:border-brand-blue focus:outline-none focus:border-brand-navy transition-colors"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={12}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-brand-text-muted pointer-events-none"
        />
      </span>
    </label>
  );
}
