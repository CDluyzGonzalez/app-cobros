export type ServiceStatus = 'ACTIVO' | 'POR_VENCER' | 'VENCIDO' | 'EN_ESPERA' | 'CANCELACION_PENDIENTE' | 'CANCELADO';

export interface User {
  id: string;
  nombre: string;
  email: string;
  password_hash: string;
  rol: 'ADMIN' | 'OPERADOR';
  activo: boolean;
  fcm_token?: string;
  hora_notificacion?: string; // Formato "HH:mm" (ej: "07:00")
  created_at: string;
  updated_at: string;
}

export interface Platform {
  id: string;
  nombre: string;
  perfiles_estandar: number;
  precio_sugerido: number;
  activo: boolean;
  created_at: string;
}

export interface Client {
  id: string;
  nombre: string;
  telefono: string;
  correo: string;
  notas: string;
  estado: 'ACTIVO' | 'INACTIVO';
  created_at: string;
  updated_at: string;
  updated_by?: string;
  version: number;
}

export interface Account {
  id: string;
  plataforma: string;
  correo_cuenta: string;
  password_encrypted: string;
  perfiles_totales: number;
  cupos_ocupados: number;
  costo_mensual: number;
  dia_pago_plataforma: number | string;
  estado: 'ACTIVA' | 'EN_REVISION' | 'CANCELADA';
  notas: string;
  created_at: string;
  updated_at: string;
}

// Entidad 3FN pura (almacenada en Firestore)
export interface ServiceEntity {
  id: string;
  cliente_id: string;
  cuenta_id: string;
  correo_cuenta?: string;
  plataforma: string;
  perfil: string;
  pin_encrypted: string;
  valor: number;
  dia_ancla: number; // Día del mes fijo (1 a 31)
  fecha_inicio: string; // YYYY-MM-DD
  fecha_ultimo_pago: string; // YYYY-MM-DD
  fecha_proximo_pago: string; // YYYY-MM-DD
  fecha_cambio_estado: string;
  estado: ServiceStatus;
  notas: string;
  created_at: string;
  updated_at: string;
  updated_by?: string;
  version: number;
}

// DTO enriquecido mediante JOIN en memoria para el frontend
export interface ServiceDTO extends ServiceEntity {
  cliente_nombre: string;
  cliente_telefono: string;
  cliente_correo: string;
  plataforma: string;
  correo_cuenta: string;
}

export interface ClientPayment {
  id: string;
  servicio_id: string;
  cliente_id: string;
  valor: number;
  fecha_pago_real: string;
  fecha_ciclo_anterior: string;
  fecha_ciclo_siguiente: string;
  metodo_pago: string;
  comprobante_ref: string;
  usuario_registro: string;
  created_at: string;
}

export interface PlatformPayment {
  id: string;
  cuenta_id: string;
  concepto: string;
  valor: number;
  fecha_limite: string;
  fecha_pago_real: string;
  estado: 'PENDIENTE' | 'PAGADO';
  notas: string;
  usuario_registro: string;
  created_at: string;
}

export interface HistoryItem {
  id: string;
  entidad: string;
  entidad_id: string;
  accion: string;
  descripcion: string;
  usuario: string;
  datos_previos?: any;
  datos_nuevos?: any;
  created_at: string;
}