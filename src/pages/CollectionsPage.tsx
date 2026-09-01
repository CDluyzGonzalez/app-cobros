import React, { useState } from 'react';
import {
  Clock,
  Search,
  CheckCircle2,
  AlertTriangle,
  Send,
  UserCheck,
  ShieldAlert,
  DollarSign,
  XCircle,
} from 'lucide-react';
import { Service, ServiceStatus } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { WhatsAppButton } from '../components/common/WhatsAppButton';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface CollectionsPageProps {
  services: Service[];
  onRefresh: () => void;
  onOpenPaymentModal: (service: Service) => void;
}

export const CollectionsPage: React.FC<CollectionsPageProps> = ({
  services,
  onRefresh,
  onOpenPaymentModal,
}) => {
  const { user } = useAuth();
  const [filter, setFilter] = useState<'ALL' | 'TODAY' | 'UPCOMING' | 'OVERDUE' | 'PENDING' | 'CANCEL_ALERT'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const formatCOP = (num: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(num);

  const handleConfirmIntent = async (service: Service) => {
    // Cliente dijo "SÍ" -> Pasa a PAGO_PENDIENTE y arranca el contador de 24 horas
    setActionLoading(service.id);
    try {
      await api.changeStatus(service.id, 'PAGO_PENDIENTE', 'Cliente confirmó renovación. Esperando comprobante.', user || undefined);
      onRefresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelService = async (service: Service) => {
    if (!confirm(`¿Confirmas la cancelación del servicio de ${service.plataforma} para ${service.cliente_nombre}?`)) return;
    setActionLoading(service.id);
    try {
      await api.changeStatus(service.id, 'CANCELADO', 'Servicio cancelado por falta de pago.', user || undefined);
      onRefresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Filtrado
  const filtered = services.filter((s) => {
    const matchesSearch =
      s.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.plataforma.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === 'TODAY') return s.fecha_proximo_pago === '2026-08-31';
    if (filter === 'UPCOMING') return s.estado === 'POR_VENCER';
    if (filter === 'OVERDUE') return s.estado === 'POR_VENCER' || s.estado === 'VENCIDO';
    if (filter === 'PENDING') return s.estado === 'PAGO_PENDIENTE' || s.estado === 'RECORDATORIO_ENVIADO';
    if (filter === 'CANCEL_ALERT') return s.estado === 'CANCELACION_PENDIENTE';
    return s.estado !== 'CANCELADO';
  });

  return (
    <div className="space-y-5 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Gestión de Cobros</h2>
          <p className="text-xs text-slate-400">Cobros automáticos, ciclo de 24h/36h y renovaciones</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por cliente o plataforma..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'ALL', label: 'Todos' },
            { id: 'TODAY', label: 'Hoy' },
            { id: 'UPCOMING', label: 'Por vencer' },
            { id: 'OVERDUE', label: 'Vencidos' },
            { id: 'PENDING', label: '⏳ En Espera (24h)' },
            { id: 'CANCEL_ALERT', label: '⚠️ Cancelación (36h)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                filter === tab.id
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((service) => {
          const isPendingPayment = service.estado === 'PAGO_PENDIENTE';
          const isReminderSent = service.estado === 'RECORDATORIO_ENVIADO';
          const isCancelAlert = service.estado === 'CANCELACION_PENDIENTE';

          return (
            <div
              key={service.id}
              className={`p-4 bg-slate-900 border rounded-2xl flex flex-col justify-between gap-3 transition-all ${
                isCancelAlert
                  ? 'border-red-700/80 bg-red-950/20 shadow-lg shadow-red-950/30'
                  : isPendingPayment || isReminderSent
                  ? 'border-cyan-800/80 bg-cyan-950/20'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Header card */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-white">{service.cliente_nombre}</h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs font-semibold text-emerald-400">{service.plataforma}</span>
                    {service.perfil && (
                      <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                        Perfil: {service.perfil}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Vencimiento: <span className="font-semibold text-slate-200">{service.fecha_proximo_pago}</span>
                  </p>
                  {service.cliente_telefono ? (
                    <p className="text-[10px] text-slate-400">📱 {service.cliente_telefono}</p>
                  ) : (
                    <p className="text-[10px] text-amber-400 font-medium">⚠️ Sin teléfono asignado</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white">{formatCOP(service.valor)}</p>
                  <div className="mt-1">
                    <StatusBadge status={service.estado} size="sm" />
                  </div>
                </div>
              </div>

              {/* Status explanation alert */}
              {isPendingPayment && (
                <div className="p-2 bg-cyan-950/60 border border-cyan-800/50 rounded-xl text-[11px] text-cyan-300 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Cliente dijo "SÍ". Esperando pago (24h).</span>
                </div>
              )}

              {isReminderSent && (
                <div className="p-2 bg-orange-950/60 border border-orange-800/50 rounded-xl text-[11px] text-orange-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0" />
                  <span>24h cumplidas. Recordatorio enviado (espera 12h más).</span>
                </div>
              )}

              {isCancelAlert && (
                <div className="p-2.5 bg-red-950/80 border border-red-700/80 rounded-xl text-[11px] text-red-200 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                    <span>36 horas sin pago. ¿Cancelar?</span>
                  </div>
                  <button
                    onClick={() => handleCancelService(service)}
                    className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-[10px] cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              )}

              {/* Action Buttons */}
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-2">
                  {/* WhatsApp button */}
                  <WhatsAppButton
                    nombre={service.cliente_nombre}
                    plataforma={service.plataforma}
                    fecha={service.fecha_proximo_pago}
                    valor={service.valor}
                    telefono={service.cliente_telefono}
                    type={isReminderSent ? 'reminder' : 'collection'}
                    className="flex-1"
                  />

                  {/* Registrar Pago (Abre modal y calcula +30 días fijo) */}
                  <button
                    onClick={() => onOpenPaymentModal(service)}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-1 shadow-md shadow-emerald-950 cursor-pointer"
                  >
                    <DollarSign className="w-3.5 h-3.5" /> Pago Recibido
                  </button>
                  {!isCancelAlert && service.estado !== 'CANCELADO' && (
                    <button
                      onClick={() => handleCancelService(service)}
                      disabled={actionLoading === service.id}
                      className="w-full py-1.5 bg-rose-950 hover:bg-rose-900 text-rose-300 font-medium rounded-xl text-xs transition-colors"
                    >
                      No renueva este servicio
                    </button>
                  )}
                </div>

                {/* Confirmación rápida cuando el cliente responde "SÍ" */}
                {!isPendingPayment && !isReminderSent && !isCancelAlert && (
                  <button
                    onClick={() => handleConfirmIntent(service)}
                    disabled={actionLoading === service.id}
                    className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-medium rounded-xl text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" /> Cliente dijo "SÍ" (Iniciar 24h)
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
