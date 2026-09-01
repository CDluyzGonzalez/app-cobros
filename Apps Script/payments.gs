/**
 * payments.gs — Registro de Pagos y Regla de Fecha Fija Mensual
 * =============================================================
 *
 * REGLA FUNDAMENTAL (INAMOVIBLE):
 *   El próximo ciclo = mismo DÍA del mes, pero del MES SIGUIENTE
 *   al ciclo programado actual.
 *   El día en que el cliente pague NO altera esta fecha.
 *
 * Ejemplo:
 *   - Ciclo programado: 19/09/2026  (día 19)
 *   - Cliente paga el 01/09/2026 (adelantado)
 *   - Próximo ciclo:  19/10/2026  (NO el 01/10 ni el 02/10)
 *
 *   - Ciclo programado: 19/09/2026
 *   - Cliente paga tarde el 25/09/2026
 *   - Próximo ciclo:  19/10/2026  (NO el 25/10)
 */

/**
 * Calcula la próxima fecha manteniendo el mismo DÍA del mes.
 * Avanza al mes siguiente desde la fecha del ciclo programado.
 * Si el día no existe en ese mes (ej: 31 de febrero), usa el último día.
 */
function getNextFixedMonthDate(currentScheduledDate) {
  var d = new Date(currentScheduledDate);
  var day   = d.getDate();       // día del mes original (ej: 19)
  var month = d.getMonth() + 1;  // mes siguiente (0-indexed, por eso +1)
  var year  = d.getFullYear();

  // Avanzar al mes siguiente
  if (month > 11) {
    month = 0;  // enero
    year  = year + 1;
  }

  // Crear la nueva fecha con el mismo día en el mes siguiente
  var newDate = new Date(year, month, day);

  // Protección: si el día no existe (ej: 31 de abril → 01/05),
  // retroceder al último día válido del mes
  if (newDate.getMonth() !== month) {
    newDate = new Date(year, month + 1, 0); // último día del mes
  }

  return newDate;
}

/**
 * Registra el pago de un cliente y renueva el ciclo automáticamente.
 * Aplica la regla de fecha fija mensual de forma estricta.
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

    // ── REGLA DE FECHA FIJA MENSUAL ──────────────────────────────────────
    // Tomar la fecha_proximo_pago actual (ciclo programado) como base.
    // Avanzar exactamente 1 mes manteniendo el mismo día.
    var currentNextDate = srv[8] ? new Date(srv[8]) : now;
    var newNextDate     = getNextFixedMonthDate(currentNextDate);
    // ─────────────────────────────────────────────────────────────────────

    // 1. Actualizar el servicio
    sSheet.getRange(i + 1, 8).setValue(now);                       // fecha_ultimo_pago = hoy (real)
    sSheet.getRange(i + 1, 9).setValue(newNextDate);               // fecha_proximo_pago = mismo día mes siguiente
    sSheet.getRange(i + 1, 10).setValue(now);                      // fecha_cambio_estado
    sSheet.getRange(i + 1, 11).setValue(CONFIG.STATUS.ACTIVO);     // vuelve a ACTIVO
    sSheet.getRange(i + 1, 14).setValue(now.toISOString());        // updated_at
    sSheet.getRange(i + 1, 15).setValue(userName);

    // 2. Registrar en la tabla de pagos (historial inmutable)
    var pRows = pSheet.getDataRange().getValues();
    var payId = 'PAY-' + padZero(pRows.length, 5);
    pSheet.appendRow([
      payId,
      payment.servicio_id,
      Number(payment.valor || srv[6]),          // valor cobrado
      now,                                       // fecha_pago_real (día real)
      currentNextDate,                           // fecha_ciclo_anterior
      newNextDate,                               // fecha_ciclo_siguiente
      payment.metodo_pago      || 'Transferencia',
      payment.comprobante_ref  || '',
      userName,
      now.toISOString()
    ]);

    logHistory('PAGOS', payId, 'REGISTRAR_PAGO',
      'Pago de $' + (payment.valor || srv[6]) + ' registrado. Próximo ciclo fijo: ' +
      formatDate(newNextDate), userName);

    return {
      success:             true,
      paymentId:           payId,
      servicio_id:         payment.servicio_id,
      fecha_pago_real:     formatDate(now),
      fecha_proximo_pago:  formatDate(newNextDate),
      message:             'Pago registrado. Próximo vencimiento: ' + formatDate(newNextDate)
    };
  }

  throw new Error('Servicio no encontrado: ' + payment.servicio_id);
}