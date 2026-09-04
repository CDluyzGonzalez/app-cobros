import React, { useState } from 'react';
import { CreditCard, Plus, CheckCircle2, Clock, Calendar, DollarSign, Edit2, Trash2 } from 'lucide-react';
import { PlatformPayment, Account } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface BillingPageProps {
  payments: PlatformPayment[];
  accounts?: Account[];
  onRefresh: () => void;
}

export const BillingPage: React.FC<BillingPageProps> = ({ payments, accounts = [], onRefresh }) => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    id: '',
    cuenta_id: '',
    plataforma: '',
    concepto: '',
    valor: '',
    fecha_limite: '2026-09-01',
    notas: '',
  });

  const handleOpenModal = (payment?: PlatformPayment) => {
    setForm(payment ? {
      id: payment.id,
      cuenta_id: payment.cuenta_id || '',
      plataforma: payment.plataforma && payment.plataforma !== 'N/A' ? payment.plataforma : payment.concepto,
      concepto: payment.concepto,
      valor: String(payment.valor),
      fecha_limite: payment.fecha_limite,
      notas: payment.notas || '',
    } : {
      id: '',
      cuenta_id: accounts[0]?.id || '',
      plataforma: accounts[0]?.plataforma || 'Netflix',
      concepto: 'Pago mensual',
      valor: accounts[0]?.costo_mensual ? String(accounts[0].costo_mensual) : '64700',
      fecha_limite: '2026-09-01',
      notas: '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    try {
      await api.savePlatformPayment(
        {
          ...form,
          valor: Number(form.valor),
          estado: 'PENDIENTE',
        },
        user || undefined
      );
      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleMarkPaid = async (payment: PlatformPayment) => {
    try {
      const result = await api.markPlatformPaymentPaid(payment.id);
      alert(result.message);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (payment: PlatformPayment) => {
    if (!confirm(`¿Eliminar el costo pendiente de ${payment.plataforma}?`)) return;
    try { await api.deletePlatformPayment(payment.id); onRefresh(); }
    catch (err: any) { alert(err.message); }
  };

  const formatCOP = (num: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(num);

  const pendingCosts = payments.filter((p) => p.estado === 'PENDIENTE').reduce((acc, p) => acc + p.valor, 0);
  const paidCosts = payments.filter((p) => p.estado === 'PAGADO').reduce((acc, p) => acc + p.valor, 0);

  return (
    <div className="space-y-5 pb-20 md:pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" /> Pagos a Plataformas (Costos)
          </h2>
          <p className="text-xs text-slate-400">
            Pendiente por pagar: <span className="text-rose-400 font-bold">{formatCOP(pendingCosts)}</span>
            {paidCosts > 0 && <span className="ml-3 text-emerald-400">· Pagado este ciclo: {formatCOP(paidCosts)}</span>}
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Cuenta a Pagar</span>
        </button>
      </div>

      {/* Grid of payments */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {payments.map((p) => {
          const isPaid = p.estado === 'PAGADO';
          return (
            <div
              key={p.id}
              className={`p-4 bg-slate-900 border rounded-2xl flex flex-col justify-between gap-3 transition-colors ${
                isPaid ? 'border-slate-800 opacity-70' : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">{p.plataforma}</h3>
                    <p className="text-xs text-slate-400">{p.concepto}</p>
                  </div>
                  <span className="text-sm font-bold text-rose-400">{formatCOP(p.valor)}</span>
                </div>

                <div className="mt-3 space-y-1 text-xs text-slate-400">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Fecha Límite:
                    </span>
                    <span className="font-semibold text-slate-200">{p.fecha_limite}</span>
                  </div>
                  {p.notas && <p className="text-[11px] text-slate-500 italic mt-1">{p.notas}</p>}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                    isPaid
                      ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                      : 'bg-amber-950/80 text-amber-400 border-amber-800'
                  }`}
                >
                  {isPaid ? '✓ Pagado' : '⏳ Pendiente'}
                </span>

                <div className="flex items-center gap-1">
                  <button onClick={() => handleOpenModal(p)} className="p-1.5 text-slate-400 hover:text-white" title="Editar costo"><Edit2 className="w-3.5 h-3.5" /></button>
                  {!isPaid && <button onClick={() => handleDelete(p)} className="p-1.5 text-slate-500 hover:text-rose-300" title="Eliminar costo pendiente"><Trash2 className="w-3.5 h-3.5" /></button>}
                {!isPaid && (
                  <button
                    onClick={() => handleMarkPaid(p)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Marcar Pagado
                  </button>
                )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal nuevo pago */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-4">{form.id ? 'Editar Costo de Plataforma' : 'Nueva Factura de Plataforma'}</h3>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Cuenta Matriz o Plataforma</label>
                <div className="space-y-1.5">
                  {accounts.length > 0 && (
                    <select
                      value={form.cuenta_id}
                      onChange={(e) => {
                        const selectedAcc = accounts.find((a) => a.id === e.target.value);
                        if (selectedAcc) {
                          setForm({
                            ...form,
                            cuenta_id: selectedAcc.id,
                            plataforma: selectedAcc.plataforma,
                            concepto: `Pago mensual ${selectedAcc.plataforma} (${selectedAcc.correo_cuenta})`,
                            valor: String(selectedAcc.costo_mensual || form.valor),
                          });
                        } else {
                          setForm({ ...form, cuenta_id: '' });
                        }
                      }}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">-- Seleccionar cuenta existente (o escribir abajo) --</option>
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.plataforma} - {acc.correo_cuenta} (${acc.costo_mensual?.toLocaleString()})
                        </option>
                      ))}
                    </select>
                  )}
                  <input
                    type="text"
                    required
                    placeholder="Nombre de la plataforma (ej: Netflix)"
                    value={form.plataforma}
                    onChange={(e) => setForm({ ...form, plataforma: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Concepto</label>
                <input
                  type="text"
                  required
                  value={form.concepto}
                  onChange={(e) => setForm({ ...form, concepto: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Valor ($ COP)</label>
                <input
                  type="number"
                  required
                  value={form.valor}
                  onChange={(e) => setForm({ ...form, valor: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Fecha Límite</label>
                <input
                  type="date"
                  required
                  value={form.fecha_limite}
                  onChange={(e) => setForm({ ...form, fecha_limite: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                />
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
