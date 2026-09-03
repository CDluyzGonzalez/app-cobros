import { Account, AppData, Client, DashboardData, HistoryItem, PlatformPayment, Service, User } from '../types';

const STORAGE_URL_KEY = 'APP_COBROS_GAS_URL';
const SESSION_TOKEN_KEY = 'APP_COBROS_SESSION_TOKEN';

export const getScriptUrl = () => localStorage.getItem(STORAGE_URL_KEY) || import.meta.env.VITE_GAS_API_URL || '';
export const setScriptUrl = (url: string) => localStorage.setItem(STORAGE_URL_KEY, url.trim());
export const setSessionToken = (token: string) => sessionStorage.setItem(SESSION_TOKEN_KEY, token);
export const getSessionToken = () => sessionStorage.getItem(SESSION_TOKEN_KEY) || '';
export const clearSessionToken = () => sessionStorage.removeItem(SESSION_TOKEN_KEY);

async function request<T>(action: string, payload: Record<string, unknown> = {}, authenticated = true): Promise<T> {
  const url = getScriptUrl();
  if (!url) throw new Error('La aplicación no está conectada al backend. Configura la URL de Apps Script antes de continuar.');
  const token = getSessionToken();
  if (authenticated && !token) throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, ...payload, token: authenticated ? token : undefined }),
    });
  } catch {
    throw new Error('No fue posible conectar con el backend. No se usaron datos de demostración.');
  }
  if (!response.ok) throw new Error(`El backend respondió HTTP ${response.status}.`);
  const result = await response.json();
  if (!result.success) throw new Error(result.error || 'Error en la petición al backend.');
  return result.data as T;
}

export const api = {
  login: (email: string, password: string) => request<User>('login', { email, password }, false),
  getAppData: () => request<AppData>('get_app_data'),
  getDashboard: () => request<DashboardData>('get_dashboard'),
  getClients: () => request<Client[]>('get_clients'),
  saveClient: (client: Partial<Client>, _user?: User) => request<{ id: string; message: string }>('save_client', { client }),
  batchUpdatePhones: (phones: Array<{ id: string; telefono: string }>, _user?: User) => request<{ updatedCount: number; message: string }>('batch_update_phones', { phones }),
  getServices: () => request<Service[]>('get_services'),
  saveService: (service: Partial<Service>, _user?: User) => request<{ id: string; message: string }>('save_service', { service }),
  deleteService: (serviceId: string) => request<{ success: boolean; message: string }>('delete_service', { serviceId }),
  changeStatus: (serviceId: string, newStatus: string, notes?: string, _user?: User) => request<{ success: boolean }>('change_service_status', { serviceId, newStatus, notes }),
  registerPayment: (payment: { servicio_id: string; valor: number; metodo_pago?: string; comprobante_ref?: string }, _user?: User) => request<{ success: boolean; fecha_proximo_pago: string; message: string }>('register_payment', { payment }),
  getAccounts: () => request<Account[]>('get_accounts'),
  saveAccount: (account: Partial<Account>, _user?: User) => request<{ success: boolean }>('save_account', { account }),
  cancelAccount: (accountId: string) => request<{ success: boolean; message: string }>('cancel_account', { accountId }),
  getPlatformPayments: () => request<PlatformPayment[]>('get_platform_payments'),
  savePlatformPayment: (payment: Partial<PlatformPayment>, _user?: User) => request<{ success: boolean }>('save_platform_payment', { payment }),
  markPlatformPaymentPaid: (paymentId: string) => request<{ success: boolean; nextDueDate: string; message: string }>('mark_platform_payment_paid', { paymentId }),
  deletePlatformPayment: (paymentId: string) => request<{ success: boolean; message: string }>('delete_platform_payment', { paymentId }),
  getHistory: (limit?: number) => request<HistoryItem[]>('get_history', { limit }),
  runScheduler: () => request<{ statusesUpdated: number; remindersSent: number; cancellationsFlagged: number }>('run_hourly_scheduler'),
  setupDatabase: () => request<{ message: string }>('setup_database'),
  migrateData: () => request<{ clientsMigrated: number; servicesMigrated: number; message: string }>('migrate_initial_data'),
};
