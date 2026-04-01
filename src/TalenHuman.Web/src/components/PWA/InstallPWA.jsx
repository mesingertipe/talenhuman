import React from 'react';
import { Share, Plus, LogOut, Smartphone, CheckCircle, ChevronRight, UserCheck } from 'lucide-react';

const InstallPWA = ({ onLogout, version }) => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col p-8 overflow-y-auto">
      
      {/* BRANDING - CLEAN PRO */}
      <div className="flex flex-col items-center mb-6 pt-4 shrink-0">
        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">TalenHuman</h1>
        <div className="mt-2 text-[11px] font-bold text-slate-400 dark:text-slate-600 tracking-widest uppercase">
          {version || 'V12.6.0-STABLE'}
        </div>
      </div>

      {/* PROGRESS INDICATOR - CLARIFYING PRIVACY ORDER */}
      <div className="flex justify-center mb-8 shrink-0">
        <div className="flex items-center gap-3 px-4 py-2 bg-green-50 dark:bg-green-900/10 rounded-2xl border border-green-100 dark:border-green-800/20 shadow-sm animate-in zoom-in duration-500">
           <UserCheck size={14} className="text-green-600" />
           <span className="text-[10px] font-black uppercase text-green-600 tracking-widest">Aviso de Privacidad: Completado ✓</span>
        </div>
      </div>

      {/* MAIN CARD - MORE COMPACT & STABLE */}
      <div className="flex-1 flex flex-col justify-center items-center">
        <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.1)] dark:shadow-none border border-slate-100 dark:border-white/5 p-8 text-center animate-in slide-in-from-bottom-8 duration-500">
          
          <div className="space-y-2 mb-8">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">Instalación Necesaria</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium px-2">
              Para continuar hacia su portal personal, instale la aplicación siguiendo estos pasos:
            </p>
          </div>

          {isIOS ? (
            <div className="space-y-3 pb-4">
              {/* Step 1 */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 transition-all">
                <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
                  <Share size={18} className="text-white" />
                </div>
                <div className="text-left">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Paso 1</p>
                   <p className="text-xs text-slate-700 dark:text-slate-300 font-bold">Tocar botón "Compartir"</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 transition-all">
                <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
                  <Plus size={18} className="text-white" />
                </div>
                <div className="text-left">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Paso 2</p>
                   <p className="text-xs text-slate-700 dark:text-slate-300 font-bold">"Añadir a pantalla de inicio"</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-6 flex flex-col items-center">
               <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-inner">
                  <Smartphone size={32} className="animate-pulse" />
               </div>
               <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-4">
                  Acepte la notificación en Android
               </p>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 dark:border-white/5 space-y-4">
            <button 
              onClick={onLogout}
              className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl"
            >
              <LogOut size={14} />
              CERRAR SESIÓN Y SALIR
            </button>
            <p className="text-[10px] text-slate-400 px-4 leading-tight">
              Si ya instaló la aplicación, ábrala desde su pantalla de inicio.
            </p>
          </div>
        </div>
      </div>

      {/* FOOTER - NATURAL FLOW (NO ABSOLUTE) */}
      <footer className="mt-auto py-8 flex flex-col items-center gap-2 opacity-50">
         <div className="flex items-center gap-2">
            <CheckCircle size={12} className="text-indigo-600" />
            <span className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-500">Secure Access Verified</span>
         </div>
         <p className="text-[8px] text-slate-400 italic">© 2026 Powered by TalenHuman V12</p>
      </footer>
    </div>
  );
};

export default InstallPWA;
