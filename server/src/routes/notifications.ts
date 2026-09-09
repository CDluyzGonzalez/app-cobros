import { Router, Request, Response } from 'express';
import webpush from 'web-push';
import { db } from '../config/firebase.js';
import { DatabaseService } from '../services/database.js';
import { formatDateIso } from '../utils/dates.js';

export const notificationsRouter = Router();

// Configuración VAPID para Web Push estándar (APNs / Apple / Google / Mozilla)
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@platnex.com';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
} else {
  console.warn('⚠️ VAPID keys no configuradas en variables de entorno.');
}

function isExpiredOrMismatch(err: any): boolean {
  if (!err) return false;
  if (err.statusCode === 410 || err.statusCode === 404) return true;
  const bodyStr = typeof err.body === 'string' ? err.body : JSON.stringify(err.body || '');
  if (err.statusCode === 400 && bodyStr.includes('VapidPkHashMismatch')) return true;
  return false;
}

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
      query = query.where('userId', '==', userId);
    }

    const snap = await query.get();
    if (snap.empty) {
      return res.status(400).json({
        success: false,
        message: userId
          ? 'No hay dispositivos suscritos para tu cuenta. Pulsa "Activar Alertas" en tu celular primero.'
          : 'No hay dispositivos suscritos. Pulsa "Activar Alertas" en tu celular primero.',
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
        if (isExpiredOrMismatch(err)) {
          console.warn('🗑️ Eliminando suscripción push caducada o con llave VAPID previa:', doc.id);
          await doc.ref.delete();
        } else {
          console.error('Error enviando push a dispositivo:', err.statusCode, err.body || err.message);
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
 * Consulta cobros pendientes hoy + atrasados y envía push notification POR USUARIO a sus dispositivos
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

    // Obtener todos los usuarios para enviar a cada uno sus dispositivos
    const usersSnap = await db.collection('usuarios').get();
    if (usersSnap.empty) {
      return res.json({ success: true, message: 'No hay usuarios registrados.', totalPendientes, valorTotal });
    }

    const payload = JSON.stringify({
      title: `📋 ${totalPendientes} Cobro${totalPendientes !== 1 ? 's' : ''} Pendiente${totalPendientes !== 1 ? 's' : ''} (${formattedValor})`,
      body: `Tienes ${cobrosHoy.length} cobro(s) de hoy y ${cobrosVencidos.length} vencido(s). Toca para verlos.`,
      icon: '/logo.png',
      badge: '/logo.png',
      data: { url: 'https://app-cobros-v2.web.app' },
    });

    let totalSuccess = 0;

    for (const userDoc of usersSnap.docs) {
      const subsSnap = await db.collection('push_subscriptions').where('userId', '==', userDoc.id).get();
      if (subsSnap.empty) continue;

      const promises = subsSnap.docs.map(async (subDoc) => {
        const sub = subDoc.data() as webpush.PushSubscription;
        try {
          await webpush.sendNotification(sub, payload);
          totalSuccess++;
        } catch (err: any) {
          if (isExpiredOrMismatch(err)) {
            await subDoc.ref.delete();
          }
        }
      });

      await Promise.all(promises);
    }

    res.json({
      success: true,
      message: `Notificaciones diarias enviadas a ${totalSuccess} dispositivo(s).`,
      totalPendientes,
      valorTotal,
      successCount: totalSuccess,
    });
  } catch (error: any) {
    console.error('Error enviando notificaciones diarias:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/notifications/cron-check
 * Llamado por Google Cloud Scheduler cada hora.
 * Itera POR USUARIO: verifica hora preferida, envía solo a los dispositivos de ese usuario,
 * y usa un log de control POR USUARIO POR DÍA para evitar duplicados sin bloquear a otros usuarios.
 */
notificationsRouter.post('/cron-check', async (_req: Request, res: Response) => {
  try {
    // Hora actual en Colombia (UTC-5)
    const nowColombia = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' }));
    const currentHour = nowColombia.getHours().toString().padStart(2, '0');
    const currentMinute = nowColombia.getMinutes();
    const todayKey = formatDateIso(nowColombia);

    console.log(`[cron-check] Hora Colombia: ${currentHour}:${currentMinute.toString().padStart(2, '0')} | Fecha: ${todayKey}`);

    // Obtener todos los usuarios
    const usersSnap = await db.collection('usuarios').get();
    if (usersSnap.empty) {
      return res.json({ success: true, message: 'No hay usuarios registrados.', skipped: true });
    }

    // Identificar qué usuarios deben recibir notificación en esta hora
    const usersToNotify: { id: string; nombre: string }[] = [];

    for (const userDoc of usersSnap.docs) {
      const data = userDoc.data();
      const horaPreferida = data.hora_notificacion || '07:00';
      const [prefHour] = horaPreferida.split(':');

      if (prefHour !== currentHour) continue; // No es su hora

      // Verificar log de control POR USUARIO POR DÍA
      const logKey = `${todayKey}__${userDoc.id}`;
      const controlDoc = await db.collection('notification_log').doc(logKey).get();
      if (controlDoc.exists && controlDoc.data()?.sent === true) {
        console.log(`[cron-check] ⏭️ Usuario ${data.nombre || userDoc.id} ya notificado hoy.`);
        continue;
      }

      usersToNotify.push({ id: userDoc.id, nombre: data.nombre || data.email || userDoc.id });
    }

    if (usersToNotify.length === 0) {
      return res.json({
        success: true,
        message: `No hay usuarios para notificar a las ${currentHour}:${currentMinute.toString().padStart(2, '0')}.`,
        skipped: true,
      });
    }

    // Consultar cobros pendientes (compartidos para todos los usuarios)
    const services = await DatabaseService.getEnrichedServices();
    const cobrosHoy = services.filter(s => s.fecha_proximo_pago === todayKey && s.estado !== 'CANCELADO');
    const cobrosVencidos = services.filter(s => s.fecha_proximo_pago < todayKey && s.estado !== 'CANCELADO');
    const totalPendientes = cobrosHoy.length + cobrosVencidos.length;

    if (totalPendientes === 0) {
      // Marcar todos como enviados (no molestar)
      for (const u of usersToNotify) {
        await db.collection('notification_log').doc(`${todayKey}__${u.id}`).set({
          sent: true, userId: u.id, totalPendientes: 0, sentAt: new Date().toISOString(),
        });
      }
      return res.json({ success: true, message: 'Sin cobros pendientes hoy. No se envió notificación.', totalPendientes: 0 });
    }

    const valorTotal = [...cobrosHoy, ...cobrosVencidos].reduce((acc, s) => acc + (s.valor || 0), 0);
    const formattedValor = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(valorTotal);

    const payload = JSON.stringify({
      title: `📋 ${totalPendientes} Cobro${totalPendientes !== 1 ? 's' : ''} Pendiente${totalPendientes !== 1 ? 's' : ''} (${formattedValor})`,
      body: `Tienes ${cobrosHoy.length} cobro(s) de hoy y ${cobrosVencidos.length} vencido(s). Toca para verlos.`,
      icon: '/logo.png',
      badge: '/logo.png',
      data: { url: 'https://app-cobros-v2.web.app' },
    });

    // Enviar POR USUARIO — solo a los dispositivos de cada usuario
    let totalSuccess = 0;
    const userResults: string[] = [];

    for (const u of usersToNotify) {
      const subsSnap = await db.collection('push_subscriptions').where('userId', '==', u.id).get();

      if (subsSnap.empty) {
        console.log(`[cron-check] ⚠️ Usuario ${u.nombre} no tiene dispositivos suscritos.`);
        // Marcar como enviado para no reintentar en la siguiente hora
        await db.collection('notification_log').doc(`${todayKey}__${u.id}`).set({
          sent: true, userId: u.id, totalPendientes, noDevices: true, sentAt: new Date().toISOString(),
        });
        userResults.push(`${u.nombre}: 0 dispositivos`);
        continue;
      }

      let userSuccess = 0;
      const promises = subsSnap.docs.map(async (subDoc) => {
        const sub = subDoc.data() as webpush.PushSubscription;
        try {
          await webpush.sendNotification(sub, payload);
          userSuccess++;
        } catch (err: any) {
          if (isExpiredOrMismatch(err)) {
            await subDoc.ref.delete();
          }
        }
      });

      await Promise.all(promises);
      totalSuccess += userSuccess;

      // Marcar log de control POR USUARIO
      await db.collection('notification_log').doc(`${todayKey}__${u.id}`).set({
        sent: true,
        userId: u.id,
        totalPendientes,
        valorTotal,
        successCount: userSuccess,
        sentAt: new Date().toISOString(),
      });

      userResults.push(`${u.nombre}: ${userSuccess} dispositivo(s)`);
      console.log(`[cron-check] ✅ ${u.nombre} → ${userSuccess} dispositivo(s)`);
    }

    console.log(`[cron-check] ✅ Total: ${totalSuccess} dispositivo(s) notificados. Pendientes: ${totalPendientes}`);

    res.json({
      success: true,
      message: `Alerta diaria enviada: ${userResults.join(' | ')}. ${totalPendientes} cobros pendientes (${formattedValor}).`,
      totalPendientes,
      totalSuccess,
      userResults,
    });
  } catch (error: any) {
    console.error('[cron-check] Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});
