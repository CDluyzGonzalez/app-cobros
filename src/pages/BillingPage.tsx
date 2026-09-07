import React, { useState } from 'react';
import { CreditCard, Plus, Calendar, Edit2, Trash2, ChevronDown, ChevronUp, RotateCcw, AlertTriangle } from 'lucide-react';
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
  const [showPaidSection, setShowPaidSection] = useState(false);
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
    const platName = payment.plataforma && payment.plataforma !== 'N/A' ? payment.plataforma : payment.concepto;
    if (!confirm(`¿Confirmas el pago de ${formatCOP(payment.valor)} para ${platName}?`)) {
      return;
    }
    try {
      const result = await api.markPlatformPaymentPaid(payment.id, user?.nombre);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Error al registrar el pago');
    }
  };

  const handleUndoPaid = async (payment: PlatformPayment) => {
    const platName = payment.plataforma && payment.plataforma !== 'N/A' ? payment.plataforma : payment.concepto;
    if (!confirm(`¿Deseas revertir el pago de ${platName} y volver a dejarlo PENDIENTE?`)) {
      return;
    }
    try {
      await api.undoPlatformInvoice(payment.id);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Error al revertir el pago');
    }
  };

  const handleDelete = async (payment: PlatformPayment) => {
    const platName = payment.plataforma && payment.plataforma !== 'N/A' ? payment.plataforma : payment.concepto;
    if (!confirm(`¿Eliminar la cuenta por pagar de ${platName}?`)) return;
    try {
      await api.deletePlatformPayment(payment.id);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const formatCOP = (num: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(num || 0);

  // Formato de nombre del mes (ej: "Septiembre 2026")
  const getMonthTitle = (yearMonthStr: string) => {
    const [year, month] = yearMonthStr.split('-').map(Number);
    if (!year || !month) return yearMonthStr;
    const date = new Date(year, month - 1, 1);
    const monthName = date.toLocaleDateString('es-CO', { month: 'long' });
    return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;
  };

  // Extraer día para badge
  const getDayNumber = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    return parts[2] ? Number(parts[2]) : '';
  };

  // 1. Separar pagos PENDIENTES y PAGADOS
  const pendingPayments = payments.filter((p) => p.estado === 'PENDIENTE');
  const paidPayments = payments
    .filter((p) => p.estado === 'PAGADO')
    .sort((a, b) => (b.fecha_pago_real || b.fecha_limite || '').localeCompare(a.fecha_pago_real || a.fecha_limite || ''));

  // 2. Ordenar todos los pendientes ascendentemente por fecha_limite (Día 1 al 31)
  const sortedPending = [...pendingPayments].sort((a, b) =>
    (a.fecha_limite || '').localeCompare(b.fecha_limite || '')
  );

  // 3. Identificar Mes Actual y Mes Siguiente (Bimestral)
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthNum = now.getMonth() + 1; // 1-12
  const currentYearMonth = `${currentYear}-${String(currentMonthNum).padStart(2, '0')}`; // ej: "2026-09"

  let nextMonthNum = currentMonthNum + 1;
  let nextYearNum = currentYear;
  if (nextMonthNum > 12) {
    nextMonthNum = 1;
    nextYearNum += 1;
  }
  const nextYearMonth = `${nextYearNum}-${String(nextMonthNum).padStart(2, '0')}`; // ej: "2026-10"

  // Clasificar pendientes en bloques
  const overduePayments = sortedPending.filter((p) => (p.fecha_limite || '').slice(0, 7) < currentYearMonth);
  const currentMonthPayments = sortedPending.filter((p) => (p.fecha_limite || '').slice(0, 7) === currentYearMonth);
  const nextMonthPayments = sortedPending.filter((p) => (p.fecha_limite || '').slice(0, 7) === nextYearMonth);
  const futurePayments = sortedPending.filter((p) => (p.fecha_limite || '').slice(0, 7) > nextYearMonth);

  // Renderizar tarjeta de pago pendiente
  const renderPaymentCard = (p: PlatformPayment) => {
    const day = getDayNumber(p.fecha_limite);
    return (
      <div
        key={p.id}
        className="p-4 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl flex flex-col justify-between gap-3 transition-colors shadow-md"
      >
        <div>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-white truncate">{p.plataforma}</h3>
              <p className="text-xs text-slate-400 truncate">{p.concepto}</p>
            </div>
            <span className="text-sm font-bold text-rose-400 shrink-0">{formatCOP(p.valor)}</span>
          </div>

          <div className="mt-3 space-y-1 text-xs text-slate-400">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-slate-400">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Fecha Límite:
              </span>
              <span className="font-semibold text-slate-200">
                {p.fecha_limite} {day && <strong className="text-emerald-400 ml-1">(Día {day})</strong>}
              </span>
            </div>
            {p.notas && <p className="text-[11px] text-slate-500 italic mt-1">{p.notas}</p>}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border bg-amber-950/80 text-amber-400 border-amber-800">
            ⏳ Pendiente
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleOpenModal(p)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              title="Editar costo"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleDelete(p)}
              className="p-1.5 text-slate-500 hover:text-rose-300 rounded-lg hover:bg-slate-800"
              title="Eliminar cuenta por pagar"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleMarkPaid(p)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer shadow-sm active:scale-95"
            >
              Marcar Pagado
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" /> Pagos a Plataformas (Costos)
          </h2>
          <p className="text-xs text-slate-400">
            Cuentas matrices pendientes de pago organizadas cronológicamente día a día
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

      {/* ⚠️ BLOQUE 0: PAGOS ATRASADOS / VENCIDOS (Si existen) */}
      {overduePayments.length > 0 && (
        <div className="space-y-3 p-4 bg-rose-950/20 border border-rose-900/50 rounded-3xl">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>Cuentas Atrasadas / Vencidas</span>
            <span className="text-xs font-normal text-rose-300">({overduePayments.length})</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {overduePayments.map(renderPaymentCard)}
          </div>
        </div>
      )}

      {/* 📅 BLOQUE 1: MES ACTUAL (Ordenado del día 1 al 31) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <Calendar className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            {getMonthTitle(currentYearMonth)}
          </h3>
          <span className="text-xs text-slate-400">({currentMonthPayments.length} pendientes)</span>
        </div>

        {currentMonthPayments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {currentMonthPayments.map(renderPaymentCard)}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-slate-500 bg-slate-900/40 border border-slate-800/60 rounded-2xl">
            🎉 No hay pagos pendientes para este mes.
          </div>
        )}
      </div>

      {/* 📅 BLOQUE 2: MES SIGUIENTE (Bimestral, ordenado del día 1 al 31) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <Calendar className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            {getMonthTitle(nextYearMonth)}
          </h3>
          <span className="text-xs text-slate-400">({nextMonthPayments.length} pendientes)</span>
        </div>

        {nextMonthPayments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {nextMonthPayments.map(renderPaymentCard)}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-slate-500 bg-slate-900/40 border border-slate-800/60 rounded-2xl">
            No hay pagos programados aún para el próximo mes.
          </div>
        )}
      </div>

      {/* 📅 BLOQUE 3: OTROS MESES FUTUROS (Si aplica) */}
      {futurePayments.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Meses Posteriores
            </h3>
            <span className="text-xs text-slate-400">({futurePayments.length} pendientes)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {futurePayments.map(renderPaymentCard)}
          </div>
        </div>
      )}

      {/* 👁️ CAJÓN COLAPSABLE: VER CUENTAS PAGADAS (Con opción de Deshacer Pago) */}
      {paidPayments.length > 0 && (
        <div className="pt-4 border-t border-slate-800">
          <button
            onClick={() => setShowPaidSection(!showPaidSection)}
            className="w-full py-3 px-4 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl flex items-center justify-between text-xs font-semibold text-slate-300 transition-all cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Cuentas Pagadas ({paidPayments.length})
            </span>
            <span className="flex items-center gap-1 text-slate-400 text-[11px]">
              {showPaidSection ? 'Ocultar' : 'Ver historial'}
              {showPaidSection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </span>
          </button>

          {showPaidSection && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3 animate-fade-in">
              {paidPayments.map((p) => {
                const day = getDayNumber(p.fecha_limite);
                return (
                  <div
                    key={p.id}
                    className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-2xl flex flex-col justify-between gap-3 opacity-80 hover:opacity-100 transition-opacity"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-bold text-slate-200 truncate">{p.plataforma}</h3>
                          <p className="text-xs text-slate-500 truncate">{p.concepto}</p>
                        </div>
                        <span className="text-xs font-bold text-slate-400 shrink-0">{formatCOP(p.valor)}</span>
                      </div>
                      <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
                        <span>Límite: {p.fecha_limite} {day && `(Día ${day})`}</span>
                        <span className="text-[10px] text-emerald-400 font-medium">✓ Pagado</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/60 flex items-center justify-end">
                      <button
                        onClick={() => handleUndoPaid(p)}
                        className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Revertir y volver a dejar pendiente"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Deshacer Pago</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal nuevo/editar costo */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-4">
              {form.id ? 'Editar Costo de Plataforma' : 'Nueva Cuenta por Pagar'}
            </h3>
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
                      <option value="">-- Seleccionar de mis cuentas registradas --</option>
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.plataforma} ({acc.correo_cuenta})
                        </option>
                      ))}
                    </select>
                  )}
                  <input
                    type="text"
                    required
                    placeholder="Nombre o concepto (ej: Netflix, Spotify)"
                    value={form.plataforma}
                    onChange={(e) => setForm({ ...form, plataforma: e.target.value, concepto: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Valor a Pagar ($ COP)</label>
                  <input
                    type="number"
                    min="0"
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
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Notas u Origen de Pago</label>
                <input
                  type="text"
                  placeholder="Ej: Nu Spotify, Tarjeta Bancolombia"
                  value={form.notas}
                  onChange={(e) => setForm({ ...form, notas: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-950 cursor-pointer"
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
