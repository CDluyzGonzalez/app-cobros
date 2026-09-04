import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const serviceAccountPath = path.resolve(__dirname, '../../serviceAccountKey.json');

if (fs.existsSync(serviceAccountPath)) {
  try {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id || process.env.GCP_PROJECT_ID || 'app-cobros-v2',
    });
    console.log('✅ Firebase inicializado con serviceAccountKey.json');
  } catch (error) {
    console.warn('⚠️ Error al leer serviceAccountKey.json, usando credenciales por defecto de Google Cloud:', error);
    admin.initializeApp({
      projectId: process.env.GCP_PROJECT_ID || 'app-cobros-v2',
    });
  }
} else {
  // En Google Cloud Run usa Application Default Credentials (ADC) automáticamente
  admin.initializeApp({
    projectId: process.env.GCP_PROJECT_ID || 'app-cobros-v2',
  });
  console.log('✅ Firebase inicializado con credenciales nativas de Google Cloud (ADC)');
}

export const db = admin.firestore();
export const messaging = admin.messaging();
export default admin;