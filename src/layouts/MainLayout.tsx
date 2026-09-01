import React from 'react';
import { Sidebar } from '../components/desktop/Sidebar';
import { BottomNav, NavTab } from '../components/mobile/BottomNav';

interface MainLayoutProps {
  children: React.ReactNode;
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  badgeCounts?: {
    collections?: number;
    pendingCancels?: number;
  };
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  currentTab,
  onSelectTab,
  badgeCounts = {}
}) => {
  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Sidebar Desktop/iPad */}
      <Sidebar 
        currentTab={currentTab} 
        onSelectTab={onSelectTab} 
        badgeCounts={badgeCounts}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="flex-1 overflow-y-auto pb-20 md:pb-6">
          {children}
        </div>
      </main>

      {/* Mobile Dedicated Bottom Navigation */}
      <BottomNav 
        currentTab={currentTab} 
        onSelectTab={onSelectTab} 
        badgeCounts={badgeCounts}
      />
    </div>
  );
};
