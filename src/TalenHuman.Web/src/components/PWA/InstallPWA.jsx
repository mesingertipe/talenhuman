import React from 'react';
import { Share, PlusSquare, ArrowRightCircle, Smartphone, LogOut } from 'lucide-react';

const InstallPWA = ({ onLogout, version }) => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  return (
    <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-between p-6 text-center text-white overflow-y-auto"
         style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)' }}>
      
      {/* 🔮 BACKGROUND GLOWS */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/20 blur-[120px] rounded-full animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-sm flex flex-col items-center py-12 relative z-10">
        {/* 🚀 ELITE HEADER */}
        <div className="mb-12 flex flex-col items-center animate-in fade-in slide-in-from-top-4 duration-1000">
           <div className="bg-white/10 p-5 rounded-[2rem] backdrop-blur-2xl border border-white/20 mb-5 shadow-2xl ring-1 ring-white/30">
              <Smartphone size={48} className="text-white drop-shadow-glow" />
           </div>
           <h1 className="text-3xl font-black tracking-tighter mb-1">TalenHuman</h1>
           <div className="flex items-center gap-2">
              <div className="h-[2px] w-8 bg-indigo-400 rounded-full"></div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-300/80">Premium Access</span>
              <div className="h-[2px] w-8 bg-indigo-400 rounded-full"></div>
           </div>
        </div>

        <div className="w-full space-y-4 mb-12">
          {/* STEP 1 */}
          <div className="bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 shadow-xl text-left flex gap-5 items-center transition-transform active:scale-[0.98]">
             <div className="bg-indigo-500/30 w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black border border-white/20 shrink-0">1</div>
             <div>
                <p className="text-[10px] font-black uppercase text-indigo-300 mb-1 tracking-widest">Paso Inicial</p>
                <p className="text-sm font-bold leading-tight">Toca <strong>Compartir</strong> <Share size={16} className="inline ml-1 opacity-70" /> en tu navegador.</p>
             </div>
          </div>

          {/* STEP 2 */}
          <div className="bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 shadow-xl text-left flex gap-5 items-center transition-transform active:scale-[0.98]">
             <div className="bg-purple-500/30 w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black border border-white/20 shrink-0">2</div>
             <div>
                <p className="text-[10px] font-black uppercase text-purple-300 mb-1 tracking-widest">Instalación</p>
                <p className="text-sm font-bold leading-tight">Busca y toca <strong>Añadir a inicio</strong> <PlusSquare size={16} className="inline ml-1 opacity-70" />.</p>
             </div>
          </div>
        </div>

        {/* 🎬 ACTIONS */}
        {!isIOS && (
           <button className="w-full bg-white text-indigo-600 py-5 rounded-[2rem] font-black text-sm shadow-2xl shadow-indigo-500/20 flex items-center justify-center gap-3 active:scale-95 transition-all mb-8">
              📥 INSTALAR TALENHUMAN
           </button>
        )}

        <button 
          onClick={onLogout}
          className="text-white/40 hover:text-white transition-colors text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 py-4 px-8 rounded-full border border-white/5"
        >
          <LogOut size={14} />
          Cerrar Sesión
        </button>

        <footer className="mt-16 opacity-30 text-[9px] font-black uppercase tracking-[0.3em]">
           TalenHuman Ecosystem &copy; {version || 'V12.8.7'}
        </footer>
      </div>
    </div>
  );
};

export default InstallPWA;
