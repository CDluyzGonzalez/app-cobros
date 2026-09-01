/**
 * reminders.gs — Lógica de Recordatorios (24 horas)
 * ===================================================
 * Cuando un cliente dice "SÍ voy a pagar", el servicio pasa a
 * PAGO_PENDIENTE y arranca el contador de 24 horas.
 *
 * Si en 24 horas no llega el comprobante, este módulo
 * lo detecta y pasa el servicio a RECORDATORIO_ENVIADO.
 */

/**
 * Evalúa todos los servicios en estado PAGO_PENDIENTE.
 * Si llevan 24+ horas sin pago, los pasa a RECORDATORIO_ENVIADO.
 *
 * @returns {number} Cantidad de servicios actualizados
 */
function processReminders() {
  var ss    = getSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SERVICES_SHEET);
  if (!sheet) return 0;

  var rows  = sheet.getDataRange().getValues();
  var now   = new Date();
  var count = 0;

  for (var i = 1; i < rows.length; i++) {
    var estado = rows[i][10];
    if (estado !== CONFIG.STATUS.PAGO_PENDIENTE) continue;

    var fechaCambio = rows[i][9] ? new Date(rows[i][9]) : null;
    if (!fechaCambio) continue;

    var diffHours = (now.getTime() - fechaCambio.getTime()) / (1000 * 60 * 60);

    if (diffHours >= CONFIG.REMINDER_HOURS) {
      sheet.getRange(i + 1, 10).setValue(now);                          // fecha_cambio_estado
      sheet.getRange(i + 1, 11).setValue(CONFIG.STATUS.RECORDATORIO_ENVIADO); // estado
      sheet.getRange(i + 1, 14).setValue(now.toISOString());            // updated_at
      sheet.getRange(i + 1, 15).setValue('Scheduler');

      logHistory('SCHEDULER', rows[i][0], 'RECORDATORIO_24H',
        'Pasaron ' + Math.round(diffHours) + 'h sin comprobante. Estado: RECORDATORIO_ENVIADO', 'Scheduler');
      count++;
    }
  }
  return count;
}
