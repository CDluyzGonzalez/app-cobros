import React, { useState } from 'react';
import { Layers, Plus, Search, Mail, Key, Users, DollarSign, Calendar, Edit2, Trash2 } from 'lucide-react';
import { Account } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface AccountsPageProps {
  accounts: Account[];
  onRefresh: () => void;
}

export const AccountsPage: React.FC<AccountsPageProps> = ({ accounts, onRefresh }) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    id: '',
    plataforma: 'Netflix',
    correo_cuenta: '',
    password: '',
    perfiles_totales: 5,
    cupos_ocupados: 0,
    costo_mensual: 64700,
    dia_pago_plataforma: '3',
    notas: '',
  });

  const handleOpenModal = (acc?: Account) => {
    if (acc) {
      setForm({
        id: acc.id,
        plataforma: acc.plataforma,
        correo_cuenta: acc.correo_cuenta,
        password: '',
        perfiles_totales: acc.perfiles_totales,
        cupos_ocupados: acc.cupos_ocupados,
        costo_mensual: acc.costo_mensual,
        dia_pago_plataforma: acc.dia_pago_plataforma,
        notas: acc.notas || '',
      });
    } else {
      setForm({
        id: '',
        plataforma: 'Netflix',
        correo_cuenta: '',
        password: '',
        perfiles_totales: 5,
        cupos_ocupados: 0,
        costo_mensual: 64700,
        dia_pago_plataforma: '1',
        notas: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.saveAccount(
        {
          ...form,
          perfiles_totales: Number(form.perfiles_totales),
          cupos_ocupados: Number(form.cupos_ocupados),
          costo_mensual: Number(form.costo_mensual),
        },
        user || undefined
      );
      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCancelAccount = async (account: Account) => {
    if (!confirm(`¿Cancelar ${account.plataforma} (${account.correo_cuenta})? Solo es posible sin servicios activos; se quitarán sus costos pendientes.`)) return;
    try {
      await api.cancelAccount(account.id);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filtered = accounts.filter(
    (a) =>
      a.plataforma.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.correo_cuenta.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCOP = (num: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(num);

  return (
    <div className="space-y-5 pb-20 md:pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" /> Cuentas de Plataforma y Cupos
          </h2>
          <p className="text-xs text-slate-400">Administra las cuentas matrices, correos, cupos y contraseñas</p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Cuenta</span>
        </button>
      </div>

      {/* Grid of Accounts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((acc) => {
          const availableSlots = acc.perfiles_totales - acc.cupos_ocupados;
          return (
            <div
              key={acc.id}
              onClick={() => handleOpenModal(acc)}
              className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 hover:border-slate-700 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">{acc.plataforma}</h3>
                  <p className="text-xs text-indigo-400 flex items-center gap-1 mt-0.5 font-mono">
                    <Mail className="w-3 h-3" /> {acc.correo_cuenta}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={(event) => { event.stopPropagation(); handleOpenModal(acc); }} className="p-1.5 text-slate-400 hover:text-white" title="Editar cuenta"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={(event) => { event.stopPropagation(); handleCancelAccount(acc); }} className="p-1.5 text-slate-500 hover:text-rose-300" title="Cancelar cuenta"><Trash2 className="w-3.5 h-3.5" /></button>
                  <span className="text-xs font-bold text-rose-400">{formatCOP(acc.costo_mensual)}</span>
                </div>
              </div>

              {/* Cupos Bar */}
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                  <span>Perfiles / Cupos</span>
                  <span className="font-semibold text-slate-200">
                    {acc.cupos_ocupados} de {acc.perfiles_totales} ocupados
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      availableSlots === 0 ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, (acc.cupos_ocupados / acc.perfiles_totales) * 100)}%` }}
                  />
                </div>
                {availableSlots > 0 ? (
                  <p className="text-[10px] text-emerald-400 mt-1">🟢 {availableSlots} cupo(s) disponible(s)</p>
                ) : (
                  <p className="text-[10px] text-rose-400 mt-1">🔴 Cuenta Llena</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                <span>Día de cobro: Día {acc.dia_pago_plataforma}</span>
                <span className="text-slate-500 font-mono text-[10px]">{acc.id}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Crear/Editar Cuenta */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-4">
              {form.id ? 'Editar Cuenta de Plataforma' : 'Registrar Nueva Cuenta'}
            </h3>
            <form onSubmit={handleSave} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Plataforma</label>
                  <input
                    type="text"
                    required
                    value={form.plataforma}
                    onChange={(e) => setForm({ ...form, plataforma: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Costo Mensual ($ COP)</label>
                  <input
                    type="number"
                    required
                    value={form.costo_mensual}
                    onChange={(e) => setForm({ ...form, costo_mensual: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Correo de la Cuenta</label>
                <input
                  type="email"
                  required
                  value={form.correo_cuenta}
                  onChange={(e) => setForm({ ...form, correo_cuenta: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Cupos Totales</label>
                  <input
                    type="number"
                    value={form.perfiles_totales}
                    onChange={(e) => setForm({ ...form, perfiles_totales: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Ocupados</label>
                  <input
                    type="number"
                    value={form.cupos_ocupados}
                    onChange={(e) => setForm({ ...form, cupos_ocupados: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Día de Pago</label>
                  <input
                    type="text"
                    placeholder="Ej: 15"
                    value={form.dia_pago_plataforma}
                    onChange={(e) => setForm({ ...form, dia_pago_plataforma: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 text-white font-semibold text-xs rounded-xl"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
