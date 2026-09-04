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
      style={{ backgroundColor: '#4ec481' }}
      className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-2.5 text-slate-950 font-bold rounded-xl shadow-md transition-all text-xs hover:brightness-105 active:scale-95 cursor-pointer ${className}`}
      title={`Enviar WhatsApp a ${nombre}`}
    >
      <MessageCircle className="w-3.5 h-3.5 fill-slate-950/20" />
      <span>WhatsApp</span>
    </button>
  );
};
