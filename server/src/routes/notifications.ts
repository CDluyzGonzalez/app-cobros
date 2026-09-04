import { Router, Request, Response } from 'express';
import webpush from 'web-push';
import { db } from '../config/firebase.js';
import { DatabaseService } from '../services/database.js';
import { formatDateIso } from '../utils/dates.js';

export const notificationsRouter = Router();

// Configuración VAPID permanente para Web Push estándar (APNs / Apple / Google / Mozilla)
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BOInRR8LAGfSMbdyb19LZwPcdBqKUG8P25MhGcqhz0Ey1VCs9ygw55HpPC0tEP9NBzE0AXP_-w_l_ZGC53Jho6A';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'P9KX2YYH8e52P8UjPbkCge9HCuCl13ijwjvEKpQooiw';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@platnex.com';

webpush.setVapidDetails(
  VAPID_SUBJECT,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

/**
 * GET /api/notifications/vapid-public-key
 * Retorna la llave pública VAPID para que el navegador/iPhone se suscriba
 */
notificationsRouter.get('/vapid-public-key', (_req: Request, res: Response) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});

/**
 * POST /api/notifications/subscribe
 * Guarda la suscripción Web Push en Firestore
 */
notificationsRouter.post('/subscribe', async (req: Request, res: Response) => {
  try {
    const { subscription, userId } = req.body;
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ success: false, message: 'Objeto de suscripción inválido.' });
    }

    // Usar un hash base64url del endpoint como ID único de documento
    const docId = Buffer.from(subscription.endpoint).toString('base64url').slice(-60);

    await db.collection('push_subscriptions').doc(docId).set({
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      userId: userId || null,
      updated_at: new Date().toISOString(),
    }, { merge: true });

    res.json({ success: true, message: 'Dispositivo suscrito exitosamente a notificaciones remotas.' });
  } catch (error: any) {
    console.error('Error guardando suscripción:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/notifications/test
 * Envía una notificación remota de prueba (opcionalmente con retardo en la nube)
 */
notificationsRouter.post('/test', async (req: Request, res: Response) => {
  try {
    const { userId, delaySeconds } = req.body;

    // Si el usuario pidió retraso para bloquear la pantalla, la nube espera aquí
    if (delaySeconds && typeof delaySeconds === 'number' && delaySeconds > 0) {
      const waitMs = Math.min(delaySeconds, 30) * 1000;
      await new Promise(resolve => setTimeout(resolve, waitMs));
    }

    let query: FirebaseFirestore.Query = db.collection('push_subscriptions');
    if (userId) {
      // Si se especifica userId, intentar buscar de ese usuario
      const userSubs = await query.where('userId', '==', userId).get();
      if (!userSubs.empty) {
        query = query.where('userId', '==', userId);
      }
    }

    const snap = await query.get();
    if (snap.empty) {
      return res.status(400).json({
        success: false,
        message: 'No hay dispositivos suscritos. Pulsa "Activar Alertas" en tu celular primero.',
      });
    }

    const payload = JSON.stringify({
      title: '🔔 Platnex — Prueba de Alerta',
      body: '¡Notificación remota entregada desde Google Cloud a tu iPhone con sonido!',
      icon: '/logo.png',
      badge: '/logo.png',
      data: { url: 'https://app-cobros-v2.web.app' },
    });

    let successCount = 0;
    const promises = snap.docs.map(async (doc) => {
      const sub = doc.data() as webpush.PushSubscription;
      try {
        await webpush.sendNotification(sub, payload);
        successCount++;
      } catch (err: any) {
        // Si el endpoint caducó (410 o 404), limpiar de Firestore
        if (err.statusCode === 410 || err.statusCode === 404) {
          await doc.ref.delete();
        } else {
          console.error('Error enviando push a dispositivo:', err.message);
        }
      }
    });

    await Promise.all(promises);

    res.json({
      success: true,
      message: `Alerta remota enviada exitosamente a ${successCount} dispositivo(s).`,
      successCount,
    });
  } catch (error: any) {
    console.error('Error en prueba de notificación remota:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/notifications/send-daily
 * Consulta cobros pendientes hoy + atrasados y envía push notification remota a todos los dispositivos
 */
notificationsRouter.post('/send-daily', async (_req: Request, res: Response) => {
  try {
    const todayStr = formatDateIso(new Date());
    const services = await DatabaseService.getEnrichedServices();

    // Filtrar cobros de hoy + vencidos
    const cobrosHoy = services.filter(s => s.fecha_proximo_pago === todayStr && s.estado !== 'CANCELADO');
    const cobrosVencidos = services.filter(s => s.fecha_proximo_pago < todayStr && s.estado !== 'CANCELADO');
    const totalPendientes = cobrosHoy.length + cobrosVencidos.length;

    const valorTotal = [...cobrosHoy, ...cobrosVencidos].reduce((acc, s) => acc + (s.valor || 0), 0);
    const formattedValor = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(valorTotal);

    const snap = await db.collection('push_subscriptions').get();
    if (snap.empty) {
      return res.json({
        success: true,
        message: 'No hay dispositivos suscritos en la nube.',
        totalPendientes,
        valorTotal,
      });
    }

    const payload = JSON.stringify({
      title: `📋 ${totalPendientes} Cobro${totalPendientes !== 1 ? 's' : ''} Pendiente${totalPendientes !== 1 ? 's' : ''} (${formattedValor})`,
      body: `Tienes ${cobrosHoy.length} cobro(s) de hoy y ${cobrosVencidos.length} vencido(s). Toca para verlos.`,
      icon: '/logo.png',
      badge: '/logo.png',
      data: { url: 'https://app-cobros-v2.web.app' },
    });

    let successCount = 0;
    const promises = snap.docs.map(async (doc) => {
      const sub = doc.data() as webpush.PushSubscription;
      try {
        await webpush.sendNotification(sub, payload);
        successCount++;
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await doc.ref.delete();
        }
      }
    });

    await Promise.all(promises);

    res.json({
      success: true,
      message: `Notificaciones diarias enviadas a ${successCount} dispositivo(s).`,
      totalPendientes,
      valorTotal,
      successCount,
    });
  } catch (error: any) {
    console.error('Error enviando notificaciones diarias:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/notifications/cron-check
 * Llamado por Google Cloud Scheduler cada 30 minutos.
 * Verifica la hora preferida de cada usuario y solo envía si coincide con la hora actual (Colombia UTC-5).
 * Evita duplicados usando un documento de control diario en Firestore.
 */
notificationsRouter.post('/cron-check', async (_req: Request, res: Response) => {
  try {
    // Hora actual en Colombia (UTC-5)
    const nowColombia = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' }));
    const currentHour = nowColombia.getHours().toString().padStart(2, '0');
    const currentMinute = nowColombia.getMinutes();
    const todayKey = formatDateIso(nowColombia);

    console.log(`[cron-check] Hora Colombia: ${currentHour}:${currentMinute.toString().padStart(2, '0')} | Fecha: ${todayKey}`);

    // Verificar si ya enviamos hoy
    const controlDoc = await db.collection('notification_log').doc(todayKey).get();
    if (controlDoc.exists && controlDoc.data()?.sent === true) {
      return res.json({ success: true, message: `Ya se enviaron las notificaciones de hoy (${todayKey}). Sin duplicados.`, skipped: true });
    }

    // Obtener la hora preferida de los usuarios
    const usersSnap = await db.collection('usuarios').get();
    let shouldSend = false;

    usersSnap.forEach(doc => {
      const data = doc.data();
      const horaPreferida = data.hora_notificacion || '07:00';
      const [prefHour] = horaPreferida.split(':');
      // Enviar si la hora actual coincide con la preferida (ej: si prefiere 07:xx y el cron corre a las 07:00)
      if (prefHour === currentHour) {
        shouldSend = true;
      }
    });

    if (!shouldSend) {
      return res.json({
        success: true,
        message: `No es hora de enviar. Hora actual: ${currentHour}:${currentMinute.toString().padStart(2, '0')}`,
        skipped: true,
      });
    }

    // Es hora de enviar — consultar cobros pendientes
    const services = await DatabaseService.getEnrichedServices();
    const cobrosHoy = services.filter(s => s.fecha_proximo_pago === todayKey && s.estado !== 'CANCELADO');
    const cobrosVencidos = services.filter(s => s.fecha_proximo_pago < todayKey && s.estado !== 'CANCELADO');
    const totalPendientes = cobrosHoy.length + cobrosVencidos.length;

    if (totalPendientes === 0) {
      // Marcar como enviado y no molestar
      await db.collection('notification_log').doc(todayKey).set({ sent: true, totalPendientes: 0, sentAt: new Date().toISOString() });
      return res.json({ success: true, message: 'Sin cobros pendientes hoy. No se envió notificación.', totalPendientes: 0 });
    }

    const valorTotal = [...cobrosHoy, ...cobrosVencidos].reduce((acc, s) => acc + (s.valor || 0), 0);
    const formattedValor = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(valorTotal);

    const snap = await db.collection('push_subscriptions').get();
    if (snap.empty) {
      await db.collection('notification_log').doc(todayKey).set({ sent: true, totalPendientes, noDevices: true, sentAt: new Date().toISOString() });
      return res.json({ success: true, message: 'No hay dispositivos suscritos.', totalPendientes });
    }

    const payload = JSON.stringify({
      title: `📋 ${totalPendientes} Cobro${totalPendientes !== 1 ? 's' : ''} Pendiente${totalPendientes !== 1 ? 's' : ''} (${formattedValor})`,
      body: `Tienes ${cobrosHoy.length} cobro(s) de hoy y ${cobrosVencidos.length} vencido(s). Toca para verlos.`,
      icon: '/logo.png',
      badge: '/logo.png',
      data: { url: 'https://app-cobros-v2.web.app' },
    });

    let successCount = 0;
    const promises = snap.docs.map(async (doc) => {
      const sub = doc.data() as webpush.PushSubscription;
      try {
        await webpush.sendNotification(sub, payload);
        successCount++;
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await doc.ref.delete();
        }
      }
    });

    await Promise.all(promises);

    // Marcar como enviado para no repetir hoy
    await db.collection('notification_log').doc(todayKey).set({
      sent: true,
      totalPendientes,
      valorTotal,
      successCount,
      sentAt: new Date().toISOString(),
    });

    console.log(`[cron-check] ✅ Notificaciones enviadas a ${successCount} dispositivo(s). Total pendientes: ${totalPendientes}`);

    res.json({
      success: true,
      message: `Alerta diaria enviada a ${successCount} dispositivo(s). ${totalPendientes} cobros pendientes (${formattedValor}).`,
      totalPendientes,
      successCount,
    });
  } catch (error: any) {
    console.error('[cron-check] Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});
