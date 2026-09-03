export type ServiceStatus =
  | 'ACTIVO'
  | 'POR_VENCER'
  | 'VENCIDO'
  | 'RENOVACION_PENDIENTE'
  | 'PAGO_PENDIENTE'
  | 'RECORDATORIO_ENVIADO'
  | 'CANCELACION_PENDIENTE'
  | 'CANCELADO';

export interface User {
  id: string;
  nombre: string;
  email: string;
  rol: 'ADMIN' | 'OPERADOR';
  token?: string;
}

export interface Platform {
  id: string;
  nombre: string;
  perfiles_estandar: number;
  precio_sugerido: number;
  activo: boolean;
}

export interface Client {
  id: string;
  nombre: string;
  telefono: string;
  correo: string;
  notas: string;
  estado: string;
  created_at: string;
  updated_at: string;
  updated_by: string;
  version: number;
}

/**
 * Entidad pura normalizada (3FN)
 */
export interface ServiceEntity {
  id: string;
  cliente_id: string;
  cuenta_id: string;
  perfil: string;
  pin: string;
  valor: number;
  fecha_ultimo_pago: string;
  fecha_proximo_pago: string;
  fecha_cambio_estado: string;
  estado: ServiceStatus;
  notas: string;
  created_at: string;
  updated_at: string;
  updated_by: string;
  version: number;
}

/**
 * DTO enriquecido por el backend (JOIN 3FN) para la interfaz de usuario
 */
export interface Service extends ServiceEntity {
  cliente_nombre: string;
  cliente_telefono: string;
  plataforma: string;
  correo_cuenta?: string;
}

export interface Account {
  id: string;
  plataforma: string;
  correo_cuenta: string;
  perfiles_totales: number;
  cupos_ocupados: number;
  costo_mensual: number;
  dia_pago_plataforma: string;
  estado: string;
  notas: string;
}

export interface PlatformPayment {
  id: string;
  cuenta_id: string;
  plataforma: string;
  concepto: string;
  valor: number;
  fecha_limite: string;
  fecha_pago_real: string;
  estado: 'PENDIENTE' | 'PAGADO';
  notas: string;
  usuario_registro: string;
  created_at: string;
}

export interface ClientPayment {
  id: string;
  servicio_id: string;
  valor: number;
  fecha_pago_real: string;
  fecha_ciclo_anterior: string;
  fecha_ciclo_siguiente: string;
  metodo_pago: string;
  comprobante_ref: string;
  usuario_registro: string;
  created_at: string;
}

export interface DashboardMetrics {
  totalServices: number;
  totalIncome: number;
  totalCosts: number;
  profit: number;
  overdueCount: number;
  dueTodayCount: number;
  upcomingCount: number;
  pendingPaymentCount: number;
  pendingCancelCount: number;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  cobros: {
    vencidos: Service[];
    hoy: Service[];
    proximos: Service[];
    pago_pendiente: Service[];
    cancelacion_pendiente: Service[];
  };
}

export interface HistoryItem {
  id: string;
  entidad: string;
  entidad_id: string;
  accion: string;
  descripcion: string;
  usuario: string;
  created_at: string;
}

export interface AppData {
  dashboard: DashboardData;
  clients: Client[];
  services: Service[];
  accounts: Account[];
  platformPayments: PlatformPayment[];
  history: HistoryItem[];
}