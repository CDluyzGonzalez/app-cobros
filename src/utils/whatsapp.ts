export interface WhatsAppMessageParams {
  nombre: string;
  plataforma: string;
  fecha: string;
  valor: number;
  telefono: string;
}

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
  }).format(valor);

  return (
    `Hola ${nombre} 👋\n\n` +
    `Te escribo porque tu servicio de *${plataforma}* vence el día *${fecha}*.\n\n` +
    `El valor de la renovación es de *${formattedVal}*.\n` +
    `¿Deseas renovar?\n\n` +
    `Puedes realizar el pago y enviarme el comprobante por este medio.\n\n` +
    `¡Gracias! 😊`
  );
}

export function generateReminderMessage({
  nombre,
  plataforma,
  valor,
}: WhatsAppMessageParams): string {
  const formattedVal = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(valor);

  return (
    `Hola ${nombre} 👋\n\n` +
    `Te recuerdo que tenemos pendiente el pago de la renovación de tu servicio de *${plataforma}* (*${formattedVal}*).\n\n` +
    `Por favor envíame el comprobante para poder confirmar y así continuar con el servicio.\n\n` +
    `¡Gracias!`
  );
}

export function createWhatsAppUrl(telefono: string, mensaje: string): string {
  // Limpiar número (remover espacios, guiones, símbolos)
  const cleanPhone = (telefono || '').replace(/\D/g, '');
  const encodedMsg = encodeURIComponent(mensaje);

  if (cleanPhone) {
    return `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
  }
  // Si no hay teléfono configurado aún, abre WhatsApp con el mensaje listo
  return `https://api.whatsapp.com/send?text=${encodedMsg}`;
}
