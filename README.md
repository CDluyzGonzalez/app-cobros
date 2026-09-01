# 🚀 App Cobros - Sistema de Gestión de Suscripciones y Facturación

Un sistema web centralizado diseñado para gestionar suscripciones, automatizar el control de cobros, registrar pagos y enviar notificaciones directas por WhatsApp a los clientes.

---

## 🛠️ Tecnologías Utilizadas

* **Frontend:** React 18, TypeScript, Vite, Tailwind CSS
* **Backend / API:** Google Apps Script (GAS) — *Arquitectura Serverless*
* **Base de Datos:** Google Sheets (Estructura en 3FN)
* **Notificaciones:** API de redirección WhatsApp (`wa.me`)
* **Automatización:** Triggers programados en Google Cloud Platform

---

## ✨ Funcionalidades Principales

* 👥 **Gestión de Clientes y Suscripciones:** Registro, edición y control de estados activos/inactivos.
* 💳 **Control de Cobros:** Seguimiento en tiempo real de pagos pendientes, próximos a vencer y vencidos.
* 📩 **Integración con WhatsApp:** Generación automática de mensajes personalizados y recibos de pago.
* 📊 **Base de Datos Ligera y Normalizada:** Persistencia en Google Sheets bajo la Tercera Forma Normal (3FN).
* ⏰ **Automatizaciones Programadas:** Revisa diariamente vencimientos para actualizar los estados del sistema.

---

## 📐 Arquitectura del Sistema (Modelo C4)

### Nivel 1: Diagrama de Contexto
```mermaid
---
config:
  theme: default
  themeVariables:
    fontFamily: "sans-serif"
---
graph TD
    classDef user fill:#2B6CB0,stroke:#2C5282,color:#FFFFFF,stroke-width:2px;
    classDef system fill:#0D9488,stroke:#0F766E,color:#FFFFFF,stroke-width:2px;
    classDef external fill:#4A5568,stroke:#2D3748,color:#FFFFFF,stroke-width:2px;

    Client[👤 Cliente / Suscriptor]:::user
    Admin[👤 Administrador / Cobrador]:::user
    
    System[🚀 App Cobros<br><i>Sistema de Gestión de Suscripciones y Facturación</i>]:::system
    
    WhatsApp[💬 WhatsApp Web / App<br><i>Plataforma de Mensajería</i>]:::external
    Spreadsheet[📊 Google Sheets<br><i>Base de Datos Oculta</i>]:::external

    Admin -->|Gestiona clientes, suscripciones, cobros y usuarios| System
    System -->|Envía recordatorios y recibos de pago| Client
    System -->|Genera enlaces wa.me con mensajes formateados| WhatsApp
    System -->|Lee y persiste datos de forma normalizada 3FN| Spreadsheet

    linkStyle default stroke:#4A5568,stroke-width:2px;

### Nivel 1: Diagrama de Contenedores
---
config:
  theme: default
  themeVariables:
    fontFamily: "sans-serif"
---
graph TB
    subgraph ClientSide["💻 Cliente (Frontend / Navegador)"]
        SPA["<b>Single Page Application</b><br><i>React 18, TypeScript, Vite, Tailwind CSS</i><br><br>Interfaz gráfica responsiva para administrar clientes, servicios, cobros e historial."]
    end

    subgraph GoogleEcosystem["☁️ Google Cloud & Workspace Infrastructure"]
        GAS["<b>API RESTful / Apps Script</b><br><i>Google Apps Script (GAS)</i><br><br>Endpoints GET/POST, lógica de negocio, JOINs en memoria, autenticación SHA-256."]
        
        Triggers["<b>Schedulers / Triggers</b><br><i>Google Apps Script Triggers</i><br><br>Automatización diaria para verificación de vencimientos de servicios."]
        
        GSheets[("<b>Base de Datos Persistente</b><br><i>Google Sheets (Hojas _APP_*)</i><br><br>Estructura 3FN: Usuarios, Clientes, Plataformas, Cuentas, Servicios, Pagos e Historial.")]
    end

    subgraph ExternalServices["📱 Servicios Externos"]
        WA["<b>WhatsApp Gateway</b><br><i>api.whatsapp.com / wa.me</i><br><br>Redirección con plantillas preformateadas para notificaciones."]
    end

    SPA -->|Peticiones HTTP / JSON via fetch| GAS
    SPA -->|Abre enlaces con mensajes dinámicos| WA
    Triggers -->|Ejecuta revisiones programadas| GAS
    GAS -->|Lectura y Escritura CRUD| GSheets

    classDef frontend fill:#3182CE,stroke:#2B6CB0,color:#FFFFFF,stroke-width:2px;
    classDef backend fill:#0D9488,stroke:#0F766E,color:#FFFFFF,stroke-width:2px;
    classDef db fill:#D97706,stroke:#B45309,color:#FFFFFF,stroke-width:2px;
    classDef ext fill:#4A5568,stroke:#2D3748,color:#FFFFFF,stroke-width:2px;

    class SPA frontend;
    class GAS,Triggers backend;
    class GSheets db;
    class WA ext;

⚡ Instalación y Configuración Local

1. Clonar el repositorio:
   ```bash
   git clone [https://github.com/TU-USUARIO/app-cobros.git](https://github.com/TU-USUARIO/app-cobros.git)
cd app-cobros
   ```
2. Instalar dependencias de Node.js:
   ```bash
npm install
   ```
3. Variables de entorno:
Crea un archivo .env en la raíz del proyecto y añade la URL de tu API de Apps Script:
   ```bash
   VITE_API_URL=[https://script.google.com/macros/s/TU_SCRIPT_ID/exec](https://script.google.com/macros/s/TU_SCRIPT_ID/exec)
   ```
4. Iniciar el entorno de desarrollo local:
   ```bash
npm run dev
   ```
5. Abrir la aplicación en tu navegador:
   ```bash
open http://localhost:3000
   ```

👤 Autor
Carlos D´ Luyz

Ingeniero de Sistemas en formación · Desarrollador Web

🔗 LinkedIn: [Carlos D´ Luyz](https://www.linkedin.com/in/carlosdluyz/)