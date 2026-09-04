import React, { useState } from 'react';
import { LockKeyhole, LoaderCircle, ShieldCheck, KeyRound, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Estados para modo Recuperación
  const [isResetMode, setIsResetMode] = useState(false);
  const [masterKey, setMasterKey] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await api.resetPassword({ email, masterKey, newPassword });
      setSuccessMsg(res.message || 'Contraseña restablecida. Ingresa con tu nueva contraseña.');
      setPassword(newPassword);
      setMasterKey('');
      setNewPassword('');
      setIsResetMode(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al restablecer contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <section className="w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          <img
            src="/logo.png"
            alt="Platnex - Tu Mundo Digital"
            className="w-28 h-28 mx-auto object-contain drop-shadow-xl rounded-2xl"
          />
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">PLATNEX</h1>
            <p className="text-xs font-medium text-emerald-400">Tu Mundo Digital &bull; Suscripciones</p>
          </div>
        </div>

        {!isResetMode ? (
          /* FORMULARIO DE INICIO DE SESIÓN */
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
            className="rounded-3xl border border-slate-800 bg-slate-900/90 backdrop-blur-md p-6 space-y-4 shadow-xl"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
              <LockKeyhole className="w-4 h-4 text-emerald-400" /> Iniciar sesión
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium">Correo electrónico</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-400 font-medium">Contraseña</label>
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setSuccessMsg('');
                    setIsResetMode(true);
                  }}
                  className="text-[11px] text-emerald-400 hover:underline cursor-pointer"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400 text-center font-medium">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-400 text-center font-medium">
                {successMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 transition-colors px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? <LoaderCircle className="w-5 h-5 animate-spin" /> : 'Ingresar al Sistema'}
            </button>

            {/* Divisor */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-slate-900 px-2 text-slate-500">o también</span>
              </div>
            </div>

            {/* Botón Acceso Rápido a Demo */}
            <button
              type="button"
              onClick={async () => {
                setLoading(true);
                setError('');
                try {
                  await api.loginDemo();
                  window.location.reload();
                } catch {
                  setError('Error al ingresar al modo demo.');
                } finally {
                  setLoading(false);
                }
              }}
              className="w-full py-3 px-4 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/50 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <span>👀 Probar versión Demo (Acceso libre)</span>
            </button>
          </form>
        ) : (
          /* FORMULARIO DE RESTABLECER CONTRASEÑA */
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleResetPassword();
            }}
            className="rounded-3xl border border-slate-800 bg-slate-900/90 backdrop-blur-md p-6 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                <KeyRound className="w-4 h-4 text-amber-400" /> Restablecer Contraseña
              </div>
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setIsResetMode(false);
                }}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Volver
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium">Tu correo registrado</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium">Clave Maestra de Seguridad</label>
              <input
                required
                type="password"
                value={masterKey}
                onChange={(e) => setMasterKey(e.target.value)}
                placeholder="Clave maestra secreta"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
              />
              <p className="text-[10px] text-slate-500">Palabra secreta configurada por el administrador.</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium">Nueva Contraseña</label>
              <input
                required
                minLength={6}
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400 text-center font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-amber-600 hover:bg-amber-500 transition-colors px-4 py-3 text-sm font-bold text-white shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? <LoaderCircle className="w-5 h-5 animate-spin" /> : 'Restablecer Contraseña'}
            </button>
          </form>
        )}
      </section>
    </main>
  );
};