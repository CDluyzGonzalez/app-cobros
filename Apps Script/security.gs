/** Security primitives. Secrets are stored only in Script Properties, never in source. */
function getSecuritySecret() {
  var secret = PropertiesService.getScriptProperties().getProperty('APP_COBROS_SESSION_SECRET');
  if (!secret) throw new Error('Falta APP_COBROS_SESSION_SECRET en Propiedades del script. Ejecuta initializeProduction() una vez.');
  return secret;
}

function hashPassword(password, salt) {
  if (!password) throw new Error('La contraseña es obligatoria.');
  salt = salt || Utilities.getUuid();
  var value = password + ':' + salt;
  for (var i = 0; i < 10000; i++) {
    value = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value, Utilities.Charset.UTF_8));
  }
  return 'v2$' + salt + '$' + value;
}

function verifyPassword(password, stored) {
  if (!stored || stored.indexOf('v2$') !== 0) return false;
  var parts = stored.split('$');
  return parts.length === 3 && hashPassword(password, parts[1]) === stored;
}

function generateSessionToken(user) {
  var token = Utilities.getUuid() + Utilities.getUuid();
  var key = 'session_' + sha256(token);
  var expiresAt = new Date().getTime() + 8 * 60 * 60 * 1000;
  PropertiesService.getScriptProperties().setProperty(key, JSON.stringify({ id: user.id, nombre: user.nombre, email: user.email, rol: user.rol, expiresAt: expiresAt }));
  return token;
}

function requireSession(token) {
  if (!token) throw new Error('No autorizado. Inicia sesión.');
  var key = 'session_' + sha256(token);
  var raw = PropertiesService.getScriptProperties().getProperty(key);
  if (!raw) throw new Error('Sesión inválida o expirada.');
  var session = JSON.parse(raw);
  if (session.expiresAt < new Date().getTime()) {
    PropertiesService.getScriptProperties().deleteProperty(key);
    throw new Error('Sesión expirada.');
  }
  return session;
}

function requireAdmin(session) {
  if (!session || session.rol !== 'ADMIN') throw new Error('No tienes permiso para esta operación.');
}

function sha256(value) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value, Utilities.Charset.UTF_8);
  return bytes.map(function(b) { return (b < 0 ? b + 256 : b).toString(16).padStart(2, '0'); }).join('');
}

// Apps Script has no native encryption-at-rest API. Do not claim Base64 is encryption.
// This keeps legacy fields readable only by the spreadsheet owner; use Cloud KMS before storing platform passwords in the app.
function encryptPIN(value) { return value || ''; }
function decryptPIN(value) { return value || ''; }
