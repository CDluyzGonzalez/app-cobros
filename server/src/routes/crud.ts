import { Router, Request, Response } from 'express';
import { db } from '../config/firebase.js';
import { DatabaseService } from '../services/database.js';
import { formatDateIso, getNextFixedMonthDate } from '../utils/dates.js';
import { Client, Account, PlatformPayment } from '../types/index.js';

export const crudRouter = Router();

// ── RUTAS CRUD PARA ENTIDADES PRINCIPALES: CLIENTES, CUENTAS, SERVICIOS, PAGOS PLATAFORMAS ──

// ── CLIENTES ─────────────────────────────────────────────────────────────
crudRouter.get('/clients', async (_req, res) => {
  const clients = await DatabaseService.getClients();
  res.json(clients);
});

crudRouter.post('/clients', async (req: Request, res: Response) => {
  try {
    const { nombre, telefono, correo, notas } = req.body;
    const now = new Date().toISOString();
    const docRef = await db.collection('clientes').add({
      nombre,
      telefono: telefono || '',
      correo: correo || '',
      notas: notas || '',
      estado: 'ACTIVO',
      created_at: now,
      updated_at: now,
      version: 1,
    });
    res.json({ success: true, id: docRef.id });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

crudRouter.put('/clients/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await db.collection('clientes').doc(id).update({
      ...req.body,
      updated_at: new Date().toISOString(),
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

crudRouter.delete('/clients/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await db.collection('clientes').doc(id).delete();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── CUENTAS MATRICES ─────────────────────────────────────────────────────
crudRouter.get('/accounts', async (_req, res) => {
  const accounts = await DatabaseService.getAccounts();
  res.json(accounts);
});

crudRouter.post('/accounts', async (req: Request, res: Response) => {
  try {
    const now = new Date().toISOString();
    const docRef = await db.collection('cuentas').add({
      ...req.body,
      cupos_ocupados: Number(req.body.cupos_ocupados) || 0,
      costo_mensual: Number(req.body.costo_mensual) || 0,
      estado: 'ACTIVA',
      created_at: now,
      updated_at: now,
    });
    res.json({ success: true, id: docRef.id });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

crudRouter.put('/accounts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await db.collection('cuentas').doc(id).update({
      ...req.body,
      updated_at: new Date().toISOString(),
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

crudRouter.delete('/accounts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await db.collection('cuentas').doc(id).delete();
    res.json({ success: true, message: 'Cuenta eliminada correctamente' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── SERVICIOS (CON FECHA LIBRE DE INICIO, DÍA ANCLA Y SOPORTE DE PLATAFORMA) ──
crudRouter.get('/services', async (_req, res) => {
  const services = await DatabaseService.getEnrichedServices();
  res.json(services);
});

// Crear nuevo servicio
crudRouter.post('/services', async (req: Request, res: Response) => {
  try {
    const {
      cliente_id,
      cuenta_id,
      correo_cuenta,
      plataforma,
      perfil,
      pin_encrypted,
      valor,
      fecha_proximo_pago,
      notas,
      usuario,
    } = req.body;

    const chosenDateStr = (fecha_proximo_pago || formatDateIso(new Date())).split('T')[0];
    const diaAncla = Number(chosenDateStr.split('-')[2]) || 1;
    const now = new Date().toISOString();

    let targetCuentaId = cuenta_id || '';

    // Si escribió un correo de cuenta, buscar o crear la cuenta matriz automáticamente
    if (correo_cuenta) {
      const accSnap = await db.collection('cuentas')
        .where('correo_cuenta', '==', correo_cuenta.toLowerCase().trim())
        .get();

      if (!accSnap.empty) {
        targetCuentaId = accSnap.docs[0].id;
      } else {
        const newAcc = await db.collection('cuentas').add({
          plataforma: plataforma || 'Netflix',
          correo_cuenta: correo_cuenta.toLowerCase().trim(),
          password_encrypted: '',
          perfiles_totales: 5,
          cupos_ocupados: 1,
          costo_mensual: 0,
          dia_pago_plataforma: '1',
          estado: 'ACTIVA',
          notas: 'Creada automáticamente desde servicio',
          created_at: now,
          updated_at: now,
        });
        targetCuentaId = newAcc.id;
      }
    }

    const docRef = await db.collection('servicios').add({
      cliente_id,
      cuenta_id: targetCuentaId,
      correo_cuenta: correo_cuenta || '',
      plataforma: plataforma || 'Netflix',
      perfil: perfil || '',
      pin_encrypted: pin_encrypted || '',
      valor: Number(valor) || 0,
      dia_ancla: diaAncla,
      fecha_inicio: chosenDateStr,
      fecha_ultimo_pago: '',
      fecha_proximo_pago: chosenDateStr,
      fecha_cambio_estado: now,
      estado: 'ACTIVO',
      notas: notas || '',
      created_at: now,
      updated_at: now,
      updated_by: usuario || 'Sistema',
      version: 1,
    });

    res.json({ success: true, id: docRef.id, dia_ancla: diaAncla });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Editar servicio existente (PUT)
crudRouter.put('/services/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const now = new Date().toISOString();
    const updateData: any = {
      ...req.body,
      updated_at: now,
    };

    if (req.body.fecha_proximo_pago) {
      const cleanDate = req.body.fecha_proximo_pago.split('T')[0];
      updateData.fecha_proximo_pago = cleanDate;
      updateData.dia_ancla = Number(cleanDate.split('-')[2]) || 1;
    }

    // Vincular cuenta matriz por correo si se ingresó uno
    if (req.body.correo_cuenta) {
      updateData.correo_cuenta = req.body.correo_cuenta.trim();
      const accSnap = await db.collection('cuentas')
        .where('correo_cuenta', '==', req.body.correo_cuenta.toLowerCase().trim())
        .get();

      if (!accSnap.empty) {
        updateData.cuenta_id = accSnap.docs[0].id;
      }
    }

    if (req.body.plataforma) {
      updateData.plataforma = req.body.plataforma;
    }

    await db.collection('servicios').doc(id).update(updateData);
    res.json({ success: true, message: 'Servicio actualizado correctamente' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Eliminar servicio
crudRouter.delete('/services/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const srvDoc = await db.collection('servicios').doc(id).get();
    if (srvDoc.exists) {
      const cuentaId = srvDoc.data()?.cuenta_id;
      if (cuentaId) {
        const accDoc = await db.collection('cuentas').doc(cuentaId).get();
        if (accDoc.exists) {
          const current = accDoc.data()?.cupos_ocupados || 1;
          await db.collection('cuentas').doc(cuentaId).update({
            cupos_ocupados: Math.max(0, current - 1),
          });
        }
      }
    }
    await db.collection('servicios').doc(id).delete();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── FACTURACIÓN / PAGOS PLATAFORMAS (COSTOS) ─────────────────────────────
crudRouter.get('/billing', async (_req, res) => {
  const payments = await DatabaseService.getPlatformPayments();
  res.json(payments);
});

crudRouter.post('/billing/:id/pay', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { usuario } = req.body;
    const now = new Date().toISOString();
    const todayStr = formatDateIso(new Date());

    const payDoc = await db.collection('pagos_plataformas').doc(id).get();
    if (!payDoc.exists) return res.status(404).json({ success: false, message: 'Pago no encontrado' });

    const pay = payDoc.data() as PlatformPayment;

    // 1. Marcar como pagado el actual
    await db.collection('pagos_plataformas').doc(id).update({
      estado: 'PAGADO',
      fecha_pago_real: todayStr,
      usuario_registro: usuario || 'Sistema',
    });

    // 2. Generar el cobro del próximo mes con fecha fija mensual
    const currentLimit = pay.fecha_limite || todayStr;
    const diaAncla = Number(currentLimit.split('-')[2]) || 1;
    const nextLimit = getNextFixedMonthDate(currentLimit, diaAncla);

    await db.collection('pagos_plataformas').add({
      cuenta_id: pay.cuenta_id || '',
      concepto: pay.concepto,
      valor: pay.valor,
      fecha_limite: nextLimit,
      fecha_pago_real: '',
      estado: 'PENDIENTE',
      notas: pay.notas || '',
      usuario_registro: usuario || 'Sistema',
      created_at: now,
    });

    res.json({ success: true, message: `Pago registrado. Siguiente vencimiento: ${nextLimit}` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Crear o editar costo de plataforma
crudRouter.post('/billing', async (req: Request, res: Response) => {
  try {
    const { id, cuenta_id, concepto, valor, fecha_limite, notas, usuario } = req.body;
    const now = new Date().toISOString();

    if (id) {
      await db.collection('pagos_plataformas').doc(id).update({
        cuenta_id: cuenta_id || '',
        concepto: concepto || '',
        valor: Number(valor) || 0,
        fecha_limite: fecha_limite || '',
        notas: notas || '',
        updated_at: now,
      });
      return res.json({ success: true, message: 'Costo actualizado correctamente' });
    }

    const docRef = await db.collection('pagos_plataformas').add({
      cuenta_id: cuenta_id || '',
      concepto: concepto || '',
      valor: Number(valor) || 0,
      fecha_limite: fecha_limite || '',
      fecha_pago_real: '',
      estado: 'PENDIENTE',
      notas: notas || '',
      usuario_registro: usuario || 'Sistema',
      created_at: now,
    });

    res.json({ success: true, id: docRef.id, message: 'Costo guardado correctamente' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

crudRouter.delete('/billing/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await db.collection('pagos_plataformas').doc(id).delete();
    res.json({ success: true, message: 'Costo eliminado correctamente' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── HISTORIAL DE AUDITORÍA ───────────────────────────────────────────────
crudRouter.get('/history', async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 50;
    const snap = await db.collection('historial')
      .orderBy('created_at', 'desc')
      .limit(limit)
      .get();
    const history = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(history);
  } catch (_err) {
    res.json([]);
  }
});