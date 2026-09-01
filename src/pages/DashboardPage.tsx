import React from 'react';
import {
  TrendingUp,
  CreditCard,
  Wallet,
  AlertTriangle,
  Clock,
  CheckCircle2,
  PhoneCall,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';
import { DashboardData, Service } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { WhatsAppButton } from '../components/common/WhatsAppButton';
import { NavTab } from '../components/mobile/BottomNav';

interface DashboardPageProps {
  data: DashboardData | null;
  loading: boolean;
  onNavigate: (tab: NavTab) => void;
  onOpenPaymentModal: (service: Service) => void;
  onCancelService: (service: Service) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  data,
  loading,
  onNavigate,
  onOpenPaymentModal,
  onCancelService,
}) => {
  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400">Cargando métricas de Google Sheets...</p>
        </div>
      </div>
    );
  }

  const { metrics, cobros } = data;

  const formatCOP = (num: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(num);

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Top Banner Alert si hay cancelaciones pendientes */}
      {metrics.pendingCancelCount > 0 && (
        <div className="p-4 bg-rose-950/80 border border-rose-800/80 rounded-2xl flex items-center justify-between shadow-lg shadow-rose-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-900/80 flex items-center justify-center text-rose-300">
              <ShieldAlert className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                ⚠️ {metrics.pendingCancelCount} Cancelación(es) Pendiente(s) (36 Horas)
              </h3>
              <p className="text-xs text-rose-300/80">Clientes que confirmaron pero no enviaron comprobante.</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('collections')}
            className="px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl text-xs transition-colors shrink-0 cursor-pointer"
          >
            Revisar
          </button>
        </div>
      )}

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Ingresos */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Ingresos Clientes</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-950/80 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg md:text-xl font-bold text-white tracking-tight">{formatCOP(metrics.totalIncome)}</p>
          <p className="text-[10px] text-slate-400 mt-1">{metrics.totalServices} servicios activos</p>
        </div>

        {/* Costos */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Costos Plataformas</span>
            <div className="w-7 h-7 rounded-lg bg-rose-950/80 text-rose-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg md:text-xl font-bold text-white tracking-tight">{formatCOP(metrics.totalCosts)}</p>
          <p className="text-[10px] text-slate-400 mt-1">Cuentas que tú pagas</p>
        </div>

        {/* Ganancia */}
        <div className="col-span-2 sm:col-span-1 p-4 bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-800/40 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-emerald-300">Ganancia Neta</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl md:text-2xl font-black text-emerald-400 tracking-tight">{formatCOP(metrics.profit)}</p>
          <p className="text-[10px] text-emerald-400/80 mt-1">Ingresos - Costos</p>
        </div>

        {/* Alertas de cobro */}
        <div className="col-span-2 sm:col-span-1 p-4 bg-slate-900 border border-slate-800 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Cobran Hoy / Vencidos</span>
            <div className="w-7 h-7 rounded-lg bg-amber-950/80 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg md:text-xl font-bold text-amber-400 tracking-tight">
            {metrics.dueTodayCount} Hoy • {metrics.overdueCount} Vencidos
          </p>
          <button
            onClick={() => onNavigate('collections')}
            className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mt-1 font-medium cursor-pointer"
          >
            Ver módulo de cobros <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Acciones Rápidas Móvil / Onboarding */}
      <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-950/80 text-indigo-400 flex items-center justify-center">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-white">¿Tienes clientes sin número de WhatsApp?</h4>
            <p className="text-[11px] text-slate-400">Asigna teléfonos rápidamente en bloque para habilitar el cobro en 1 toque.</p>
          </div>
        </div>
        <button
          onClick={() => onNavigate('phones')}
          className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-xs transition-all shrink-0 cursor-pointer"
        >
          Cargar Teléfonos
        </button>
      </div>

      {/* Cobros Prioritarios de Hoy y Vencidos */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" /> Cobros de Hoy y Vencidos
          </h3>
          <button
            onClick={() => onNavigate('collections')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
          >
            Ver todos ({cobros.hoy.length + cobros.vencidos.length})
          </button>
        </div>

        {cobros.hoy.length === 0 && cobros.vencidos.length === 0 ? (
          <div className="p-8 bg-slate-900/40 border border-slate-800/60 rounded-2xl text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
            <p className="text-xs text-slate-300 font-medium">¡Al día! No hay cobros pendientes para hoy.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[...cobros.vencidos, ...cobros.hoy].slice(0, 6).map((service) => (
              <div
                key={service.id}
                className="p-4 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl flex flex-col justify-between gap-3 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-white">{service.cliente_nombre}</h4>
                    <p className="text-xs text-indigo-400 font-medium">{service.plataforma}</p>
                    <p className="text-[11px] text-slate-400">
                      Vence: <span className="font-semibold text-slate-300">{service.fecha_proximo_pago}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-400">{formatCOP(service.valor)}</p>
                    <StatusBadge status={service.estado} size="sm" />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                  <WhatsAppButton
                    nombre={service.cliente_nombre}
                    plataforma={service.plataforma}
                    fecha={service.fecha_proximo_pago}
                    valor={service.valor}
                    telefono={service.cliente_telefono}
                    className="flex-1"
                  />
                  <button
                    onClick={() => onOpenPaymentModal(service)}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-800 text-slate-200 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    ✓ Registrar Pago
                  </button>
                  <button
                    onClick={() => onCancelService(service)}
                    className="py-2 px-3 bg-rose-950 hover:bg-rose-900 text-rose-300 font-semibold rounded-xl text-xs transition-colors"
                    title="Cliente no renueva este servicio"
                  >
                    No renueva
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
