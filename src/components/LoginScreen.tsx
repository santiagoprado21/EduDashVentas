import { useState, type FormEvent } from 'react';
import { Lock } from 'lucide-react';

export default function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center">
      <form onSubmit={submit} className="card w-[340px] p-6 flex flex-col gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-red rounded flex items-center justify-center">
            <Lock size={14} className="text-white" />
          </div>
          <div className="leading-tight">
            <div className="text-[13px] font-bold text-brand-navy tracking-tight">Ventas</div>
            <div className="text-[10px] text-brand-text-muted">Acceso restringido</div>
          </div>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-brand-text-muted">
            Contraseña
          </span>
          <input
            type="password"
            autoFocus
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-brand-bg border border-brand-border rounded-lg text-[12px] text-brand-navy px-3 py-2 focus:outline-none focus:border-brand-navy transition-colors"
          />
        </label>

        {error && <div className="text-[11px] text-alert-critical">{error}</div>}

        <button
          type="submit"
          disabled={!password || submitting}
          className="bg-brand-navy text-white rounded-lg text-[12px] font-semibold py-2 hover:bg-brand-navy/90 disabled:opacity-25 transition-opacity"
        >
          {submitting ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
