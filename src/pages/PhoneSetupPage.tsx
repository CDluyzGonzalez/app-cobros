import React, { useState, useEffect } from 'react';
import { PhoneCall, Save, CheckCircle2, Search, User, AlertCircle } from 'lucide-react';
import { Client } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface PhoneSetupPageProps {
  clients: Client[];
  onRefresh: () => void;
}

export const PhoneSetupPage: React.FC<PhoneSetupPageProps> = ({ clients, onRefresh }) => {
  const { user } = useAuth();
  const [phones, setPhones] = useState<{ [id: string]: string }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const map: { [id: string]: string } = {};
    clients.forEach((c) => {
      map[c.id] = c.telefono || '';
    });
    setPhones(map);
  }, [clients]);

  const handlePhoneChange = (clientId: string, val: string) => {
    setPhones((prev) => ({
      ...prev,
      [clientId]: val,
    }));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setSuccessMsg('');
    try {
      const updates = Object.keys(phones).map((id) => ({
        id,
        telefono: phones[id],
      }));

      await api.batchUpdatePhones(updates, user || undefined);
      setSuccessMsg('¡Todos los números de teléfono han sido guardados en Google Sheets!');
      onRefresh();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Error guardando teléfonos');
    } finally {
      setSaving(false);
    }
  };

  const filteredClients = clients.filter((c) =>
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const missingPhonesCount = clients.filter((c) => !c.telefono).length;

  return (
    <div className="space-y-5 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-emerald-400" /> Asignación Rápida de WhatsApps
          </h2>
          <p className="text-xs text-slate-400">
            Ingresa o actualiza los números de teléfono. Varios clientes pueden compartir el mismo WhatsApp.
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Guardando en Sheets...' : 'Guardar Todos los Cambios'}</span>
        </button>
      </div>

      {/* Info card */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-950/80 text-amber-400 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">
              {missingPhonesCount} de {clients.length} clientes aún no tienen teléfono
            </p>
            <p className="text-[11px] text-slate-400">
              Formato recomendado: <span className="text-emerald-400 font-mono">+573001234567</span> o <span className="text-emerald-400 font-mono">3001234567</span>
            </p>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-semibold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Search filter */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        <input
          type="text"
          placeholder="Buscar cliente para editar teléfono..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Grid of Client Phone Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredClients.map((client) => {
          const currentVal = phones[client.id] || '';
          return (
            <div
              key={client.id}
              className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 text-xs font-bold">
                    {client.nombre.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{client.nombre}</h4>
                    <p className="text-[10px] text-slate-400 font-mono">{client.id}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-medium text-slate-400 mb-1">
                  Número de WhatsApp
                </label>
                <div className="relative">
                  <PhoneCall className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="+57 300 000 0000"
                    value={currentVal}
                    onChange={(e) => handlePhoneChange(client.id, e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
