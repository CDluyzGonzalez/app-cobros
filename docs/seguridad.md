# 🔐 Seguridad y Privacidad del Sistema

## 1. Almacenamiento Seguro de Credenciales

### Contraseñas de Usuarios (`_APP_USUARIOS`)
- Se almacenan con un hash con sal individual e iteraciones; no hay semilla ni credenciales embebidas en el código.
- Las contraseñas en texto plano **nunca** se guardan en la hoja de cálculo.
- Al iniciar sesión, el backend compara únicamente el hash calculado con el almacenado.

### PINs de Perfiles y Claves de Plataformas (`_APP_SERVICIOS` y `_APP_CUENTAS`)
- Google Apps Script no ofrece cifrado nativo de datos en reposo. Base64 no es cifrado y no se debe usar como tal. Mantén la hoja restringida y, para contraseñas de plataformas, integra Cloud KMS antes de almacenarlas.

---

## 2. Tokens de Sesión y Acceso

- El backend emite un token aleatorio opaco y guarda únicamente su hash en Propiedades del script.
- El token expira a las **8 horas**. La identidad se obtiene en el servidor; nunca se acepta desde el navegador.

---

## 3. Concurrencia y Bloqueos (Control Optimista)

- Las tablas críticas (`_APP_CLIENTES` y `_APP_SERVICIOS`) cuentan con una columna `version` numérica.
- Cada actualización incrementa en 1 la versión del registro.
- En caso de que Carlos y su Esposa modifiquen el mismo registro simultáneamente, el último guardado prevalece con registro en `_APP_HISTORIAL` detallando quién hizo cada cambio.

---

## 4. Aislamiento de Datos

- La aplicación opera exclusivamente dentro del Spreadsheet designado.
- Las hojas originales (`NETFLIX`, `DISNEY`, `FACTURACION`, etc.) quedan intactas durante y después de la migración.
- Todas las operaciones de la app se ejecutan sobre las tablas con prefijo `_APP_*`.
