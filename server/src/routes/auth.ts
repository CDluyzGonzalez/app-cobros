import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { db } from '../config/firebase.js';
import { DatabaseService } from '../services/database.js';
import { User } from '../types/index.js';

export const authRouter = Router();

// ── Gestiona el inicio de sesión seguro, la creación/cambio de contraseña y guarda el fcm_token y la hora preferida para las notificaciones diarias ─────────────────────────────────────────────────────

const JWT_SECRET = process.env.JWT_SECRET || 'app_cobros_secret_key_2026';

// Función hash compatible con la migración anterior (SHA-256)
function verifyOrHashPassword(password: string, storedHash: string): boolean {
  const hash = crypto.createHash('sha256').update(password + 'COBROS_APP_SALT_2026').digest('hex');
  return hash === storedHash || password === storedHash;
}

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'COBROS_APP_SALT_2026').digest('hex');
}

/**
 * POST /api/auth/login
 * Acceso directo sin configurar ninguna URL
 */
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Correo y contraseña requeridos' });
    }

    const usersSnap = await db.collection('usuarios')
      .where('email', '==', email.toLowerCase().trim())
      .get();

    if (usersSnap.empty) {
      return res.status(401).json({ success: false, message: 'Usuario no encontrado o inactivo' });
    }

    const userDoc = usersSnap.docs[0];
    const user = { id: userDoc.id, ...userDoc.data() } as User;

    if (!user.activo) {
      return res.status(403).json({ success: false, message: 'Usuario desactivado' });
    }

    if (!verifyOrHashPassword(password, user.password_hash)) {
      return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, nombre: user.nombre, rol: user.rol },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    await DatabaseService.logHistory('AUTH', user.id, 'LOGIN', `Inicio de sesión exitoso: ${user.nombre}`, user.nombre);

    res.json({
      success: true,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        hora_notificacion: user.hora_notificacion || '07:00',
      },
      token,
    });
  } catch (error: any) {
    console.error('Error en /login:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PUT /api/auth/preferences
 * Guarda la hora elegida para las notificaciones diarias y el token de PWA push
 */
authRouter.put('/preferences', async (req: Request, res: Response) => {
  try {
    const { userId, hora_notificacion, fcm_token } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId requerido' });
    }

    const updateData: any = { updated_at: new Date().toISOString() };
    if (hora_notificacion) updateData.hora_notificacion = hora_notificacion;
    if (fcm_token) updateData.fcm_token = fcm_token;

    await db.collection('usuarios').doc(userId).update(updateData);

    res.json({ success: true, message: 'Preferencias guardadas correctamente.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/auth/reset-password
 * Restablece la contraseña de un usuario usando la Clave Maestra de Seguridad
 */
authRouter.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { email, masterKey, newPassword } = req.body;
    const MASTER_KEY = process.env.MASTER_RECOVERY_KEY;

    if (!MASTER_KEY) {
      return res.status(500).json({ success: false, message: 'Clave Maestra no configurada en el servidor.' });
    }

    if (!email || !masterKey || !newPassword) {
      return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios' });
    }

    if (masterKey.trim() !== MASTER_KEY) {
      return res.status(401).json({ success: false, message: 'Clave Maestra de Seguridad incorrecta' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }

    const usersSnap = await db.collection('usuarios')
      .where('email', '==', email.toLowerCase().trim())
      .get();

    if (usersSnap.empty) {
      return res.status(404).json({ success: false, message: 'No existe una cuenta registrada con este correo' });
    }

    const userDoc = usersSnap.docs[0];
    const newHash = hashPassword(newPassword);

    await db.collection('usuarios').doc(userDoc.id).update({
      password_hash: newHash,
      updated_at: new Date().toISOString(),
    });

    await DatabaseService.logHistory(
      'AUTH',
      userDoc.id,
      'PASSWORD_RESET',
      'Contraseña restablecida exitosamente con clave maestra',
      email
    );

    res.json({ success: true, message: '¡Contraseña restablecida con éxito! Ya puedes iniciar sesión.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});