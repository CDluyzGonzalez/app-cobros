/**
 * clients.gs — Gestión de Clientes y WhatsApps
 * ==============================================
 * CRUD de clientes. Soporta que varios clientes
 * compartan el mismo número de WhatsApp.
 */

/**
 * Retorna la lista completa de clientes activos e inactivos.
 */
function getClientsList() {
  var ss    = getSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.CLIENTS_SHEET);
  if (!sheet) return [];

  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];

  var clients = [];
  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    if (!row[0]) continue;
    clients.push({
      id:         row[0],
      nombre:     row[1],
      telefono:   row[2] ? row[2].toString() : '',
      correo:     row[3] || '',
      notas:      row[4] || '',
      estado:     row[5] || 'ACTIVO',
      created_at: row[6] || '',
      updated_at: row[7] || '',
      updated_by: row[8] || '',
      version:    Number(row[9]) || 1
    });
  }
  return clients;
}

/**
 * Crea un nuevo cliente o actualiza uno existente.
 * El número de teléfono es el campo principal para WhatsApp.
 * Un mismo número puede pertenecer a varios clientes.
 */
function saveClient(client, user) {
  if (!client || !client.nombre || !client.nombre.trim()) {
    throw new Error('El nombre del cliente es obligatorio.');
  }

  var ss       = getSpreadsheet();
  var sheet    = ss.getSheetByName(CONFIG.CLIENTS_SHEET);
  var rows     = sheet.getDataRange().getValues();
  var now      = new Date().toISOString();
  var userName = (user && user.nombre) ? user.nombre : 'Sistema';

  // ── Actualizar cliente existente ────────────────────────────────────────
  if (client.id) {
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] === client.id) {
        var newVersion = (Number(rows[i][9]) || 1) + 1;
        sheet.getRange(i + 1, 2, 1, 9).setValues([[
          client.nombre.trim(),
          client.telefono   || '',
          client.correo     || '',
          client.notas      || '',
          client.estado     || 'ACTIVO',
          rows[i][6],   // created_at (no cambia)
          now,
          userName,
          newVersion
        ]]);
        logHistory('CLIENTES', client.id, 'ACTUALIZAR', 'Cliente actualizado: ' + client.nombre, userName);
        return { id: client.id, success: true, message: 'Cliente actualizado correctamente.' };
      }
    }
  }

  // ── Crear nuevo cliente ─────────────────────────────────────────────────
  var nextId = 'CLI-' + padZero(rows.length, 5);
  sheet.appendRow([
    nextId,
    client.nombre.trim(),
    client.telefono || '',
    client.correo   || '',
    client.notas    || '',
    client.estado   || 'ACTIVO',
    now, now, userName, 1
  ]);
  logHistory('CLIENTES', nextId, 'CREAR', 'Cliente creado: ' + client.nombre, userName);
  return { id: nextId, success: true, message: 'Cliente creado con éxito.' };
}

/**
 * Actualiza los teléfonos de múltiples clientes en una sola operación.
 * Usado desde la pantalla "Asignación Rápida de WhatsApps".
 *
 * @param {Array} phoneUpdates  Array de { id: 'CLI-XXXXX', telefono: '+57300...' }
 */
function batchUpdateClientPhones(phoneUpdates, user) {
  if (!phoneUpdates || !phoneUpdates.length) return { updatedCount: 0 };

  var ss       = getSpreadsheet();
  var sheet    = ss.getSheetByName(CONFIG.CLIENTS_SHEET);
  var rows     = sheet.getDataRange().getValues();
  var now      = new Date().toISOString();
  var userName = (user && user.nombre) ? user.nombre : 'Sistema';

  // Construir mapa para búsqueda O(1)
  var phoneMap = {};
  for (var k = 0; k < phoneUpdates.length; k++) {
    phoneMap[phoneUpdates[k].id] = phoneUpdates[k].telefono;
  }

  var updatedCount = 0;
  for (var i = 1; i < rows.length; i++) {
    var cId = rows[i][0];
    if (phoneMap[cId] !== undefined) {
      sheet.getRange(i + 1, 3).setValue(phoneMap[cId]); // columna 3 = telefono
      sheet.getRange(i + 1, 8).setValue(now);            // updated_at
      sheet.getRange(i + 1, 9).setValue(userName);       // updated_by
      updatedCount++;
    }
  }

  logHistory('CLIENTES', 'BATCH', 'ACTUALIZAR_TELEFONOS',
    'Teléfonos actualizados para ' + updatedCount + ' clientes', userName);

  return { updatedCount: updatedCount, message: 'Teléfonos guardados correctamente.' };
}
