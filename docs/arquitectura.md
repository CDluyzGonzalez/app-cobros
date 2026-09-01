# 🏛️ Arquitectura del Sistema - App de Cobros

## 1. Visión General

La **App de Cobros de Plataformas** es una solución web progresiva (PWA / SPA) de alto rendimiento y cero costo de infraestructura mensual. 

Utiliza **Google Sheets** como base de datos persistente y **Google Apps Script** como backend serverless, mientras que el frontend está construido en **React 19 + TypeScript + Vite + Tailwind CSS**.

```
┌─────────────────────────────────────────────────────────────┐
│                       DISPOSITIVOS                          │
│   📱 iPhone (PWA)   📱 iPad   💻 PC Carlos   💻 Laptop      │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / JSON
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 FRONTEND (Vercel / Netlify)                 │
│   • React 19 + TypeScript + Tailwind CSS                    │
│   • AuthContext + LocalStorage                              │
│   • Componentes Móviles y de Escritorio Dedicados           │
│   • Generador de Enlaces Directos WhatsApp (wa.me)          │
└──────────────────────────────┬──────────────────────────────┘
                               │ POST (JSON via Web App URL)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               BACKEND SERVERLESS (Google Apps Script)        │
│   • Code.gs (Router de API REST)                            │
│   • auth.gs, clients.gs, services.gs, payments.gs           │
│   • billing.gs, scheduler.gs, reminders.gs, cancellations.gs │
│   • security.gs, sheets.gs, utils.gs                        │
│   • Disparador horario (Time-Driven Trigger cada hora)      │
└──────────────────────────────┬──────────────────────────────┘
                               │ SpreadsheetApp API
                               ▼
┌─────────────────────────────────────────────────────────────┐
│              BASE DE DATOS (Google Sheets)                  │
│   • _APP_CLIENTES          • _APP_SERVICIOS                 │
│   • _APP_PAGOS_CLIENTES    • _APP_PAGOS_PLATAFORMAS         │
│   • _APP_CUENTAS           • _APP_USUARIOS                  │
│   • _APP_HISTORIAL         • _APP_CONFIG                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Componentes del Backend (`Apps Script/`)

Cada archivo `.gs` tiene una responsabilidad única:

| Archivo | Responsabilidad |
|---------|-----------------|
| `Code.gs` | Enrutador principal de endpoints API REST (`doGet`, `doPost`) y configuración global. |
| `auth.gs` | Validación de credenciales para Carlos y su Esposa, emisión y verificación de sesiones. |
| `clients.gs` | CRUD maestro de clientes. Permite que múltiples clientes compartan un mismo WhatsApp. |
| `services.gs` | Gestión de suscripciones individuales, perfiles, PINs y estados. |
| `payments.gs` | Registro de pagos aplicando estrictamente la **Regla de 30 Días Fijos**. |
| `billing.gs` | Costos de cuentas matrices de plataformas y cálculos de ganancia neta. |
| `scheduler.gs` | Tarea programada por Google Triggers que se ejecuta cada hora de forma autónoma. |
| `reminders.gs` | Control del temporizador de 24h para clientes que prometieron pagar. |
| `cancellations.gs` | Control del temporizador de 36h para marcar pre-cancelaciones automáticas. |
| `sheets.gs` | Creación de esquemas `_APP_*` y migración segura de datos heredados. |
| `security.gs` | Funciones de cifrado de PINs (reversible) y hashing de contraseñas (SHA-256). |
| `utils.gs` | Helpers de fecha, relleno de IDs con ceros, formateo y registro en bitácora. |

---

## 3. Componentes del Frontend (`src/`)

```
src/
├── components/
│   ├── common/       # Badges de estado, modal de pago, botón WhatsApp
│   ├── mobile/       # Barra de navegación inferior móvil dedicada (BottomNav)
│   └── desktop/      # Barra lateral de escritorio e iPad (Sidebar)
├── layouts/          # Layout principal unificado
├── pages/            # Dashboard, Cobros, Clientes, Teléfonos, Cuentas, Facturación, Historial, Ajustes, Login
├── context/          # AuthContext para sincronización de sesión
├── hooks/            # Hooks reactivos (useServices, etc.)
├── services/         # api.ts con soporte dual (Mock Local + GAS en Vivo)
├── types/            # Definiciones de TypeScript
└── utils/            # Generadores de mensajes y URLs de WhatsApp
```
