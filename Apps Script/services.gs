/**
 * services.gs — Servicios contratados por cliente (Normalizado 3FN)
 * ================================================================
 */

/**
 * Retorna todos los servicios enriquecidos con datos del cliente y de la cuenta matriz (JOIN 3FN).
 */
function getServicesList() {
  var ss    = getSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SERVICES_SHEET);
  if (!sheet) return [];

  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];

  // Mapa de Clientes (id -> cliente)
  var clientsMap = {};
  var clients    = getClientsList();
  for (var c = 0; c < clients.length; c++) {
    clientsMap[clients[c].id] = clients[c];
  }

  // Mapa de Cuentas (id -> cuenta)
  var accountsMap = {};
  var accounts = getAccountsList();
  for (var a = 0; a < accounts.length; a++) {
    accountsMap[accounts[a].id] = accounts[a];
  }

  var services = [];
  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    if (!row[0]) continue;

    var clientId  = row[1];
    var accountId = row[2];

    var client  = clientsMap[clientId]  || { nombre: 'Cliente no encontrado', telefono: '' };
    var account = accountsMap[accountId] || { correo_cuenta: '', plataforma: '' };

    var finalPlatform = account.plataforma;
    if (!finalPlatform || finalPlatform === 'N/A') {
      var extraNote = (row[10] || '').toString();
      finalPlatform = (typeof inferPlatformFromConcept === 'function' ? inferPlatformFromConcept(extraNote) : '') || 'General';
    }

    services.push({
      id:                  row[0],
      cliente_id:          clientId,
      cliente_nombre:      client.nombre,
      cliente_telefono:    client.telefono,
      cuenta_id:           accountId,
      plataforma:          finalPlatform,
      correo_cuenta:       account.correo_cuenta || '',
      perfil:              row[3],
      pin:                 decryptPIN(row[4]),
      valor:               Number(row[5]) || 0,
      fecha_ultimo_pago:   formatDate(row[6]),
      fecha_proximo_pago:  formatDate(row[7]),
      fecha_cambio_estado: formatDate(row[8]),
      estado:              row[9] || CONFIG.STATUS.ACTIVO,
      notas:               row[10] || '',
      created_at:          row[11] || '',
      updated_at:          row[12] || '',
      updated_by:          row[13] || '',
      version:             Number(row[14]) || 1
    });
  }
  return services;
}

/**
 * Crea o actualiza un servicio guardando únicamente los campos normalizados en 3FN.
 */
function saveService(service, user) {
  if (!service || !service.cliente_id) {
    throw new Error('El cliente es obligatorio.');
  }

  var ss           = getSpreadsheet();
  var sheet        = ss.getSheetByName(CONFIG.SERVICES_SHEET);
  var rows         = sheet.getDataRange().getValues();
  var now          = new Date().toISOString();
  var userName     = (user && user.nombre) ? user.nombre : 'Sistema';
  var pinEncrypted = encryptPIN(service.pin);
  var resolvedAccountId = resolveAccountForService(service, userName);

  // ── Actualizar servicio existente ────────────────────────────────────────
  if (service.id) {
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] === service.id) {
        var newVersion = (Number(rows[i][14]) || 1) + 1;
        sheet.getRange(i + 1, 2, 1, 14).setValues([[
          service.cliente_id,
          resolvedAccountId,
          service.perfil || '',
          pinEncrypted,
          Number(service.valor) || 0,
          service.fecha_ultimo_pago  ? new Date(service.fecha_ultimo_pago)  : '',
          service.fecha_proximo_pago ? new Date(service.fecha_proximo_pago) : '',
          new Date(),
          service.estado || CONFIG.STATUS.ACTIVO,
          service.notas  || '',
          rows[i][11],  // created_at original
          now,
          userName,
          newVersion
        ]]);

        logHistory('SERVICIOS', service.id, 'ACTUALIZAR', 'Servicio ' + service.id + ' actualizado', userName);
        refreshAccountCapacity(resolvedAccountId);
        refreshClientStatus(service.cliente_id);
        return { id: service.id, success: true, message: 'Servicio actualizado con éxito.' };
      }
    }
  }

  // ── Crear nuevo servicio ─────────────────────────────────────────────────
  var nextId = 'SRV-' + padZero(rows.length, 5);
  sheet.appendRow([
    nextId,
    service.cliente_id,
    resolvedAccountId,
    service.perfil || '',
    pinEncrypted,
    Number(service.valor) || 0,
    service.fecha_ultimo_pago  ? new Date(service.fecha_ultimo_pago)  : '',
    service.fecha_proximo_pago ? new Date(service.fecha_proximo_pago) : '',
    now,
    service.estado || CONFIG.STATUS.ACTIVO,
    service.notas  || '',
    now, now, userName, 1
  ]);

  logHistory('SERVICIOS', nextId, 'CREAR', 'Servicio ' + nextId + ' registrado', userName);
  refreshAccountCapacity(resolvedAccountId);
  refreshClientStatus(service.cliente_id);
  return { id: nextId, success: true, message: 'Servicio registrado con éxito.' };
}

