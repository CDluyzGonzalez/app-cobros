import { Router, Request, Response } from 'express';
import { db } from '../config/firebase.js';
import { DatabaseService } from '../services/database.js';
import { formatDateIso, getDaysDifference, getNextFixedMonthDate } from '../utils/dates.js';

export const cobrosRouter = Router();

/**
 * GET /api/dashboard
 * Retorna métricas del mes y la sección destacada de "Cobros Pendientes Hoy + Atrasados"
 */
cobrosRouter.get('/dashboard', async (_req: Request, res: Response) => {
  try {
    const [services, platformPayments] = await Promise.all([
      DatabaseService.getEnrichedServices(),
      DatabaseService.getPlatformPayments(),
    ]);

    const todayStr = formatDateIso(new Date());

    // 1. Cobros Pendientes: Los de hoy MÁS los atrasados que no han pagado
    const pendientesHoyYAtrasados = services.filter(srv => {
      if (srv.estado === 'CANCELADO') return false;
      const diff = getDaysDifference(srv.fecha_proximo_pago);
      // diff <= 0 significa que vence hoy (0) o ya venció en días pasados (< 0)
      return diff <= 0;
    }).sort((a, b) => a.fecha_proximo_pago.localeCompare(b.fecha_proximo_pago));

    // 2. Cobros de hoy exactos
    const cobrosHoy = services.filter(srv => srv.fecha_proximo_pago === todayStr && srv.estado !== 'CANCELADO');

    // 3. Cobros vencidos en días anteriores
    const cobrosVencidos = services.filter(srv => {
      const diff = getDaysDifference(srv.fecha_proximo_pago);
      return diff < 0 && srv.estado !== 'CANCELADO';
    });

    // 4. Métricas Financieras
    const activeServices = services.filter(s => s.estado !== 'CANCELADO');
    const totalIngresosEsperados = activeServices.reduce((acc, s) => acc + (Number(s.valor) || 0), 0);
    
    // Deduplicación de costos operativos mensuales
    const uniqueCostsMap = new Map<string, number>();
    platformPayments.forEach(p => {
      const key = (p.cuenta_id || p.concepto || '').trim().toLowerCase();
      if (!uniqueCostsMap.has(key)) {
        uniqueCostsMap.set(key, Number(p.valor) || 0);
      }
    });
    const totalCostosPlataformas = Array.from(uniqueCostsMap.values()).reduce((acc, v) => acc + v, 0);
    const gananciaEstimada = totalIngresosEsperados - totalCostosPlataformas;

    res.json({
      success: true,
      metrics: {
        totalIngresosEsperados,
        totalCostosPlataformas,
        gananciaEstimada,
        serviciosActivos: activeServices.length,
        pendientesHoyCount: pendientesHoyYAtrasados.length,
        totalPendienteHoyValor: pendientesHoyYAtrasados.reduce((acc, s) => acc + (Number(s.valor) || 0), 0),
        pendingCancelCount: services.filter(s => s.estado === 'CANCELACION_PENDIENTE').length,
      },
      pendientesHoyYAtrasados,
      cobros: {
        hoy: cobrosHoy,
        vencidos: cobrosVencidos,
      },
    });
  } catch (error: any) {
    console.error('Error en /dashboard:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/collections?tab=todos|hoy|por_vencer|vencidos|en_espera|cancelacion
 * Gestión de Cobros con los 6 tabs de filtrado inteligente
 */
cobrosRouter.get('/collections', async (req: Request, res: Response) => {
  try {
    const tab = (req.query.tab as string) || 'todos';
    const services = await DatabaseService.getEnrichedServices();
    const todayStr = formatDateIso(new Date());

    let filtered = services.filter(s => s.estado !== 'CANCELADO');

    switch (tab) {
      case 'hoy':
        filtered = filtered.filter(s => s.fecha_proximo_pago === todayStr);
        break;

      case 'por_vencer':
        // Vencen en los próximos 5 días (del día 1 al día 5)
        filtered = filtered.filter(s => {
          const diff = getDaysDifference(s.fecha_proximo_pago);
          return diff >= 1 && diff <= 5;
        });
        break;

      case 'vencidos':
        // Vencidos en días anteriores a hoy
        filtered = filtered.filter(s => {
          const diff = getDaysDifference(s.fecha_proximo_pago);
          return diff < 0;
        });
        break;

      case 'en_espera':
        filtered = filtered.filter(s => s.estado === 'EN_ESPERA');
        break;

      case 'cancelacion':
        filtered = filtered.filter(s => s.estado === 'CANCELACION_PENDIENTE');
        break;

      case 'todos':
      default:
        // Todos los cobros pendientes o en gestión
        break;
    }

    // Ordenar: primero los más vencidos
    filtered.sort((a, b) => a.fecha_proximo_pago.localeCompare(b.fecha_proximo_pago));

    res.json({ success: true, count: filtered.length, services: filtered });
  } catch (error: any) {
    console.error('Error en /collections:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/services/:id/pay
 * Botón "Registrar Pago" con regla del Día Ancla Fijo
 */
cobrosRouter.post('/services/:id/pay', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { valor, metodo_pago, comprobante_ref, usuario } = req.body;

    const srvDoc = await db.collection('servicios').doc(id).get();
    if (!srvDoc.exists) {
      return res.status(404).json({ success: false, message: 'Servicio no encontrado' });
    }

    const srv = srvDoc.data()!;
    const todayStr = formatDateIso(new Date());
    
    // Obtenemos el día ancla original (si no existe lo saca del día de la fecha de cobro actual)
    const diaAncla = srv.dia_ancla || Number(srv.fecha_proximo_pago.split('-')[2]) || 1;

    // Calculamos el próximo mes con el día ancla fijo
    const nextDateStr = getNextFixedMonthDate(srv.fecha_proximo_pago, diaAncla);

    // 1. Actualizar servicio
    await db.collection('servicios').doc(id).update({
      fecha_ultimo_pago: todayStr,
      fecha_proximo_pago: nextDateStr,
      dia_ancla: diaAncla,
      estado: 'ACTIVO',
      fecha_cambio_estado: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      updated_by: usuario || 'Sistema',
    });

    // 2. Guardar en historial inmutable de pagos
    const payRef = await db.collection('pagos_clientes').add({
      servicio_id: id,
      cliente_id: srv.cliente_id,
      valor: Number(valor || srv.valor),
      fecha_pago_real: todayStr,
      fecha_ciclo_anterior: srv.fecha_proximo_pago,
      fecha_ciclo_siguiente: nextDateStr,
      metodo_pago: metodo_pago || 'Nequi / Transferencia',
      comprobante_ref: comprobante_ref || '',
      usuario_registro: usuario || 'Sistema',
      created_at: new Date().toISOString(),
    });

    await DatabaseService.logHistory(
      'PAGOS',
      payRef.id,
      'REGISTRAR_PAGO',
      `Pago de $${valor || srv.valor} registrado. Próximo ciclo fijo: ${nextDateStr}`,
      usuario || 'Sistema'
    );

    res.json({
      success: true,
      message: `Pago registrado con éxito. Próximo vencimiento: ${nextDateStr}`,
      fecha_proximo_pago: nextDateStr,
    });
  } catch (error: any) {
    console.error('Error al registrar pago:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/services/:id/no-renew
 * Botón "No renueva" (Marca el servicio como cancelado)
 */
cobrosRouter.post('/services/:id/no-renew', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { usuario, motivo } = req.body;

    await db.collection('servicios').doc(id).update({
      estado: 'CANCELADO',
      notas: motivo ? `No renueva: ${motivo}` : 'Cliente no renueva el servicio.',
      fecha_cambio_estado: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      updated_by: usuario || 'Sistema',
    });

    await DatabaseService.logHistory('SERVICIOS', id, 'NO_RENUEVA', 'Servicio marcado como No Renueva (Cancelado)', usuario || 'Sistema');

    res.json({ success: true, message: 'Servicio marcado como no renovado.' });
  } catch (error: any) {
    console.error('Error al cancelar servicio:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/services/:id/wait-24h
 * Botón "Recordar 24h" (Pone el servicio en estado EN_ESPERA / Pago Pendiente)
 */
cobrosRouter.post('/services/:id/wait-24h', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { usuario } = req.body;

    await db.collection('servicios').doc(id).update({
      estado: 'EN_ESPERA',
      fecha_cambio_estado: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      updated_by: usuario || 'Sistema',
    });

    await DatabaseService.logHistory('SERVICIOS', id, 'RECORDAR_24H', 'Servicio puesto en espera (Recordar 24h)', usuario || 'Sistema');

    res.json({ success: true, message: 'Servicio puesto en espera (Recordar 24h).' });
  } catch (error: any) {
    console.error('Error al poner en espera:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});