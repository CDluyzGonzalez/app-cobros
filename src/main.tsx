import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// 👉 Capturar el evento de instalación nativo antes de que React se monte
window.addEventListener('beforeinstallprompt', (e: any) => {
  e.preventDefault();
  (window as any).deferredPrompt = e;
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
