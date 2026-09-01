# ⚖️ Reglas de Negocio del Sistema

Este documento describe las reglas inamovibles del negocio implementadas tanto en el backend (`Apps Script/`) como en el frontend (`src/`).

---

## 1. Regla Inamovible de los 30 Días Fijos

> **Principio:** El ciclo de cobro de un servicio se calcula SIEMPRE a partir de la `fecha_proximo_pago` anterior + 30 días exactos, **NUNCA** a partir de la fecha real en que el cliente hizo la transferencia.

### Ejemplo Práctico:
- Fecha de vencimiento programada: **31 de Agosto**
- El cliente paga con demora el: **03 de Septiembre**
- Próximo vencimiento calculado por la app: **30 de Septiembre** *(31 de Agosto + 30 días)*.
- **PROHIBIDO:** Calcular el vencimiento como `03 de Septiembre + 30 días = 03 de Octubre`. Si se hiciera esto, el cliente ganaría días gratis por pagar tarde.

### Implementación en código (`payments.gs`):
```javascript
var currentNextDate = srv[8] ? new Date(srv[8]) : now;
var newNextDate     = new Date(currentNextDate.getTime());
newNextDate.setDate(newNextDate.getDate() + 30);
```

---

## 2. Flujo de Estados y Ciclo 24h / 36h

```
┌─────────────────┐
│     ACTIVO      │ ── (Vence en ≤3 días) ──▶ ┌───────────────┐
└─────────────────┘                           │  POR_VENCER   │
         ▲                                    └───────┬───────┘
         │                                            │ (Fecha hoy o pasada)
         │ (Registra Pago)                            ▼
         │                                    ┌───────────────┐
         ├─────────────────────────────────── │    VENCIDO    │
         │                                    └───────┬───────┘
         │                                            │
         │                                     [💬 Enviar Cobro]
         │                                            │
         │                                            ▼
         │                                    ┌───────────────────────┐
         │                                    │    PAGO_PENDIENTE     │
         │                                    │  (Cliente dijo "SÍ")  │
         │                                    └───────────┬───────────┘
         │                                                │
         │                                      (Transcurren 24 Horas
         │                                       sin comprobante)
         │                                                │
         │                                                ▼
         │                                    ┌───────────────────────┐
         │                                    │  RECORDATORIO_ENVIADO │
         │                                    │ (Mensaje de seguimiento)
         │                                    └───────────┬───────────┘
         │                                                │
         │                                      (Transcurren 12 Horas
         │                                       adicionales / 36h total)
         │                                                │
         │                                                ▼
         │                                    ┌───────────────────────┐
         │                                    │ CANCELACION_PENDIENTE │
         │                                    │  (Alerta en Dashboard)│
         │                                    └───────────┬───────────┘
         │                                                │
         │                                                │ (Decisión MANUAL
         │                                                │  Carlos o Esposa)
         │                                                ▼
         └─────────────────────────────────── ┌───────────────────────┐
                                              │       CANCELADO       │
                                              │  (Cupo liberado)      │
                                              └───────────────────────┘
```

---

## 3. Regla de Cancelación Manual Obligatoria

> **Principio:** La aplicación **NUNCA cancela un servicio automáticamente**. 

Al cumplirse las 36 horas, el servicio pasa a `CANCELACION_PENDIENTE` y se muestra un banner de alta prioridad en el Dashboard. Carlos o su Esposa deben pulsar el botón de confirmación manual para pasarlo a `CANCELADO`. Esto evita desconectar accidentalmente a clientes especiales o con arreglos previos de pago.

---

## 4. Multi-Servicio (Descomposición de Combos)

- Si un cliente tiene contratados Netflix, Disney y Spotify:
  - Se registra **1 único cliente** en `_APP_CLIENTES`.
  - Se crean **3 servicios independientes** en `_APP_SERVICIOS`, todos apuntando al mismo `cliente_id`.
  - Cada servicio tiene su propio ciclo, fecha de cobro y perfil independiente.

---

## 5. Números de Teléfono Compartidos

- El campo `telefono` en `_APP_CLIENTES` contiene el número de WhatsApp con formato internacional (ej. `+573001234567`).
- **Un mismo número de teléfono puede asignarse a múltiples clientes** (ej. familiares, amigos o clientes referidos que pagan por la misma persona).
