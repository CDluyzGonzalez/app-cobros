# 📊 Modelo de Datos Normalizado - Google Sheets (`_APP_*`) (3FN)

El sistema utiliza hojas con prefijo `_APP_` para aislar la base de datos de cualquier hoja existente o de usuario, estructurado bajo la **Tercera Forma Normal (3FN)** con cruces (*JOINs*) en memoria en la capa de backend (Apps Script).

---

## 1. `_APP_USUARIOS` (Acceso al Sistema)

Almacena los usuarios autorizados (Carlos y Esposa) con contraseñas hasheadas.

| Columna | Tipo | Descripción | Ejemplo |
|---------|------|-------------|---------|
| `id` | String (PK) | Identificador de usuario | `USR-001` |
| `nombre` | String | Nombre visible | `Carlos` |
| `email` | String | Correo para iniciar sesión | `carlos@cobros.app` |
| `password_hash`| String | SHA-256 con salt interno | `a665a45920422f9d417e...` |
| `rol` | String | Nivel de permisos (`ADMIN` / `OPERADOR`) | `ADMIN` |
| `activo` | Boolean | Estado de cuenta | `TRUE` |
| `created_at` | ISO Date | Fecha de creación | `2026-08-31T12:00:00.000Z` |
| `updated_at` | ISO Date | Fecha de última modificación | `2026-08-31T12:00:00.000Z` |

---

## 2. `_APP_PLATAFORMAS` (Catálogo Maestro)

Catálogo único de plataformas y servicios para evitar errores tipográficos o inconsistencias.

| Columna | Tipo | Descripción | Ejemplo |
|---------|------|-------------|---------|
| `id` | String (PK) | Código único | `PLA-NETFLIX` |
| `nombre` | String | Nombre oficial | `Netflix` |
| `perfiles_estandar` | Number | Capacidad de perfiles estándar | `5` |
| `precio_sugerido` | Number | Precio base de reventa | `25000` |
| `activo` | Boolean | Estado | `TRUE` |
| `created_at` | ISO Date | Creación | `2026-08-31T12:00:00.000Z` |

---

## 3. `_APP_CLIENTES` (Directorio Maestro de Clientes)

Cada registro representa a una persona única.

| Columna | Tipo | Descripción | Ejemplo |
|---------|------|-------------|---------|
| `id` | String (PK) | Identificador único de cliente | `CLI-00001` |
| `nombre` | String | Nombre completo del cliente | `Walter Gómez` |
| `telefono` | String | Número de WhatsApp (con cód. país) | `+573001234567` |
| `correo` | String | Correo personal opcional | `walter@gmail.com` |
| `notas` | String | Observaciones del cliente | `Paga puntual` |
| `estado` | String | Estado del cliente (`ACTIVO`, `INACTIVO`)| `ACTIVO` |
| `created_at` | ISO Date | Fecha de registro | `2026-08-31T12:00:00.000Z` |
| `updated_at` | ISO Date | Fecha de actualización | `2026-08-31T12:00:00.000Z` |
| `updated_by` | String | Usuario que hizo el cambio | `Carlos` |
| `version` | Number | Control de concurrencia optimista | `1` |

---

## 4. `_APP_CUENTAS` (Cuentas Matrices)

Cuentas principales contratadas con los proveedores de streaming.

| Columna | Tipo | Descripción | Ejemplo |
|---------|------|-------------|---------|
| `id` | String (PK) | Identificador de cuenta | `ACC-00001` |
| `plataforma` | String | Nombre de la plataforma | `Netflix` |
| `correo_cuenta`| String | Correo de acceso a la plataforma | `carlos_netflix1@gmail.com` |
| `password_encrypted` | String | Clave cifrada | `U0VDL...` |
| `perfiles_totales` | Number | Capacidad de perfiles | `5` |
| `cupos_ocupados` | Number | Perfiles en uso (calculado) | `4` |
| `costo_mensual` | Number | Costo mensual de la cuenta | `64700` |
| `dia_pago_plataforma` | String | Día del mes en que renueva | `15` |
| `estado` | String | `ACTIVA`, `EN_REVISION`, `CANCELADA` | `ACTIVA` |
| `notas` | String | Notas técnicas | `Tarjeta Bancolombia` |
| `created_at` | ISO Date | Creación | `2026-08-31T12:00:00.000Z` |
| `updated_at` | ISO Date | Modificación | `2026-08-31T12:00:00.000Z` |

---

## 5. `_APP_SERVICIOS` (Suscripciones Contratadas - 3FN)

Representa cada plataforma/perfil asignado a un cliente. No guarda redundancias de cliente ni de cuenta; se ensamblan por clave foránea (`FK`).

