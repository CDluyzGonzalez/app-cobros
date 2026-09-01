import React, { useState } from 'react';
import { Settings, Link2, Database, Play, CheckCircle2, ShieldCheck, FileSpreadsheet, ExternalLink } from 'lucide-react';
import { getScriptUrl, setScriptUrl, api } from '../services/api';

export const SettingsPage: React.FC = () => {
  const [url, setUrl] = useState(getScriptUrl());
  const [saved, setSaved] = useState(false);
  const [dbStatus, setDbStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    setScriptUrl(url);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleSetupDatabase = async () => {
    setLoading(true);
    setDbStatus('');
    try {
      const res = await api.setupDatabase();
      setDbStatus('✅ ' + (res.message || 'Base de datos creada exitosamente en Sheets'));
    } catch (err: any) {
      setDbStatus('❌ Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMigrateData = async () => {
    if (!confirm('¿Deseas migrar los datos de las hojas de plataforma a la nueva estructura de la app? Las hojas originales no se alterarán.')) return;
    setLoading(true);
    setDbStatus('');
    try {
      const res = await api.migrateData();
      setDbStatus(`✅ ${res.message} (${res.clientsMigrated} clientes, ${res.servicesMigrated} servicios migrados).`);
    } catch (err: any) {
      setDbStatus('❌ Error en la migración: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRunScheduler = async () => {
    setLoading(true);
    setDbStatus('');
    try {
      const res = await api.runScheduler();
      setDbStatus(`✅ Scheduler ejecutado: ${res.statusesUpdated} estados actualizados, ${res.remindersSent} recordatorios y ${res.cancellationsFlagged} alertas.`);
    } catch (err: any) {
      setDbStatus('❌ Error ejecutando scheduler: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6 max-w-3xl">
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-emerald-400" /> Configuración de Google Apps Script & Sheets
        </h2>
        <p className="text-xs text-slate-400">
          Enlaza la aplicación con tu Web App de Google Apps Script para persistencia en tiempo real.
        </p>
      </div>

      {/* Google Sheet ID Card */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-950/80 text-emerald-400 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Google Sheet Vinculado</h3>
            <p className="text-xs text-slate-400 font-mono">1-A6QOVI6keO2ybFQc_0wOMPNjgSCUqWFNzhdhefGW3o</p>
          </div>
        </div>
        <a
          href="https://docs.google.com/spreadsheets/d/1-A6QOVI6keO2ybFQc_0wOMPNjgSCUqWFNzhdhefGW3o/edit"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
        >
          <span>Abrir Google Sheet en pestaña nueva</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Web App URL Form */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Link2 className="w-4 h-4 text-indigo-400" /> URL del Web App (Apps Script Deployment)
        </h3>
        <p className="text-xs text-slate-400">
          Pega aquí la URL que te genera Google Apps Script al hacer clic en <b>Implementar &gt; Nueva implementación &gt; Aplicación web</b> (Acceso: Cualquiera).
        </p>

        <form onSubmit={handleSaveUrl} className="space-y-3">
          <input
            type="url"
            placeholder="https://script.google.com/macros/s/.../exec"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
          />

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              {url ? '🟢 Conexión personalizada activa' : '🟡 Modo Local / Demostración activo'}
            </span>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs transition-all shadow-md shadow-emerald-950 cursor-pointer"
            >
              Guardar URL
            </button>
          </div>
        </form>

        {saved && (
          <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> URL de Google Apps Script guardada correctamente.
          </p>
        )}
      </div>

      {/* Database Operations */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-400" /> Operaciones de Base de Datos
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={handleSetupDatabase}
            disabled={loading}
            className="p-3 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-left transition-colors cursor-pointer"
          >
            <p className="text-xs font-bold text-white">1. Crear Estructura</p>
            <p className="text-[10px] text-slate-400 mt-1">Crea las hojas _APP_* con sus encabezados</p>
          </button>

          <button
            onClick={handleMigrateData}
            disabled={loading}
            className="p-3 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-left transition-colors cursor-pointer"
          >
            <p className="text-xs font-bold text-emerald-400">2. Migrar Datos Reales</p>
            <p className="text-[10px] text-slate-400 mt-1">Importa clientes y servicios desde el Sheet</p>
          </button>

          <button
            onClick={handleRunScheduler}
            disabled={loading}
            className="p-3 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-left transition-colors cursor-pointer"
          >
            <p className="text-xs font-bold text-cyan-400">3. Probar Scheduler</p>
            <p className="text-[10px] text-slate-400 mt-1">Simula el trigger horario de 24h/36h</p>
          </button>
        </div>

        {dbStatus && (
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200">
            {dbStatus}
          </div>
        )}
      </div>
    </div>
  );
};
