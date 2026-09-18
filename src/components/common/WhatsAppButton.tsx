import React, { useState } from 'react';
import { MessageCircle, Check } from 'lucide-react';
import {
  createWhatsAppUrl,
  generateCollectionMessage,
  generateReminderMessage,
  isWhatsAppUsername,
  ServiceItemSummary,
} from '../../utils/whatsapp';
import { Service } from '../../types';

interface WhatsAppButtonProps {
  nombre: string;
  plataforma: string;
  fecha: string;
  valor: number;
  telefono: string;
  type?: 'collection' | 'reminder';
  onSent?: () => void;
  className?: string;
  clienteId?: string;
  allServices?: Service[];
  clientServices?: ServiceItemSummary[];
}

function copyTextToClipboard(text: string): boolean {
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.setAttribute('readonly', '');
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '-9999px';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    if (successful) return true;
  } catch {
    // fallback a navigator.clipboard
  }

  try {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fallback
  }

  return false;
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
  clienteId,
  allServices,
  clientServices,
}) => {
  const [copied, setCopied] = useState(false);

  // Determinar los servicios activos a considerar para este cliente
  let resolvedServices: ServiceItemSummary[] | undefined = clientServices;

  if (!resolvedServices && allServices && allServices.length > 0) {
    const cleanPhone = (telefono || '').replace(/\D/g, '');
    const cleanName = (nombre || '').trim().toLowerCase();
    const cleanContact = (telefono || '').trim().toLowerCase();

    const matched = allServices.filter((s) => {
      if (s.estado === 'CANCELADO') return false;
      if (clienteId && s.cliente_id && s.cliente_id === clienteId) return true;
      if (cleanPhone && s.cliente_telefono) {
        const sPhone = s.cliente_telefono.replace(/\D/g, '');
        if (sPhone && sPhone === cleanPhone) return true;
      }
      if (cleanContact && s.cliente_telefono) {
        if (s.cliente_telefono.trim().toLowerCase() === cleanContact) return true;
      }
      if (cleanName && s.cliente_nombre) {
        return s.cliente_nombre.trim().toLowerCase() === cleanName;
      }
      return false;
    });

    if (matched.length > 0) {
      resolvedServices = matched;
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    const cleanContact = (telefono || '').trim();
    const isUser = isWhatsAppUsername(cleanContact);

    // Si es un username (@usuario), copiarlo al portapapeles de forma sincrónica garantizada
    if (isUser) {
      copyTextToClipboard(cleanContact);
      setCopied(true);
      setTimeout(() => setCopied(false), 3500);
    }

    const msg =
      type === 'reminder'
        ? generateReminderMessage({
            nombre,
            plataforma,
            fecha,
            valor,
            telefono,
            servicios: resolvedServices,
          })
        : generateCollectionMessage({
            nombre,
            plataforma,
            fecha,
            valor,
            telefono,
            servicios: resolvedServices,
          });

    const url = createWhatsAppUrl(telefono, msg);
    window.open(url, '_blank');

    if (onSent) {
      onSent();
    }
  };

  const servicesCount = resolvedServices ? resolvedServices.length : 1;
  const isUser = isWhatsAppUsername((telefono || '').trim());

  return (
    <button
      onClick={handleClick}
      type="button"
      style={{ backgroundColor: '#4ec481' }}
      className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-2.5 text-slate-950 font-bold rounded-xl shadow-md transition-all text-xs hover:brightness-105 active:scale-95 cursor-pointer ${className}`}
      title={
        isUser
          ? `Abrir WhatsApp y copiar ${telefono} al portapapeles`
          : servicesCount > 1
          ? `Enviar WhatsApp a ${nombre} (${servicesCount} servicios activos)`
          : `Enviar WhatsApp a ${nombre}`
      }
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-slate-950" />
          <span className="truncate max-w-[120px]">¡{telefono} copiado!</span>
        </>
      ) : (
        <>
          <MessageCircle className="w-3.5 h-3.5 fill-slate-950/20" />
          <span>WhatsApp</span>
        </>
      )}
    </button>
  );
};
