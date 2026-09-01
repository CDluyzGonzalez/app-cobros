import React, { useState } from 'react';
import { LockKeyhole, Link2, LoaderCircle, ShieldCheck } from 'lucide-react';
import { getScriptUrl, setScriptUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [apiUrl, setApiUrl] = useState(getScriptUrl());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const saveApiUrl = () => {
    try {
      const parsed = new URL(apiUrl);
      if (parsed.protocol !== 'https:' || !parsed.hostname.endsWith('google.com')) throw new Error();
      setScriptUrl(apiUrl);
      setSaved(true);
      setError('');
    } catch {
      setError('Ingresa la URL HTTPS /exec de tu Web App de Apps Script.');
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <section className="w-full max-w-md space-y-5">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center"><ShieldCheck /></div>
          <h1 className="text-xl font-bold">Cobros App</h1>
          <p className="text-sm text-slate-400">Acceso seguro a la operación</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold"><Link2 className="w-4 h-4 text-emerald-400" /> Conexión inicial</div>
          <input aria-label="URL de Apps Script" type="url" value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} placeholder="https://script.google.com/macros/s/.../exec" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs" />
          <button type="button" onClick={saveApiUrl} className="w-full rounded-xl bg-slate-800 px-3 py-2 text-xs font-semibold">Guardar URL de backend</button>
          {saved && <p className="text-xs text-emerald-400">URL guardada en este navegador.</p>}
        </div>
        <form onSubmit={submit} className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold"><LockKeyhole className="w-4 h-4 text-emerald-400" /> Iniciar sesión</div>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Correo" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
          <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
          {error && <p className="text-xs text-rose-400">{error}</p>}
          <button disabled={loading} className="w-full rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-bold disabled:opacity-50">{loading ? <LoaderCircle className="mx-auto w-4 h-4 animate-spin" /> : 'Ingresar'}</button>
        </form>
      </section>
    </main>
  );
};
