import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CollectionsPage } from './pages/CollectionsPage';
import { ClientsPage } from './pages/ClientsPage';
import { PhoneSetupPage } from './pages/PhoneSetupPage';
import { AccountsPage } from './pages/AccountsPage';
import { BillingPage } from './pages/BillingPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { BottomNav, NavTab } from './components/mobile/BottomNav';
import { Sidebar } from './components/desktop/Sidebar';
import { PaymentModal } from './components/common/PaymentModal';
import { Client, Service, Account, PlatformPayment, DashboardData, HistoryItem } from './types';
import { api } from './services/api';
import { ShieldCheck, RefreshCw, LogOut } from 'lucide-react';

function MainApp() {
  const { isAuthenticated, user, logout } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [platformPayments, setPlatformPayments] = useState<PlatformPayment[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal de pago
  const [selectedServiceForPayment, setSelectedServiceForPayment] = useState<Service | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1 sola petición HTTP optimizada
      const data = await api.getAppData();
      setDashboardData(data.dashboard);
      setClients(data.clients);
      setServices(data.services);
      setAccounts(data.accounts);
      setPlatformPayments(data.platformPayments);
      setHistory(data.history);
    } catch (err: any) {
      // Fallback de retrocompatibilidad por si el script aún no fue actualizado
      try {
        const [dash, cls, srvs, accs, plats, hist] = await Promise.all([
          api.getDashboard(),
          api.getClients(),
          api.getServices(),
          api.getAccounts(),
          api.getPlatformPayments(),
          api.getHistory(50),
        ]);
        setDashboardData(dash);
        setClients(cls);
        setServices(srvs);
        setAccounts(accs);
        setPlatformPayments(plats);
        setHistory(hist);
      } catch (fallbackErr: any) {
        console.error('Error cargando datos:', fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, loadData]);

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const handleOpenPaymentModal = (service: Service) => {
    setSelectedServiceForPayment(service);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = (nextDate: string) => {
    loadData();
  };

  const handleCancelService = async (service: Service) => {
    if (!confirm(`¿Marcar como no renovado el servicio ${service.plataforma} de ${service.cliente_nombre}?`)) return;
    await api.changeStatus(service.id, 'CANCELADO', 'Cliente no renueva el servicio.');
    loadData();
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row text-slate-100">
      {/* Desktop Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        badgeCounts={{
          collections: (dashboardData?.cobros.hoy.length || 0) + (dashboardData?.cobros.vencidos.length || 0),
          pendingCancels: dashboardData?.metrics.pendingCancelCount || 0,
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xs font-bold text-white tracking-wide">COBROS APP</h1>
              <p className="text-[10px] text-slate-400 font-medium">{user?.nombre}</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 text-slate-400 hover:text-emerald-400 rounded-lg bg-slate-800/50"
              title="Recargar datos"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
            <button
              onClick={() => setCurrentTab('settings')}
              className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800/50"
              title="Configuración"
            >
              ⚙️
            </button>
            <button
              onClick={logout}
              className="p-2 text-rose-400 hover:text-rose-300 rounded-lg bg-slate-800/50"
              title="Salir"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Content Container */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          {currentTab === 'dashboard' && (
            <DashboardPage
              data={dashboardData}
              loading={loading}
              onNavigate={setCurrentTab}
              onOpenPaymentModal={handleOpenPaymentModal}
              onCancelService={handleCancelService}
            />
          )}

          {currentTab === 'collections' && (
            <CollectionsPage
              services={services}
              onRefresh={loadData}
              onOpenPaymentModal={handleOpenPaymentModal}
            />
          )}

          {currentTab === 'clients' && (
            <ClientsPage
              clients={clients}
              services={services}
              accounts={accounts}
              onRefresh={loadData}
            />
          )}

          {currentTab === 'phones' && (
            <PhoneSetupPage
              clients={clients}
              onRefresh={loadData}
            />
          )}

          {currentTab === 'accounts' && (
            <AccountsPage
              accounts={accounts}
              onRefresh={loadData}
            />
          )}

          {currentTab === 'billing' && (
            <BillingPage
              payments={platformPayments}
              accounts={accounts}
              onRefresh={loadData}
            />
          )}

          {currentTab === 'history' && (
            <HistoryPage history={history} />
          )}

          {currentTab === 'settings' && (
            <SettingsPage />
          )}
        </main>
      </div>

      {/* Mobile Dedicated Bottom Nav */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        badgeCounts={{
          collections: (dashboardData?.cobros.hoy.length || 0) + (dashboardData?.cobros.vencidos.length || 0),
          pendingCancels: dashboardData?.metrics.pendingCancelCount || 0,
        }}
      />

      {/* Modal de Pago Global (+30 Días Fijo) */}
      {selectedServiceForPayment && (
        <PaymentModal
          service={selectedServiceForPayment}
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedServiceForPayment(null);
          }}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
