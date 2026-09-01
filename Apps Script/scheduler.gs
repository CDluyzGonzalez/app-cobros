/**
 * scheduler.gs — Tarea Programada Automática (Cada Hora)
 * =========================================================
 * Se ejecuta automáticamente mediante un activador horario de Google Apps Script.
 * No requiere que la aplicación web esté abierta ni que nadie esté conectado.
 *
 * Responsabilidades:
 *  1. Detecta servicios que están por vencer (a 3 días o menos)
 *  2. Detecta servicios vencidos hoy o en el pasado
 *  3. Ejecuta el ciclo de recordatorios de 24 horas (PAGO_PENDIENTE → RECORDATORIO_ENVIADO)
 *  4. Ejecuta el ciclo de pre-cancelación de 36 horas (RECORDATORIO_ENVIADO → CANCELACION_PENDIENTE)
 */

/**
 * Función principal del activador horario.
 * Configurar en Apps Script: Activadores (Triggers) → Añadir activador →
 * Función: runHourlyScheduler → Basado en tiempo → Cada hora.
 */
function runHourlyScheduler() {
  var ss    = getSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SERVICES_SHEET);
  if (!sheet) return;

  var rows  = sheet.getDataRange().getValues();
  var today = new Date();
  today.setHours(0, 0, 0, 0);

  var updatedCount = 0;

  for (var i = 1; i < rows.length; i++) {
    var sId      = rows[i][0];
    var estado   = rows[i][10];
    var proxPago = rows[i][8] ? new Date(rows[i][8]) : null;

    if (!sId || !proxPago) continue;

    // No tocar servicios en flujo de cobro activo o ya cancelados
    if (estado === CONFIG.STATUS.PAGO_PENDIENTE ||
        estado === CONFIG.STATUS.RECORDATORIO_ENVIADO ||
        estado === CONFIG.STATUS.CANCELACION_PENDIENTE ||
        estado === CONFIG.STATUS.CANCELADO) {
      continue;
    }

    proxPago.setHours(0, 0, 0, 0);
    var diffDays = Math.round((proxPago - today) / (1000 * 60 * 60 * 24));

    // Si vence en 3 días o menos y está ACTIVO → POR_VENCER
    if (diffDays <= 3 && diffDays > 0 && estado === CONFIG.STATUS.ACTIVO) {
      sheet.getRange(i + 1, 10).setValue(new Date());
      sheet.getRange(i + 1, 11).setValue(CONFIG.STATUS.POR_VENCER);
      sheet.getRange(i + 1, 14).setValue(new Date().toISOString());
      sheet.getRange(i + 1, 15).setValue('Scheduler');
      logHistory('SCHEDULER', sId, 'AUTO_POR_VENCER', 'Vence en ' + diffDays + ' días', 'Scheduler');
      updatedCount++;
    }

    // Si ya venció (hoy o antes) y estaba ACTIVO o POR_VENCER → VENCIDO
    if (diffDays <= 0 && (estado === CONFIG.STATUS.ACTIVO || estado === CONFIG.STATUS.POR_VENCER)) {
      sheet.getRange(i + 1, 10).setValue(new Date());
      sheet.getRange(i + 1, 11).setValue(CONFIG.STATUS.VENCIDO);
      sheet.getRange(i + 1, 14).setValue(new Date().toISOString());
      sheet.getRange(i + 1, 15).setValue('Scheduler');
      logHistory('SCHEDULER', sId, 'AUTO_VENCIDO', 'Servicio venció el ' + formatDate(proxPago), 'Scheduler');
      updatedCount++;
    }
  }

  // Ejecutar reglas de tiempo (24h recordatorio y 36h pre-cancelación)
  var remindersCount = processReminders();
  var cancelsCount   = processCancellations();

  return {
    success: true,
    statusesUpdated: updatedCount,
    remindersSent: remindersCount,
    cancellationsFlagged: cancelsCount,
    timestamp: new Date().toISOString()
  };
}
