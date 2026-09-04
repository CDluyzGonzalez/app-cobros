<div align="center">
  <img src="public/logo.png" alt="Platnex Logo" width="160" style="border-radius: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.2);" />

  # PLATNEX — Tu Mundo Digital
  ### Sistema Inteligente de Gestión de Suscripciones, Cobros Automatizados y Streaming Multiplataforma

  [![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![Vite](https://img.shields.io/badge/Vite-8.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
  [![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
  [![Google Cloud Run](https://img.shields.io/badge/Google_Cloud_Run-API-4285F4?style=for-the-badge&logo=google-cloud&logoColor=white)](https://cloud.google.com/run)
  [![Cloud Firestore](https://img.shields.io/badge/Cloud_Firestore-3FN-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/docs/firestore)
  [![Firebase Hosting](https://img.shields.io/badge/Firebase_Hosting-Live-FF8F00?style=for-the-badge&logo=firebase&logoColor=white)](https://app-cobros-v2.web.app)
  [![Cost](https://img.shields.io/badge/Costo-$0_COP/mes-00C853?style=for-the-badge)](https://cloud.google.com/free)

  <p align="center">
    <strong>Plataforma PWA moderna, reactiva y serverless de nivel empresarial, diseñada para negocios de distribución y administración de cuentas de streaming (Netflix, Disney+, Max, Prime Video, Spotify, YouTube Premium, etc.).</strong>
  </p>

  [Ver App en Producción](https://app-cobros-v2.web.app) · [Reportar un Error](https://github.com/CDluyzGonzalez/app-cobros/issues) · [Solicitar Funcionalidad](https://github.com/CDluyzGonzalez/app-cobros/issues)
</div>

---

## 📖 Tabla de Contenidos

1. [Visión General](#-visión-general)
2. [Características Principales](#-características-principales)
3. [Arquitectura del Sistema](#-arquitectura-del-sistema)
4. [Modelo de Datos en Firestore (3FN)](#-modelo-de-datos-en-firestore-3fn)
5. [Notificaciones Push Nativas (VAPID / Apple APNs / Google FCM)](#-notificaciones-push-nativas)
6. [Flujo de Cobros y Acciones Inteligentes](#-flujo-de-cobros-y-acciones-inteligentes)
7. [Infraestructura y Costo Cero ($0 COP)](#-infraestructura-y-costo-cero-0-cop)
8. [Estructura del Repositorio](#-estructura-del-repositorio)
9. [Instalación y Desarrollo Local](#-instalación-y-desarrollo-local)
10. [Despliegue a Producción](#-despliegue-a-producción)
11. [Seguridad y Gestión de Acceso](#-seguridad-y-gestión-de-acceso)
12. [Autor](#-autor)
13. [Licencia](#-licencia)

---

## 🌟 Visión General

**Platnex** nació de la necesidad de sustituir hojas de cálculo manuales (Google Sheets) y scripts lentos por una arquitectura de alta disponibilidad, baja latencia y costo operativo cero.

Permite a los administradores y sus equipos operar el negocio desde cualquier celular (iOS / Android) o computador de escritorio con sincronización en tiempo real, alertas con sonido a la pantalla bloqueada, facturación automatizada y auditoría de cada peso cobrado y pagado.

---

## ✨ Características Principales

### 📱 Progressive Web App (PWA) de Alto Rendimiento
- **Instalable sin tiendas**: Añade la aplicación directamente a la pantalla de inicio en iOS (Safari) o Android (Chrome) como si fuera una app nativa.
- **Soporte Offline & Pre-cache**: Service Worker optimizado con Workbox para tiempos de carga inferiores a 800 ms.
- **Diseño Adaptativo Móvil / Desktop**: Barra de navegación móvil inferior ergonómica y barra lateral expandible para pantallas grandes.

### 🔔 Notificaciones Push Remotas (Despiertan el Celular Bloqueado)
- Implementación de **Web Push RFC 8030 / RFC 8291** con llaves **VAPID**.
- Entrega directa a los servidores oficiales de **Apple (APNs)** y **Google (FCM)**.
- **Suenan, vibran y encienden la pantalla** incluso cuando el teléfono lleva horas bloqueado.
- Resumen matutino automático de cobros del día y cuentas vencidas.

### ⚡ Ciclo de Cobro en 4 Botones Especializados
Cada tarjeta de cobro en el Dashboard y la pantalla de Cobros cuenta con 4 acciones estratégicas con retroalimentación visual:
1. **`WhatsApp`** (`#4ec481`): Abre la conversación de WhatsApp con una plantilla prediseñada, personalizada con el nombre del cliente, servicio y monto exacto en pesos colombianos ($ COP).
2. **`Recordar 24h`** (`#b996d2`): Mueve el servicio a estado `EN_ESPERA` ("⏳ Pago Pendiente"), otorgando un período de gracia configurable de 24 horas sin cancelar el servicio.
3. **`Registrar Pago`** (`#6bb6e8`): Abre el modal inteligente de confirmación y avanza el ciclo exactamente un mes calendario, preservando el **día ancla original** del cliente.
4. **`No renueva`** (`#6a0101`): Cancela el servicio, libera el perfil asignado y registra el evento en el historial de auditoría.

### 📊 Dashboard Financiero y Control de Rentabilidad
- Cálculo en tiempo real de:
  - **Ingresos del Mes** (Recaudado vs. Esperado).
  - **Costos de Plataformas** (Compras a proveedores mayoristas).
  - **Ganancia Neta Real**.
  - Tasa de efectividad de cobro y servicios activos.

### 👥 Gestión Integral de Clientes, Cuentas y Perfiles
- Directorio de clientes con autocompletado y carga masiva de números telefónicos de WhatsApp.
- Inventario de cuentas de streaming con control de perfiles ocupados, PIN de acceso y fechas de corte del proveedor.
- Módulo de Facturación y Costos para registrar egresos por renovación de membresías mayoristas.

### 👀 Modo Demo Integrado (1 Clic)
- **Acceso Instantáneo sin Registro ni Clonación**: Puedes probar la aplicación en vivo directamente en [https://app-cobros-v2.web.app](https://app-cobros-v2.web.app).
- **Botón Directo**: En la pantalla de inicio de sesión, pulsa el botón **«👀 Probar versión Demo (Acceso libre)»**.
- **Datos Simulados Aislados**: Carga instantáneamente un catálogo completo de clientes, servicios por cobrar, cuentas mayoristas y métricas financieras simuladas sin requerir credenciales ni modificar los datos reales de producción en Firestore.

---

## 🏗️ Arquitectura del Sistema

El sistema utiliza una arquitectura serverless desacoplada alojada 100% en **Google Cloud Platform (GCP)**:

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             DISPOSITIVOS DE USUARIO                              │
│         iPhone (Safari PWA)  ·  Android (Chrome PWA)  ·  PC / Mac Desktop        │
└──────────────────────────┬───────────────────────────────┬───────────────────────┘
                           │                               │
                HTTP / CDN │ HTTPS                         │ Web Push (APNs / FCM)
                           ▼                               ▼
       ┌───────────────────────────────┐       ┌───────────────────────────────┐
       │       Firebase Hosting        │       │   Apple Push & Google FCM     │
       │    (React 19 + PWA Assets)    │       │    (Alertas Pantalla Bloq.)   │
       └──────────────┬────────────────┘       └───────────────▲───────────────┘
                      │                                        │
                      │ REST API / JSON                        │ VAPID Push Payload
                      ▼                                        │
       ┌───────────────────────────────────────────────────────┴───────────────┐
       │                     Google Cloud Run (Container)                      │
       │                 app-cobros-api (Node.js / Express / TS)               │
       │                                                                       │
       │  • Auth / JWT / Bcrypt       • Cobros & Ciclos       • Web Push VAPID │
       │  • Clientes & Servicios      • Facturación & Costos  • Auditoría Log  │
       └──────────────────────────────┬────────────────────────────────────────┘
                                      │
                                      │ Firestore SDK (gRPC)
                                      ▼
       ┌───────────────────────────────────────────────────────────────────────┐
       │                         Cloud Firestore                               │
       │                Base de Datos NoSQL en 3FN (Always Free)               │
       │                                                                       │
       │  [clientes] · [servicios] · [cuentas] · [pagos_plataformas]           │
       │  [historial_cambios] · [usuarios] · [push_subscriptions]              │
       └───────────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Modelo de Datos en Firestore (3FN)

Para garantizar integridad referencial y eliminar duplicidad de datos, la estructura se modeló en Tercera Forma Normal (3FN):

| Colección | Descripción | Campos Clave |
|---|---|---|
| `clientes` | Información base del comprador | `id`, `nombre`, `telefono`, `estado`, `created_at` |
| `servicios` | Suscripciones activas vendidas | `id`, `cliente_id`, `plataforma`, `perfil`, `pin`, `valor`, `dia_ancla`, `fecha_proximo_pago`, `estado` |
| `cuentas` | Cuentas madre compradas a mayoristas | `id`, `plataforma`, `correo`, `password`, `perfiles_totales`, `fecha_corte`, `costo_mensual` |
| `pagos_plataformas` | Registro de costos y egresos pagados | `id`, `cuenta_id`, `plataforma`, `monto_pagado`, `fecha_pago`, `metodo` |
| `historial_cambios` | Bitácora de auditoría inmutable | `id`, `servicio_id`, `tipo_evento`, `detalles`, `usuario`, `timestamp` |
| `usuarios` | Operadores con acceso al panel | `id`, `nombre`, `email`, `password_hash`, `rol`, `hora_notificacion` |
| `push_subscriptions` | Dispositivos registrados para alertas | `endpoint`, `keys: { p256dh, auth }`, `userId`, `updated_at` |

---

## 🔔 Notificaciones Push Nativas

A diferencia de las alertas web tradicionales que se congelan cuando el usuario bloquea su teléfono, Platnex implementa el protocolo de **Web Push RFC 8291 con llaves VAPID**:

1. **Registro**: En `Configuración > Activar Alertas`, el dispositivo genera un canal cifrado con los servidores de Apple (si es iPhone) o Google (si es Android).
2. **Almacenamiento**: La clave pública y el endpoint se almacenan en la colección `push_subscriptions`.
3. **Disparo Remoto**: El backend en Cloud Run envía un payload criptográfico firmado con VAPID a `push.apple.com` o `fcm.googleapis.com`.
4. **Despertar de Pantalla**: El sistema operativo del teléfono recibe el paquete a nivel de kernel, activa la pantalla, hace sonar el tono oficial de notificación y muestra el banner con el logo de Platnex.

---

## 📁 Estructura del Repositorio

```text
app-cobros/
├── public/
│   ├── custom-sw.js            # Lógica personalizada del Service Worker para Push
│   ├── favicon.svg             # Favicon vectorial
│   └── logo.png                # Logo oficial Platnex - Tu Mundo Digital
├── server/                     # Backend API en Google Cloud Run
│   ├── src/
│   │   ├── config/             # Conexión Firebase Admin y Firestore
│   │   ├── routes/             # Endpoints (auth, clients, services, cobros, notifications)
│   │   ├── services/           # Lógica de base de datos y migración
│   │   ├── utils/              # Formateo de fechas y matemáticas de ciclos
│   │   └── index.ts            # Punto de entrada Express
│   ├── Dockerfile              # Empaquetado de contenedor ligero Node.js Alpine
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── src/                        # Frontend React 19 + PWA
│   ├── components/
│   │   ├── common/             # Modales (pago, instalación PWA), Badges, Botón WhatsApp
│   │   ├── desktop/            # Sidebar para pantallas de escritorio
│   │   └── mobile/             # BottomNav y Header móvil
│   ├── context/                # Contexto global de autenticación (AuthContext)
│   ├── pages/                  # Vistas principales (Dashboard, Cobros, Clientes, Cuentas, etc.)
│   ├── services/               # Cliente HTTP Axios/Fetch hacia Cloud Run
│   ├── types/                  # Definiciones de tipos TypeScript
│   ├── utils/                  # Generador de enlaces WhatsApp y filtros
│   ├── App.tsx                 # Enrutador y layout principal
│   └── main.tsx
├── firebase.json               # Configuración de Firebase Hosting y PWA SPA Rewrite
├── vite.config.ts              # Configuración Vite, Tailwind CSS y VitePWA
├── package.json
└── README.md
```

---

## 💻 Instalación y Desarrollo Local

### Prerrequisitos
- **Node.js**: v20 o superior.
- **npm**: v10 o superior.
- Cuenta de **Google Cloud Platform** con Firestore habilitado en modo Nativo.

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/app-cobros.git
cd app-cobros
```

### 2. Configurar y levantar el Backend (API)
```bash
cd server
npm install
cp .env.example .env
# Variables requeridas en .env: PORT=8080, GCP_PROJECT_ID, JWT_SECRET, VAPID_KEYS
npm run dev
```
*El servidor Express iniciará en `http://localhost:8080`.*

### 3. Configurar y levantar el Frontend (PWA)
En otra pestaña de la terminal:
```bash
cd ..
npm install
npm run dev
```
*La aplicación web Vite iniciará en `http://localhost:3000` (configurado en `vite.config.ts`).*

---

## 🚀 Despliegue a Producción

El proyecto está preparado para desplegarse con dos comandos directos:

### 1. Desplegar el Backend a Google Cloud Run
```bash
cd server
gcloud run deploy app-cobros-api \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --project app-cobros-v2
```

### 2. Desplegar el Frontend a Firebase Hosting
```bash
cd ..
npm run build
npx firebase-tools deploy --only hosting
```

---

## 🔐 Seguridad y Gestión de Acceso

- **Cifrado de Contraseñas**: Cifrado unidireccional con **Bcrypt** (salt rounds = 10). Las contraseñas nunca se guardan en texto plano.
- **Sesiones Cifradas**: Tokens de acceso basados en **JWT (JSON Web Tokens)** con firma secreta configurable y expiración automática.
- **Llave Maestra de Recuperación**: Si el administrador olvida su contraseña, el sistema incluye un mecanismo de restablecimiento de emergencia protegido por la variable de entorno `MASTER_RECOVERY_KEY` en el servidor, evitando exponer accesos o depender de servicios SMTP externos.
- **Protección contra Inyecciones**: Todas las consultas a la base de datos se ejecutan a través del SDK oficial de Cloud Firestore con tipado estricto.
- **Archivos Sensibles Protegidos**: Las llaves de cuentas de servicio (`serviceAccountKey.json`), tokens y archivos de entorno (`.env`) están estrictamente excluidos en `.gitignore` para evitar filtraciones en repositorios públicos o privados.

---

## 👨‍💻 Autor

**Carlos D'Luyz**  
Desarrollador de Software | Estudiante de Ingeniería de Sistemas

---

## 📄 Licencia

Este proyecto es propiedad de **Platnex — Tu Mundo Digital**. Todos los derechos reservados © 2026.
Desarrollado para optimización de cobros y administración digital de suscripciones.