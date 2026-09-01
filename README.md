# 🚀 App Cobros

Sistema web para la gestión de clientes, suscripciones, cobros, pagos y cuentas de plataformas digitales.

La aplicación centraliza la información de los clientes y servicios contratados, utilizando Google Sheets como fuente de datos y Google Apps Script como backend serverless.

---

## 🎯 Objetivo

App Cobros permite administrar desde una sola aplicación:

- 👥 Clientes y suscripciones.
- 📺 Servicios de plataformas digitales.
- 💰 Cobros y pagos.
- 📅 Próximas fechas de renovación.
- 📩 Recordatorios mediante WhatsApp.
- 💳 Pagos realizados a las plataformas.
- 📊 Facturación, ingresos, gastos y ganancias.
- 🔔 Alertas de vencimientos.
- ❌ Cancelación automática de servicios no renovados.
- 👨‍👩‍👧‍👦 Acceso compartido para el administrador y su esposa.

La aplicación está diseñada principalmente para dispositivos móviles, pero también cuenta con una interfaz adaptada para tablets y computadores.

---

## 🛠️ Tecnologías utilizadas

| Tecnología | Uso |
|---|---|
| **React** | Construcción de la interfaz |
| **TypeScript** | Tipado y seguridad del código |
| **Vite** | Herramienta de desarrollo y build |
| **Tailwind CSS** | Diseño y estilos |
| **Google Apps Script** | Backend y API |
| **Google Sheets** | Persistencia de datos |
| **WhatsApp** | Envío manual de mensajes mediante enlaces |
| **Git / GitHub** | Control de versiones |

---

## 🏗️ Arquitectura

La aplicación utiliza una arquitectura desacoplada:

```text
┌──────────────────────────────┐
│        React + TypeScript    │
│          Frontend            │
│                              │
│  Mobile · Tablet · Desktop  │
└──────────────┬───────────────┘
               │
               │ HTTP / JSON
               ▼
┌──────────────────────────────┐
│      Google Apps Script      │
│           Backend            │
│                              │
│  Auth · Clientes · Cobros   │
│  Servicios · Facturación    │
│  Recordatorios · Scheduler  │
└──────────────┬───────────────┘
               │
               │ CRUD
               ▼
┌──────────────────────────────┐
│        Google Sheets         │
│      Fuente de datos         │
│                              │
│ Clientes · Servicios        │
│ Plataformas · Pagos         │
│ Facturación · Historial     │
└──────────────────────────────┘

               │
               ▼
        ┌─────────────┐
        │  WhatsApp   │
        │   wa.me     │
        └─────────────┘
```

---

## 📐 Arquitectura del Backend

El backend de Google Apps Script está dividido por responsabilidades para reducir errores, duplicación de código y facilitar el mantenimiento.

```text
Apps Script
│
├── Code.gs
├── auth.gs
├── clients.gs
├── services.gs
├── payments.gs
├── billing.gs
├── scheduler.gs
├── reminders.gs
├── cancellations.gs
├── sheets.gs
├── security.gs
└── utils.gs
```

### Responsabilidad de cada archivo

| Archivo | Responsabilidad |
|---|---|
| `Code.gs` | Entrada de la API y enrutamiento de solicitudes |
| `auth.gs` | Autenticación y gestión de sesiones |
| `clients.gs` | Gestión de clientes |
| `services.gs` | Gestión de servicios y suscripciones |
| `payments.gs` | Registro y control de pagos |
| `billing.gs` | Facturación y pagos de plataformas |
| `scheduler.gs` | Procesos automáticos programados |
| `reminders.gs` | Generación de recordatorios |
| `cancellations.gs` | Gestión de servicios pendientes de cancelación |
| `sheets.gs` | Lectura y escritura en Google Sheets |
| `security.gs` | Hashing, validaciones y medidas de seguridad |
| `utils.gs` | Funciones auxiliares reutilizables |

La lógica de negocio se mantiene separada del acceso a Google Sheets.

---

## ✨ Funcionalidades principales

### 👥 Gestión de clientes

Permite:

- Registrar clientes.
- Editar información.
- Consultar clientes.
- Registrar teléfono.
- Registrar correo.
- Registrar notas.
- Consultar servicios contratados.
- Consultar el correo utilizado actualmente en cada perfil.

---

### 📺 Gestión de servicios

Cada cliente puede tener uno o varios servicios.

Ejemplo:

