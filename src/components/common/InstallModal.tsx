import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Apple, Monitor, CheckCircle2 } from 'lucide-react';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallModal: React.FC<InstallModalProps> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'pc'>('android');

  useEffect(() => {
    // Detectar si ya está instalada en modo standalone (PWA activa)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Guardar también globalmente
      (window as any).__pwaPrompt = e;
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    const promptEvent = (window as any).deferredPrompt || deferredPrompt || (window as any).__pwaPrompt;
    if (promptEvent) {
      promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      if (outcome === 'accepted') {
        setInstalled(true);
        (window as any).deferredPrompt = null;
        onClose();
      }
    } else {
      // Si no hay evento nativo disponible (ej: iPhone o ya instalada), cambiar a la pestaña según dispositivo
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) setActiveTab('ios');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 text-slate-100 relative">
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-800/60 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-950 shrink-0">
            <Download className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Instalar Cobros App</h3>
            <p className="text-xs text-slate-400">Úsala como una aplicación nativa en tu pantalla</p>
          </div>
        </div>

        {/* Botón de instalación directa si el navegador lo soporta */}
        {deferredPrompt && !installed && (
          <button
            onClick={handleNativeInstall}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 font-bold text-white rounded-2xl shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 text-sm transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Instalar Ahora</span>
          </button>
        )}

        {/* Selector de pestañas de ayuda */}
        <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
          <button
            onClick={() => setActiveTab('android')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'android' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" /> Android
          </button>
          <button
            onClick={() => setActiveTab('ios')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'ios' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Apple className="w-3.5 h-3.5" /> iPhone / iPad
          </button>
          <button
            onClick={() => setActiveTab('pc')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'pc' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" /> PC / Mac
          </button>
        </div>

        {/* Contenido según pestaña */}
        <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl text-xs space-y-2.5">
          {activeTab === 'android' && (
            <div className="space-y-2 text-slate-300">
              <p className="font-bold text-emerald-400">📱 En Google Chrome para Android:</p>
              <ol className="list-decimal list-inside space-y-1 text-slate-300">
                <li>Toca los <strong>tres puntos ⋮</strong> en la esquina superior derecha de Chrome.</li>
                <li>Selecciona <strong>"Instalar aplicación"</strong> o <strong>"Agregar a pantalla principal"</strong>.</li>
                <li>Toca <strong>Instalar</strong> y ¡listo! Aparecerá con su icono en tus aplicaciones.</li>
              </ol>
            </div>
          )}

          {activeTab === 'ios' && (
            <div className="space-y-2 text-slate-300">
              <p className="font-bold text-emerald-400">🍎 En Safari para iPhone o iPad:</p>
              <ol className="list-decimal list-inside space-y-1 text-slate-300">
                <li>Toca el botón <strong>Compartir</strong> (el cuadrado con la flecha hacia arriba <span className="font-mono text-amber-300">⎋</span> en la barra de Safari).</li>
                <li>Desliza hacia abajo y selecciona <strong>"Agregar al inicio"</strong> (icono con signo <strong>+</strong>).</li>
                <li>Toca <strong>"Agregar"</strong> arriba a la derecha.</li>
              </ol>
            </div>
          )}

          {activeTab === 'pc' && (
            <div className="space-y-2 text-slate-300">
              <p className="font-bold text-emerald-400">💻 En Google Chrome o Edge para PC:</p>
              <ol className="list-decimal list-inside space-y-1 text-slate-300">
                <li>En la barra de direcciones donde escribes la URL, busca a la derecha el icono de <strong>Instalar pantalla</strong> 🖥️.</li>
                <li>Haz clic y presiona <strong>Instalar</strong> para abrirla en ventana independiente.</li>
              </ol>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
          <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Sin ocupar espacio</span>
          <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Notificaciones directas</span>
        </div>
      </div>
    </div>
  );
};