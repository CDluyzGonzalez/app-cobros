import React from 'react';
import { MessageCircle } from 'lucide-react';
import { createWhatsAppUrl, generateCollectionMessage, generateReminderMessage } from '../../utils/whatsapp';

interface WhatsAppButtonProps {
  nombre: string;
  plataforma: string;
  fecha: string;
  valor: number;
  telefono: string;
  type?: 'collection' | 'reminder';
  onSent?: () => void;
  className?: string;
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
  nombre,
  plataforma,
  fecha,
  valor,
  telefono,
  type = 'collection',
  onSent,
  className = '',
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    const msg =
      type === 'reminder'
        ? generateReminderMessage({ nombre, plataforma, fecha, valor, telefono })
        : generateCollectionMessage({ nombre, plataforma, fecha, valor, telefono });

    const url = createWhatsAppUrl(telefono, msg);
    window.open(url, '_blank');

    if (onSent) {
      onSent();
    }
  };

  return (
    <button
      onClick={handleClick}
      type="button"
      className={`inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-medium rounded-xl shadow-sm transition-all text-xs active:scale-95 cursor-pointer ${className}`}
      title={`Enviar WhatsApp a ${nombre}`}
    >
      <MessageCircle className="w-4 h-4 fill-white/20" />
      <span>{type === 'reminder' ? 'Recordar 24h' : 'Cobrar WhatsApp'}</span>
    </button>
  );
};
