import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

export const InstallPwaBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:bottom-6 z-50 p-3.5 bg-slate-900/95 backdrop-blur-md border border-emerald-500/40 rounded-2xl shadow-2xl flex items-center justify-between gap-3 max-w-sm">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0">
          <Download className="w-4 h-4" />
        </div>
        <div>
          <p className="text-xs font-bold text-white">Instalar Cobros App</p>
          <p className="text-[10px] text-slate-400">Accede más rápido desde tu pantalla de inicio</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={handleInstallClick}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-950 cursor-pointer"
        >
          Instalar
        </button>
        <button
          onClick={() => setShowBanner(false)}
          className="p-1 text-slate-400 hover:text-white rounded-lg"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};