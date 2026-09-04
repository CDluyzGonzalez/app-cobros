// este es un script de migración de datos de la base de datos de  sheets a firestore, se ejecuta una sola vez y luego se elimina

import dotenv from 'dotenv';
import { db } from '../config/firebase.js';
import { hashPassword } from '../routes/auth.js';
import { formatDateIso } from '../utils/dates.js';

dotenv.config();

const GAS_URL = process.env.GAS_URL;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

async function requestGas(action: string, payload: any = {}) {
  const res = await fetch(GAS_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, ...payload }),
  });
  const json: any = await res.json();
  if (!json.success) throw new Error(json.error || `Error en acción ${action}`);
  return json.data;
}

async function runMigration() {
  console.log('====================================================');
  console.log('🚀 INICIANDO MIGRACIÓN: Google Sheets ➔ Cloud Firestore');
  console.log('====================================================');

  if (!GAS_URL || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error('Faltan configurar GAS_URL, ADMIN_EMAIL o ADMIN_PASSWORD en server/.env');
  }

  // 1. Iniciar sesión en Apps Script para obtener token
  console.log(`🔑 Autenticando con Google Apps Script (${ADMIN_EMAIL})...`);
  const loginData = await requestGas('login', { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  const token = loginData.token;
  console.log('✅ Autenticación exitosa.');

  // 2. Descargar toda la base de datos de Sheets
  console.log('📦 Descargando datos desde Google Sheets...');
  const appData = await requestGas('get_app_data', { token });
  const { clients = [], accounts = [], services = [], platformPayments = [] } = appData;

  console.log(`📋 Registros encontrados:`);
  console.log(`   - Clientes: ${clients.length}`);
  console.log(`   - Cuentas Matrices: ${accounts.length}`);
  console.log(`   - Servicios Contratados: ${services.length}`);
  console.log(`   - Facturas a Plataformas: ${platformPayments.length}`);
  console.log('----------------------------------------------------');

  const now = new Date().toISOString();

  // 3. Migrar Clientes
  console.log('⏳ Migrando Clientes a Firestore...');
  for (const c of clients) {
    await db.collection('clientes').doc(c.id).set({
      nombre: c.nombre || '',
      telefono: c.telefono || '',
      correo: c.correo || '',
      notas: c.notas || '',
      estado: c.estado || 'ACTIVO',
      created_at: c.created_at || now,
      updated_at: c.updated_at || now,
      version: 1,
    });
  }
  console.log(`✅ ${clients.length} clientes migrados.`);

  // 4. Migrar Cuentas Matrices
  console.log('⏳ Migrando Cuentas Matrices a Firestore...');
  for (const a of accounts) {
    await db.collection('cuentas').doc(a.id).set({
      plataforma: a.plataforma || '',
      correo_cuenta: a.correo_cuenta || '',
      password_encrypted: a.password_encrypted || '',
      perfiles_totales: Number(a.perfiles_totales) || 1,
      cupos_ocupados: Number(a.cupos_ocupados) || 0,
      costo_mensual: Number(a.costo_mensual) || 0,
      dia_pago_plataforma: a.dia_pago_plataforma || '',
      estado: a.estado || 'ACTIVA',
      notas: a.notas || '',
      created_at: a.created_at || now,
      updated_at: a.updated_at || now,
    });
  }
  console.log(`✅ ${accounts.length} cuentas matrices migradas.`);

  // 5. Migrar Servicios con cálculo automático de día_ancla
  console.log('⏳ Migrando Servicios y calculando Día Ancla Fijo...');
  for (const s of services) {
    const nextDate = s.fecha_proximo_pago ? s.fecha_proximo_pago.split('T')[0] : formatDateIso(new Date());
    // Se calcula el día ancla directamente de su fecha de vencimiento actual
    const diaAncla = Number(nextDate.split('-')[2]) || 1;

    await db.collection('servicios').doc(s.id).set({
      cliente_id: s.cliente_id,
      cuenta_id: s.cuenta_id || '',
      perfil: s.perfil || '',
      pin_encrypted: s.pin_encrypted || '',
      valor: Number(s.valor) || 0,
      dia_ancla: diaAncla,
      fecha_inicio: nextDate,
      fecha_ultimo_pago: s.fecha_ultimo_pago ? s.fecha_ultimo_pago.split('T')[0] : '',
      fecha_proximo_pago: nextDate,
      fecha_cambio_estado: s.fecha_cambio_estado || now,
      estado: s.estado || 'ACTIVO',
      notas: s.notas || '',
      created_at: s.created_at || now,
      updated_at: s.updated_at || now,
      version: 1,
    });
  }
  console.log(`✅ ${services.length} servicios migrados con su Día Ancla Fijo.`);

  // 6. Migrar Costos / Pagos a Plataformas
  console.log('⏳ Migrando Facturación y Costos de Plataformas...');
  for (const p of platformPayments) {
    const limitDate = p.fecha_limite ? p.fecha_limite.split('T')[0] : '';
    await db.collection('pagos_plataformas').doc(p.id).set({
      cuenta_id: p.cuenta_id || '',
      concepto: p.concepto || '',
      valor: Number(p.valor) || 0,
      fecha_limite: limitDate,
      fecha_pago_real: p.fecha_pago_real ? p.fecha_pago_real.split('T')[0] : '',
      estado: p.estado || 'PENDIENTE',
      notas: p.notas || '',
      usuario_registro: p.usuario_registro || 'Migración',
      created_at: p.created_at || now,
    });
  }
  console.log(`✅ ${platformPayments.length} pagos de plataformas migrados.`);

  // 7. Asegurar creación de Usuarios Administradores (Carlos y Esposa)
  console.log('⏳ Creando usuarios en Firestore...');
  const usersSnap = await db.collection('usuarios').get();
  if (usersSnap.empty) {
    // Usuario Carlos
    await db.collection('usuarios').doc('USR-CARLOS').set({
      nombre: loginData.user ? loginData.user.nombre : 'Carlos',
      email: ADMIN_EMAIL.toLowerCase().trim(),
      password_hash: hashPassword(ADMIN_PASSWORD),
      rol: 'ADMIN',
      activo: true,
      hora_notificacion: '07:00',
      created_at: now,
      updated_at: now,
    });

    console.log(`👤 Usuario Administrador (${ADMIN_EMAIL}) creado.`);
  }

  console.log('====================================================');
  console.log('🎉 ¡MIGRACIÓN COMPLETADA CON ÉXITO TOTAL!');
  console.log('====================================================');
  process.exit(0);
}

runMigration().catch((err) => {
  console.error('❌ Error durante la migración:', err);
  process.exit(1);
});