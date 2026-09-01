/**
 * auth.gs — Autenticación de Carlos y Esposa
 * ============================================
 * Login, verificación de credenciales y sesiones.
 */

/**
 * Valida email y contraseña contra la hoja _APP_USUARIOS.
 * Retorna el objeto de usuario con token si las credenciales son correctas.
 */
function loginUser(email, password) {
  if (!email || !password) {
    throw new Error('El correo y la contraseña son obligatorios.');
  }

  var ss    = getSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.USERS_SHEET);
  if (!sheet) throw new Error('Base de datos no inicializada. Ejecuta "Crear Estructura" primero.');

  var rows   = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    var row        = rows[i];
    var rowEmail   = (row[2] || '').toString().toLowerCase().trim();
    var rowHash    = (row[3] || '').toString();
    var rowActivo  = row[5];

    if (rowEmail === email.toLowerCase().trim() && verifyPassword(password, rowHash) && rowActivo === true) {
      var token = generateSessionToken({ id: row[0], nombre: row[1], email: row[2], rol: row[4] });
      logHistory('AUTH', row[0], 'LOGIN', 'Inicio de sesión exitoso: ' + row[1], row[1]);
      return {
        id:     row[0],
        nombre: row[1],
        email:  row[2],
        rol:    row[4],
        token:  token
      };
    }
  }

  throw new Error('Credenciales incorrectas o usuario inactivo.');
}

/**
 * Cambia la contraseña de un usuario.
 * Requiere la contraseña actual como verificación.
 */
function changePassword(userId, currentPassword, newPassword) {
  if (!userId || !currentPassword || !newPassword) {
    throw new Error('Todos los campos son obligatorios.');
  }
  if (newPassword.length < 6) {
    throw new Error('La nueva contraseña debe tener al menos 6 caracteres.');
  }

  var ss    = getSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.USERS_SHEET);
  var rows  = sheet.getDataRange().getValues();

  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === userId && verifyPassword(currentPassword, rows[i][3])) {
      sheet.getRange(i + 1, 4).setValue(hashPassword(newPassword));
      sheet.getRange(i + 1, 8).setValue(new Date().toISOString());
      logHistory('AUTH', userId, 'CAMBIO_CONTRASEÑA', 'Contraseña actualizada', rows[i][1]);
      return { success: true, message: 'Contraseña actualizada correctamente.' };
    }
  }

  throw new Error('La contraseña actual no es correcta.');
}
