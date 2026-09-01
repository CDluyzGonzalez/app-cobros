/**
 * payments.gs — Registro de Pagos y Regla Fija de 30 Días
 * =========================================================
 *
 * REGLA FUNDAMENTAL (INAMOVIBLE):
 *   El próximo ciclo = fecha_programada_actual + 30 días EXACTOS.
 *   El día en que el cliente pague NO altera esta fecha.
 *
 * Ejemplo:
 *   - Ciclo programado: 31/08/2026
 *   - Cliente paga tarde el 03/09/2026
 *   - Próximo ciclo: 30/09/2026  (NO el 03/10)
 */

/**
 * Registra el pago de un cliente y renueva el ciclo automáticamente.
 * Esta función aplica la regla de los 30 días de forma estricta.
 */
function registerClientPayment(payment, user) {
  if (!payment || !payment.servicio_id) {
    throw new Error('El ID del servicio es obligatorio para registrar el pago.');
  }

  var ss      = getSpreadsheet();
  var sSheet  = ss.getSheetByName(CONFIG.SERVICES_SHEET);
  var pSheet  = ss.getSheetByName(CONFIG.PAYMENTS_CLIENTS_SHEET);
  var rows    = sSheet.getDataRange().getValues();
  var now     = new Date();
  var userName = (user && user.nombre) ? user.nombre : 'Sistema';

  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] !== payment.servicio_id) continue;

    var srv = rows[i];

    // ── REGLA DE LOS 30 DÍAS ─────────────────────────────────────────────
    // Siempre sumar al ciclo programado original, nunca a la fecha de pago real.
    var currentNextDate = srv[8] ? new Date(srv[8]) : now;
    var newNextDate     = new Date(currentNextDate.getTime());
    newNextDate.setDate(newNextDate.getDate() + CONFIG.CYCLE_DAYS);
    // ─────────────────────────────────────────────────────────────────────

    // 1. Actualizar el servicio
    sSheet.getRange(i + 1, 8).setValue(now);              // fecha_ultimo_pago = hoy
    sSheet.getRange(i + 1, 9).setValue(newNextDate);      // fecha_proximo_pago = ciclo + 30
    sSheet.getRange(i + 1, 10).setValue(now);             // fecha_cambio_estado
    sSheet.getRange(i + 1, 11).setValue(CONFIG.STATUS.ACTIVO); // vuelve a ACTIVO
    sSheet.getRange(i + 1, 14).setValue(now.toISOString());    // updated_at
    sSheet.getRange(i + 1, 15).setValue(userName);

    // 2. Registrar en la tabla de pagos
    var pRows = pSheet.getDataRange().getValues();
    var payId = 'PAY-' + padZero(pRows.length, 5);
    pSheet.appendRow([
      payId,
      payment.servicio_id,
      srv[1],                                    // cliente_id
      Number(payment.valor || srv[6]),           // valor cobrado
      now,                                       // fecha_pago_real
      currentNextDate,                           // fecha_ciclo_anterior
      newNextDate,                               // fecha_ciclo_siguiente
      payment.metodo_pago      || 'Transferencia',
      payment.comprobante_ref  || '',
      userName,
      now.toISOString()
    ]);

    logHistory('PAGOS', payId, 'REGISTRAR_PAGO',
      'Pago de $' + (payment.valor || srv[6]) + ' registrado para ' + srv[2] +
      '. Próximo ciclo: ' + formatDate(newNextDate), userName);

    return {
      success:             true,
      paymentId:           payId,
      servicio_id:         payment.servicio_id,
      fecha_pago_real:     formatDate(now),
      fecha_proximo_pago:  formatDate(newNextDate),
      message:             'Pago registrado. Ciclo renovado por 30 días.'
    };
  }

  throw new Error('Servicio no encontrado: ' + payment.servicio_id);
}
