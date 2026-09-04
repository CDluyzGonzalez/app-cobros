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
import { InstallPwaBanner } from './components/common/InstallPwaBanner';
import { InstallModal } from './components/common/InstallModal';
import { Download } from 'lucide-react';

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
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  // Modal de pago
  const [selectedServiceForPayment, setSelectedServiceForPayment] = useState<Service | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    const loadData = useCallback(async () => {
    setLoading(true);
    try {

      // 👉 1. SOLO AGREGAS ESTE BLOQUE IF AQUÍ ARRIBA:
      if (user?.email === 'demo@appcobros.com') {
        const todayStr = new Date().toISOString().split('T')[0];
        const pastDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const futureDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const futureDate4 = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const demoServices: Service[] = [
          {
            id: 'SRV-DEMO-1',
            cliente_id: 'CLI-1',
            cuenta_id: 'ACC-1',
            cliente_nombre: 'Viviana Flórez',
            cliente_telefono: '3001234567',
            plataforma: 'NETFLIX',
            perfil: 'Perfil 1',
            valor: 14000,
            fecha_proximo_pago: todayStr,
            fecha_ultimo_pago: pastDate,
            fecha_cambio_estado: todayStr,
            estado: 'ACTIVO',
            dia_ancla: new Date().getDate(),
            notas: 'Cliente puntual',
            created_at: pastDate,
            updated_at: pastDate,
          },
          {
            id: 'SRV-DEMO-2',
            cliente_id: 'CLI-2',
            cuenta_id: 'ACC-2',
            cliente_nombre: 'Andrés Cepeda',
            cliente_telefono: '3109876543',
            plataforma: 'DISNEY+',
            perfil: 'Perfil 2',
            valor: 11000,
            fecha_proximo_pago: pastDate,
            fecha_ultimo_pago: pastDate,
            fecha_cambio_estado: pastDate,
            estado: 'VENCIDO',
            dia_ancla: 1,
            notas: 'Pendiente confirmar renovación',
            created_at: pastDate,
            updated_at: pastDate,
          },
          {
            id: 'SRV-DEMO-3',
            cliente_id: 'CLI-3',
            cuenta_id: 'ACC-1',
            cliente_nombre: 'Camila Morales',
            cliente_telefono: '3155551234',
            plataforma: 'MAX',
            perfil: 'Perfil 3',
            valor: 12000,
            fecha_proximo_pago: futureDate,
            fecha_ultimo_pago: pastDate,
            fecha_cambio_estado: pastDate,
            estado: 'POR_VENCER',
            dia_ancla: 6,
            notas: '',
            created_at: pastDate,
            updated_at: pastDate,
          },
          {
            id: 'SRV-DEMO-4',
            cliente_id: 'CLI-4',
            cuenta_id: 'ACC-1',
            cliente_nombre: 'Sebastián Ruiz',
            cliente_telefono: '3201112233',
            plataforma: 'SPOTIFY',
            perfil: 'Cupo 4',
            valor: 8500,
            fecha_proximo_pago: futureDate4,
            fecha_ultimo_pago: pastDate,
            fecha_cambio_estado: pastDate,
            estado: 'ACTIVO',
            dia_ancla: 8,
            notas: '',
            created_at: pastDate,
            updated_at: pastDate,
          },
          {
            id: 'SRV-DEMO-5',
            cliente_id: 'CLI-5',
            cuenta_id: 'ACC-2',
            cliente_nombre: 'Mariana Duque',
            cliente_telefono: '3014445566',
            plataforma: 'PRIME VIDEO',
            perfil: 'Perfil 1',
            valor: 10000,
            fecha_proximo_pago: pastDate,
            fecha_ultimo_pago: pastDate,
            fecha_cambio_estado: pastDate,
            estado: 'EN_ESPERA',
            dia_ancla: 2,
            notas: 'Prometió pagar hoy en la tarde',
            created_at: pastDate,
            updated_at: pastDate,
          },
          {
            id: 'SRV-DEMO-6',
            cliente_id: 'CLI-6',
            cuenta_id: 'ACC-1',
            cliente_nombre: 'Carlos Peñaloza',
            cliente_telefono: '3187778899',
            plataforma: 'YOUTUBE PREMIUM',
            perfil: 'Cuenta personal',
            valor: 9000,
            fecha_proximo_pago: futureDate4,
            fecha_ultimo_pago: pastDate,
            fecha_cambio_estado: pastDate,
            estado: 'ACTIVO',
            dia_ancla: 8,
            notas: '',
            created_at: pastDate,
            updated_at: pastDate,
          },
          {
            id: 'SRV-DEMO-7',
            cliente_id: 'CLI-7',
            cuenta_id: 'ACC-1',
            cliente_nombre: 'Alejandro Toro',
            cliente_telefono: '3123334455',
            plataforma: 'NETFLIX',
            perfil: 'Perfil 2',
            valor: 14000,
            fecha_proximo_pago: todayStr,
            fecha_ultimo_pago: pastDate,
            fecha_cambio_estado: todayStr,
            estado: 'ACTIVO',
            dia_ancla: new Date().getDate(),
            notas: 'Paga por Nequi',
            created_at: pastDate,
            updated_at: pastDate,
          },
        ];

        setServices(demoServices);
        setClients([
          { id: 'CLI-1', nombre: 'Viviana Flórez', telefono: '3001234567', correo: 'viviana@demo.com', notas: 'Cliente puntual', estado: 'ACTIVO', created_at: pastDate, updated_at: pastDate },
          { id: 'CLI-2', nombre: 'Andrés Cepeda', telefono: '3109876543', correo: 'andres@demo.com', notas: 'Pendiente confirmar', estado: 'ACTIVO', created_at: pastDate, updated_at: pastDate },
          { id: 'CLI-3', nombre: 'Camila Morales', telefono: '3155551234', correo: 'camila@demo.com', notas: '', estado: 'ACTIVO', created_at: pastDate, updated_at: pastDate },
          { id: 'CLI-4', nombre: 'Sebastián Ruiz', telefono: '3201112233', correo: 'sebas@demo.com', notas: '', estado: 'ACTIVO', created_at: pastDate, updated_at: pastDate },
          { id: 'CLI-5', nombre: 'Mariana Duque', telefono: '3014445566', correo: 'mariana@demo.com', notas: '', estado: 'ACTIVO', created_at: pastDate, updated_at: pastDate },
          { id: 'CLI-6', nombre: 'Carlos Peñaloza', telefono: '3187778899', correo: 'carlos@demo.com', notas: '', estado: 'ACTIVO', created_at: pastDate, updated_at: pastDate },
          { id: 'CLI-7', nombre: 'Alejandro Toro', telefono: '3123334455', correo: 'alejo@demo.com', notas: '', estado: 'ACTIVO', created_at: pastDate, updated_at: pastDate },
        ]);
        setAccounts([
          { id: 'ACC-1', plataforma: 'NETFLIX', correo_cuenta: 'streaming.master1@gmail.com', perfiles_totales: 5, cupos_ocupados: 4, costo_mensual: 45900, dia_pago_plataforma: 15, estado: 'ACTIVA', notas: 'Proveedor Colombia', created_at: pastDate, updated_at: pastDate },
          { id: 'ACC-2', plataforma: 'DISNEY+', correo_cuenta: 'disney.cuentascol@gmail.com', perfiles_totales: 4, cupos_ocupados: 2, costo_mensual: 38900, dia_pago_plataforma: 22, estado: 'ACTIVA', notas: 'Combo mensual', created_at: pastDate, updated_at: pastDate },
        ]);
        setPlatformPayments([
          { id: 'PAY-1', cuenta_id: 'ACC-1', concepto: 'Renovación Netflix 4 Pantallas', valor: 45900, fecha_limite: futureDate4, fecha_pago_real: '', estado: 'PENDIENTE', notas: '', usuario_registro: 'Demo', created_at: pastDate },
          { id: 'PAY-2', cuenta_id: 'ACC-2', concepto: 'Renovación Disney+ Combo', valor: 38900, fecha_limite: pastDate, fecha_pago_real: pastDate, estado: 'PAGADO', notas: '', usuario_registro: 'Demo', created_at: pastDate },
        ]);
        setDashboardData({
          metrics: {
            serviciosActivos: 7,
            dueTodayCount: 2,
            overdueCount: 1,
            upcomingCount: 3,
            pendingCancelCount: 0,
            totalIngresosEsperados: 78500,
            totalCostosPlataformas: 84800,
            gananciaEstimada: 35000,
          },
          cobros: {
            hoy: [demoServices[0], demoServices[6]],
            proximos: [demoServices[2], demoServices[3], demoServices[5]],
            vencidos: [demoServices[1], demoServices[4]],
          },
        });
        return; // Detiene aquí para que el demo no consulte tu base real
      }

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
  }, [user]);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, loadData]);
      // Función para instalar directamente o abrir modal si es iPhone
  const handleTriggerInstall = async () => {
    const promptEvent = (window as any).deferredPrompt;
    if (promptEvent) {
      // 🚀 Lanza la alerta nativa de Android ("¿Deseas instalar Platnex?")
      promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      if (outcome === 'accepted') {
        (window as any).deferredPrompt = null;
      }
    } else {
      // Si es iPhone o no está disponible el prompt nativo, abre el modal de instrucciones
      setIsInstallModalOpen(true);
    }
  };

  // Abre el modal o dispara la instalación cuando tocan "Instalar" en Configuración
  useEffect(() => {
    window.addEventListener('open-install-modal', handleTriggerInstall);
    return () => window.removeEventListener('open-install-modal', handleTriggerInstall);
  }, []);

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

  const handleWait24hService = async (service: Service) => {
    if (user?.email === 'demo@appcobros.com') {
      service.estado = 'EN_ESPERA';
      loadData();
      return;
    }
    await api.wait24hService(service.id, user?.nombre || 'Carlos');
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
            <img
              src="/logo.png"
              alt="Platnex"
              className="w-7 h-7 rounded-lg object-contain bg-slate-800/80 p-0.5"
            />
            <div>
              <h1 className="text-xs font-bold text-white tracking-wide">PLATNEX</h1>
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
              onClick={handleTriggerInstall}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
              title="Descargar e Instalar App"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Descargar App</span>
              <span className="sm:hidden">Instalar</span>
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
              onWait24hService={handleWait24hService}
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
      {/* Banner flotante de instalación PWA */}
      <InstallPwaBanner />
      {/* Modal de instalación */}
      <InstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />
      
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
