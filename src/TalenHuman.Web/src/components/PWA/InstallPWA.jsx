import React from 'react';
import { Share, Plus, LogOut, Smartphone, ArrowBigRightDash } from 'lucide-react';

const InstallPWA = ({ onLogout, version }) => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  return (
    <div className="min-h-screen bg-blue-600 flex flex-col items-center p-6 relative overflow-hidden">
      
      {/* Background Shapes for 'Pro' look */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-blue-500 rounded-full blur-3xl opacity-50" />
      <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-blue-700 rounded-full blur-3xl opacity-50" />

      {/* Animated Phone Icon - DomiCare style */}
      <div className="mt-12 mb-10 relative animate-in fade-in slide-in-from-top-12 duration-1000">
        <div className="absolute top-[-40px] left-[-60px] animate-bounce-horizontal">
           <ArrowBigRightDash size={48} className="text-blue-300 fill-blue-300" />
        </div>
        <div className="w-24 h-44 bg-slate-900 rounded-[2.5rem] border-[6px] border-slate-800 shadow-2xl relative overflow-hidden flex flex-col justify-center gap-2 px-3">
           <div className="grid grid-cols-3 gap-1 opcity-50">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="w-full aspect-square bg-slate-700 rounded-sm" />
              ))}
           </div>
           <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-4 bg-slate-800 rounded-full" />
        </div>
      </div>

      <div className="w-full max-w-sm bg-white/10 backdrop-blur-2xl rounded-[2.5rem] border border-white/20 p-10 text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-500 relative z-10">
        
        <h2 className="text-3xl font-black text-white leading-tight">
          ¡Instala la Aplicación!
        </h2>
        
        <p className="text-sm text-blue-100/80 leading-relaxed font-medium px-2">
          Para usar <strong>TalenHuman</strong> de manera eficiente y recibir notificaciones en tiempo real, debes instalar la aplicación en tu celular.
        </p>

        {isIOS ? (
          <div className="space-y-6 pt-4 text-left text-white">
            <p className="text-sm font-bold border-b border-white/10 pb-2">Instrucciones para iPhone:</p>
            
            <div className="flex gap-4">
              <span className="text-blue-200 font-bold shrink-0">1.</span>
              <p className="text-xs font-medium leading-relaxed">
                 Toca el botón <strong>Compartir <Share size={14} className="inline mb-1" /></strong> en tu navegador.
              </p>
            </div>

            <div className="flex gap-4">
              <span className="text-blue-200 font-bold shrink-0">2.</span>
              <p className="text-xs font-medium leading-relaxed">
                 Desliza hacia abajo y toca en <strong>Añadir a la pantalla de inicio <Plus size={14} className="inline mb-1" /></strong>.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6 flex flex-col items-center py-4">
             <div className="w-20 h-20 bg-white/10 rounded-[2.5rem] flex items-center justify-center text-white border border-white/20 shadow-inner">
                <Smartphone size={40} className="animate-pulse" />
             </div>
             <p className="text-xs text-white/70 font-bold uppercase tracking-widest text-center px-4">
                Acepte la notificación en Android
             </p>
          </div>
        )}

        <div className="pt-6">
           <button 
             onClick={onLogout}
             className="w-full py-4 px-6 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all border border-white/20 active:scale-95"
           >
             <LogOut size={16} />
             CERRAR SESIÓN Y SALIR
           </button>
        </div>
      </div>

      <footer className="mt-auto pb-10 text-[10px] text-blue-200/40 font-bold uppercase tracking-[0.3em]">
        TalenHuman v12.7.0
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes bounce-horizontal {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(20px); }
        }
        .animate-bounce-horizontal {
          animation: bounce-horizontal 2s infinite ease-in-out;
        }
      `}} />
    </div>
  );
};

export default InstallPWA;