```text
Juan Pérez

Netflix       $25.000
Disney+       $15.000
Spotify       $10.000
```

Cada servicio mantiene su propia información:

- Plataforma.
- Valor.
- Fecha de vencimiento.
- Estado.
- Cuenta / correo del perfil.
- PIN.
- Notas.
- Historial de pagos.

Esto permite cancelar un servicio específico sin eliminar al cliente.

---

## 💰 Sistema de cobros

La aplicación identifica:

- Cobros próximos.
- Cobros del día.
- Cobros vencidos.
- Clientes que confirmaron renovación.
- Clientes que aún no han realizado el pago.
- Servicios pendientes de cancelación.

El sistema genera automáticamente la información necesaria para realizar el seguimiento.

---

## 📱 Recordatorios por WhatsApp

La aplicación **no envía automáticamente el mensaje**.

En su lugar, genera un enlace que abre WhatsApp con el mensaje preparado.

El administrador decide cuándo presionar **Enviar**.

### Primer recordatorio

Ejemplo:

> Hola Juan 👋
>
> Te escribo porque tu servicio de Netflix vence  
> el día 01/09/2026.
>
> El valor de la renovación es de $25.000.
>
> ¿Deseas renovar?
>
> Puedes realizar el pago y  
> enviarme el comprobante por este medio.
>
> ¡Gracias! 😊

---

## ⏱️ Flujo de renovación

El sistema utiliza un flujo controlado de renovación.

```text
Servicio próximo a vencer
          │
          ▼
Enviar recordatorio
          │
          ▼
¿Cliente renueva?
     │           │
    NO           SÍ
     │           │
     │           ▼
     │      ¿Realizó pago?
     │        │       │
     │       SÍ       NO
     │        │       │
     │        │       ▼
     │        │   Esperar 24 h
     │        │       │
     │        │       ▼
     │        │   Recordatorio
     │        │       │
     │        │       ▼
     │        │   Esperar hasta
     │        │   completar 36 h
     │        │       │
     │        │       ▼
     │        │   Generar alerta
     │        │   de cancelación
     │        │
     ▼        ▼
 Cancelar   Renovar
 servicio   servicio
```

---

## 🔔 Recordatorio de pago pendiente

Cuando el cliente confirma que desea renovar pero todavía no realiza el pago, se puede generar el siguiente mensaje:

> Hola Juan 👋
>
> Te recuerdo que tenemos pendiente el pago  
> de la renovación de tu servicio.
>
> Por favor envíame el comprobante para poder confirmar y así continuar  
> con el servicio.
>
> Gracias.

---

## ❌ Cancelación por falta de pago

Si el cliente confirma que desea renovar pero no realiza el pago dentro del período establecido:

1. Se registra la confirmación de renovación.
2. Se inicia el período de espera.
3. Se envía el recordatorio correspondiente.
4. Al cumplirse las 36 horas sin pago, el servicio queda pendiente de cancelación.
5. El sistema genera una alerta para el administrador.
6. El administrador cancela el servicio correspondiente.
7. El servicio deja de aparecer como activo para el cliente.

### Importante

La aplicación **no elimina al cliente** por cancelar un servicio.

Si un cliente tiene:

```text
Netflix
Disney+
Spotify
```

y cancela Disney+:

```text
Netflix   → Activo
Disney+   → Cancelado
Spotify   → Activo
```

Solo se modifica el servicio cancelado.

---

## 📅 Cálculo de próximas fechas

La renovación utiliza **días calendario**.

Ejemplo:

```text
Pago:             31/08/2026
Próxima fecha:    30/09/2026
```

Otro ejemplo:

```text
Pago:             15/09/2026
Próxima fecha:    15/10/2026
```

El período de 24/36 horas utilizado para los recordatorios **no modifica la fecha mensual de renovación**.

La nueva fecha se calcula a partir de la fecha correspondiente al ciclo de servicio.

---

## 💳 Facturación de plataformas

La aplicación también controla los pagos que realiza el administrador a las plataformas.

La sección:

```text
FACTURACION
```

permite consultar:

- Plataforma / cuenta.
- Valor a pagar.
- Fecha de pago.
- Estado del pago.
- Notas.
- Total de gastos.
- Ingresos provenientes de los clientes.
- Ganancia estimada.

Ejemplo:

```text
Ingresos de clientes
        -
Pagos realizados a plataformas
        =
Ganancia
```

