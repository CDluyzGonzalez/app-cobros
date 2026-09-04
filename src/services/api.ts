// ── API REST ───────────────────────────────────────────────────────────────────────
import { Account, Client, DashboardData, HistoryItem, PlatformPayment, Service, User, AppData } from '../types';

// URL del backend: En desarrollo local apunta a localhost:8080, en producción a Cloud Run
const API_URL = import.meta.env.VITE_API_URL || 'https://app-cobros-api-535051602259.us-central1.run.app/api';
const SESSION_TOKEN_KEY = 'APP_COBROS_JWT_TOKEN';
const USER_KEY = 'APP_COBROS_USER';

export const setSessionToken = (token: string) => localStorage.setItem(SESSION_TOKEN_KEY, token);
export const getSessionToken = () => localStorage.getItem(SESSION_TOKEN_KEY) || '';
export const clearSession = () => {
  localStorage.removeItem(SESSION_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const setStoredUser = (user: User) => localStorage.setItem(USER_KEY, JSON.stringify(user));
export const getStoredUser = (): User | null => {
  const u = localStorage.getItem(USER_KEY);
  return u ? JSON.parse(u) : null;
};

async function request<T>(endpoint: string, options: RequestInit = {}, authenticated = true): Promise<T> {
  const token = getSessionToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (authenticated && token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Error en servidor (HTTP ${res.status})`);
  }

  const data = await res.json();
  return data as T;
}

export const api = {
  // ── AUTENTICACIÓN ────────────────────────────────────────────────────────
  login: async (email: string, password: string): Promise<{ user: User; token: string }> => {
    const res = await request<{ success: boolean; user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }, false);
    setSessionToken(res.token);
    setStoredUser(res.user);
    return res;
  },

  updatePreferences: (userId: string, prefs: { hora_notificacion?: string; fcm_token?: string }) =>
    request<{ success: boolean; message: string }>('/auth/preferences', {
      method: 'PUT',
      body: JSON.stringify({ userId, ...prefs }),
    }),

  // ── DASHBOARD & COBROS ───────────────────────────────────────────────────
  getDashboard: () => request<DashboardData>('/dashboard'),
  
  getCollections: (tab: 'todos' | 'hoy' | 'por_vencer' | 'vencidos' | 'en_espera' | 'cancelacion' = 'todos') =>
    request<{ success: boolean; count: number; services: Service[] }>(`/collections?tab=${tab}`),

    registerPayment: (
    serviceIdOrPayment: string | { servicio_id: string; valor?: number; metodo_pago?: string; comprobante_ref?: string },
    paymentOrUser?: any,
    maybeUser?: any
  ) => {
    let serviceId = '';
    let payload: any = {};

    if (typeof serviceIdOrPayment === 'string') {
      serviceId = serviceIdOrPayment;
      payload = paymentOrUser || {};
      if (maybeUser) payload.usuario = typeof maybeUser === 'string' ? maybeUser : maybeUser?.nombre;
    } else {
      serviceId = serviceIdOrPayment.servicio_id;
      payload = serviceIdOrPayment;
      if (paymentOrUser) payload.usuario = typeof paymentOrUser === 'string' ? paymentOrUser : paymentOrUser?.nombre;
    }

    return request<{ success: boolean; message: string; fecha_proximo_pago: string }>(`/services/${serviceId}/pay`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  noRenewService: (serviceId: string, motivo?: string, usuario?: string) =>
    request<{ success: boolean; message: string }>(`/services/${serviceId}/no-renew`, {
      method: 'POST',
      body: JSON.stringify({ motivo, usuario }),
    }),

  wait24hService: (serviceId: string, usuario?: string) =>
    request<{ success: boolean; message: string }>(`/services/${serviceId}/wait-24h`, {
      method: 'POST',
      body: JSON.stringify({ usuario }),
    }),

    // ── CUENTAS MATRICES ─────────────────────────────────────────────────────
  getAccounts: () => request<Account[]>('/accounts'),
  saveAccount: (account: Partial<Account>, _user?: any) => {
    if (account.id) {
      return request<{ success: boolean }>(`/accounts/${account.id}`, { method: 'PUT', body: JSON.stringify(account) });
    }
    return request<{ success: boolean; id: string }>('/accounts', { method: 'POST', body: JSON.stringify(account) });
  },
  deleteAccount: (id: string) => request<{ success: boolean }>(`/accounts/${id}`, { method: 'DELETE' }),
  cancelAccount: (id: string) => api.deleteAccount(id),

  // ── CLIENTES ─────────────────────────────────────────────────────────────
  getClients: () => request<Client[]>('/clients'),
  saveClient: (client: Partial<Client>, _user?: any) => {
    if (client.id) {
      return request<{ success: boolean }>(`/clients/${client.id}`, { method: 'PUT', body: JSON.stringify(client) });
    }
    return request<{ success: boolean; id: string }>('/clients', { method: 'POST', body: JSON.stringify(client) });
  },
  deleteClient: (id: string) => request<{ success: boolean }>(`/clients/${id}`, { method: 'DELETE' }),

  // ── SERVICIOS ────────────────────────────────────────────────────────────
  getServices: () => request<Service[]>('/services'),
  saveService: (service: Partial<Service>, usuario?: any) => {
    const userNombre = typeof usuario === 'string' ? usuario : usuario?.nombre || 'Carlos';
    if (service.id) {
      return request<{ success: boolean; id: string }>(`/services/${service.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...service, usuario: userNombre }),
      });
    }
    return request<{ success: boolean; id: string }>('/services', {
      method: 'POST',
      body: JSON.stringify({ ...service, usuario: userNombre }),
    });
  },
  deleteService: (id: string) => request<{ success: boolean }>(`/services/${id}`, { method: 'DELETE' }),
  changeStatus: (serviceId: string, newStatus: string, notes?: string, usuario?: any) => {
    if (newStatus === 'CANCELADO') {
      return api.noRenewService(serviceId, notes, typeof usuario === 'string' ? usuario : usuario?.nombre);
    }
    return Promise.resolve({ success: true });
  },

  // ── FACTURACIÓN A PLATAFORMAS (COSTOS) ───────────────────────────────────
  getPlatformPayments: () => request<PlatformPayment[]>('/billing'),
  savePlatformPayment: (payment: Partial<PlatformPayment>, _user?: any) =>
    request<{ success: boolean }>('/billing', { method: 'POST', body: JSON.stringify(payment) }),
  payPlatformInvoice: (id: string, usuario?: any) =>
    request<{ success: boolean; message: string }>(`/billing/${id}/pay`, {
      method: 'POST',
      body: JSON.stringify({ usuario: typeof usuario === 'string' ? usuario : usuario?.nombre }),
    }),
  markPlatformPaymentPaid: (id: string, usuario?: any) => api.payPlatformInvoice(id, usuario),
  deletePlatformPayment: (id: string) =>
    request<{ success: boolean }>(`/billing/${id}`, { method: 'DELETE' }).catch(() => ({ success: true })),

    // ── APP DATA UNIFICADA ───────────────────────────────────────────────────
  getAppData: async (): Promise<AppData> => {
    const [dashboard, clients, services, accounts, platformPayments, history] = await Promise.all([
      api.getDashboard(),
      api.getClients(),
      api.getServices(),
      api.getAccounts(),
      api.getPlatformPayments(),
      api.getHistory(),
    ]);
    return { dashboard, clients, services, accounts, platformPayments, history };
  },

      // ── Recuperar contraseña ───────────────────────────────────────────────────────────── 
  resetPassword: (data: { email: string; masterKey: string; newPassword: string }) =>
    request<{ success: boolean; message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
  }, false),

  // ── HISTORIAL ────────────────────────────────────────────────────────────
  getHistory: (_limit?: number) => request<HistoryItem[]>('/history').catch(() => []),

  // ── MODO DEMOSTRACIÓN ──────────────────────────────────────────────────
  loginDemo: async (): Promise<{ user: User; token: string }> => {
    const demoUser: User = {
      id: 'USR-DEMO',
      nombre: 'Usuario Demo',
      email: 'demo@appcobros.com',
      rol: 'OPERADOR',
      hora_notificacion: '08:00',
    };
    const demoToken = 'DEMO_SESSION_TOKEN_2026';
    setSessionToken(demoToken);
    setStoredUser(demoUser);
    return { user: demoUser, token: demoToken };
  },

  // ── NOTIFICACIONES WEB PUSH (VAPID / APNs) ───────────────────────────
  getVapidPublicKey: () =>
    request<{ publicKey: string }>('/notifications/vapid-public-key', {}, false),

  subscribePush: (subscription: any, userId?: string) =>
    request<{ success: boolean; message: string }>('/notifications/subscribe', {
      method: 'POST',
      body: JSON.stringify({ subscription, userId }),
    }, false),

  sendTestNotification: (userId?: string, delaySeconds?: number) =>
    request<{ success: boolean; message: string }>('/notifications/test', {
      method: 'POST',
      body: JSON.stringify({ userId, delaySeconds }),
    }, false),

  sendDailyNotifications: () =>
    request<{ success: boolean; message: string }>('/notifications/send-daily', {
      method: 'POST',
    }, false),
};