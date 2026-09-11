import React, { useState, useMemo } from 'react';
import { Users, Plus, Search, Layers, DollarSign, Calendar, Edit2, Shield, Key, Trash2 } from 'lucide-react';
import { Account, Client, Service } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { WhatsAppButton } from '../components/common/WhatsAppButton';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface ClientsPageProps {
  clients: Client[];
  services: Service[];
  accounts: Account[];
  onRefresh: () => void;
}

export const ClientsPage: React.FC<ClientsPageProps> = ({ clients, services, accounts, onRefresh }) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isCustomPlatform, setIsCustomPlatform] = useState(false);

  // Form states
  const [clientForm, setClientForm] = useState({ id: '', nombre: '', telefono: '', correo: '', notas: '' });
  const [serviceForm, setServiceForm] = useState({
    id: '',
    cliente_id: '',
    plataforma: 'Netflix',
    perfil: '',
    pin: '',
    valor: '25000',
    fecha_proximo_pago: new Date().toISOString().split('T')[0],
    cuenta_id: '',
    correo_cuenta: '',
    notas: '',
  });

  const isSamePlatform = (platA: string, platB: string): boolean => {
    const a = (platA || '').toLowerCase().trim();
    const b = (platB || '').toLowerCase().trim();
    if (!a || !b) return false;
    if (a === b) return true;

    // Comparación limpia eliminando caracteres no alfanuméricos (ej: "disney+" y "disney", "paramount+" y "paramount")
    const cleanA = a.replace(/[^a-z0-9]/g, '');
    const cleanB = b.replace(/[^a-z0-9]/g, '');
    if (cleanA && cleanB && cleanA === cleanB) return true;

    if (a.includes('netflix') && b.includes('netflix')) return true;
    if (a.includes('disney') && b.includes('disney')) return true;
    if ((a.includes('prime') || a.includes('amazon')) && (b.includes('prime') || b.includes('amazon'))) return true;
    if ((a.includes('max') || a.includes('hbo')) && (b.includes('max') || b.includes('hbo'))) return true;
    if (a.includes('spotify') && b.includes('spotify')) return true;
    if (a.includes('apple') && b.includes('apple')) return true;
    if (a.includes('canva') && b.includes('canva')) return true;
    if ((a.includes('directv') || a.includes('dgo')) && (b.includes('directv') || b.includes('dgo'))) return true;
    if (a.includes('paramount') && b.includes('paramount')) return true;
    if (a.includes('youtube') && b.includes('youtube')) return true;
    if (a.includes('crunchyroll') && b.includes('crunchyroll')) return true;

    // Comparación por contención de subcadenas si tienen longitud razonable
    if (cleanA.length >= 4 && cleanB.length >= 4) {
      if (cleanA.includes(cleanB) || cleanB.includes(cleanA)) return true;
    }

    return false;
  };

  // Lista dinámica de plataformas combinando cuentas registradas, servicios y valores por defecto
  const availablePlatforms = useMemo(() => {
    const map = new Map<string, string>();

    const addPlat = (plat?: string) => {
      if (!plat) return;
      const trimmed = plat.trim();
      if (!trimmed) return;
      const key = trimmed.toLowerCase();
      if (!map.has(key)) {
        map.set(key, trimmed);
      }
    };

    // 1. Cuentas creadas (para que cualquier plataforma nueva como Paramount salga de inmediato)
    accounts.forEach((acc) => addPlat(acc.plataforma));

    // 2. Servicios ya existentes
    services.forEach((srv) => addPlat(srv.plataforma));

    // 3. Plataformas estándar
    [
      'Netflix',
      'Disney+',
      'Amazon Prime',
      'MAX',
      'Spotify',
      'DIRECTV',
      'Apple Music',
      'Canva Pro',
      'Paramount',
      'YouTube Premium',
      'Crunchyroll',
    ].forEach((p) => addPlat(p));

    return Array.from(map.values()).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }, [accounts, services]);

  // Cuentas pertenecientes a la plataforma seleccionada en el formulario
  const matchingAccounts = useMemo(() => {
    return accounts.filter((acc) => isSamePlatform(acc.plataforma, serviceForm.plataforma));
  }, [accounts, serviceForm.plataforma]);

  const handlePlatformChange = (newPlat: string) => {
    if (newPlat === '__NEW_PLATFORM__') {
      setIsCustomPlatform(true);
      setServiceForm((prev) => ({
        ...prev,
        plataforma: '',
        cuenta_id: '',
        correo_cuenta: '',
      }));
      return;
    }

    setIsCustomPlatform(false);
    const matched = accounts.filter((acc) => isSamePlatform(acc.plataforma, newPlat));
    // Si hay exactamente una sola cuenta de esta plataforma, ¡auto-seleccionarla!
    if (matched.length === 1) {
      setServiceForm((prev) => ({
        ...prev,
        plataforma: newPlat,
        cuenta_id: matched[0].id,
        correo_cuenta: matched[0].correo_cuenta,
      }));
    } else {
      setServiceForm((prev) => ({
        ...prev,
        plataforma: newPlat,
        cuenta_id: '',
        correo_cuenta: '',
      }));
    }
  };

  const getAccOccupied = (acc: Account) => {
    return services.filter(
      (s) =>
        s.estado !== 'CANCELADO' &&
        isSamePlatform(s.plataforma, acc.plataforma) &&
        (s.cuenta_id === acc.id ||
          (s.correo_cuenta &&
            acc.correo_cuenta &&
            s.correo_cuenta.toLowerCase().trim() === acc.correo_cuenta.toLowerCase().trim()))
    ).length;
  };

  const handleOpenClientModal = (client?: Client) => {
    if (client) {
      setClientForm({ id: client.id, nombre: client.nombre, telefono: client.telefono, correo: client.correo, notas: client.notas });
    } else {
      setClientForm({ id: '', nombre: '', telefono: '', correo: '', notas: '' });
    }
    setIsClientModalOpen(true);
  };

  const handleSaveClient = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    try {
      await api.saveClient(clientForm, user?.nombre);
      setIsClientModalOpen(false);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleOpenServiceModal = (clientId: string, srv?: Service) => {
    setIsCustomPlatform(false);
    if (srv) {
      setServiceForm({
        id: srv.id,
        cliente_id: srv.cliente_id,
        plataforma: srv.plataforma,
        perfil: srv.perfil,
        pin: srv.pin || '',
        valor: srv.valor.toString(),
        fecha_proximo_pago: (srv.fecha_proximo_pago || '').split('T')[0] || new Date().toISOString().split('T')[0],
        cuenta_id: srv.cuenta_id || '',
        correo_cuenta: srv.correo_cuenta || '',
        notas: srv.notas || '',
      });
    } else {
      const defaultPlat = availablePlatforms[0] || 'Netflix';
      const matched = accounts.filter((acc) => isSamePlatform(acc.plataforma, defaultPlat));
      const firstAcc = matched.length === 1 ? matched[0] : null;

      setServiceForm({
        id: '',
        cliente_id: clientId,
        plataforma: defaultPlat,
        perfil: '',
        pin: '',
        valor: '20000',
        fecha_proximo_pago: new Date().toISOString().split('T')[0],
        cuenta_id: firstAcc ? firstAcc.id : '',
        correo_cuenta: firstAcc ? firstAcc.correo_cuenta : '',
        notas: '',
      });
    }
    setIsServiceModalOpen(true);
  };

  const handleSaveService = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    try {
      await api.saveService(
        {
          ...serviceForm,
          valor: Number(serviceForm.valor),
        },
        user?.nombre || 'Carlos'
      );
      setIsServiceModalOpen(false);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteService = async (service: Service) => {
    if (!confirm(`¿Eliminar el servicio ${service.plataforma && service.plataforma !== 'N/A' ? service.plataforma : 'seleccionado'} de ${service.cliente_nombre}?`)) return;
    try {
      await api.deleteService(service.id);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filtered = clients.filter((c) =>
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.telefono.includes(searchTerm)
  );

  const formatCOP = (num: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(num);

  return (
    <div className="space-y-5 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" /> Directorio de Clientes
          </h2>
          <p className="text-xs text-slate-400">Administra clientes, teléfonos y sus plataformas contratadas</p>
        </div>

        <button
          onClick={() => handleOpenClientModal()}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        <input
          type="text"
          placeholder="Buscar por nombre o teléfono..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Client List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((client) => {
          const clientServices = services.filter((s) => s.cliente_id === client.id && s.estado !== 'CANCELADO');
          const totalVal = clientServices.reduce((acc, s) => acc + s.valor, 0);

          return (
            <div
              key={client.id}
              className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between gap-3 hover:border-slate-700 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">{client.nombre}</h3>
                    <p className="text-xs text-slate-400">{client.telefono || 'Sin WhatsApp'}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {client.telefono && clientServices.length > 0 && (
                      <WhatsAppButton
                        nombre={client.nombre}
                        plataforma={clientServices[0]?.plataforma || 'Servicio'}
                        fecha={clientServices[0]?.fecha_proximo_pago || ''}
                        valor={clientServices[0]?.valor || 0}
                        telefono={client.telefono}
                        clienteId={client.id}
                        clientServices={clientServices}
                        className="py-1 px-2 text-[11px]"
                      />
                    )}
                    <button
                      onClick={() => handleOpenClientModal(client)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800/60"
                      title="Editar Cliente"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Services list for this client */}
                <div className="mt-3 space-y-1.5 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                    <span>Servicios ({clientServices.length})</span>
                    <span className="text-emerald-400 font-bold">{formatCOP(totalVal)} / mes</span>
                  </div>

                  {clientServices.length === 0 ? (
                    <p className="text-[11px] text-slate-500 italic">Sin servicios activos</p>
                  ) : (
                    clientServices.map((srv) => (
                      <div
                        key={srv.id}
                        onClick={() => handleOpenServiceModal(client.id, srv)}
                        className="p-2 bg-slate-950/70 border border-slate-800/60 rounded-xl flex items-center justify-between gap-2 hover:border-slate-700 cursor-pointer"
                      >
                        <div>
                          <p className="text-xs font-semibold text-white">{srv.plataforma || 'Netflix'} · Editar</p>
                          <p className="text-[10px] text-slate-400">
                            {srv.perfil ? `Perfil: ${srv.perfil}` : 'Perfil único'} {srv.pin ? `• PIN: ${srv.pin}` : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-slate-200">{formatCOP(srv.valor)}</p>
                          <StatusBadge status={srv.estado} size="sm" />
                        </div>
                        <button
                          type="button"
                          onClick={(event) => { event.stopPropagation(); handleDeleteService(srv); }}
                          className="p-1.5 text-slate-500 hover:text-rose-300 hover:bg-rose-950 rounded-lg"
                          title="Eliminar servicio"
                          aria-label={`Eliminar ${srv.plataforma}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Add service button */}
              <button
                onClick={() => handleOpenServiceModal(client.id)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 font-medium rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-1"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar Plataforma
              </button>
            </div>
          );
        })}
      </div>

      {/* Modal Crear/Editar Cliente */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-4">
              {clientForm.id ? 'Editar Cliente' : 'Nuevo Cliente'}
            </h3>
            <form onSubmit={handleSaveClient} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={clientForm.nombre}
                  onChange={(e) => setClientForm({ ...clientForm, nombre: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Teléfono / WhatsApp</label>
                <input
                  type="text"
                  placeholder="+57 300 000 0000"
                  value={clientForm.telefono}
                  onChange={(e) => setClientForm({ ...clientForm, telefono: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Notas</label>
                <textarea
                  rows={2}
                  value={clientForm.notas}
                  onChange={(e) => setClientForm({ ...clientForm, notas: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(false)}
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

      {/* Modal Crear/Editar Servicio */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-4">
              {serviceForm.id ? 'Editar Plataforma' : 'Asignar Nueva Plataforma'}
            </h3>
            <form onSubmit={handleSaveService} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs text-slate-300">Plataforma</label>
                    {isCustomPlatform && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomPlatform(false);
                          handlePlatformChange(availablePlatforms[0] || 'Netflix');
                        }}
                        className="text-[10px] text-emerald-400 hover:underline"
                      >
                        ← Volver a lista
                      </button>
                    )}
                  </div>
                  {isCustomPlatform ? (
                    <input
                      type="text"
                      required
                      placeholder="Ej: Paramount, Max..."
                      value={serviceForm.plataforma}
                      onChange={(e) => {
                        const val = e.target.value;
                        const matched = accounts.filter((acc) => isSamePlatform(acc.plataforma, val));
                        setServiceForm((prev) => ({
                          ...prev,
                          plataforma: val,
                          cuenta_id: matched.length === 1 ? matched[0].id : '',
                          correo_cuenta: matched.length === 1 ? matched[0].correo_cuenta : prev.correo_cuenta,
                        }));
                      }}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 font-medium"
                    />
                  ) : (
                    <select
                      value={serviceForm.plataforma}
                      onChange={(e) => handlePlatformChange(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 font-medium"
                    >
                      {serviceForm.plataforma &&
                        !availablePlatforms.some((p) => p.toLowerCase() === serviceForm.plataforma.toLowerCase()) && (
                          <option value={serviceForm.plataforma}>{serviceForm.plataforma}</option>
                        )}
                      {availablePlatforms.map((plat) => (
                        <option key={plat} value={plat}>
                          {plat}
                        </option>
                      ))}
                      <option value="__NEW_PLATFORM__">➕ Otra plataforma...</option>
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Valor ($ COP)</label>
                  <input
                    type="number"
                    required
                    value={serviceForm.valor}
                    onChange={(e) => setServiceForm({ ...serviceForm, valor: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Perfil Asignado</label>
                  <input
                    type="text"
                    placeholder="Ej: Carlos o Perfil 1"
                    value={serviceForm.perfil}
                    onChange={(e) => setServiceForm({ ...serviceForm, perfil: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">PIN del Perfil (Cifrado)</label>
                  <input
                    type="text"
                    placeholder="Ej: 1234"
                    value={serviceForm.pin}
                    onChange={(e) => setServiceForm({ ...serviceForm, pin: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Fecha de Inicio / Primer Vencimiento (Día Ancla Fijo)
                </label>
                <input
                  type="date"
                  required
                  value={serviceForm.fecha_proximo_pago}
                  onChange={(e) => setServiceForm({ ...serviceForm, fecha_proximo_pago: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 font-medium"
                />
                <p className="mt-1 text-[11px] text-emerald-400 font-medium">
                  💡 Día ancla fijado: Día {serviceForm.fecha_proximo_pago ? Number(serviceForm.fecha_proximo_pago.split('-')[2]) : '1'}. Todos los meses renovará exactamente este mismo día.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Cuenta Matriz ({serviceForm.plataforma})
                </label>
                {matchingAccounts.length > 0 ? (
                  <div className="space-y-2">
                    <select
                      value={
                        serviceForm.cuenta_id ||
                        matchingAccounts.find(
                          (a) =>
                            a.correo_cuenta.toLowerCase().trim() ===
                            (serviceForm.correo_cuenta || '').toLowerCase().trim()
                        )?.id ||
                        (serviceForm.correo_cuenta ? '__CUSTOM__' : '')
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '__CUSTOM__') {
                          setServiceForm({ ...serviceForm, cuenta_id: '' });
                        } else {
                          const chosen = accounts.find((a) => a.id === val);
                          if (chosen) {
                            setServiceForm({
                              ...serviceForm,
                              cuenta_id: chosen.id,
                              correo_cuenta: chosen.correo_cuenta,
                            });
                          }
                        }
                      }}
                      className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 font-medium"
                    >
                      <option value="">-- Selecciona la cuenta de {serviceForm.plataforma} --</option>
                      {matchingAccounts.map((acc) => {
                        const occupied = getAccOccupied(acc);
                        const total = Number(acc.perfiles_totales) || 1;
                        const free = Math.max(0, total - occupied);
                        return (
                          <option key={acc.id} value={acc.id}>
                            {acc.correo_cuenta} ({occupied}/{total} ocupados - {free > 0 ? `${free} libres 🟢` : 'LLENA 🔴'})
                          </option>
                        );
                      })}
                      <option value="__CUSTOM__">➕ Escribir otro correo / Nueva cuenta</option>
                    </select>

                    {/* Si eligió escribir otro correo manual o no ha seleccionado del desplegable */}
                    {(!serviceForm.cuenta_id || !matchingAccounts.some((a) => a.id === serviceForm.cuenta_id)) && (
                      <input
                        type="email"
                        required
                        placeholder="cuenta@correo.com"
                        value={serviceForm.correo_cuenta}
                        onChange={(e) => setServiceForm({ ...serviceForm, correo_cuenta: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                      />
                    )}
                  </div>
                ) : (
                  <div>
                    <input
                      type="email"
                      required
                      placeholder="cuenta@correo.com"
                      value={serviceForm.correo_cuenta}
                      onChange={(e) => setServiceForm({ ...serviceForm, correo_cuenta: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                    <p className="mt-1 text-[10px] text-slate-500">
                      No hay cuentas matrices de {serviceForm.plataforma} registradas. Se creará automáticamente al guardar.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsServiceModalOpen(false)}
                  className="flex-1 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 text-white font-semibold text-xs rounded-xl"
                >
                  Guardar Servicio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
