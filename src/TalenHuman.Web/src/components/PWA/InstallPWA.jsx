import React, { useEffect, useState } from 'react';
import { Share, PlusSquare, Smartphone, LogOut, DownloadCloud, LucideUsers, ChevronRight, ArrowRight, Smartphone as PhoneIcon, Chrome } from 'lucide-react';

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
    <div className="fixed inset-0 z-[10000] flex flex-col items-center bg-gradient-to-br from-[#7c3aed] via-[#6366f1] to-[#4f46e5] overflow-y-auto no-select"
         style={{ minHeight: '100dvh' }}>
      
      {/* 🚀 ELITE ANIMATED BACKGROUND ELEMENTS */}
      <div className="absolute top-[-10%] right-[-10%] w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-indigo-400/20 rounded-full blur-2xl"></div>

      {/* 🎬 TOP ILLUSTRATION AREA */}
      <div className="w-full pt-16 pb-8 flex flex-col items-center justify-center relative z-10 shrink-0">
          <div className="relative group">
              {/* Floating Phone Illustration */}
              <div className="relative z-20 bg-slate-900 w-24 h-48 rounded-[2rem] border-[4px] border-slate-800 shadow-2xl flex flex-col items-center p-2 animate-bounce-slow">
                  <div className="w-8 h-1 bg-slate-800 rounded-full mb-4"></div>
                  <div className="flex-1 w-full bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] rounded-2xl flex items-center justify-center overflow-hidden relative">
                      <div className="absolute inset-0 opacity-20">
                          <div className="absolute top-2 left-2 w-4 h-4 rounded-full bg-white/30" />
                          <div className="absolute bottom-4 right-4 w-8 h-8 rounded-full bg-white/20" />
                      </div>
                      <TTHLogoSmall />
                  </div>
                  <div className="w-6 h-6 bg-slate-800 rounded-full mt-4 flex items-center justify-center">
                      <div className="w-2 h-2 bg-slate-700 rounded-full" />
                  </div>
              </div>
              
              {/* Animated Arrow */}
              <div className="absolute top-1/2 left-[-60px] -translate-y-1/2 flex items-center gap-2 animate-float-x">
                  <ArrowRight size={32} className="text-white/40 rotate-180" />
              </div>
              <div className="absolute top-1/2 right-[-60px] -translate-y-1/2 flex items-center gap-2 animate-float-x-reverse">
                  <ArrowRight size={32} className="text-white/40" />
              </div>
          </div>

          <div className="mt-8 text-center px-6">
              <h1 className="text-3xl font-black text-white tracking-tighter" style={{ fontFamily: "'Outfit', sans-serif" }}>TalenHuman</h1>
              <p className="text-white/60 font-bold text-[10px] tracking-[0.3em] uppercase mt-1">Smart Enterprise System</p>
          </div>
      </div>

      {/* 🎬 GLASSMORPHISM INSTRUCTION CARD */}
      <div className="w-full max-w-md px-6 pb-20 relative z-20 flex-1 flex flex-col">
          <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[3rem] p-8 shadow-2xl shadow-black/20 flex-1 flex flex-col">
              
              <div className="text-center mb-8">
                  <h2 className="text-2xl font-black text-white tracking-tight leading-tight">
                      ¡Instala la Aplicación!
                  </h2>
                  <p className="text-blue-100/70 text-sm mt-3 leading-relaxed font-medium">
                      Para una experiencia nativa y recibir todas tus notificaciones, debes instalar TalenHuman en tu celular.
                  </p>
              </div>

              <div className="flex-1 flex flex-col justify-center gap-6">
                  {isIOS ? (
                      <div className="space-y-5">
                          <p className="text-center text-xs font-black text-blue-200 uppercase tracking-widest mb-2">Instrucciones para iPhone:</p>
                          <div className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/10">
                              <div className="bg-blue-600 w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/20">
                                  <Share size={20} />
                              </div>
                              <p className="text-sm font-bold text-white leading-tight">Toca el botón <strong>Compartir</strong> en la barra inferior de Safari.</p>
                          </div>
                          <div className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/10">
                              <div className="bg-indigo-600 w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-500/20">
                                  <PlusSquare size={20} />
                              </div>
                              <p className="text-sm font-bold text-white leading-tight">Busca y toca en <strong>"Añadir a la pantalla de inicio"</strong>.</p>
                          </div>
                      </div>
                  ) : deferredPrompt ? (
                      <div className="py-4">
                          <button 
                              onClick={handleInstallClick}
                              className="group w-full bg-white text-blue-700 py-6 rounded-[2.2rem] font-black text-sm uppercase tracking-widest shadow-2xl shadow-blue-900/40 flex items-center justify-center gap-4 active:scale-[0.96] transition-all overflow-hidden relative"
                          >
                              <DownloadCloud size={24} className="animate-bounce" />
                              <span>Instalar Ahora</span>
                              <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          </button>
                          <p className="mt-4 text-center text-[9px] font-black text-blue-200/40 uppercase tracking-[0.3em]">Procedimiento Seguro Certificado</p>
                      </div>
                  ) : (
                      <div className="space-y-5">
                          <p className="text-center text-xs font-black text-blue-200 uppercase tracking-widest mb-2">Pasos para tu navegador:</p>
                          <div className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/10">
                              <div className="bg-blue-600 w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/20">
                                  <Chrome size={20} />
                              </div>
                              <p className="text-sm font-bold text-white leading-tight">Abre el menú de opciones de tu navegador <br/><span className="text-[10px] text-blue-200/60 font-medium">(Tres puntos verticales)</span></p>
                          </div>
                          <div className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/10">
                              <div className="bg-indigo-600 w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-500/20">
                                  <PlusSquare size={20} />
                              </div>
                              <p className="text-sm font-bold text-white leading-tight">Toca en <strong>"Instalar aplicación"</strong> o realizar el paso manual.</p>
                          </div>
                      </div>
                  )}
              </div>

              {/* 🎬 CERRAR SESION BUTTON (Refined Elite Style) */}
              <div className="mt-10 flex flex-col items-center gap-6">
                  <button 
                    onClick={onLogout}
                    className="group px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full flex items-center gap-3 transition-all active:scale-95"
                  >
                    <LogOut size={14} className="text-blue-200" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">Cerrar Sesión</span>
                  </button>

                  <div className="flex flex-col items-center gap-2">
                     <span className="text-[9px] font-black text-white/30 tracking-[0.4em] mb-1">{version || 'V16.3.0'}</span>
                     <div className="h-1 w-8 bg-white/10 rounded-full"></div>
                  </div>
              </div>
          </div>
      </div>

      <style>{`
          @keyframes bounce-slow {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-10px); }
          }
          @keyframes float-x {
              0%, 100% { transform: translateX(0); opacity: 0.2; }
              50% { transform: translateX(-10px); opacity: 0.5; }
          }
          @keyframes float-x-reverse {
              0%, 100% { transform: translateX(0); opacity: 0.2; }
              50% { transform: translateX(10px); opacity: 0.5; }
          }
          .animate-bounce-slow { animation: bounce-slow 4s ease-in-out infinite; }
          .animate-float-x { animation: float-x 3s ease-in-out infinite; }
          .animate-float-x-reverse { animation: float-x-reverse 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

const TTHLogoSmall = () => (
    <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 bg-white/20 rounded-xl rotate-12 absolute animate-pulse"></div>
        <div className="relative z-10 font-black text-2xl italic tracking-tighter text-white drop-shadow-lg">TH</div>
    </div>
);

export default InstallPWA;
