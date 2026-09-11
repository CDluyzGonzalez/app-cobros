import React, { useState, useMemo } from 'react';
import { Layers, Plus, Mail, Edit2, Trash2, Search, Users, ShieldAlert } from 'lucide-react';
import { Account, Service } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface AccountsPageProps {
  accounts: Account[];
  services?: Service[];
  onRefresh: () => void;
}

export const AccountsPage: React.FC<AccountsPageProps> = ({ accounts, services = [], onRefresh }) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    id: '',
    plataforma: 'Netflix',
    correo_cuenta: '',
    password: '',
    perfiles_totales: 5,
    cupos_ocupados: 0,
    costo_mensual: 0,
    dia_pago_plataforma: '1',
    notas: '',
  });

  const platformSuggestions = useMemo(() => {
    const list = ['Netflix', 'Disney+', 'Amazon Prime', 'MAX', 'Spotify', 'DIRECTV', 'Apple Music', 'Canva Pro', 'Paramount', 'YouTube Premium', 'Crunchyroll'];
    accounts.forEach((a) => {
      if (a.plataforma && !list.some((item) => item.toLowerCase() === a.plataforma.toLowerCase())) {
        list.push(a.plataforma);
      }
    });
    return list;
  }, [accounts]);

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

  // Función para obtener los servicios activos vinculados a una cuenta
  const getAccountActiveServices = (acc: Account): Service[] => {
    const accCorreo = (acc.correo_cuenta || '').toLowerCase().trim();
    const accPlat = (acc.plataforma || '').toLowerCase().trim();

    return services.filter((s) => {
      if (s.estado === 'CANCELADO') return false;
      const srvPlat = (s.plataforma || '').toLowerCase().trim();

      // REGLA FUNDAMENTAL: La plataforma DEBE coincidir
      if (!isSamePlatform(accPlat, srvPlat)) return false;

      // 1. Coincidencia directa por cuenta_id
      if (s.cuenta_id && acc.id && s.cuenta_id === acc.id) return true;
      // 2. Coincidencia por correo
      if (accCorreo && s.correo_cuenta && s.correo_cuenta.toLowerCase().trim() === accCorreo) {
        return true;
      }
      return false;
    });
  };

  const handleOpenModal = (acc?: Account) => {
    if (acc) {
      const activeServices = getAccountActiveServices(acc);
      setForm({
        id: acc.id || '',
        plataforma: acc.plataforma || 'Netflix',
        correo_cuenta: acc.correo_cuenta || '',
        password: '',
        perfiles_totales: Number(acc.perfiles_totales) || 5,
        cupos_ocupados: activeServices.length,
        costo_mensual: Number(acc.costo_mensual) || 0,
        dia_pago_plataforma: String(acc.dia_pago_plataforma || '1'),
        notas: acc.notas || '',
      });
    } else {
      setForm({
        id: '',
        plataforma: 'Netflix',
        correo_cuenta: '',
        password: '',
        perfiles_totales: 5,
        cupos_ocupados: 0,
        costo_mensual: 0,
        dia_pago_plataforma: '1',
        notas: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    try {
      await api.saveAccount(
        {
          ...form,
          id: form.id.trim(),
          correo_cuenta: form.correo_cuenta.toLowerCase().trim(),
          perfiles_totales: Number(form.perfiles_totales) || 5,
          cupos_ocupados: Number(form.cupos_ocupados) || 0,
          costo_mensual: Number(form.costo_mensual) || 0,
          dia_pago_plataforma: String(form.dia_pago_plataforma || '1'),
        },
        user?.nombre || 'Carlos'
      );
      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Error al guardar la cuenta');
    }
  };

  const handleCancelAccount = async (account: Account) => {
    const cleanId = (account.id || '').trim();
    if (!cleanId) {
      alert('Error: No se pudo identificar el ID de la cuenta en la base de datos.');
      return;
    }

    const activeServices = getAccountActiveServices(account);
    if (activeServices.length > 0) {
      if (
        !confirm(
          `⚠️ Esta cuenta tiene ${activeServices.length} perfil(es) activo(s) asignado(s).\n\n¿Estás seguro de que deseas eliminar ${account.plataforma} (${account.correo_cuenta})?`
        )
      ) {
        return;
      }
    } else {
      if (!confirm(`¿Eliminar la cuenta ${account.plataforma} (${account.correo_cuenta})?`)) {
        return;
      }
    }

    try {
      await api.deleteAccount(cleanId);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar la cuenta');
    }
  };

  const filtered = accounts.filter(
    (a) =>
      (a.plataforma || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.correo_cuenta || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCOP = (num: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(num || 0);

  return (
    <div className="space-y-5 pb-24 md:pb-8">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" /> Cuentas de Plataforma y Cupos
          </h2>
          <p className="text-xs text-slate-400">Administra las cuentas matrices, correos, cupos y contraseñas</p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Cuenta</span>
        </button>
      </div>

      {/* Buscador de Cuentas */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        <input
          type="text"
          placeholder="Buscar por plataforma o correo de la cuenta..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
        />
      </div>

      {/* Grid de Cuentas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filtered.map((acc) => {
          const activeServices = getAccountActiveServices(acc);
          // Sincronización dinámica: usa el conteo real de servicios activos
          const occupiedCount = activeServices.length;
          const totalSlots = Number(acc.perfiles_totales) || 1;
          const availableSlots = Math.max(0, totalSlots - occupiedCount);
          const percent = Math.min(100, Math.round((occupiedCount / totalSlots) * 100));

          return (
            <div
              key={acc.id}
              onClick={() => handleOpenModal(acc)}
              className="p-4 bg-slate-900 border border-slate-800 rounded-3xl space-y-3 hover:border-slate-700 transition-all shadow-md cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Cabecera */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-white truncate">{acc.plataforma}</h3>
                      <span className="text-xs font-bold text-rose-400 shrink-0">{formatCOP(acc.costo_mensual)}</span>
                    </div>
                    <p className="text-xs text-indigo-400 flex items-center gap-1 mt-1 font-mono truncate">
                      <Mail className="w-3 h-3 shrink-0" />
                      <span className="truncate">{acc.correo_cuenta}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0 self-start">
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        handleOpenModal(acc);
                      }}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                      title="Editar cuenta"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        handleCancelAccount(acc);
                      }}
                      className="p-1.5 text-slate-500 hover:text-rose-300 rounded-lg hover:bg-slate-800"
                      title="Eliminar cuenta"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Barra de Cupos / Ocupación Sincronizada */}
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span>Perfiles / Cupos</span>
                    <span className="font-semibold text-slate-200">
                      {occupiedCount} de {totalSlots} ocupados
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        availableSlots === 0 ? 'bg-rose-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] mt-1">
                    {availableSlots > 0 ? (
                      <span className="text-emerald-400 font-semibold">🟢 {availableSlots} cupo(s) disponible(s)</span>
                    ) : (
                      <span className="text-rose-400 font-semibold">🔴 Cuenta Llena (0 disponibles)</span>
                    )}
                    <span className="text-slate-500 font-medium">{percent}% en uso</span>
                  </div>
                </div>

                {/* Perfiles Asignados en Vivo */}
                {activeServices.length > 0 ? (
                  <div className="pt-2 border-t border-slate-800/80 space-y-1">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Users className="w-3 h-3 text-indigo-400" /> Perfiles Ocupados ({activeServices.length}):
                    </p>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-0.5">
                      {activeServices.map((s) => (
                        <span
                          key={s.id}
                          className="px-2 py-0.5 bg-slate-950 border border-slate-800 text-[10px] rounded-lg text-slate-300 flex items-center gap-1 truncate max-w-full"
                          title={`Perfil: ${s.perfil || 'Sin perfil'} | Cliente: ${s.cliente_nombre}`}
                        >
                          <span className="text-emerald-400 font-bold">{s.perfil || 'Perfil'}</span>
                          <span className="text-slate-400 truncate">({s.cliente_nombre})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-slate-800/80">
                    <p className="text-[10px] text-slate-500 italic">Sin clientes activos asignados</p>
                  </div>
                )}
              </div>

              {/* Pie de tarjeta */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 mt-2">
                <span>Día de cobro: Día {acc.dia_pago_plataforma}</span>
                <span className="text-slate-500 font-mono text-[10px] truncate max-w-28" title={acc.id}>
                  {acc.id}
                </span>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500">
            <p className="text-sm">No se encontraron cuentas que coincidan con la búsqueda.</p>
          </div>
        )}
      </div>

      {/* Modal Crear/Editar Cuenta */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-4">
              {form.id ? 'Editar Cuenta de Plataforma' : 'Registrar Nueva Cuenta'}
            </h3>
            <form onSubmit={handleSave} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Plataforma</label>
                  <input
                    type="text"
                    required
                    list="account-platform-suggestions"
                    placeholder="Ej: Paramount, Netflix..."
                    value={form.plataforma}
                    onChange={(e) => setForm({ ...form, plataforma: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                  <datalist id="account-platform-suggestions">
                    {platformSuggestions.map((p) => (
                      <option key={p} value={p} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Costo Mensual ($ COP)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={form.costo_mensual}
                    onChange={(e) => setForm({ ...form, costo_mensual: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Correo de la Cuenta</label>
                <input
                  type="email"
                  required
                  value={form.correo_cuenta}
                  onChange={(e) => setForm({ ...form, correo_cuenta: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Cupos Totales</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.perfiles_totales}
                    onChange={(e) => setForm({ ...form, perfiles_totales: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Ocupados</label>
                  <div className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-emerald-400 font-bold text-xs flex items-center justify-between">
                    <span>{form.cupos_ocupados}</span>
                    <span className="text-[10px] text-slate-500 font-normal">Auto</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Día de Pago</label>
                  <input
                    type="text"
                    placeholder="Ej: 15"
                    value={form.dia_pago_plataforma}
                    onChange={(e) => setForm({ ...form, dia_pago_plataforma: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <p className="text-[10px] text-slate-500 italic">
                * Los cupos ocupados se calculan automáticamente según los clientes con suscripción activa asociada a este correo.
              </p>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-950 cursor-pointer"
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