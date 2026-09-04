import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { cobrosRouter } from './routes/cobros.js';
import { crudRouter } from './routes/crud.js';
import { authRouter } from './routes/auth.js';
import { notificationsRouter } from './routes/notifications.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Configuración de CORS para permitir tu frontend local y en la nube
app.use(cors({
  origin: true, // Permite localhost:3000, Vite y los dominios de Firebase/Vercel
  credentials: true,
}));

app.use(express.json());

// Ruta de estado de salud (Healthcheck)
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'App Cobros V2 API',
  });
});

// Registrar rutas de la API
app.use('/api/auth', authRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api', cobrosRouter);
app.use('/api', crudRouter);

// Manejo de rutas no encontradas
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Ruta no encontrada' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 Servidor App Cobros V2 escuchando en:`);
  console.log(`👉 http://localhost:${PORT}`);
  console.log(`👉 Health check: http://localhost:${PORT}/health`);
  console.log(`=========================================`);
});