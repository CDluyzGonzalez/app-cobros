import { api } from './api';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Sincroniza silenciosamente el token Push del dispositivo con Google Cloud y Apple APNs.
 * Se ejecuta al iniciar sesión o cargar la app si el usuario ya concedió permisos previamente.
 */
export async function syncPushSubscriptionSilently(userId?: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return false;
  if (Notification.permission !== 'granted') return false;

  try {
    const reg = await navigator.serviceWorker.ready;
    if (!reg || !reg.pushManager) return false;

    // Obtener llave pública actual del servidor
    const { publicKey } = await api.getVapidPublicKey();
    if (!publicKey) return false;

    let sub = await reg.pushManager.getSubscription();

    // Si no hay suscripción o si ha pasado tiempo, renovar/asegurar
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }

    if (sub) {
      await api.subscribePush(sub.toJSON(), userId);
      return true;
    }
  } catch (err) {
    console.warn('[PushSync] Sincronización en segundo plano omitida o no soportada:', err);
  }

  return false;
}
