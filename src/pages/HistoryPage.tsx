import React from 'react';
import { History, User, Clock, ShieldCheck } from 'lucide-react';
import { HistoryItem } from '../types';

interface HistoryPageProps {
  history: HistoryItem[];
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ history }) => {
  return (
    <div className="space-y-5 pb-20 md:pb-6">
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          <History className="w-5 h-5 text-emerald-400" /> Registro de Historial y Auditoría
        </h2>
        <p className="text-xs text-slate-400">
          Registro inmutable de todas las acciones realizadas por Carlos, Esposa o el Scheduler automático.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800/80">
        {history.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">No hay registros en el historial todavía.</div>
        ) : (
          history.map((item) => (
            <div key={item.id} className="p-4 flex items-start justify-between gap-3 hover:bg-slate-800/30 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 text-xs shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{item.usuario || 'Sistema'}</span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono font-medium">
                      {item.accion}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">{item.descripcion}</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{item.entidad} • {item.entidad_id}</p>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 whitespace-nowrap">
                {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