/**
 * Cambia el estado de un servicio.
 */
function changeServiceStatus(serviceId, newStatus, notes, user) {
  if (!serviceId || !newStatus) throw new Error('ID de servicio y nuevo estado son obligatorios.');

  var ss       = getSpreadsheet();
  var sheet    = ss.getSheetByName(CONFIG.SERVICES_SHEET);
  var rows     = sheet.getDataRange().getValues();
  var now      = new Date();
  var userName = (user && user.nombre) ? user.nombre : 'Sistema';

  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === serviceId) {
      var oldStatus = rows[i][9];
      sheet.getRange(i + 1, 9).setValue(now);         // fecha_cambio_estado
      sheet.getRange(i + 1, 10).setValue(newStatus);  // estado
      if (notes) {
        var prevNotes = rows[i][10] ? rows[i][10] + ' | ' : '';
        sheet.getRange(i + 1, 11).setValue(prevNotes + notes);
      }
      sheet.getRange(i + 1, 13).setValue(now.toISOString()); // updated_at
      sheet.getRange(i + 1, 14).setValue(userName);

      logHistory('SERVICIOS', serviceId, 'CAMBIO_ESTADO',
        oldStatus + ' → ' + newStatus + (notes ? ' (' + notes + ')' : ''), userName);

      refreshAccountCapacity(rows[i][2]);
      refreshClientStatus(rows[i][1]);

      return { success: true, serviceId: serviceId, oldStatus: oldStatus, newStatus: newStatus };
    }
  }
  throw new Error('Servicio no encontrado: ' + serviceId);
}

function deleteService(serviceId, user) {
  if (!serviceId) throw new Error('El ID del servicio es obligatorio.');
  var ss = getSpreadsheet();
  var serviceSheet = ss.getSheetByName(CONFIG.SERVICES_SHEET);
  var services = serviceSheet.getDataRange().getValues();
  var userName = (user && user.nombre) ? user.nombre : 'Sistema';

  for (var i = 1; i < services.length; i++) {
    if (services[i][0] !== serviceId) continue;
    var clientId = services[i][1];
    var accountId = services[i][2];

    // Limpiar posibles pagos de prueba vinculados para evitar registros huérfanos
    var paymentSheet = ss.getSheetByName(CONFIG.PAYMENTS_CLIENTS_SHEET);
    if (paymentSheet) {
      var pRows = paymentSheet.getDataRange().getValues();
      for (var p = pRows.length - 1; p >= 1; p--) {
        if (pRows[p][1] === serviceId) {
          paymentSheet.deleteRow(p + 1);
        }
      }
    }

    serviceSheet.deleteRow(i + 1);
    refreshAccountCapacity(accountId);
    refreshClientStatus(clientId);
    logHistory('SERVICIOS', serviceId, 'ELIMINAR', 'Servicio eliminado (' + serviceId + ')', userName);
    return { success: true, message: 'Servicio eliminado correctamente.' };
  }
  throw new Error('Servicio no encontrado: ' + serviceId);
}

function getAccountsList() {
  var ss    = getSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.ACCOUNTS_SHEET);
  if (!sheet) return [];
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];

  var accounts = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    if (!r[0]) continue;
    accounts.push({
      id:                  r[0],
      plataforma:          r[1],
      correo_cuenta:       r[2],
      perfiles_totales:    Number(r[4]) || 1,
      cupos_ocupados:      Number(r[5]) || 0,
      costo_mensual:       Number(r[6]) || 0,
      dia_pago_plataforma: r[7] || '',
      estado:              r[8] || 'ACTIVA',
      notas:               r[9] || ''
    });
  }
  return accounts;
}

function saveAccount(acc, user) {
  var ss       = getSpreadsheet();
  var sheet    = ss.getSheetByName(CONFIG.ACCOUNTS_SHEET);
  var rows     = sheet.getDataRange().getValues();
  var now      = new Date().toISOString();
  var userName = (user && user.nombre) ? user.nombre : 'Sistema';

  if (acc.id) {
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] === acc.id) {
        sheet.getRange(i + 1, 2, 1, 10).setValues([[
          acc.plataforma,
          acc.correo_cuenta,
          encryptPIN(acc.password),
          Number(acc.perfiles_totales) || 1,
          Number(acc.cupos_ocupados)   || 0,
          Number(acc.costo_mensual)    || 0,
          acc.dia_pago_plataforma || '',
          acc.estado || 'ACTIVA',
          acc.notas  || '',
          now
        ]]);
        return { success: true, message: 'Cuenta actualizada.' };
      }
    }
  }

  var nextId = 'ACC-' + padZero(rows.length, 5);
  sheet.appendRow([
    nextId, acc.plataforma, acc.correo_cuenta,
    encryptPIN(acc.password),
    Number(acc.perfiles_totales) || 1,
    Number(acc.cupos_ocupados)   || 0,
    Number(acc.costo_mensual)    || 0,
    acc.dia_pago_plataforma || '',
    acc.estado || 'ACTIVA',
    acc.notas  || '',
    now, now
  ]);
  return { success: true, id: nextId, message: 'Cuenta creada con éxito.' };
}

