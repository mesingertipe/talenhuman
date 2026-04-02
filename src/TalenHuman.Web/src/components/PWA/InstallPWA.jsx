import React, { useEffect, useState } from 'react';
import { Share, PlusSquare, Smartphone, LogOut, DownloadCloud, CheckCircle2 } from 'lucide-react';

const InstallPWA = ({ onLogout, version }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log('Capture beforeinstallprompt');
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstalled(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center p-6 text-center text-white overflow-hidden"
         style={{ 
           background: 'radial-gradient(circle at 50% 0%, #6366f1 0%, #4f46e5 35%, #1e1b4b 100%)',
           minHeight: '100dvh'
         }}>
      
      {/* 🔮 ELITE MESH GLOWS */}
      <div className="absolute top-[-10%] right-[-10%] w-[80%] h-[50%] bg-indigo-500/20 blur-[120px] rounded-full animate-pulse"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[80%] h-[50%] bg-fuchsia-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-md flex flex-col items-center relative z-10 px-4">
        {/* 🚀 PREMIUM HEADER */}
        <div className="mb-12 flex flex-col items-center animate-in fade-in zoom-in duration-1000">
           <div className="relative mb-6">
              <div className="absolute inset-0 bg-white/20 blur-2xl rounded-full scale-150"></div>
              <div className="relative bg-white/10 p-6 rounded-[2.5rem] backdrop-blur-3xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.3)] ring-1 ring-white/30">
                 <Smartphone size={56} className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
              </div>
           </div>
           
           <h1 className="text-4xl font-black tracking-tight mb-2 italic bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">TalenHuman</h1>
           <div className="flex items-center gap-3">
              <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-white/40"></div>
              <span className="text-[10px] font-black uppercase tracking-[0.6em] text-indigo-200/80">Premium Ecosystem</span>
              <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-white/40"></div>
           </div>
        </div>

        {/* 🎬 ANDROID INSTALL CTA */}
        {!isIOS && deferredPrompt && (
           <div className="w-full animate-in slide-in-from-bottom-8 duration-700 mb-10">
              <button 
                onClick={handleInstallClick}
                className="group relative w-full bg-white text-indigo-700 py-6 px-8 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-[0_20px_40px_rgba(0,0,0,0.2)] flex items-center justify-center gap-4 active:scale-95 transition-all overflow-hidden"
              >
                 <div className="absolute inset-0 bg-gradient-to-r from-indigo-50 to-white opacity-0 group-hover:opacity-100 transition-opacity"></div>
                 <DownloadCloud size={22} className="relative z-10 animate-bounce" />
                 <span className="relative z-10">Instalar Aplicación</span>
              </button>
              <p className="mt-4 text-[10px] font-bold text-indigo-200/60 uppercase tracking-widest">Recomendado para la mejor experiencia</p>
           </div>
        )}

        {/* 📱 IOS / GENERIC STEPS */}
        {(isIOS || !deferredPrompt) && (
          <div className="w-full space-y-4 mb-10 animate-in fade-in duration-700 delay-300">
            {/* STEP 1 */}
            <div className="group bg-white/5 backdrop-blur-2xl p-5 rounded-[2.2rem] border border-white/10 shadow-2xl text-left flex gap-5 items-center transition-all hover:bg-white/10 hover:border-white/20">
               <div className="bg-indigo-500/30 w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black border border-white/20 shrink-0 shadow-inner">1</div>
               <div>
                  <p className="text-[10px] font-black uppercase text-indigo-300 mb-0.5 tracking-widest">Paso Inicial</p>
                  <p className="text-sm font-bold leading-tight text-white/90">Toca <strong>Compartir</strong> <Share size={16} className="inline ml-1 opacity-70" /> en tu navegador.</p>
               </div>
            </div>

            {/* STEP 2 */}
            <div className="group bg-white/5 backdrop-blur-2xl p-5 rounded-[2.2rem] border border-white/10 shadow-2xl text-left flex gap-5 items-center transition-all hover:bg-white/10 hover:border-white/20">
               <div className="bg-fuchsia-500/30 w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black border border-white/20 shrink-0 shadow-inner">2</div>
               <div>
                  <p className="text-[10px] font-black uppercase text-fuchsia-300 mb-0.5 tracking-widest">Instalación</p>
                  <p className="text-sm font-bold leading-tight text-white/90">Busca y toca <strong>Añadir a inicio</strong> <PlusSquare size={16} className="inline ml-1 opacity-70" />.</p>
               </div>
            </div>
          </div>
        )}

        {/* 🎬 ACTIONS & DISMISS */}
        <div className="flex flex-col items-center gap-6 w-full animate-in fade-in duration-1000 delay-500">
          <button 
            onClick={onLogout}
            className="group flex items-center gap-3 py-4 px-10 rounded-full text-white/40 hover:text-white transition-all text-[10px] font-black uppercase tracking-[0.2em] border border-white/5 hover:bg-white/5 hover:border-white/10"
          >
            <LogOut size={16} className="transition-transform group-hover:-translate-x-1" />
            Cerrar Sesión
          </button>

          <div className="flex flex-col items-center gap-2">
            <span className="opacity-30 text-[9px] font-black uppercase tracking-[0.4em]">
               {version || 'V16.2.0-ELITE'}
            </span>
            <div className="h-1 w-12 bg-white/10 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallPWA;

export default InstallPWA;
