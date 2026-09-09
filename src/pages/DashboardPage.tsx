import React from 'react';
import {
  TrendingUp,
  CreditCard,
  Wallet,
  Clock,
  CheckCircle2,
  PhoneCall,
  ArrowUpRight,
  ShieldAlert,
  DollarSign,
  UserX,
} from 'lucide-react';
import { DashboardData, Service } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { WhatsAppButton } from '../components/common/WhatsAppButton';
import { NavTab } from '../components/mobile/BottomNav';

interface DashboardPageProps {
  data: DashboardData | null;
  services?: Service[];
  loading: boolean;
  onNavigate: (tab: NavTab) => void;
  onOpenPaymentModal: (service: Service, servicesGroup?: Service[]) => void;
  onCancelService: (service: Service, servicesGroup?: Service[]) => void;
  onWait24hService?: (service: Service, servicesGroup?: Service[]) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  data,
  services,
  loading,
  onNavigate,
  onOpenPaymentModal,
  onCancelService,
  onWait24hService,
}) => {
  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400">Cargando métricas desde Google Cloud Firestore...</p>
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

  const getDaysDiff = (dateStr: string) => {
    if (!dateStr) return 0;
    const cleanDate = dateStr.split('T')[0];
    const [y, m, d] = cleanDate.split('-').map(Number);
    const target = new Date(y, m - 1, d);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Lista prioritaria: Hoy + Atrasados
  const listaPendientes = data.pendientesHoyYAtrasados || [...(cobros.vencidos || []), ...(cobros.hoy || [])];

  const totalIngresos = metrics.totalIngresosEsperados ?? metrics.totalIncome ?? 0;
  const totalCostos = metrics.totalCostosPlataformas ?? metrics.totalCosts ?? 0;
  const ganancia = metrics.gananciaEstimada ?? metrics.profit ?? (totalIngresos - totalCostos);
  const pendientesCount = metrics.pendientesHoyCount ?? listaPendientes.length;

  // Agrupación de cobros pendientes por Cliente
  const groupedPendientes = React.useMemo(() => {
    const groupsMap = new Map<string, {
      key: string;
      cliente_id?: string;
      cliente_nombre: string;
      cliente_telefono: string;
      services: Service[];
      totalValor: number;
      minDiff: number;
      earliestDate: string;
      primaryStatus: Service['estado'];
    }>();

    for (const s of listaPendientes) {
      const cleanPhone = (s.cliente_telefono || '').replace(/\D/g, '');
      const cleanName = (s.cliente_nombre || '').trim().toLowerCase();
      const key = s.cliente_id
        ? `id_${s.cliente_id}`
        : cleanPhone
        ? `phone_${cleanPhone}`
        : `name_${cleanName}`;

      const sDiff = getDaysDiff(s.fecha_proximo_pago);
      const existing = groupsMap.get(key);

      if (existing) {
        existing.services.push(s);
        existing.totalValor += Number(s.valor) || 0;
        if (sDiff < existing.minDiff) {
          existing.minDiff = sDiff;
          existing.earliestDate = s.fecha_proximo_pago;
        }
      } else {
        groupsMap.set(key, {
          key,
          cliente_id: s.cliente_id,
          cliente_telefono: s.cliente_telefono,
          cliente_nombre: s.cliente_nombre,
          services: [s],
          totalValor: Number(s.valor) || 0,
          minDiff: sDiff,
          earliestDate: s.fecha_proximo_pago,
          primaryStatus: s.estado,
        });
      }
    }

    return Array.from(groupsMap.values());
  }, [listaPendientes]);

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* Alerta de Cancelaciones Pendientes (36 Horas) */}
      {(metrics.pendingCancelCount || 0) > 0 && (
        <div className="p-4 bg-rose-950/80 border border-rose-800/80 rounded-2xl flex items-center justify-between shadow-lg shadow-rose-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-900/80 flex items-center justify-center text-rose-300 shrink-0">
              <ShieldAlert className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                ⚠️ {metrics.pendingCancelCount} Servicio(s) Listo(s) para Cancelación (36h+)
              </h3>
              <p className="text-xs text-rose-300/80">Vencieron y no confirmaron pago.</p>
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

      {/* Tarjetas Financieras Principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Total Ingresos */}
        <div className="p-4 bg-slate-900/80 border border-slate-800/80 rounded-3xl flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-emerald-950/80 border border-emerald-800/40 flex items-center justify-center text-emerald-400 shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400">Ingresos Esperados</p>
            <h4 className="text-base font-bold text-white tracking-tight">{formatCOP(totalIngresos)}</h4>
          </div>
        </div>

        {/* Costos Plataformas */}
        <div className="p-4 bg-slate-900/80 border border-slate-800/80 rounded-3xl flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-rose-950/80 border border-rose-800/40 flex items-center justify-center text-rose-400 shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400">Costo Cuentas</p>
            <h4 className="text-base font-bold text-white tracking-tight">{formatCOP(totalCostos)}</h4>
          </div>
        </div>

        {/* Ganancia Neta */}
        <div className="p-4 bg-slate-900/80 border border-slate-800/80 rounded-3xl flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-indigo-950/80 border border-indigo-800/40 flex items-center justify-center text-indigo-400 shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400">Ganancia Estimada</p>
            <h4 className="text-base font-bold text-emerald-400 tracking-tight">{formatCOP(ganancia)}</h4>
          </div>
        </div>

        {/* Cobros Pendientes (Hoy) */}
        <div className="p-4 bg-slate-900/80 border border-slate-800/80 rounded-3xl flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium text-slate-400">Cobros Hoy y Atrasados</p>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <h4 className="text-lg font-bold text-amber-400">{pendientesCount}</h4>
            <span className="text-[10px] text-slate-500">servicios</span>
          </div>
          <button
            onClick={() => onNavigate('collections')}
            className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 mt-1 font-medium cursor-pointer"
          >
            Ir a Gestión de Cobros <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Acceso Rápido a Teléfonos */}
      <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-950/80 text-indigo-400 flex items-center justify-center shrink-0">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-white">¿Clientes sin número de WhatsApp?</h4>
            <p className="text-[11px] text-slate-400">Asigna teléfonos para habilitar el cobro en 1 toque.</p>
          </div>
        </div>
        <button
          onClick={() => onNavigate('phones')}
          className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-xs transition-all shrink-0 cursor-pointer"
        >
          Cargar Teléfonos
        </button>
      </div>

      {/* SECCIÓN DESTACADA: COBROS PENDIENTES (HOY + ATRASADOS) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" /> Cobros Pendientes (Hoy y Atrasados)
          </h3>
          <button
            onClick={() => onNavigate('collections')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
          >
            Ver todos ({pendientesCount})
          </button>
        </div>

        {groupedPendientes.length === 0 ? (
          <div className="p-8 bg-slate-900/40 border border-slate-800/60 rounded-3xl text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
            <p className="text-xs text-slate-300 font-medium">¡Al día! No hay cobros atrasados ni para hoy.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {groupedPendientes.slice(0, 8).map((group) => {
              const hasMultiple = group.services.length > 1;
              const diff = group.minDiff;

              return (
                <div
                  key={group.key}
                  className="p-4 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl flex flex-col justify-between gap-3.5 transition-all shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-white truncate">{group.cliente_nombre}</h4>
                        {hasMultiple && (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                            {group.services.length} plataformas
                          </span>
                        )}
                      </div>

                      {!hasMultiple && (
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-xs font-semibold text-emerald-400">{group.services[0].plataforma}</span>
                          {group.services[0].perfil && (
                            <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded-md">
                              Perfil: {group.services[0].perfil}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="mt-2 space-y-0.5 text-xs text-slate-400">
                        <p>
                          Vence:{' '}
                          <span className="font-semibold text-slate-200">
                            {group.earliestDate ? group.earliestDate.split('T')[0] : 'N/A'}
                          </span>
                        </p>
                        {diff < 0 && (
                          <p className="text-[11px] text-rose-400 font-semibold">
                            ⚠️ Vencido hace {Math.abs(diff)} día{Math.abs(diff) > 1 ? 's' : ''}
                          </p>
                        )}
                        {diff === 0 && (
                          <p className="text-[11px] text-amber-400 font-semibold">
                            🔔 Vence hoy
                          </p>
                        )}
                        {diff > 0 && diff <= 5 && (
                          <p className="text-[11px] text-cyan-400 font-medium">
                            ⏳ Vence en {diff} día{diff > 1 ? 's' : ''}
                          </p>
                        )}
                        {group.cliente_telefono && (
                          <p className="text-[11px] text-slate-400">📱 {group.cliente_telefono}</p>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-white">{formatCOP(group.totalValor)}</p>
                      <div className="mt-1">
                        <StatusBadge status={group.primaryStatus} size="sm" />
                      </div>
                    </div>
                  </div>

                  {/* Desglose de plataformas si son 2 o más */}
                  {hasMultiple && (
                    <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                      {group.services.map((srv) => (
                        <div
                          key={srv.id}
                          className="flex items-center justify-between text-xs py-1 px-2.5 bg-slate-950/60 rounded-xl border border-slate-800/60"
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="font-semibold text-emerald-400">{srv.plataforma}</span>
                            {srv.perfil && (
                              <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded-md truncate">
                                Perfil: {srv.perfil}
                              </span>
                            )}
                          </div>
                          <span className="font-bold text-white text-xs shrink-0">
                            {formatCOP(srv.valor)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* LOS 4 BOTONES DE ACCIÓN */}
                  <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {/* Botón 1: WhatsApp (#4ec481) */}
                    <WhatsAppButton
                      nombre={group.cliente_nombre}
                      plataforma={group.services.map((s) => s.plataforma).join(', ')}
                      fecha={group.earliestDate}
                      valor={group.totalValor}
                      telefono={group.cliente_telefono}
                      clienteId={group.cliente_id}
                      allServices={services || listaPendientes}
                      clientServices={group.services}
                      type={diff < 0 ? 'reminder' : 'collection'}
                      className="w-full py-2.5"
                    />

                    {/* Botón 2: Recordar 24h (#b996d2) */}
                    <button
                      onClick={() => onWait24hService && onWait24hService(group.services[0], group.services)}
                      style={{ backgroundColor: '#b996d2' }}
                      className="w-full py-2.5 px-2 text-slate-950 hover:brightness-105 active:brightness-95 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1 shadow-md cursor-pointer"
                      title="Cliente confirmó intención de pago, poner en espera 24h"
                    >
                      <Clock className="w-3.5 h-3.5" /> Recordar 24h
                    </button>

                    {/* Botón 3: Registrar Pago (#6bb6e8) */}
                    <button
                      onClick={() => onOpenPaymentModal(group.services[0], group.services)}
                      style={{ backgroundColor: '#6bb6e8' }}
                      className="w-full py-2.5 px-2 text-slate-950 hover:brightness-105 active:brightness-95 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1 shadow-md cursor-pointer"
                    >
                      <DollarSign className="w-3.5 h-3.5" /> Registrar Pago
                    </button>

                    {/* Botón 4: No renueva (#6a0101) */}
                    <button
                      onClick={() => onCancelService(group.services[0], group.services)}
                      style={{ backgroundColor: '#6a0101' }}
                      className="w-full py-2.5 px-2 text-white hover:brightness-125 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1 shadow-md cursor-pointer"
                    >
                      <UserX className="w-3.5 h-3.5" /> No renueva
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};