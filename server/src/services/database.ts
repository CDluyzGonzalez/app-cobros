import { db } from '../config/firebase.js';
import { Client, Account, ServiceEntity, ServiceDTO, PlatformPayment, ClientPayment, User } from '../types/index.js';

export class DatabaseService {
  // Obtener usuarios
  static async getUsers(): Promise<User[]> {
    const snapshot = await db.collection('usuarios').get();
    return snapshot.docs.map(doc => {
      const data = doc.data();
      delete data.id;
      return { ...data, id: doc.id } as User;
    });
  }

  // Obtener clientes
  static async getClients(): Promise<Client[]> {
    const snapshot = await db.collection('clientes').get();
    return snapshot.docs.map(doc => {
      const data = doc.data();
      delete data.id;
      return { ...data, id: doc.id } as Client;
    });
  }

  // Obtener cuentas matrices (con cálculo dinámico de cupos ocupados según servicios activos)
  static async getAccounts(): Promise<Account[]> {
    const [accountsSnap, servicesSnap] = await Promise.all([
      db.collection('cuentas').get(),
      db.collection('servicios').get(),
    ]);

    const services = servicesSnap.docs.map(doc => doc.data() as ServiceEntity);

    return accountsSnap.docs.map(doc => {
      const data = doc.data();
      delete data.id;
      const accountId = doc.id;
      const correo = (data.correo_cuenta || '').toLowerCase().trim();
      const plataforma = (data.plataforma || '').toLowerCase().trim();

      // Contar servicios activos asociados a esta cuenta
      const activeCount = services.filter(s => {
        if (s.estado === 'CANCELADO') return false;
        if (s.cuenta_id && s.cuenta_id === accountId) return true;
        if (correo && s.correo_cuenta && s.correo_cuenta.toLowerCase().trim() === correo) {
          if (!plataforma || (s.plataforma || '').toLowerCase().trim() === plataforma) {
            return true;
          }
        }
        return false;
      }).length;

      return {
        ...data,
        id: accountId,
        costo_mensual: Number(data.costo_mensual) || 0,
        perfiles_totales: Number(data.perfiles_totales) || 5,
        cupos_ocupados: activeCount,
      } as Account;
    });
  }

  // Obtener pagos a plataformas (costos)
  static async getPlatformPayments(): Promise<PlatformPayment[]> {
    const snapshot = await db.collection('pagos_plataformas').get();
    return snapshot.docs.map(doc => {
      const data = doc.data();
      delete data.id;
      return { ...data, id: doc.id } as PlatformPayment;
    });
  }

  // Obtener servicios con cruce 3FN en memoria (JOIN)
  static async getEnrichedServices(): Promise<ServiceDTO[]> {
    const [servicesSnap, clients, accounts] = await Promise.all([
      db.collection('servicios').get(),
      this.getClients(),
      this.getAccounts(),
    ]);

    const clientsMap = new Map<string, Client>(clients.map(c => [c.id, c]));
    const accountsMap = new Map<string, Account>(accounts.map(a => [a.id, a]));

    return servicesSnap.docs.map(doc => {
      const data = doc.data() as ServiceEntity;
      const client = clientsMap.get(data.cliente_id);
      const account = accountsMap.get(data.cuenta_id);

      return {
        ...data,
        id: doc.id,
        cliente_nombre: client ? client.nombre : 'Cliente Desconocido',
        cliente_telefono: client ? client.telefono : '',
        cliente_correo: client ? client.correo : '',
        plataforma: data.plataforma || (account ? account.plataforma : 'Netflix'),
        correo_cuenta: (account ? account.correo_cuenta : '') || data.correo_cuenta || '',
      };
    });
  }

  // Registrar auditoría inmutable en el historial
  static async logHistory(entidad: string, entidad_id: string, accion: string, descripcion: string, usuario: string = 'Sistema') {
    await db.collection('historial').add({
      entidad,
      entidad_id,
      accion,
      descripcion,
      usuario,
      created_at: new Date().toISOString(),
    });
  }
}