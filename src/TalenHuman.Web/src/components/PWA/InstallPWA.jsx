import React, { useEffect, useState } from 'react';
import { Share, PlusSquare, Smartphone, LogOut, DownloadCloud, LucideUsers, ChevronRight } from 'lucide-react';

const InstallPWA = ({ onLogout, version }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
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
    <div className="fixed inset-0 z-[10000] flex flex-col items-center bg-white overflow-y-auto"
         style={{ minHeight: '100dvh' }}>
      
      {/* 🚀 ELITE BRAND HEADER (Matches Login) */}
      <div className="w-full bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-12 flex flex-col items-center justify-center text-white relative overflow-hidden shrink-0 shadow-xl">
         {/* Background Decoration */}
         <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
         <div className="absolute bottom-[-20%] left-[-10%] w-48 h-48 bg-indigo-400/20 rounded-full blur-2xl"></div>

         <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md border border-white/30 shadow-lg mb-2">
               <LucideUsers size={32} className="text-white drop-shadow-md" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter" style={{ fontFamily: "'Outfit', sans-serif" }}>TalenHuman</h1>
            <div className="flex items-center gap-2">
               <div className="h-[1px] w-8 bg-white/20"></div>
               <span className="text-[10px] uppercase font-black tracking-[0.4em] text-indigo-200">System Installation</span>
               <div className="h-[1px] w-8 bg-white/20"></div>
            </div>
         </div>
      </div>

      <div className="w-full max-w-md px-8 py-10 flex flex-col items-center flex-1">
        {/* 🎬 HEADER TEXT */}
        <div className="text-center mb-10 w-full">
           <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight mb-2">
             Optimiza tu <span className="text-indigo-600">Experiencia</span>
           </h2>
           <p className="text-slate-500 font-medium text-sm px-4">
             Instala nuestra aplicación para recibir notificaciones y acceder sin conexión con un solo toque.
           </p>
        </div>

        {/* 🎬 MAIN CONTENT */}
        <div className="w-full flex-1 flex flex-col justify-start gap-6">
           {!isIOS && deferredPrompt ? (
              <div className="animate-in slide-in-from-bottom-6 duration-700">
                 <button 
                   onClick={handleInstallClick}
                   className="group relative w-full bg-indigo-600 text-white py-6 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl shadow-indigo-600/30 flex items-center justify-center gap-4 active:scale-[0.98] transition-all overflow-hidden"
                 >
                    <DownloadCloud size={24} className="animate-bounce" />
                    <span>Instalar Ahora</span>
                 </button>
                 <p className="mt-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Procedimiento Recomendado</p>
              </div>
           ) : (
              <div className="space-y-4 animate-in fade-in duration-700">
                 {/* Step 1 */}
                 <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex items-center gap-5 transition-all hover:border-indigo-200 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 group">
                    <div className="bg-indigo-600 w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg shadow-indigo-200/50 shrink-0">1</div>
                    <div className="flex-1">
                       <p className="text-[10px] font-black uppercase text-indigo-600/60 mb-0.5 tracking-widest">Navegador</p>
                       <p className="text-sm font-bold text-slate-800">Toca el botón <Share size={18} className="inline-block mx-1 text-indigo-500" /> en la barra inferior.</p>
                    </div>
                 </div>

                 {/* Step 2 */}
                 <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex items-center gap-5 transition-all hover:border-indigo-200 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 group">
                    <div className="bg-indigo-500 w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg shadow-indigo-200/50 shrink-0">2</div>
                    <div className="flex-1">
                       <p className="text-[10px] font-black uppercase text-indigo-500/60 mb-0.5 tracking-widest">Añadir</p>
                       <p className="text-sm font-bold text-slate-800">Busca <PlusSquare size={18} className="inline-block mx-1 text-indigo-500" /> <strong>"Añadir a inicio"</strong> en la lista.</p>
                    </div>
                 </div>
              </div>
           )}
        </div>

        {/* 🎬 FOOTER ACTIONS */}
        <div className="w-full pt-10 pb-6 flex flex-col items-center gap-8">
           <button 
             onClick={onLogout}
             className="text-slate-400 hover:text-indigo-600 transition-colors flex items-center gap-2 font-black text-[11px] uppercase tracking-widest outline-none"
           >
             <LogOut size={16} />
             Cerrar Sesión Segura
           </button>

           <div className="flex flex-col items-center gap-2 opacity-20">
              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-900">
                 {version || 'V16.3.0-ELITE'}
              </span>
              <div className="h-0.5 w-8 bg-slate-900 rounded-full"></div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default InstallPWA;
