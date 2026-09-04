import { db } from '../config/firebase.js';
import { Client, Account, ServiceEntity, ServiceDTO, PlatformPayment, ClientPayment, User } from '../types/index.js';

export class DatabaseService {
  // Obtener usuarios
  static async getUsers(): Promise<User[]> {
    const snapshot = await db.collection('usuarios').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
  }

  // Obtener clientes
  static async getClients(): Promise<Client[]> {
    const snapshot = await db.collection('clientes').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
  }

  // Obtener cuentas matrices
  static async getAccounts(): Promise<Account[]> {
    const snapshot = await db.collection('cuentas').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account));
  }

  // Obtener pagos a plataformas (costos)
  static async getPlatformPayments(): Promise<PlatformPayment[]> {
    const snapshot = await db.collection('pagos_plataformas').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PlatformPayment));
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