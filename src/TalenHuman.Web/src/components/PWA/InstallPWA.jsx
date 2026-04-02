import React from 'react';
import { Share, PlusSquare, ArrowRightCircle, Smartphone, LogOut } from 'lucide-react';

const InstallPWA = ({ onLogout, version }) => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  return (
    <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center p-6 text-center text-white overflow-y-auto"
         style={{ 
           background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
           minHeight: '100dvh',
           paddingTop: 'env(safe-area-inset-top, 2rem)',
           paddingBottom: 'env(safe-area-inset-bottom, 2rem)'
         }}>
      
      {/* 🔮 BACKGROUND GLOWS EXHIBIT */}
      <div className="absolute top-[-5%] left-[-10%] w-[60%] h-[40%] bg-white/10 blur-[100px] rounded-full"></div>
      <div className="absolute bottom-[0%] right-[-10%] w-[60%] h-[40%] bg-indigo-400/20 blur-[100px] rounded-full"></div>

      <div className="w-full max-w-md flex flex-col items-center relative z-10 py-6">
        {/* 🚀 ELITE HEADER */}
        <div className="mb-10 flex flex-col items-center animate-in fade-in zoom-in duration-700">
           <div className="bg-white/20 p-5 rounded-[2rem] backdrop-blur-3xl border border-white/30 mb-4 shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
              <Smartphone size={48} className="text-white drop-shadow-2xl" />
           </div>
           <h1 className="text-3xl font-black tracking-tight mb-1 italic">TalenHuman</h1>
           <div className="flex items-center gap-3">
              <div className="h-[2px] w-8 bg-white/40 rounded-full"></div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/80">Premium Access</span>
              <div className="h-[2px] w-8 bg-white/40 rounded-full"></div>
           </div>
        </div>

        <div className="w-full space-y-4 mb-10 px-2">
          {/* STEP 1 */}
          <div className="bg-white/10 backdrop-blur-2xl p-6 rounded-[2rem] border border-white/20 shadow-2xl text-left flex gap-5 items-center transform transition-all hover:scale-[1.02]">
             <div className="bg-white text-indigo-600 w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black shadow-lg shrink-0">1</div>
             <div>
                <p className="text-[10px] font-black uppercase text-white/60 mb-0.5 tracking-widest">Paso Inicial</p>
                <p className="text-sm font-bold leading-tight">Toca <strong>Compartir</strong> <Share size={16} className="inline ml-1 opacity-80" /> en tu navegador.</p>
             </div>
          </div>

          {/* STEP 2 */}
          <div className="bg-white/10 backdrop-blur-2xl p-6 rounded-[2rem] border border-white/20 shadow-2xl text-left flex gap-5 items-center transform transition-all hover:scale-[1.02]">
             <div className="bg-white text-purple-600 w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black shadow-lg shrink-0">2</div>
             <div>
                <p className="text-[10px] font-black uppercase text-white/60 mb-0.5 tracking-widest">Instalación</p>
                <p className="text-sm font-bold leading-tight">Busca y toca <strong>Añadir a inicio</strong> <PlusSquare size={16} className="inline ml-1 opacity-80" />.</p>
             </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-5 w-full px-4">
          <button 
            onClick={onLogout}
            className="w-full bg-black/20 hover:bg-black/40 transition-all text-white py-3.5 px-10 rounded-full border border-white/20 font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 backdrop-blur-md"
          >
            <LogOut size={16} />
            Cerrar Sesión
          </button>

          <footer className="opacity-40 text-[9px] font-black uppercase tracking-[0.4em] mt-2">
             {version || 'V16.1.0-ELITE'}
          </footer>
        </div>
      </div>
    </div>
  );
};

export default InstallPWA;
