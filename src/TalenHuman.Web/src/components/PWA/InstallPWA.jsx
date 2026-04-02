import React from 'react';
import { Share, PlusSquare, ArrowRightCircle, Smartphone, LogOut } from 'lucide-react';

const InstallPWA = ({ onLogout, version }) => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  return (
    <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center p-8 text-center text-white overflow-y-auto"
         style={{ 
           background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
           paddingBottom: 'env(safe-area-inset-bottom, 2rem)'
         }}>
      
      {/* 🔮 BACKGROUND GLOWS EXHIBIT */}
      <div className="absolute top-[-5%] left-[-10%] w-[60%] h-[40%] bg-white/10 blur-[100px] rounded-full"></div>
      <div className="absolute bottom-[0%] right-[-10%] w-[60%] h-[40%] bg-indigo-400/20 blur-[100px] rounded-full"></div>

      <div className="w-full max-w-md flex flex-col items-center relative z-10 py-10">
        {/* 🚀 ELITE HEADER */}
        <div className="mb-14 flex flex-col items-center animate-in fade-in zoom-in duration-700">
           <div className="bg-white/20 p-6 rounded-[2.5rem] backdrop-blur-3xl border border-white/30 mb-6 shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
              <Smartphone size={56} className="text-white drop-shadow-2xl" />
           </div>
           <h1 className="text-4xl font-black tracking-tight mb-2 italic">TalenHuman</h1>
           <div className="flex items-center gap-3">
              <div className="h-[2px] w-10 bg-white/40 rounded-full"></div>
              <span className="text-xs font-black uppercase tracking-[0.5em] text-white/80">Premium Access</span>
              <div className="h-[2px] w-10 bg-white/40 rounded-full"></div>
           </div>
        </div>

        <div className="w-full space-y-6 mb-16 px-2">
          {/* STEP 1 */}
          <div className="bg-white/10 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/20 shadow-2xl text-left flex gap-6 items-center transform transition-all hover:scale-[1.02]">
             <div className="bg-white text-indigo-600 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg shrink-0">1</div>
             <div>
                <p className="text-xs font-black uppercase text-white/60 mb-1 tracking-widest">Paso Inicial</p>
                <p className="text-base font-bold leading-tight">Toca <strong>Compartir</strong> <Share size={18} className="inline ml-1 opacity-80" /> en tu navegador.</p>
             </div>
          </div>

          {/* STEP 2 */}
          <div className="bg-white/10 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/20 shadow-2xl text-left flex gap-6 items-center transform transition-all hover:scale-[1.02]">
             <div className="bg-white text-purple-600 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg shrink-0">2</div>
             <div>
                <p className="text-xs font-black uppercase text-white/60 mb-1 tracking-widest">Instalación</p>
                <p className="text-base font-bold leading-tight">Busca y toca <strong>Añadir a inicio</strong> <PlusSquare size={18} className="inline ml-1 opacity-80" />.</p>
             </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-6 w-full px-4">
          <button 
            onClick={onLogout}
            className="w-full sm:w-auto bg-black/20 hover:bg-black/40 transition-all text-white py-4 px-10 rounded-full border border-white/20 font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3 backdrop-blur-md"
          >
            <LogOut size={16} />
            Cerrar Sesión
          </button>

          <footer className="opacity-40 text-[10px] font-black uppercase tracking-[0.4em] mt-4">
             {version || 'V14.0.0-PRO'}
          </footer>
        </div>
      </div>
    </div>
  );
};

export default InstallPWA;
