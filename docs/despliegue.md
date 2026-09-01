# 🚀 Guía de Despliegue Paso a Paso

## Antes de desplegar: cierre de datos

1. En Google Sheets abre **Compartir** y cambia **Acceso general** a **Restringido**. Comparte solo con las dos cuentas operadoras.
2. En Apps Script abre **Configuración del proyecto > Propiedades del script** y crea `INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_NAME` y `INITIAL_ADMIN_PASSWORD` (mínimo 12 caracteres).
3. Ejecuta manualmente `initializeProduction` una sola vez desde el editor de Apps Script. Esta función genera el secreto de sesión, crea las tablas `_APP_*` y elimina la contraseña temporal de las propiedades.
4. Despliega la Web App como **ejecutar como: yo** y **acceso: cualquiera**. La URL pública no concede acceso a datos: la API exige una sesión válida para toda operación salvo login y ping.

Esta guía te permite poner en marcha el sistema completo en menos de 10 minutos.

---

## PASO 1: Configurar el Backend en Google Apps Script

1. Abre tu hoja de Google Sheets en el navegador:
   `https://docs.google.com/spreadsheets/d/1N3yY4axOFcKS5V3IiRNvbMaALKpbRw7e/edit`
2. En el menú superior de Google Sheets, ve a: **Extensiones** ➔ **Apps Script**.
3. En el editor de Apps Script, crea 12 archivos `.gs` copiando el contenido de la carpeta `Apps Script/` de este proyecto:
   - `Code.gs`
   - `auth.gs`
   - `clients.gs`
   - `services.gs`
   - `payments.gs`
   - `billing.gs`
   - `scheduler.gs`
   - `reminders.gs`
   - `cancellations.gs`
   - `sheets.gs`
   - `security.gs`
   - `utils.gs`
4. Guarda todos los archivos pulsando el ícono de **Guardar** (Ctrl+S).

---

## PASO 2: Publicar la Web App en Google Apps Script

1. En la esquina superior derecha del editor de Apps Script, haz clic en el botón azul **Implementar (Deploy)** ➔ **Nueva implementación**.
2. Selecciona el tipo: **Aplicación web**.
3. Configura los siguientes campos:
   - **Descripción**: `API Cobros v1.0`
   - **Ejecutar como**: `Yo (tu correo de Google)`
   - **Quién tiene acceso**: `Cualquiera (Anyone)` *(Indispensable para que la app frontend pueda comunicarse)*
4. Haz clic en **Implementar**.
5. Google te pedirá autorizar permisos la primera vez:
   - Haz clic en **Revisar permisos**.
   - Elige tu cuenta de Google.
   - Haz clic en **Avanzado (Advanced)** ➔ **Ir a Proyecto (no seguro)**.
   - Haz clic en **Permitir**.
6. **Copia la URL de la aplicación web** que termina en `/exec`.

---

## PASO 3: Activar el Scheduler Horario Automático

1. En el panel izquierdo del editor de Apps Script, haz clic en el ícono de reloj **Activadores (Triggers)**.
2. Haz clic en el botón azul **+ Añadir activador** (abajo a la derecha).
3. Configura:
   - **Qué función desea ejecutar**: `runHourlyScheduler`
   - **Qué despliegue se debe ejecutar**: `Principal (Head)`
   - **Seleccione la fuente del evento**: `Basado en tiempo (Time-driven)`
   - **Seleccione el tipo de activador basado en tiempo**: `Temporizador por horas (Hour timer)`
   - **Seleccione el intervalo de horas**: `Cada hora (Every hour)`
4. Haz clic en **Guardar**.

---

## PASO 4: Conectar el Frontend con la Web App

1. Abre la aplicación frontend en tu navegador o localmente.
2. Inicia sesión con el botón rápido **Carlos** o **Esposa**.
3. Ve a la pestaña **Ajustes (⚙️)** en el menú.
4. En el campo **URL de Google Apps Script**, pega la URL `/exec` que copiaste en el Paso 2.
5. Haz clic en **Guardar Configuración**.
6. Inicia sesión con el administrador creado en `initializeProduction`.
7. Ejecuta **Migrar Datos Existentes** una única vez y valida los conteos antes de operar con las nuevas tablas. Las hojas originales no se modifican.

---

## PASO 5: Desplegar el Frontend en Vercel o Netlify (Gratuito)

### En Vercel:
1. Sube este repositorio a GitHub.
2. Entra en [vercel.com](https://vercel.com) e inicia sesión con tu GitHub.
3. Haz clic en **Add New Project** e importa este repositorio `app-cobros`.
4. El framework se detectará automáticamente como **Vite**.
5. Haz clic en **Deploy**.
6. Abre la URL generada en tu iPhone, iPad o laptop. ¡Listo!