| Columna | Tipo | Descripción | Ejemplo |
|---------|------|-------------|---------|
| `id` | String (PK) | Identificador único de servicio | `SRV-00001` |
| `cliente_id` | String (FK) | ID del cliente en `_APP_CLIENTES` | `CLI-00001` |
| `cuenta_id` | String (FK) | Cuenta matriz asignada en `_APP_CUENTAS` | `ACC-00001` |
| `perfil` | String | Nombre o número de perfil | `Perfil 2` |
| `pin_encrypted` | String | PIN cifrado con clave reversible | `U0VDL...` |
| `valor` | Number | Monto mensual que paga el cliente | `15000` |
| `fecha_ultimo_pago` | Date | Fecha en que pagó por última vez | `2026-08-01` |
| `fecha_proximo_pago` | Date | Fecha fija del próximo vencimiento (+30 días) | `2026-08-31` |
| `fecha_cambio_estado` | Date | Fecha/Hora del último cambio de estado| `2026-08-31T09:00:00.000Z` |
| `estado` | String | Estado del ciclo de cobro | `ACTIVO`, `VENCIDO`, etc. |
| `notas` | String | Notas operativas | `Perfil con candado` |
| `created_at` | ISO Date | Creación | `2026-08-31T12:00:00.000Z` |
| `updated_at` | ISO Date | Modificación | `2026-08-31T12:00:00.000Z` |
| `updated_by` | String | Operador | `Esposa` |
| `version` | Number | Versión | `1` |

---

## 6. `_APP_PAGOS_CLIENTES` (Historial de Pagos de Clientes)

Registro inmutable de cada transacción cobrada.

| Columna | Tipo | Descripción | Ejemplo |
|---------|------|-------------|---------|
| `id` | String (PK) | Identificador de pago | `PAY-00001` |
| `servicio_id` | String (FK) | Servicio renovado en `_APP_SERVICIOS` | `SRV-00001` |
| `valor` | Number | Monto recibido | `15000` |
| `fecha_pago_real` | Date | Fecha real en que pagó | `2026-09-02` |
| `fecha_ciclo_anterior` | Date | Fecha de vencimiento antes del pago | `2026-08-31` |
| `fecha_ciclo_siguiente` | Date | Fecha de nuevo vencimiento (+30 días)| `2026-09-30` |
| `metodo_pago` | String | Nequi, Daviplata, Bancolombia, etc. | `Nequi` |
| `comprobante_ref` | String | Referencia de transferencia | `NEQ-98124` |
| `usuario_registro` | String | Quién validó el pago | `Carlos` |
| `created_at` | ISO Date | Fecha/hora del registro | `2026-09-02T14:30:00.000Z` |

---

## 7. `_APP_PAGOS_PLATAFORMAS` (Costos Operativos - 3FN)

Registros de facturación mensual que Carlos paga a proveedores, plataformas o servicios fijos (Movistar, iCloud, Netflix, etc.).

| Columna | Tipo | Descripción | Ejemplo |
|---------|------|-------------|---------|
| `id` | String (PK) | Identificador de costo | `PLA-00001` |
| `cuenta_id` | String (FK) | Cuenta asociada en `_APP_CUENTAS` (o vacío si es gasto operativo general) | `ACC-00001` |
| `concepto` | String | Descripción del gasto | `Plan Movistar 500MB` |
| `valor` | Number | Monto pagado o por pagar | `65000` |
| `fecha_limite` | Date | Fecha máxima de pago | `2026-09-15` |
| `fecha_pago_real` | Date | Fecha en que se pagó | `2026-09-14` |
| `estado` | String | `PENDIENTE`, `PAGADO` | `PENDIENTE` |
| `notas` | String | Comentarios adicionales | `Pago por PSE` |
| `usuario_registro` | String | Usuario que registró | `Carlos` |
| `created_at` | ISO Date | Timestamp | `2026-09-14T10:00:00.000Z` |

---

## 8. `_APP_HISTORIAL` (Bitácora de Auditoría)

Registro cronológico inmutable de todas las acciones del sistema.

| Columna | Descripción |
|---------|-------------|
| `id` | `HIS-XXXXXXXXXX` |
| `entidad` | `SERVICIOS`, `CLIENTES`, `PAGOS`, `FACTURACION`, `CUENTAS`, `AUTH`, `SCHEDULER` |
| `entidad_id` | ID del registro afectado |
| `accion` | `REGISTRAR_PAGO`, `CAMBIO_ESTADO`, `CREAR`, `ACTUALIZAR`, `ELIMINAR` |
| `descripcion`| Detalle explicativo de la operación |
| `usuario` | Nombre de quien ejecutó la acción (Carlos, Esposa o Sistema) |
| `datos_previos` | Snapshot anterior |
| `datos_nuevos` | Snapshot nuevo |
| `created_at` | Timestamp ISO |