function resolveAccountForService(service, userName) {
  var email = (service.correo_cuenta || '').toString().trim().toLowerCase();
  if (!email) return service.cuenta_id || '';
  var sheet = getSpreadsheet().getSheetByName(CONFIG.ACCOUNTS_SHEET);
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if ((rows[i][2] || '').toString().trim().toLowerCase() === email) {
      return rows[i][0];
    }
  }
  var accountId = 'ACC-' + Utilities.getUuid().substring(0, 8);
  var now = new Date().toISOString();
  sheet.appendRow([accountId, service.plataforma || 'GENERAL', email, '', 1, 0, 0, '', 'EN_REVISION', 'Creada al asignar servicio', now, now]);
  logHistory('CUENTAS', accountId, 'CREAR', 'Cuenta creada desde servicio: ' + email, userName);
  return accountId;
}

function refreshAccountCapacity(accountId) {
  if (!accountId) return;
  var ss = getSpreadsheet();
  var services = ss.getSheetByName(CONFIG.SERVICES_SHEET).getDataRange().getValues();
  var accounts = ss.getSheetByName(CONFIG.ACCOUNTS_SHEET);
  var occupied = 0;
  for (var i = 1; i < services.length; i++) {
    if (services[i][2] === accountId && services[i][9] !== CONFIG.STATUS.CANCELADO) occupied++;
  }
  var rows = accounts.getDataRange().getValues();
  for (var a = 1; a < rows.length; a++) {
    if (rows[a][0] === accountId) {
      accounts.getRange(a + 1, 6).setValue(occupied);
      accounts.getRange(a + 1, 12).setValue(new Date().toISOString());
      return;
    }
  }
}

function refreshClientStatus(clientId) {
  if (!clientId) return;
  var ss = getSpreadsheet();
  var services = ss.getSheetByName(CONFIG.SERVICES_SHEET).getDataRange().getValues();
  var active = false;
  for (var i = 1; i < services.length; i++) {
    if (services[i][1] === clientId && services[i][9] !== CONFIG.STATUS.CANCELADO) active = true;
  }
  var clients = ss.getSheetByName(CONFIG.CLIENTS_SHEET);
  var rows = clients.getDataRange().getValues();
  for (var c = 1; c < rows.length; c++) {
    if (rows[c][0] === clientId) {
      clients.getRange(c + 1, 6).setValue(active ? 'ACTIVO' : 'INACTIVO');
      clients.getRange(c + 1, 8).setValue(new Date().toISOString());
      return;
    }
  }
}

function cancelAccount(accountId, user) {
  if (!accountId) throw new Error('El ID de cuenta es obligatorio.');
  var ss = getSpreadsheet();
  var serviceSheet = ss.getSheetByName(CONFIG.SERVICES_SHEET);
  var services = serviceSheet.getDataRange().getValues();
  var userName = (user && user.nombre) ? user.nombre : 'Sistema';

  // Desvincular o cancelar servicios de prueba asociados para que no bloquee
  for (var s = 1; s < services.length; s++) {
    if (services[s][2] === accountId) {
      serviceSheet.getRange(s + 1, 3).setValue(''); // desvincular cuenta_id
      if (services[s][9] !== CONFIG.STATUS.CANCELADO) {
        serviceSheet.getRange(s + 1, 10).setValue(CONFIG.STATUS.CANCELADO);
      }
    }
  }

  var accounts = ss.getSheetByName(CONFIG.ACCOUNTS_SHEET);
  var rows = accounts.getDataRange().getValues();
  for (var a = 1; a < rows.length; a++) {
    if (rows[a][0] !== accountId) continue;
    
    // Eliminar la cuenta para que desaparezca
    accounts.deleteRow(a + 1);

    var payments = ss.getSheetByName(CONFIG.PAYMENTS_PLATFORMS_SHEET);
    if (payments) {
      var pRows = payments.getDataRange().getValues();
      for (var p = pRows.length - 1; p >= 1; p--) {
        if (pRows[p][1] === accountId) payments.deleteRow(p + 1);
      }
    }
    logHistory('CUENTAS', accountId, 'ELIMINAR', 'Cuenta eliminada y costos asociados limpiados.', userName);
    return { success: true, message: 'Cuenta eliminada correctamente.' };
  }
  throw new Error('Cuenta no encontrada.');
}