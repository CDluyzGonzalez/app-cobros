{/*configuraciones de usuario*/}

import React, { useState } from 'react';
import {
  Settings,
  Bell,
  CheckCircle2,
  Clock,
  Cloud,
  UserCheck,
  Smartphone,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [notificationTime, setNotificationTime] = useState(user?.hora_notificacion || '07:00');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [pushStatus, setPushStatus] = useState<string>('');

  const handleSaveNotificationTime = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await api.updatePreferences(user.id, { hora_notificacion: notificationTime });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert('Error guardando hora: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

  const handleRequestPushPermission = async () => {
    if (!('Notification' in window)) {
      setPushStatus('Este navegador no soporta notificaciones push.');
      return;
    }

    try {
      setPushStatus('Solicitando permiso a iOS...');
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setPushStatus('❌ Permiso denegado por el navegador. Ve a Ajustes > Notificaciones en tu dispositivo.');
        return;
      }

      setPushStatus('Conectando con Google Cloud y Apple APNs...');

      // 1. Obtener la llave pública VAPID del servidor
      const { publicKey } = await api.getVapidPublicKey();

      // 2. Obtener el service worker activo
      if (!('serviceWorker' in navigator)) {
        setPushStatus('Service Worker no disponible.');
        return;
      }

      const reg = await navigator.serviceWorker.ready;

      // 3. Suscribir el dispositivo al servicio push oficial de Apple / Google
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }

      // 4. Guardar la suscripción en Firestore a través de la API
      await api.subscribePush(sub.toJSON(), user?.id);

      setPushStatus('✅ ¡iPhone vinculado exitosamente con Google Cloud y Apple APNs!');
    } catch (err: any) {
      console.error(err);
      setPushStatus('Error al activar alertas: ' + err.message);
    }
  };

  const [countdown, setCountdown] = useState<number | null>(null);

  const handleSendRemoteTest = async (delaySeconds = 0) => {
    try {
      if (delaySeconds > 0) {
        setPushStatus(`⏳ Servidor esperando ${delaySeconds}s en la nube... ¡BLOQUEA TU IPHONE AHORA!`);
        setCountdown(delaySeconds);
        let count = delaySeconds;
        const timer = setInterval(() => {
          count--;
          if (count > 0) {
            setCountdown(count);
          } else {
            clearInterval(timer);
            setCountdown(null);
            setPushStatus('📡 Señal enviada por Google Cloud a Apple. Debe sonar y encender la pantalla en breve.');
          }
        }, 1000);
      } else {
        setPushStatus('Enviando alerta remota desde la nube...');
      }

      const res = await api.sendTestNotification(user?.id, delaySeconds);
      if (!delaySeconds) {
        setPushStatus(res.message || 'Alerta remota enviada.');
      }
    } catch (err: any) {
      setPushStatus('Error enviando prueba remota: ' + err.message);
      setCountdown(null);
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-emerald-400" /> Configuración del Sistema
        </h2>
        <p className="text-xs text-slate-400">
          Personaliza tus alertas de cobro y revisa el estado de tu nube en Google Cloud.
        </p>
      </div>

      {/* Usuario Activo */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-950/80 text-emerald-400 flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{user?.nombre || 'Administrador'}</h3>
            <p className="text-xs text-slate-400">{user?.email}</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold">
          {user?.rol || 'ADMIN'}
        </span>
      </div>

      {/* Selector de Hora para Notificaciones Diarias */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-950/80 text-amber-400 flex items-center justify-center">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Notificaciones Diarias de Cobro</h3>
            <p className="text-xs text-slate-400">Elige la hora exacta en que deseas recibir el resumen diario en tu celular.</p>
          </div>
        </div>

        <form onSubmit={handleSaveNotificationTime} className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative w-full sm:w-48">
              <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="time"
                value={notificationTime}
                onChange={(e) => setNotificationTime(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs transition-all shadow-md shadow-emerald-950 cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar Hora Preferida'}
            </button>
          </div>

          {savedSuccess && (
            <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 pt-1">
              <CheckCircle2 className="w-4 h-4" /> Hora de notificación actualizada a las {notificationTime}.
            </p>
          )}
        </form>

        <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Smartphone className="w-4 h-4 text-indigo-400" />
            <span>Permiso de Notificaciones en este dispositivo:</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleRequestPushPermission}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs transition-all shadow-md shadow-indigo-950 cursor-pointer"
            >
              🔔 Activar Alertas en este equipo
            </button>
            <button
              onClick={() => handleSendRemoteTest(0)}
              className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 font-medium rounded-lg text-xs transition-colors cursor-pointer"
            >
              ⚡ Alerta Inmediata
            </button>
            <button
              onClick={() => handleSendRemoteTest(5)}
              disabled={countdown !== null}
              className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 font-medium rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {countdown !== null ? `⏳ ¡Bloquea tu iPhone ya! (${countdown}s)...` : '🚀 Probar Remoto en 5s (Bloquea celular)'}
            </button>
          </div>
        </div>
        {pushStatus && <p className="text-xs text-slate-300">{pushStatus}</p>}
      </div>

      {/* Estado de la Nube */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-950/80 text-cyan-400 flex items-center justify-center">
            <Cloud className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Infraestructura Google Cloud</h3>
            <p className="text-xs text-slate-400">Proyecto: <span className="font-mono text-slate-200 font-semibold">app-cobros-v2</span> (Always Free)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2">
          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80">
            <span className="text-slate-400">Base de Datos:</span>
            <p className="font-bold text-emerald-400 mt-0.5">Google Cloud Firestore (3FN)</p>
          </div>
          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80">
            <span className="text-slate-400">Backend API:</span>
            <p className="font-bold text-emerald-400 mt-0.5">Cloud Run (min-instances = 0)</p>
          </div>
        </div>
      </div>
      {/* Opción de Descargar e Instalar App */}
        <div className="p-5 bg-slate-900 border border-emerald-500/30 rounded-3xl space-y-3 shadow-md">
          <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-950/80 text-emerald-400 flex items-center justify-center">
        <Smartphone className="w-4 h-4" />
        </div>
        <div>
        <h3 className="text-sm font-bold text-white">Instalar App en el Celular</h3>
        <p className="text-xs text-slate-400">Agrega el icono directo a tu pantalla de inicio como una aplicación nativa.</p>
        </div>
        </div>
          <button
            type="button"
            onClick={() => {
        // Disparar evento para abrir modal
            window.dispatchEvent(new CustomEvent('open-install-modal'));
          }}
        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer"
      >
        Instalar
    </button>
  </div>
</div>
    </div>
  );
};