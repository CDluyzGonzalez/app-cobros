/**
 * sheets.gs — Estructura de la Base de Datos en Google Sheets (3FN)
 * ============================================================
 * Crea y gestiona las hojas _APP_* de forma segura en 3FN.
 * También contiene el script de inicialización y migración adaptado a 3FN.
 */

/**
 * 1. Crea todas las hojas _APP_* con sus encabezados normalizados en 3FN.
 * Es seguro ejecutarlo más de una vez (no sobreescribe datos).
 */
function setupDatabase() {
  var ss = getSpreadsheet();

  // 1. Usuarios del sistema (Carlos & Esposa)
  getOrCreateSheet(ss, CONFIG.USERS_SHEET, [
    'id', 'nombre', 'email', 'password_hash', 'rol', 'activo', 'created_at', 'updated_at'
  ]);

  // 2. Catálogo Maestro de Plataformas (3FN)
  getOrCreateSheet(ss, '_APP_PLATAFORMAS', [
    'id', 'nombre', 'perfiles_estandar', 'precio_sugerido', 'activo', 'created_at'
  ]);

  // 3. Directorio maestro de clientes (1FN y 3FN)
  getOrCreateSheet(ss, CONFIG.CLIENTS_SHEET, [
    'id', 'nombre', 'telefono', 'correo', 'notas', 'estado',
    'created_at', 'updated_at', 'updated_by', 'version'
  ]);

  // 4. Cuentas matrices de plataformas (3FN)
  getOrCreateSheet(ss, CONFIG.ACCOUNTS_SHEET, [
    'id', 'plataforma', 'correo_cuenta', 'password_encrypted', 'perfiles_totales',
    'cupos_ocupados', 'costo_mensual', 'dia_pago_plataforma', 'estado', 'notas',
    'created_at', 'updated_at'
  ]);

  // 5. Servicios contratados por cliente (3FN: FKs a cliente y cuenta sin duplicaciones)
  getOrCreateSheet(ss, CONFIG.SERVICES_SHEET, [
    'id', 'cliente_id', 'cuenta_id', 'perfil', 'pin_encrypted', 'valor',
    'fecha_ultimo_pago', 'fecha_proximo_pago', 'fecha_cambio_estado', 'estado', 'notas',
    'created_at', 'updated_at', 'updated_by', 'version'
  ]);

  // 6. Pagos recibidos de clientes (3FN)
  getOrCreateSheet(ss, CONFIG.PAYMENTS_CLIENTS_SHEET, [
    'id', 'servicio_id', 'valor', 'fecha_pago_real', 'fecha_ciclo_anterior',
    'fecha_ciclo_siguiente', 'metodo_pago', 'comprobante_ref', 'usuario_registro', 'created_at'
  ]);

  // 7. Pagos a plataformas / Costos operativos (3FN: cuenta_id normalizado)
  getOrCreateSheet(ss, CONFIG.PAYMENTS_PLATFORMS_SHEET, [
    'id', 'cuenta_id', 'concepto', 'valor', 'fecha_limite',
    'fecha_pago_real', 'estado', 'notas', 'usuario_registro', 'created_at'
  ]);

  // 8. Historial de auditoría (inmutable)
  getOrCreateSheet(ss, CONFIG.HISTORY_SHEET, [
    'id', 'entidad', 'entidad_id', 'accion', 'descripcion',
    'usuario', 'datos_previos', 'datos_nuevos', 'created_at'
  ]);

  // 9. Configuración global de la app
  getOrCreateSheet(ss, CONFIG.CONFIG_SHEET, [
    'clave', 'valor', 'descripcion', 'updated_at'
  ]);

  return { message: 'Base de datos 3FN configurada correctamente.' };
}

/**
 * 2. Crea el usuario administrador inicial (si la hoja de usuarios está vacía).
 */
function initializeProduction() {
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty('APP_COBROS_SESSION_SECRET')) {
    props.setProperty('APP_COBROS_SESSION_SECRET', Utilities.getUuid() + Utilities.getUuid());
  }
  var ss = getSpreadsheet();
  setupDatabase();
  var users = ss.getSheetByName(CONFIG.USERS_SHEET);
  if (users.getLastRow() > 1) return { message: 'Base ya inicializada; no se crearon usuarios.' };
  
  var email = props.getProperty('INITIAL_ADMIN_EMAIL');
  var password = props.getProperty('INITIAL_ADMIN_PASSWORD');
  var name = props.getProperty('INITIAL_ADMIN_NAME') || 'Administrador';
  
  if (!email || !password || password.length < 12) {
    throw new Error('Define INITIAL_ADMIN_EMAIL e INITIAL_ADMIN_PASSWORD (mínimo 12 caracteres) en Propiedades del script.');
  }
  
  var now = new Date().toISOString();
  users.appendRow([
    'USR-' + Utilities.getUuid(),
    name,
    email.toLowerCase().trim(),
    hashPassword(password),
    'ADMIN',
    true,
    now,
    now
  ]);
  
  props.deleteProperty('INITIAL_ADMIN_PASSWORD');
  return { message: 'Inicialización segura completada con éxito.' };
}

/**
 * 3. Migra los datos existentes (NETFLIX, DISNEY, FACTURACION, etc.)
 * a la nueva estructura 3FN de forma automática.
 */
