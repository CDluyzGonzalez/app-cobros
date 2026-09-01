import React from 'react';
import { Home, Users, DollarSign, CreditCard, Layers, MoreHorizontal } from 'lucide-react';

export type NavTab = 'dashboard' | 'collections' | 'clients' | 'accounts' | 'billing' | 'phones' | 'history' | 'settings';

interface BottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  badgeCounts?: {
    collections?: number;
    pendingCancels?: number;
  };
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  badgeCounts = {},
}) => {
  const tabs = [
    { id: 'dashboard' as NavTab, label: 'Inicio', icon: Home },
    { id: 'collections' as NavTab, label: 'Cobros', icon: DollarSign, badge: badgeCounts.collections },
    { id: 'clients' as NavTab, label: 'Clientes', icon: Users },
    { id: 'billing' as NavTab, label: 'Facturas', icon: CreditCard },
    { id: 'accounts' as NavTab, label: 'Cuentas', icon: Layers },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 pb-safe md:hidden shadow-2xl">
      <div className="flex items-center justify-around h-16 px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center h-full relative py-1 transition-colors cursor-pointer ${
                isActive ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {!!tab.badge && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-4 text-center">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1 tracking-tight">{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-1 w-8 h-0.5 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
