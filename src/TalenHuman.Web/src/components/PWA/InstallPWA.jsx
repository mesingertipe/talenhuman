import React from 'react';
import { Share, PlusSquare, ArrowRightCircle, Smartphone, LogOut } from 'lucide-react';

const InstallPWA = ({ onLogout, version }) => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  return (
    <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center p-8 text-center text-white overflow-hidden"
         style={{ background: 'linear-gradient(135deg, #0d6efd 0%, #1565c0 100%)' }}>
      
      {/* 📱 PWA ICON LARGE (DomiCare Style) */}
      <div className="text-[6rem] mb-8 animate-bounce transition-transform">
         📲
      </div>

      <div className="w-full max-w-sm bg-white/10 backdrop-blur-md p-8 rounded-[2rem] border border-white/20 shadow-2xl animate-in zoom-in-95 duration-500">
        <h3 className="text-2xl font-black mb-4 leading-tight">¡Instala la Aplicación!</h3>
        <p className="text-sm text-blue-50/80 mb-8 leading-relaxed font-medium">
          Para usar <strong>TalenHuman</strong> de manera eficiente y recibir notificaciones en tiempo real, debes instalar la aplicación en tu celular.
        </p>

        {isIOS ? (
          <div className="space-y-6 text-left animate-in slide-in-from-bottom-4 duration-700">
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100/60 border-b border-white/10 pb-2">Instrucciones para iPhone:</p>
             <ol className="space-y-4">
                <li className="flex gap-4 items-start">
                   <span className="bg-white/20 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 border border-white/20">1</span>
                   <p className="text-xs font-bold leading-relaxed">
                      Toca el botón <strong>Compartir</strong> <span className="inline-block translate-y-0.5 ml-1 opacity-80 mr-1"><Share size={16}/></span> en tu navegador.
                   </p>
                </li>
                <li className="flex gap-4 items-start">
                   <span className="bg-white/20 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 border border-white/20">2</span>
                   <p className="text-xs font-bold leading-relaxed">
                      Desliza hacia abajo y toca en <strong>Añadir a la pantalla de inicio</strong> <span className="inline-block translate-y-0.5 ml-1 opacity-80 mr-1"><PlusSquare size={16}/></span>.
                   </p>
                </li>
             </ol>
          </div>
        ) : (
          <div className="py-6 flex flex-col items-center">
             <button className="w-full bg-white text-blue-600 py-4 rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                📥 INSTALAR AHORA
             </button>
             <p className="text-[10px] font-bold text-white/50 mt-4 uppercase tracking-widest">Añadir a pantalla de inicio</p>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-white/10">
           <button 
             onClick={onLogout}
             className="text-white/50 hover:text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 mx-auto"
           >
             <LogOut size={12} />
             Cerrar Sesión y Salir
           </button>
        </div>
      </div>

      <footer className="mt-12 opacity-30 text-[9px] font-black uppercase tracking-[0.3em]">
         TalenHuman @ {version || 'V12.8.5'}
      </footer>
    </div>
  );
};

export default InstallPWA;
