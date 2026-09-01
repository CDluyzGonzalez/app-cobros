/**
 * utils.gs — Utilidades generales y registro de auditoría
 * =========================================================
 * Funciones de apoyo que usan todos los demás módulos.
 */

/**
 * Retorna el Spreadsheet activo (donde está el script instalado).
 */
function getSpreadsheet() {
  var spreadsheetId = PropertiesService
    .getScriptProperties()
    .getProperty('APP_COBROS_SPREADSHEET_ID');

  if (!spreadsheetId) {
    throw new Error('Falta configurar APP_COBROS_SPREADSHEET_ID en Propiedades del script.');
  }

  return SpreadsheetApp.openById(spreadsheetId);
}

/**
 * Obtiene una hoja por nombre, o la crea con encabezados si no existe.
 */
function getOrCreateSheet(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (headers && headers.length > 0) {
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setValues([headers]);
      headerRange.setBackground('#1E293B');
      headerRange.setFontColor('#FFFFFF');
      headerRange.setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
  }
  return sheet;
}

/**
 * Registra una entrada en el historial de auditoría.
 * Si falla, no interrumpe la operación principal.
 */
function logHistory(entidad, entidadId, accion, descripcion, usuario) {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.HISTORY_SHEET);
    if (!sheet) return;
    var now = new Date().toISOString();
    var hId = 'HIS-' + new Date().getTime();
    sheet.appendRow([hId, entidad, entidadId, accion, descripcion, usuario || 'Sistema', '', '', now]);
  } catch (e) {
    // Silencioso: el historial nunca debe romper una transacción principal
  }
}

/**
 * Genera el historial completo (los últimos N registros, ordenados del más reciente al más antiguo).
 */
function getHistoryLog(limit) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.HISTORY_SHEET);
  if (!sheet) return [];
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];

  var history = [];
  var start = Math.max(1, rows.length - (limit || 100));
  for (var i = rows.length - 1; i >= start; i--) {
    var r = rows[i];
    if (!r[0]) continue;
    history.push({
      id: r[0],
      entidad: r[1],
      entidad_id: r[2],
      accion: r[3],
      descripcion: r[4],
      usuario: r[5],
      created_at: r[8]
    });
  }
  return history;
}

/**
 * Rellena un número con ceros a la izquierda hasta el tamaño indicado.
 * Ej: padZero(5, 5) → "00005"
 */
function padZero(num, size) {
  var s = String(num);
  while (s.length < size) s = '0' + s;
  return s;
}

/**
 * Formatea un valor de celda de Sheets como una fecha YYYY-MM-DD.
 * Maneja strings, objetos Date y valores nulos de forma segura.
 */
function formatDate(dateVal) {
  if (!dateVal) return '';
  if (typeof dateVal === 'string') return dateVal.split('T')[0];
  try {
    var d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    var y = d.getFullYear();
    var m = padZero(d.getMonth() + 1, 2);
    var day = padZero(d.getDate(), 2);
    return y + '-' + m + '-' + day;
  } catch (e) {
    return '';
  }
}

/**
 * Genera el resumen financiero del dashboard.
 * Llama a getServicesList() y getPlatformPayments() para calcular:
 * ingresos totales, costos y ganancia neta.
 */
function getDashboardData() {
  var services = getServicesList();
  var today = new Date();
  today.setHours(0, 0, 0, 0);

  var overdue = [], dueToday = [], upcoming = [], pendingPayment = [], pendingCancel = [];
  var totalIncome = 0;

  for (var i = 0; i < services.length; i++) {
    var s = services[i];
    if (s.estado === CONFIG.STATUS.CANCELADO) continue;
    totalIncome += Number(s.valor) || 0;

    var nextDate = s.fecha_proximo_pago ? new Date(s.fecha_proximo_pago) : null;
    if (nextDate) {
      nextDate.setHours(0, 0, 0, 0);
      var diffDays = Math.round((nextDate - today) / (1000 * 60 * 60 * 24));

      if (s.estado === CONFIG.STATUS.CANCELACION_PENDIENTE) {
        pendingCancel.push(s);
      } else if (s.estado === CONFIG.STATUS.PAGO_PENDIENTE || s.estado === CONFIG.STATUS.RECORDATORIO_ENVIADO) {
        pendingPayment.push(s);
      } else if (diffDays < 0) {
        overdue.push(s);
      } else if (diffDays === 0) {
        dueToday.push(s);
      } else if (diffDays <= 7) {
        upcoming.push(s);
      }
    }
  }

  // ── Cálculo de Costos Mensuales Exactos (Facturación Unificada) ────────
  // Agrupa cada cuenta o concepto (Movistar, iCloud, Netflix, etc.)
  // para tomar su cuota mensual única, sin duplicar pagos pasados ya pagados.
  var platformPayments = getPlatformPayments();
  var uniqueCostsMap = {};

  for (var j = 0; j < platformPayments.length; j++) {
    var p = platformPayments[j];
    var key = (p.cuenta_id || p.concepto || p.plataforma || '').toString().trim().toLowerCase();
    if (!key) continue;

    // Priorizar la factura pendiente del ciclo o registrar el valor mensual del concepto
    if (!uniqueCostsMap[key] || p.estado === 'PENDIENTE') {
      uniqueCostsMap[key] = Number(p.valor) || 0;
    }
  }

  var totalCosts = 0;
  for (var k in uniqueCostsMap) {
    totalCosts += uniqueCostsMap[k];
  }

  return {
    metrics: {
      totalServices: services.length,
      totalIncome: totalIncome,
      totalCosts: totalCosts,
      profit: totalIncome - totalCosts,
      overdueCount: overdue.length,
      dueTodayCount: dueToday.length,
      upcomingCount: upcoming.length,
      pendingPaymentCount: pendingPayment.length,
      pendingCancelCount: pendingCancel.length
    },
    cobros: {
      vencidos: overdue,
      hoy: dueToday,
      proximos: upcoming,
      pago_pendiente: pendingPayment,
      cancelacion_pendiente: pendingCancel
    }
  };
}
