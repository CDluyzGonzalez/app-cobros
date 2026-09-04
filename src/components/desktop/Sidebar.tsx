import React from 'react';
import {
  Home,
  Users,
  DollarSign,
  CreditCard,
  Layers,
  History,
  PhoneCall,
  Settings,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { NavTab } from '../mobile/BottomNav';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  badgeCounts?: {
    collections?: number;
    pendingCancels?: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  badgeCounts = {},
}) => {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: Home },
    { id: 'collections' as NavTab, label: 'Gestión de Cobros', icon: DollarSign, badge: badgeCounts.collections },
    { id: 'clients' as NavTab, label: 'Clientes y Servicios', icon: Users },
    { id: 'phones' as NavTab, label: 'Cargar Teléfonos WhatsApp', icon: PhoneCall },
    { id: 'accounts' as NavTab, label: 'Cuentas y Perfiles', icon: Layers },
    { id: 'billing' as NavTab, label: 'Facturación / Costos', icon: CreditCard },
    { id: 'history' as NavTab, label: 'Historial de Cambios', icon: History },
    { id: 'settings' as NavTab, label: 'Configuración del Sistema', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 shrink-0 h-screen sticky top-0">
      {/* Brand header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt="Platnex"
            className="w-9 h-9 rounded-xl object-contain bg-slate-800/80 p-0.5 shadow-md"
          />
          <div>
            <h1 className="text-sm font-black text-white tracking-wider">PLATNEX</h1>
            <p className="text-[10px] text-emerald-400 font-medium">Tu Mundo Digital</p>
          </div>
        </div>
      </div>

      {/* User tag */}
      <div className="px-5 py-3.5 bg-slate-950/40 border-b border-slate-800/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-xs font-bold">
            {user?.nombre?.charAt(0) || 'U'}
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-200">{user?.nombre || 'Usuario'}</p>
            <p className="text-[10px] text-slate-400">{user?.email || 'admin'}</p>
          </div>
        </div>
        <button
          onClick={logout}
          title="Cerrar Sesión"
          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 rounded-lg transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {!!item.badge && item.badge > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/60 text-[10px] text-slate-400 space-y-0.5">
        <p className="text-slate-400 font-medium">Ciclo Fijo: <span className="text-emerald-400">+30 Días</span></p>
        <p className="text-slate-400">Scheduler: <span className="text-cyan-400">24h / 36h Auto</span></p>
      </div>
    </aside>
  );
};
