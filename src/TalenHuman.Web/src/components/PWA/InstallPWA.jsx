import React from 'react';
import { Share, Plus, LogOut, Smartphone } from 'lucide-react';

const InstallPWA = ({ onLogout, version }) => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
      
      {/* BRANDING RESTORATION - MINIMALIST */}
      <div className="flex flex-col items-center mb-10">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">TalenHuman Mobile</h1>
        <div className="bg-slate-50 dark:bg-slate-800/50 px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-1 font-bold">
          {version || 'V12.5.8-FORCE'}
        </div>
      </div>

      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 p-8 text-center space-y-6">
        
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Instalación Necesaria</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed px-2">
            Para acceder a sus turnos y biometría, debe instalar esta aplicación en su dispositivo móvil.
          </p>
        </div>

        {isIOS ? (
          <div className="space-y-4 text-left">
            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest text-center mb-4">Pasos para iPhone:</p>
            
            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="bg-white dark:bg-slate-700 p-2 rounded-lg shadow-sm">
                <Share size={20} className="text-slate-600 dark:text-slate-300" />
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300">
                Toca el botón <strong>"Compartir"</strong> en la barra inferior de Safari.
              </p>
            </div>

            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="bg-white dark:bg-slate-700 p-2 rounded-lg shadow-sm">
                <Plus size={20} className="text-slate-600 dark:text-slate-300" />
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300">
                Selecciona la opción <strong>"Añadir a pantalla de inicio"</strong>.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6 flex flex-col items-center">
             <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center text-indigo-600">
                <Smartphone size={40} />
             </div>
             <p className="text-xs text-slate-500 px-4">
                En Android, acepte la notificación de "Instalar Aplicación" que aparecerá en pantalla.
             </p>
          </div>
        )}

        <div className="pt-4 space-y-4">
           <button 
             onClick={onLogout}
             className="w-full py-4 px-6 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-transform"
           >
             <LogOut size={16} />
             CERRAR SESIÓN Y SALIR
           </button>
           
           <p className="text-[10px] text-slate-400">
             Si ya instaló la aplicación, ciérrela y ábrala desde el icono en su pantalla de inicio.
           </p>
        </div>
      </div>

      <footer className="mt-10 text-[9px] text-slate-400 font-medium lowercase tracking-widest opacity-50">
        powered by talenhuman v12 © 2026
      </footer>
    </div>
  );
};

export default InstallPWA;
