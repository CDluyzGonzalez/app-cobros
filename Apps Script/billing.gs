/**
 * billing.gs — Costos de Plataformas y Finanzas (3FN)
 * ====================================================
 */

function getPlatformPayments() {
  var ss    = getSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.PAYMENTS_PLATFORMS_SHEET);
  if (!sheet) return [];
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];

  // Mapa de cuentas para conocer la plataforma correspondiente (JOIN 3FN)
  var accountsMap = {};
  var accounts = getAccountsList();
  for (var a = 0; a < accounts.length; a++) {
    accountsMap[accounts[a].id] = accounts[a];
  }

  var list = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    if (!r[0]) continue;
    var accountId = (r[1] || '').toString().trim();
    var account = accountsMap[accountId];
    var concepto = (r[2] || '').toString();

    // Inferencia inteligente para que NUNCA salga N/A
    var platformName = '';
    if (account && account.plataforma && account.plataforma !== 'N/A') {
      platformName = account.plataforma;
    } else {
      platformName = inferPlatformFromConcept(concepto);
    }

    list.push({
      id:               r[0],
      cuenta_id:        accountId,
      plataforma:       platformName,
      concepto:         concepto,
      valor:            Number(r[3]) || 0,
      fecha_limite:     formatDate(r[4]),
      fecha_pago_real:  formatDate(r[5]),
      estado:           r[6] || 'PENDIENTE',
      notas:            r[7] || '',
      usuario_registro: r[8] || '',
      created_at:       r[9] || ''
    });
  }
  return list;
}

function savePlatformPayment(payment, user) {
  var ss       = getSpreadsheet();
  var sheet    = ss.getSheetByName(CONFIG.PAYMENTS_PLATFORMS_SHEET);
  var rows     = sheet.getDataRange().getValues();
  var now      = new Date();
  var userName = (user && user.nombre) ? user.nombre : 'Sistema';

  // Resuelve la cuenta matriz vinculada (3FN)
  var targetPlatform = payment.plataforma || inferPlatformFromConcept(payment.concepto);
  var resolvedAccountId = payment.cuenta_id || resolveAccountIdByPlatform(targetPlatform, userName);

  if (payment.id) {
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] === payment.id) {
        var fechaPagoReal = payment.fecha_pago_real
          ? new Date(payment.fecha_pago_real)
          : (payment.estado === 'PAGADO' ? now : '');

        var finalAccountId = resolvedAccountId || rows[i][1];

        sheet.getRange(i + 1, 2, 1, 8).setValues([[
          finalAccountId,
          payment.concepto  || rows[i][2],
          Number(payment.valor) || Number(rows[i][3]) || 0,
          payment.fecha_limite ? new Date(payment.fecha_limite) : rows[i][4],
          fechaPagoReal,
          payment.estado || rows[i][6],
          payment.notas  || rows[i][7] || '',
          userName
        ]]);

        logHistory('FACTURACION', payment.id, 'ACTUALIZAR', 'Pago de costo actualizado: ' + (payment.concepto || targetPlatform), userName);
        return { success: true, message: 'Pago actualizado.' };
      }
    }
  }

  var nextId = 'PLA-' + padZero(rows.length, 5);
  sheet.appendRow([
    nextId,
    resolvedAccountId || '',
    payment.concepto  || '',
    Number(payment.valor) || 0,
    payment.fecha_limite ? new Date(payment.fecha_limite) : '',
    '',
    payment.estado || 'PENDIENTE',
    payment.notas  || '',
    userName,
    now.toISOString()
  ]);

  logHistory('FACTURACION', nextId, 'CREAR', 'Costo registrado ($' + payment.valor + ')', userName);
  return { success: true, id: nextId, message: 'Pago a plataforma registrado.' };
}

/**
 * Resuelve o vincula una cuenta matriz para un costo
 */
function resolveAccountIdByPlatform(platformName, userName) {
  if (!platformName || platformName === 'N/A') return '';
  var clean = platformName.toString().trim().toUpperCase();
  var accounts = getAccountsList();
  for (var a = 0; a < accounts.length; a++) {
    if ((accounts[a].plataforma || '').toString().trim().toUpperCase() === clean) {
      return accounts[a].id;
    }
  }
  return '';
}

/**
 * Infiere el nombre de la plataforma desde el texto del concepto
 */
function inferPlatformFromConcept(concepto) {
  if (!concepto) return 'General';
  var upper = concepto.toUpperCase();
  if (upper.includes('NETFLIX')) return 'Netflix';
  if (upper.includes('DISNEY')) return 'Disney+';
  if (upper.includes('MAX') || upper.includes('HBO')) return 'Max';
  if (upper.includes('PRIME') || upper.includes('AMAZON')) return 'Prime Video';
  if (upper.includes('SPOTIFY')) return 'Spotify';
  if (upper.includes('CANVA')) return 'Canva';
  if (upper.includes('DIRECTV') || upper.includes('DGO')) return 'DirecTV';
  if (upper.includes('PARAMOUNT')) return 'Paramount+';
  if (upper.includes('YOUTUBE')) return 'YouTube Premium';
  if (upper.includes('CRUNCHYROLL')) return 'Crunchyroll';
  if (upper.includes('IPTV')) return 'IPTV';
  return concepto.trim();
}

function addOneMonth(dateValue) {
  var date = new Date(dateValue);
  var day = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + 1);
  var lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(day, lastDay));
  return date;
}

function markPlatformPaymentPaid(paymentId, user) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.PAYMENTS_PLATFORMS_SHEET);
  var rows = sheet.getDataRange().getValues();
  var now = new Date();
  var userName = (user && user.nombre) ? user.nombre : 'Sistema';

  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] !== paymentId) continue;
    if (rows[i][6] === 'PAGADO') throw new Error('Este costo ya fue marcado como pagado.');

    sheet.getRange(i + 1, 6).setValue(now);       // fecha_pago_real
    sheet.getRange(i + 1, 7).setValue('PAGADO');   // estado
    sheet.getRange(i + 1, 9).setValue(userName);

    var dueDate = rows[i][4] ? new Date(rows[i][4]) : now;
    var nextDueDate = addOneMonth(dueDate);

    sheet.appendRow([
      'PLA-' + Utilities.getUuid().substring(0, 8),
      rows[i][1], // cuenta_id
      rows[i][2], // concepto
      rows[i][3], // valor
      nextDueDate,
      '',
      'PENDIENTE',
      rows[i][7] || '',
      userName,
      now.toISOString()
    ]);

    logHistory('FACTURACION', paymentId, 'PAGAR_Y_RENOVAR', 'Costo pagado; próxima fecha: ' + formatDate(nextDueDate), userName);
    return { success: true, nextDueDate: formatDate(nextDueDate), message: 'Pago registrado y próxima factura creada.' };
  }
  throw new Error('Costo no encontrado.');
}

function deletePlatformPayment(paymentId, user) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.PAYMENTS_PLATFORMS_SHEET);
  var rows = sheet.getDataRange().getValues();
  var userName = (user && user.nombre) ? user.nombre : 'Sistema';
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] !== paymentId) continue;
    if (rows[i][6] === 'PAGADO') throw new Error('No se puede eliminar un pago ya realizado; se conserva como historial.');
    sheet.deleteRow(i + 1);
    logHistory('FACTURACION', paymentId, 'ELIMINAR_PENDIENTE', 'Costo pendiente eliminado.', userName);
    return { success: true, message: 'Costo pendiente eliminado.' };
  }
  throw new Error('Costo no encontrado.');
}