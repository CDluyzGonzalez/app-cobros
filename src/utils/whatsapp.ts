export interface WhatsAppMessageParams {
  nombre: string;
  plataforma: string;
  fecha: string;
  valor: number;
  telefono: string;
}

/**
 * Determina el texto del día de vencimiento (ej: "hoy", "mañana", "15 de marzo")
 */
function formatExpirationDay(dateStr?: string): string {
  if (!dateStr) return 'hoy';
  const cleanDate = dateStr.split('T')[0];
  const parts = cleanDate.split('-');
  if (parts.length !== 3) return 'hoy';
  const [y, m, d] = parts.map(Number);
  const target = new Date(y, m - 1, d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diff <= 0) return 'hoy';
  if (diff === 1) return 'mañana';

  try {
    return target.toLocaleDateString('es-CO', { day: 'numeric', month: 'long' });
  } catch {
    return `${d.toString().padStart(2, '0')}/${m.toString().padStart(2, '0')}/${y}`;
  }
}

/**
 * Mensaje de cobro formal solicitado:
 * Hola {nombre}
 * 
 * Te escribo porque tu servicio de *{PLATAFORMA}* vence el día *{hoy/fecha}*.
 * 
 * El valor de la renovación es de *{valor}*.
 * ¿Deseas renovar?
 * 
 * Puedes realizar el pago y enviarme el comprobante por este medio.
 * 
 * ¡Gracias!
 */
export function generateCollectionMessage({
  nombre,
  plataforma,
  fecha,
  valor,
}: WhatsAppMessageParams): string {
  const formattedVal = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(valor || 0);

  const cleanName = (nombre || 'Cliente').trim();
  const plat = (plataforma || 'Servicio').toUpperCase().trim();
  const expDay = formatExpirationDay(fecha);

  return (
    `Hola ${cleanName} \n\n` +
    `Te escribo porque tu servicio de *${plat}* vence el día *${expDay}*.\n\n` +
    `El valor de la renovación es de *${formattedVal}*.\n` +
    `¿Deseas renovar?\n\n` +
    `Puedes realizar el pago y enviarme el comprobante por este medio.\n\n` +
    `¡Gracias!`
  );
}

/**
 * Mensaje para recordar después de 24h
 */
export function generateReminderMessage({
  nombre,
  plataforma,
  valor,
}: WhatsAppMessageParams): string {
  const formattedVal = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(valor || 0);

  const cleanName = (nombre || 'Cliente').trim();
  const plat = (plataforma || 'Servicio').toUpperCase().trim();

  return (
    `Hola ${cleanName} \n\n` +
    `Te recuerdo que tenemos pendiente el pago de la renovación de tu servicio de *${plat}* (*${formattedVal}*).\n\n` +
    `Por favor envíame el comprobante para poder confirmar y así continuar con el servicio.\n\n` +
    `¡Gracias!`
  );
}

/**
 * Genera la URL para abrir WhatsApp Web o App móvil
 */
export function createWhatsAppUrl(telefono: string, mensaje: string): string {
  const cleanPhone = (telefono || '').replace(/\D/g, '');
  const encodedMsg = encodeURIComponent(mensaje);

  if (cleanPhone) {
    // Si tiene 10 dígitos e inicia con 3 (móvil colombiano), anteponer 57
    const finalPhone = cleanPhone.length === 10 && cleanPhone.startsWith('3')
      ? `57${cleanPhone}`
      : cleanPhone;

    return `https://wa.me/${finalPhone}?text=${encodedMsg}`;
  }

  // Fallback si no tiene teléfono registrado
  return `https://api.whatsapp.com/send?text=${encodedMsg}`;
}
