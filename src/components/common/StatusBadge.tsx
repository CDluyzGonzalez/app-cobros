import React from 'react';
import { ServiceStatus } from '../../types';

interface StatusBadgeProps {
  status: ServiceStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getStyles = () => {
    switch (status) {
      case 'ACTIVO':
        return 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60';
      case 'POR_VENCER':
        return 'bg-amber-950/80 text-amber-400 border-amber-800/60';
      case 'VENCIDO':
        return 'bg-rose-950/80 text-rose-400 border-rose-800/60';
      case 'PAGO_PENDIENTE':
        return 'bg-cyan-950/80 text-cyan-400 border-cyan-800/60 animate-pulse';
      case 'RECORDATORIO_ENVIADO':
        return 'bg-orange-950/80 text-orange-400 border-orange-800/60';
      case 'CANCELACION_PENDIENTE':
        return 'bg-red-950/90 text-red-300 border-red-700 font-bold animate-bounce';
      case 'CANCELADO':
        return 'bg-slate-900 text-slate-500 border-slate-800';
      default:
        return 'bg-slate-900 text-slate-300 border-slate-700';
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'ACTIVO': return '🟢 Activo';
      case 'POR_VENCER': return '🟡 Por Vencer';
      case 'VENCIDO': return '🔴 Vencido';
      case 'PAGO_PENDIENTE': return '⏳ Pago Pendiente (24h)';
      case 'RECORDATORIO_ENVIADO': return '📩 Recordatorio Enviado';
      case 'CANCELACION_PENDIENTE': return '⚠️ Cancelación Pendiente (36h)';
      case 'CANCELADO': return '⚪ Cancelado';
      default: return status;
    }
  };

  const sizeCls = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${sizeCls} ${getStyles()}`}>
      {getLabel()}
    </span>
  );
};
