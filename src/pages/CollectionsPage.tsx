import React, { useState, useMemo } from 'react';
import {
  Search,
  DollarSign,
  UserX,
  Clock,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react';
import { Service } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { WhatsAppButton } from '../components/common/WhatsAppButton';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface CollectionsPageProps {
  services: Service[];
  onRefresh: () => void;
  onOpenPaymentModal: (service: Service, servicesGroup?: Service[]) => void;
}

export interface ClientCollectionGroup {
  key: string;
  cliente_id?: string;
  cliente_nombre: string;
  cliente_telefono: string;
  services: Service[];
  totalValor: number;
  minDiff: number;
  earliestDate: string;
  isCancelAlert: boolean;
  isPendingPayment: boolean;
  primaryStatus: Service['estado'];
}

const STATUS_PRIORITY: Record<string, number> = {
  CANCELACION_PENDIENTE: 1,
  VENCIDO: 2,
  EN_ESPERA: 3,
  PAGO_PENDIENTE: 4,
  RECORDATORIO_ENVIADO: 5,
  RENOVACION_PENDIENTE: 6,
  POR_VENCER: 7,
  ACTIVO: 8,
  CANCELADO: 9,
};

type TabType = 'TODOS' | 'HOY' | 'POR_VENCER' | 'VENCIDOS' | 'EN_ESPERA' | 'CANCELACION';

export const CollectionsPage: React.FC<CollectionsPageProps> = ({
  services,
  onRefresh,
  onOpenPaymentModal,
}) => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState<TabType>('TODOS');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const formatCOP = (num: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(num);

  // Calcula la diferencia en días entre la fecha de vencimiento y hoy
  const getDaysDiff = (dateStr: string) => {
    if (!dateStr) return 0;
    const cleanDate = dateStr.split('T')[0];
    const [y, m, d] = cleanDate.split('-').map(Number);
    const target = new Date(y, m - 1, d);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const handleNoRenew = async (service: Service) => {
    const motivo = prompt(`¿Motivo por el cual ${service.cliente_nombre} no renueva? (Opcional):`);
    if (motivo === null) return; // Canceló el prompt

    setActionLoading(service.id);
    try {
      await api.noRenewService(service.id, motivo, user?.nombre || 'Carlos');
      onRefresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleNoRenewGroup = async (servicesList: Service[]) => {
    if (servicesList.length === 1) {
      return handleNoRenew(servicesList[0]);
    }

    const clientName = servicesList[0]?.cliente_nombre || 'Cliente';
    const optionsText = servicesList
      .map((s, idx) => `${idx + 1}. ${s.plataforma} (${formatCOP(s.valor)})`)
      .join('\n');

    const answer = prompt(
      `¿Qué servicio no renueva ${clientName}?\n\n0. Cancelar TODOS (${servicesList.length} servicios)\n${optionsText}\n\nEscribe el número correspondiente (o presiona Cancelar):`
    );
    if (answer === null) return;

    const choice = answer.trim();
    let toCancel: Service[] = [];
    if (choice === '0') {
      toCancel = servicesList;
    } else {
      const idx = parseInt(choice, 10) - 1;
      if (idx >= 0 && idx < servicesList.length) {
        toCancel = [servicesList[idx]];
      } else {
        alert('Opción no válida');
        return;
      }
    }

    const motivo = prompt(`Motivo por el cual no renueva (Opcional):`);
    if (motivo === null) return;

    const actionKey = servicesList.map((s) => s.id).join('_');
    setActionLoading(actionKey);
    try {
      for (const s of toCancel) {
        await api.noRenewService(s.id, motivo, user?.nombre || 'Carlos');
      }
      onRefresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleWait24hGroup = async (servicesList: Service[]) => {
    const actionKey = servicesList.map((s) => s.id).join('_');
    setActionLoading(actionKey);
    try {
      if (user?.email === 'demo@appcobros.com') {
        servicesList.forEach((s) => {
          s.estado = 'EN_ESPERA';
        });
        onRefresh();
        return;
      }
      for (const s of servicesList) {
        await api.wait24hService(s.id, user?.nombre || 'Carlos');
      }
      onRefresh();
    } catch (e: any) {
      alert('Error al poner en espera: ' + e.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Filtrado por Tabs y Búsqueda
  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      // Ignorar cancelados en la gestión de cobros activos
      if (s.estado === 'CANCELADO') return false;

      // Buscador por nombre o plataforma
      const matchesSearch =
        s.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.plataforma.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      const diff = getDaysDiff(s.fecha_proximo_pago);

      switch (currentTab) {
        case 'HOY':
          // Solo los que vencen hoy exactamente
          return diff === 0;

        case 'POR_VENCER':
          // Vencen en los próximos 5 días (del día 1 al día 5)
          return diff >= 1 && diff <= 5;

        case 'VENCIDOS':
          // Vencidos en días anteriores a hoy que no han pagado
          return diff < 0;

        case 'EN_ESPERA':
          return s.estado === 'EN_ESPERA' || s.estado === 'PAGO_PENDIENTE' || s.estado === 'RECORDATORIO_ENVIADO';

        case 'CANCELACION':
          return s.estado === 'CANCELACION_PENDIENTE';

        case 'TODOS':
        default:
          return true;
      }
    }).sort((a, b) => (a.fecha_proximo_pago || '').localeCompare(b.fecha_proximo_pago || ''));
  }, [services, currentTab, searchTerm]);

  // Agrupación de cobros por Cliente
  const groupedCollections = useMemo(() => {
    const groupsMap = new Map<string, ClientCollectionGroup>();

    for (const s of filteredServices) {
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
        if (s.estado === 'CANCELACION_PENDIENTE') existing.isCancelAlert = true;
        if (s.estado === 'PAGO_PENDIENTE' || s.estado === 'EN_ESPERA') existing.isPendingPayment = true;

        const currentPrio = STATUS_PRIORITY[existing.primaryStatus] ?? 99;
        const newPrio = STATUS_PRIORITY[s.estado] ?? 99;
        if (newPrio < currentPrio) {
          existing.primaryStatus = s.estado;
        }
      } else {
        groupsMap.set(key, {
          key,
          cliente_id: s.cliente_id,
          cliente_nombre: s.cliente_nombre,
          cliente_telefono: s.cliente_telefono,
          services: [s],
          totalValor: Number(s.valor) || 0,
          minDiff: sDiff,
          earliestDate: s.fecha_proximo_pago,
          isCancelAlert: s.estado === 'CANCELACION_PENDIENTE',
          isPendingPayment: s.estado === 'PAGO_PENDIENTE' || s.estado === 'EN_ESPERA',
          primaryStatus: s.estado,
        });
      }
    }

    return Array.from(groupsMap.values());
  }, [filteredServices]);

  return (
    <div className="space-y-5 pb-24 md:pb-8">
      {/* Cabecera */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Gestión de Cobros</h2>
        <p className="text-xs text-slate-400">Cobros automáticos, ciclo mensual fijo y renovaciones</p>
      </div>

      {/* Buscador y Tabs */}
      <div className="space-y-3">
        {/* Barra de búsqueda */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Buscar por cliente o plataforma..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* 6 Tabs de Filtrado Inteligente */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {[
            { id: 'TODOS', label: 'Todos' },
            { id: 'HOY', label: 'Hoy' },
            { id: 'POR_VENCER', label: 'Por vencer' },
            { id: 'VENCIDOS', label: 'Vencidos' },
            { id: 'EN_ESPERA', label: '⏳ En Espera (24h)' },
            { id: 'CANCELACION', label: '⚠️ Cancelación (36h)' },
          ].map((tab) => {
            const active = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id as TabType)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  active
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950 scale-[1.02]'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Contador de resultados */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>
          Mostrando {groupedCollections.length} cliente{groupedCollections.length !== 1 ? 's' : ''} ({filteredServices.length} servicio{filteredServices.length !== 1 ? 's' : ''})
        </span>
      </div>

      {/* Lista de Tarjetas de Cobro Agrupadas por Cliente */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {groupedCollections.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 bg-slate-900/50 border border-slate-800/80 rounded-3xl">
            <p className="text-sm font-medium">No hay cobros en esta pestaña.</p>
          </div>
        ) : (
          groupedCollections.map((group) => {
            const hasMultiple = group.services.length > 1;
            const diff = group.minDiff;
            const isCancelAlert = group.isCancelAlert;
            const isPendingPayment = group.isPendingPayment;
            const actionKey = group.services.map((s) => s.id).join('_');
            const isLoading = group.services.some((s) => actionLoading === s.id) || actionLoading === actionKey;

            return (
              <div
                key={group.key}
                className={`p-4 bg-slate-900 border rounded-3xl flex flex-col justify-between gap-3.5 transition-all shadow-md ${
                  isCancelAlert
                    ? 'border-red-700/80 bg-red-950/20 shadow-red-950/20'
                    : isPendingPayment
                    ? 'border-cyan-800/80 bg-cyan-950/20'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Encabezado de la Tarjeta */}
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
                      {group.cliente_telefono ? (
                        <p className="text-[11px] text-slate-400">📱 {group.cliente_telefono}</p>
                      ) : (
                        <p className="text-[11px] text-amber-400 font-medium">⚠️ Sin teléfono asignado</p>
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

                {/* Avisos especiales */}
                {isCancelAlert && (
                  <div className="p-2.5 bg-red-950/80 border border-red-700/80 rounded-2xl text-xs text-red-200 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                    <span>36h cumplidas sin pago. Listo para suspensión.</span>
                  </div>
                )}

                {isPendingPayment && (
                  <div className="p-2 bg-cyan-950/60 border border-cyan-800/50 rounded-2xl text-xs text-cyan-300 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Cliente confirmó intención de pago.</span>
                  </div>
                )}

                {/* LOS 4 BOTONES COMPLETOS DE ACCIÓN */}
                <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {/* Botón 1: WhatsApp (#4ec481) */}
                  <WhatsAppButton
                    nombre={group.cliente_nombre}
                    plataforma={group.services.map((s) => s.plataforma).join(', ')}
                    fecha={group.earliestDate}
                    valor={group.totalValor}
                    telefono={group.cliente_telefono}
                    clienteId={group.cliente_id}
                    clientServices={group.services}
                    type={diff < 0 ? 'reminder' : 'collection'}
                    className="w-full py-2.5"
                  />

                  {/* Botón 2: Recordar 24h (#b996d2) */}
                  <button
                    onClick={() => handleWait24hGroup(group.services)}
                    disabled={isLoading}
                    style={{ backgroundColor: '#b996d2' }}
                    className="w-full py-2.5 px-2 text-slate-950 hover:brightness-105 active:brightness-95 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1 shadow-md cursor-pointer disabled:opacity-50"
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
                    onClick={() => handleNoRenewGroup(group.services)}
                    disabled={isLoading}
                    style={{ backgroundColor: '#6a0101' }}
                    className="w-full py-2.5 px-2 text-white hover:brightness-125 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1 shadow-md cursor-pointer disabled:opacity-50"
                  >
                    <UserX className="w-3.5 h-3.5" /> No renueva
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};