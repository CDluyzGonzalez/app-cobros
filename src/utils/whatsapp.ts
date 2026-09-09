export interface ServiceItemSummary {
  plataforma: string;
  valor?: number;
  estado?: string;
}

export interface WhatsAppMessageParams {
  nombre: string;
  plataforma?: string;
  fecha?: string;
  valor?: number;
  telefono?: string;
  servicios?: ServiceItemSummary[];
}

/**
 * Formatea una lista de plataformas para el mensaje:
 * - 1 plataforma: "DISNEY+"
 * - 2 plataformas: "DISNEY+ y DGO"
 * - 3+ plataformas: "DISNEY+, DGO y NETFLIX"
 * - Repetidas: "NETFLIX (2)"
 */
export function formatPlatformsList(platforms: string[]): string {
  const validPlatforms = (platforms || []).map((p) => (p || '').trim()).filter(Boolean);
  if (validPlatforms.length === 0) return 'SERVICIO';

  const counts = new Map<string, number>();
  validPlatforms.forEach((p) => {
    const upper = p.toUpperCase();
    counts.set(upper, (counts.get(upper) || 0) + 1);
  });

  const formattedItems: string[] = [];
  counts.forEach((count, name) => {
    if (count > 1) {
      formattedItems.push(`${name} (${count})`);
    } else {
      formattedItems.push(name);
    }
  });

  if (formattedItems.length === 1) {
    return formattedItems[0];
  }
  if (formattedItems.length === 2) {
    return `${formattedItems[0]} y ${formattedItems[1]}`;
  }
  return `${formattedItems.slice(0, -1).join(', ')} y ${formattedItems[formattedItems.length - 1]}`;
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
 * Te escribo porque tu servicio de *{PLATAFORMAS}* vence el día *{hoy/fecha}*.
 * 
 * El valor de la renovación es de *{valor_total}*.
 * ¿Deseas renovar?
 * 
 * Puedes realizar el pago por llave bre-b: @cdg264 y enviarme el comprobante por este medio.
 * 
 * ¡Gracias!
 */
export function generateCollectionMessage({
  nombre,
  plataforma,
  fecha,
  valor,
  servicios,
}: WhatsAppMessageParams): string {
  let platStr = (plataforma || 'Servicio').toUpperCase().trim();
  let finalVal = valor || 0;

  if (servicios && servicios.length > 0) {
    const activeList = servicios.filter((s) => s.estado !== 'CANCELADO');
    if (activeList.length > 0) {
      platStr = formatPlatformsList(activeList.map((s) => s.plataforma));
      finalVal = activeList.reduce((sum, s) => sum + (Number(s.valor) || 0), 0);
    }
  }

  const formattedVal = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(finalVal);

  const cleanName = (nombre || 'Cliente').trim();
  const expDay = formatExpirationDay(fecha);

  return (
    `Hola ${cleanName}\n\n` +
    `Te escribo porque tu servicio de *${platStr}* vence el día *${expDay}*.\n\n` +
    `El valor de la renovación es de *${formattedVal}*.\n` +
    `¿Deseas renovar?\n\n` +
    `Puedes realizar el pago por llave bre-b: @cdg264 y enviarme el comprobante por este medio.\n\n` +
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
  servicios,
}: WhatsAppMessageParams): string {
  let platStr = (plataforma || 'Servicio').toUpperCase().trim();
  let finalVal = valor || 0;

  if (servicios && servicios.length > 0) {
    const activeList = servicios.filter((s) => s.estado !== 'CANCELADO');
    if (activeList.length > 0) {
      platStr = formatPlatformsList(activeList.map((s) => s.plataforma));
      finalVal = activeList.reduce((sum, s) => sum + (Number(s.valor) || 0), 0);
    }
  }

  const formattedVal = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(finalVal);

  const cleanName = (nombre || 'Cliente').trim();

  return (
    `Hola ${cleanName}\n\n` +
    `Te recuerdo que tenemos pendiente el pago de la renovación de tu servicio de *${platStr}* (*${formattedVal}*).\n\n` +
    `Puedes realizar el pago por llave bre-b: @cdg264 y enviarme el comprobante por este medio para poder confirmar y así continuar con el servicio.\n\n` +
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
