import { db } from '../config/firebase.js';
import { hashPassword } from '../routes/auth.js';

async function createUser() {
  const now = new Date().toISOString();
  const userId = 'USR-MAYRETH';
  const email = 'mayreth96@gmail.com'.toLowerCase().trim();
  const rawPassword = 'Ivmatrhe#.';

  console.log(`⏳ Creando usuario para Mayreth D´Luyz (${email})...`);

  await db.collection('usuarios').doc(userId).set({
    nombre: 'Mayreth D´Luyz',
    email: email,
    password_hash: hashPassword(rawPassword),
    rol: 'ADMIN',
    activo: true,
    hora_notificacion: '07:00',
    created_at: now,
    updated_at: now,
  });

  console.log(`✅ ¡Usuario ${userId} creado exitosamente en Firestore!`);
  process.exit(0);
}

createUser().catch((err) => {
  console.error('❌ Error al crear usuario:', err);
  process.exit(1);
});