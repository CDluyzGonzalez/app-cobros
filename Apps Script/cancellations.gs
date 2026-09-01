/**
 * cancellations.gs — Lógica de Pre-Cancelación (36 horas)
 * ==========================================================
 * Tras enviar el recordatorio de 24h (RECORDATORIO_ENVIADO),
 * si pasan 12 horas adicionales (36h en total desde el cobro)
 * sin pago, pasa a CANCELACION_PENDIENTE.
 *
 * NOTA IMPORTANTE:
 * La app NUNCA cancela automáticamente un servicio.
 * Pasa a CANCELACION_PENDIENTE para alertar a Carlos/Esposa,
 * quienes toman la decisión manual.
 */

/**
 * Evalúa los servicios en RECORDATORIO_ENVIADO.
 * Si llevan 12+ horas en este estado (36h totales),
 * los pasa a CANCELACION_PENDIENTE.
 *
 * @returns {number} Cantidad de servicios en pre-cancelación
 */
function processCancellations() {
  var ss    = getSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SERVICES_SHEET);
  if (!sheet) return 0;

  var rows  = sheet.getDataRange().getValues();
  var now   = new Date();
  var count = 0;

  for (var i = 1; i < rows.length; i++) {
    var estado = rows[i][10];
    if (estado !== CONFIG.STATUS.RECORDATORIO_ENVIADO) continue;

    var fechaCambio = rows[i][9] ? new Date(rows[i][9]) : null;
    if (!fechaCambio) continue;

    var diffHours = (now.getTime() - fechaCambio.getTime()) / (1000 * 60 * 60);

    // 12 horas tras el recordatorio = 36 horas totales
    if (diffHours >= (CONFIG.CANCEL_HOURS - CONFIG.REMINDER_HOURS)) {
      sheet.getRange(i + 1, 10).setValue(now);                               // fecha_cambio_estado
      sheet.getRange(i + 1, 11).setValue(CONFIG.STATUS.CANCELACION_PENDIENTE); // estado
      sheet.getRange(i + 1, 14).setValue(now.toISOString());                 // updated_at
      sheet.getRange(i + 1, 15).setValue('Scheduler');

      logHistory('SCHEDULER', rows[i][0], 'PRE_CANCELACION_36H',
        'Pasaron 36h totales sin comprobante. Estado: CANCELACION_PENDIENTE (Requiere decisión manual)', 'Scheduler');
      count++;
    }
  }
  return count;
}
