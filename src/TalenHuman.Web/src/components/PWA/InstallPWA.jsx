import React from 'react';
import { Share, Plus, LogOut, Smartphone, CheckCircle, ChevronRight } from 'lucide-react';

const InstallPWA = ({ onLogout, version }) => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 animate-in fade-in duration-700">
      
      {/* BRANDING RESTORATION - PRO CLEAN */}
      <div className="flex flex-col items-center mb-10 translate-y-[-20%]">
        <div className="px-3 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] uppercase font-black tracking-[0.25em] mb-4 border border-indigo-500/20">
          Mobile App Verified
        </div>
        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">TalenHuman</h1>
        <div className="mt-2 text-[11px] font-mono font-bold text-slate-400 dark:text-slate-600 tracking-widest uppercase">
          {version || 'V12.5.9-PRO'}
        </div>
      </div>

      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] dark:shadow-none border border-slate-100 dark:border-white/5 p-10 text-center space-y-8 animate-in zoom-in-95 duration-500">
        
        <div className="space-y-3">
          <div className="w-16 h-1 bg-indigo-500/20 mx-auto rounded-full mb-6" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Instalación Necesaria</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            Para acceder a sus turnos y biometría, debe instalar esta aplicación en su dispositivo móvil.
          </p>
        </div>

        {isIOS ? (
          <div className="space-y-4 text-left">
            <div className="flex items-center gap-5 p-5 bg-slate-50 dark:bg-white/5 rounded-[2rem] border border-slate-100 dark:border-white/5 transition-all hover:bg-white dark:hover:bg-white/10 hover:shadow-xl hover:shadow-slate-200/50">
              <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-500/20">
                <Share size={20} className="text-white" />
              </div>
              <div className="flex-1">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Paso 1</p>
                 <p className="text-xs text-slate-700 dark:text-slate-300 font-bold leading-tight">
                    Toca el botón <strong>"Compartir"</strong> en Safari.
                 </p>
              </div>
              <ChevronRight className="text-slate-300" size={16} />
            </div>

            <div className="flex items-center gap-5 p-5 bg-slate-50 dark:bg-white/5 rounded-[2rem] border border-slate-100 dark:border-white/5 transition-all hover:bg-white dark:hover:bg-white/10 hover:shadow-xl hover:shadow-slate-200/50">
              <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-500/20">
                <Plus size={20} className="text-white" />
              </div>
              <div className="flex-1">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Paso 2</p>
                 <p className="text-xs text-slate-700 dark:text-slate-300 font-bold leading-tight">
                    Selecciona la opción <strong>"Añadir a pantalla de inicio"</strong>.
                 </p>
              </div>
              <ChevronRight className="text-slate-300" size={16} />
            </div>
          </div>
        ) : (
          <div className="space-y-6 flex flex-col items-center py-4">
             <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-500/10 rounded-[2.5rem] flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-inner">
                <Smartphone size={48} className="animate-pulse" />
             </div>
             <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center px-4">
                Acepte la notificación de instalación en su Android.
             </p>
          </div>
        )}

        <div className="pt-4 space-y-4">
           <button 
             onClick={onLogout}
             className="w-full py-5 px-6 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-[1.75rem] font-bold text-xs flex items-center justify-center gap-3 active:scale-95 transition-all shadow-2xl hover:bg-slate-800 dark:hover:bg-slate-100"
           >
             <LogOut size={16} />
             CERRAR SESIÓN Y SALIR
           </button>
           
           <p className="text-[10px] text-slate-400 font-medium px-4">
             Si ya instaló la aplicación, ábrela desde su pantalla de inicio.
           </p>
        </div>
      </div>

      <footer className="absolute bottom-10 flex items-center gap-2 opacity-30 grayscale hover:grayscale-0 transition-all cursor-default">
         <CheckCircle size={14} className="text-indigo-600" />
         <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Secure Access Verified</span>
      </footer>
    </div>
  );
};

export default InstallPWA;
