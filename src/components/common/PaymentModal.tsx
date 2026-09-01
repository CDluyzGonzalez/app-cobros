import React, { useState } from 'react';
import { X, CheckCircle2, DollarSign, Calendar, CreditCard } from 'lucide-react';
import { Service } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface PaymentModalProps {
  service: Service;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (nextDate: string) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  service,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [valor, setValor] = useState(service.valor.toString());
  const [metodo, setMetodo] = useState('Transferencia (Bancolombia / Nequi)');
  const [comprobante, setComprobante] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Cálculo visual del próximo ciclo (+30 días fijo)
  const curTargetDate = new Date(service.fecha_proximo_pago || '2026-08-31');
  const nextTargetDate = new Date(curTargetDate);
  nextTargetDate.setDate(nextTargetDate.getDate() + 30);
  const nextDateFormatted = nextTargetDate.toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.registerPayment(
        {
          servicio_id: service.id,
          valor: Number(valor),
          metodo_pago: metodo,
          comprobante_ref: comprobante,
        },
        user || undefined
      );

      onSuccess(res.fecha_proximo_pago);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error registrando el pago');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/50"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-800/50 flex items-center justify-center text-emerald-400">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Registrar Pago</h3>
            <p className="text-xs text-slate-400">{service.cliente_nombre} • {service.plataforma}</p>
          </div>
        </div>

        {/* Regla fija de 30 días destacada */}
        <div className="mb-4 p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Fecha del ciclo actual:
            </span>
            <span className="font-semibold text-slate-200">{service.fecha_proximo_pago || 'Hoy'}</span>
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Próximo vencimiento (+30 días):
            </span>
            <span className="font-bold text-emerald-400">{nextDateFormatted}</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1.5 italic">
            * El retraso en el pago no altera la fecha del próximo ciclo.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Valor Recibido ($ COP)</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 text-sm">$</span>
              <input
                type="number"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                required
                className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-semibold text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Método de Pago</label>
            <select
              value={metodo}
              onChange={(e) => setMetodo(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
            >
              <option value="Transferencia (Bancolombia / Nequi)">Transferencia (Bancolombia / Nequi)</option>
              <option value="Daviplata">Daviplata</option>
              <option value="Efectivo">Efectivo</option>
              <option value="Otro">Otro</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Referencia / Comprobante (Opcional)</label>
            <input
              type="text"
              placeholder="Ej: #123456 o Nota"
              value={comprobante}
              onChange={(e) => setComprobante(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-xs transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950"
            >
              {loading ? 'Guardando...' : 'Confirmar Pago'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
