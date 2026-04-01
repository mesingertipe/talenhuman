import React from 'react';

const InstallPWA = ({ deferredPrompt, onLogout }) => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-blue-500 rounded-full blur-[120px] opacity-20 animate-pulse"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-indigo-500 rounded-full blur-[120px] opacity-20"></div>

      <div className="relative max-w-md w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl text-center transform transition-all hover:scale-[1.01]">
        <img src="/icon.png" alt="TalenHuman Logo" className="w-24 h-24 mx-auto rounded-2xl shadow-lg mb-6 ring-4 ring-indigo-500/30" />
        
        <h1 className="text-3xl font-extrabold mb-2 bg-gradient-to-r from-blue-200 to-indigo-100 bg-clip-text text-transparent italic">
          Elite V12 Mobile
        </h1>
        <p className="text-blue-100/70 text-lg mb-8 leading-relaxed">
          Para acceder a tus turnos, biometría y marcaciones, debes instalar la aplicación en tu celular.
        </p>

        {isIOS ? (
          <div className="space-y-6 text-left animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-indigo-300 font-semibold mb-2">Pasos para instalar en iOS:</h2>
            <div className="flex items-center space-x-4 bg-white/5 p-4 rounded-xl border border-white/10">
              <div className="bg-blue-500 rounded-lg p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </div>
              <p className="text-sm">Toca el icono de <strong>Compartir</strong> en la barra inferior.</p>
            </div>
            <div className="flex items-center space-x-4 bg-white/5 p-4 rounded-xl border border-white/10">
              <div className="bg-indigo-500 rounded-lg p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p className="text-sm">Selecciona <strong>"Añadir a pantalla de inicio"</strong>.</p>
            </div>
          </div>
        ) : (
          <div className="animate-in zoom-in duration-500">
            <button 
              onClick={handleInstall}
              disabled={!deferredPrompt}
              className={`w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all flex items-center justify-center space-x-3 shadow-xl ${
                deferredPrompt 
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95' 
                : 'bg-white/10 cursor-not-allowed opacity-50'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Instalar Aplicación</span>
            </button>
            {!deferredPrompt && (
              <p className="text-xs text-blue-200/40 mt-4 italic">Si ya está instalada, ábrela desde tu menú de aplicaciones.</p>
            )}
          </div>
        )}

        <button 
          onClick={onLogout}
          className="mt-8 text-sm text-blue-300/60 hover:text-white underline transition-colors"
        >
          Cerrar sesión y salir
        </button>
      </div>

      <p className="absolute bottom-6 text-xs text-white/20">
        TalenHuman Elite V12 &copy; 2026 | Powered by Next-Gen Architecture
      </p>
    </div>
  );
};

export default InstallPWA;