---

## 📊 Google Sheets como fuente de datos

Google Sheets funciona como la fuente de persistencia del sistema.

La aplicación lee y escribe los datos directamente en el Sheet.

La interfaz de la aplicación tiene prioridad operativa sobre la edición manual de las hojas.

Las hojas internas utilizadas por la aplicación pueden mantenerse ocultas para evitar modificaciones accidentales.

---

## 🔐 Seguridad

La aplicación cuenta con autenticación mediante usuario y contraseña.

Las contraseñas **no se almacenan en texto plano**.

Se utiliza almacenamiento mediante hash con salt y mecanismos de validación para evitar guardar la contraseña original.

Las credenciales y configuraciones sensibles no deben almacenarse directamente en el código fuente ni publicarse en GitHub.

---

## 👨‍👩‍👧‍👦 Usuarios

La aplicación está diseñada para permitir el acceso de más de un administrador.

El administrador y su esposa pueden trabajar sobre:

- Los mismos clientes.
- Los mismos servicios.
- Los mismos pagos.
- Las mismas plataformas.
- La misma facturación.

No se duplican los clientes ni la información.

---

## 📱 Diseño responsive

La aplicación está diseñada principalmente para:

### 📱 Móvil

- iPhone
- Android
- Pantallas pequeñas

### 📲 Tablet

- iPad
- Tablets Android

### 💻 Desktop

- Windows
- macOS
- Linux

Las vistas móviles tendrán componentes y distribución optimizados para pantallas táctiles.

---

## ⚡ Automatizaciones

Google Apps Script utiliza triggers programados para ejecutar procesos automáticos.

Entre ellos:

- Detectar próximos vencimientos.
- Actualizar estados.
- Detectar pagos pendientes.
- Controlar períodos de espera.
- Generar alertas de cancelación.
- Mantener actualizados los estados de los servicios.

Las automatizaciones se ejecutan independientemente de que la aplicación web esté abierta.

---

## 📁 Estructura del proyecto

```text
app-cobros/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── layouts/
│   ├── services/
│   ├── hooks/
│   ├── context/
│   ├── types/
│   ├── utils/
│   └── App.tsx
│
├── Apps Script/
│   ├── Code.gs
│   ├── auth.gs
│   ├── clients.gs
│   ├── services.gs
│   ├── payments.gs
│   ├── billing.gs
│   ├── scheduler.gs
│   ├── reminders.gs
│   ├── cancellations.gs
│   ├── sheets.gs
│   ├── security.gs
│   └── utils.gs
│
├── public/
├── docs/
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/CDluyzGonzalez/app-cobros.git
cd app-cobros
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crear un archivo `.env` basado en `.env.example`.

Ejemplo:

```env
VITE_API_URL=https://script.google.com/macros/s/TU_SCRIPT_ID/exec
```

No subir `.env` al repositorio.

### 4. Iniciar el entorno de desarrollo

```bash
npm run dev
```

### 5. Abrir la aplicación

La URL será mostrada por Vite en la terminal.

Normalmente:

```text
http://localhost:5173
```

---

## 🔄 Flujo general de datos

```text
Usuario
   │
   ▼
React / TypeScript
   │
   │ HTTP + JSON
   ▼
Google Apps Script
   │
   ├── Autenticación
   ├── Lógica de negocio
   ├── Validaciones
   └── Servicios
   │
   ▼
Google Sheets
   │
   └── Persistencia
```

---

## 📌 Estado del proyecto

Proyecto en desarrollo.

### Próximas etapas

- [ ] Configuración de Google Apps Script.
- [ ] Conexión con Google Sheets.
- [ ] Estructura definitiva de datos.
- [ ] Sistema de autenticación.
- [ ] Gestión de clientes.
- [ ] Gestión de servicios.
- [ ] Sistema de cobros.
- [ ] Sistema de recordatorios.
- [ ] Scheduler automático.
- [ ] Sistema de cancelaciones.
- [ ] Módulo de facturación.
- [ ] Dashboard.
- [ ] Diseño móvil.
- [ ] Pruebas.
- [ ] Despliegue.

---

## 👤 Autor

**Carlos D'Luyz Gonzalez**

Ingeniería de Sistemas en formación · Desarrollador Web

- [GitHub](https://github.com/CDluyzGonzalez)
- [LinkedIn](https://www.linkedin.com/in/cdluyz/)

---