function migrateExistingData() {
  var ss = getSpreadsheet();

  // Asegurar que las hojas 3FN existan
  setupDatabase();

  var clientSheet  = ss.getSheetByName(CONFIG.CLIENTS_SHEET);
  var serviceSheet = ss.getSheetByName(CONFIG.SERVICES_SHEET);
  var accountSheet = ss.getSheetByName(CONFIG.ACCOUNTS_SHEET);
  var platPaySheet = ss.getSheetByName(CONFIG.PAYMENTS_PLATFORMS_SHEET);

  var now = new Date().toISOString();
  var clientsMap   = {}; // { 'nombre_normalizado': 'CLI-XXXXX' }
  var accountsMap  = {}; // { 'correo_normalizado': 'ACC-XXXXX' }
  var clientCount  = 0;
  var serviceCount = 0;
  var accountCount = 0;

  // ── A. Migrar hoja FACTURACION → _APP_PAGOS_PLATAFORMAS y _APP_CUENTAS ───
  var factSheet = ss.getSheetByName('FACTURACION');
  if (factSheet) {
    var fRows = factSheet.getDataRange().getValues();
    for (var f = 1; f < fRows.length; f++) {
      var concepto = fRows[f][1];
      var valor    = fRows[f][2];
      var fecha    = fRows[f][3];
      var notas    = fRows[f][4];
      var correo   = (fRows[f][7] || '').toString().trim().toLowerCase();

      var upper = (concepto || '').toString().toUpperCase();
      if (!concepto || upper === 'TOTAL' || upper === 'INGRESOS' || upper === 'GANANCIAS FINAL') continue;

      var accId = '';
      if (correo) {
        if (!accountsMap[correo]) {
          accountCount++;
          accId = 'ACC-' + padZero(accountCount, 5);
          accountsMap[correo] = accId;
          accountSheet.appendRow([
            accId, concepto.toString(), correo, '', 1, 0, Number(valor) || 0, '', 'ACTIVA', 'Migrada desde Facturación', now, now
          ]);
        } else {
          accId = accountsMap[correo];
        }
      }

      platPaySheet.appendRow([
        'PLA-' + padZero(f, 5),
        accId,
        concepto.toString(),
        Number(valor) || 0,
        fecha ? new Date(fecha) : '',
        '',
        'PENDIENTE',
        notas || '',
        'Migración',
        now
      ]);
    }
  }

  // ── B. Migrar hojas de plataformas → _APP_CLIENTES y _APP_SERVICIOS (3FN) ───
  var platformSheets = ['NETFLIX', 'DISNEY', 'AMAZON PRIME', 'DIRECTV', 'MAX', 'COMBOS', 'SPOTIFY', 'CANVA', 'VARIOS'];

  for (var p = 0; p < platformSheets.length; p++) {
    var sheetName = platformSheets[p];
    var pSheet    = ss.getSheetByName(sheetName);
    if (!pSheet) continue;

    var rows = pSheet.getDataRange().getValues();
    for (var r = 1; r < rows.length; r++) {
      var rawName   = rows[r][0];
      var valor_srv = rows[r][1];
      var pagoOk    = rows[r][2];
      var fechaProx = rows[r][3];
      var extra     = rows[r][4]; // correo o nota

      if (!rawName || rawName.toString().toUpperCase() === 'TOTAL') continue;

      var cleanName     = rawName.toString().trim();
      var normalizedKey = cleanName.toLowerCase().replace(/\s+/g, ' ');

      // Deduplicar cliente (1FN / 3FN)
      var cId = clientsMap[normalizedKey];
      if (!cId) {
        clientCount++;
        cId = 'CLI-' + padZero(clientCount, 5);
        clientsMap[normalizedKey] = cId;
        clientSheet.appendRow([
          cId, cleanName, '', '', 'Migrado desde hoja ' + sheetName, 'ACTIVO', now, now, 'Migración', 1
        ]);
      }

      // Resolver o crear cuenta matriz vinculada
      var accId = '';
      var extraStr = (extra || '').toString().trim();
      if (extraStr.includes('@')) {
        var emailKey = extraStr.toLowerCase();
        if (!accountsMap[emailKey]) {
          accountCount++;
          accId = 'ACC-' + padZero(accountCount, 5);
          accountsMap[emailKey] = accId;
          accountSheet.appendRow([
            accId, sheetName, emailKey, '', 1, 0, 0, '', 'ACTIVA', 'Creada en migración', now, now
          ]);
        } else {
          accId = accountsMap[emailKey];
        }
      }

      serviceCount++;
      var sId           = 'SRV-' + padZero(serviceCount, 5);
      var estadoInicial = (pagoOk === false) ? CONFIG.STATUS.POR_VENCER : CONFIG.STATUS.ACTIVO;

      // Inserción en _APP_SERVICIOS en 3FN (sin nombre ni teléfono redundantes)
      serviceSheet.appendRow([
        sId,
        cId,
        accId,
        '', // perfil
        '', // pin_encrypted
        Number(valor_srv) || 0,
        '', // fecha_ultimo_pago
        fechaProx ? new Date(fechaProx) : '',
        now,
        estadoInicial,
        (!extraStr.includes('@') ? extraStr : ''),
        now, now, 'Migración', 1
      ]);
    }
  }

  return {
    success: true,
    clientsMigrated:  clientCount,
    servicesMigrated: serviceCount,
    accountsMigrated: accountCount,
    message: 'Migración a 3FN completada con éxito.'
  };
}