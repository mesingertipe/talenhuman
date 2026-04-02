import React, { useEffect, useState } from 'react';
import { Share, PlusSquare, Smartphone, LogOut, DownloadCloud, ChevronRight, ArrowRight, Chrome, RefreshCw } from 'lucide-react';
import TalenHumanLogo from '../Shared/TalenHumanLogo';

const InstallPWA = ({ onLogout, version }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  
  // 🚀 STRICT PLATFORM DETECTION
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isChrome = /Chrome/i.test(navigator.userAgent) && !/Edge|OPR/i.test(navigator.userAgent);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log('Fired beforeinstallprompt');
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
        window.location.reload(); // Fallback: Force refresh to catch event
        return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', flexDirection: 'column',
      alignItems: 'center', background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
      fontFamily: "'Outfit', 'Inter', sans-serif", color: '#ffffff', overflowY: 'auto'
    }}>
      
      {/* 🎬 LOGO & VERSION */}
      <div style={{ width: '100%', paddingTop: '60px', paddingBottom: '30px', textAlign: 'center', zIndex: 10 }}>
          <TalenHumanLogo size={70} type="icon" />
          <h1 style={{ fontSize: '32px', fontWeight: '900', letterSpacing: '-1.5px', margin: '15px 0 0 0' }}>TalenHuman</h1>
          <p style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '4px', opacity: 0.6 }}>ECOSYSTEM {version}</p>
      </div>

      <div style={{ width: '100%', maxWidth: '380px', padding: '0 25px 40px 25px', zIndex: 20 }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '45px', padding: '40px 30px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            display: 'flex', flexDirection: 'column', gap: '25px'
          }}>
              
              <div style={{ textAlign: 'center' }}>
                  <h2 style={{ fontSize: '24px', fontWeight: '800' }}>{isIOS ? 'Añadir a Pantalla' : 'Instalar Aplicación'}</h2>
                  <p style={{ fontSize: '14px', opacity: 0.8, marginTop: '10px', lineHeight: '1.5', fontWeight: '500' }}>
                    Para una experiencia fluida y sin flasheos, instala TalenHuman en tu dispositivo.
                  </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {isIOS ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <InstructionStep icon={<Share size={18}/>} text="Toca 'Compartir' en Safari" />
                          <InstructionStep icon={<PlusSquare size={18}/>} text="Busca 'Añadir a pantalla de inicio'" />
                      </div>
                  ) : deferredPrompt ? (
                      <button 
                          onClick={handleInstallClick}
                          style={{
                              width: '100%', background: '#ffffff', color: '#4f46e5', padding: '20px',
                              borderRadius: '2.5rem', fontSize: '16px', fontWeight: '900', border: 'none',
                              boxShadow: '0 15px 30px -5px rgba(255, 255, 255, 0.2)', display: 'flex',
                              alignItems: 'center', justifyContent: 'center', gap: '12px', cursor: 'pointer'
                          }}
                      >
                          <DownloadCloud size={22} />
                          Instalar Ahora
                      </button>
                  ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                          <InstructionStep icon={<Chrome size={18}/>} text="Toca los tres puntos de Chrome" />
                          <InstructionStep icon={<PlusSquare size={18}/>} text="Busca 'Instalar aplicación'" />
                          <button 
                            onClick={() => window.location.reload()}
                            style={{ 
                                marginTop: '10px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', 
                                color: 'white', padding: '12px', borderRadius: '100px', fontSize: '11px', fontWeight: '800', 
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                            }}
                          >
                             <RefreshCw size={14} /> reintentar botón nativo
                          </button>
                      </div>
                  )}
              </div>

              <div style={{ textAlign: 'center' }}>
                  <button 
                    onClick={onLogout}
                    style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    CERRAR SESIÓN
                  </button>
              </div>
          </div>
      </div>
    </div>
  );
};

const InstructionStep = ({ icon, text }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '25px', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '15px', background: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {icon}
        </div>
        <span style={{ fontSize: '13px', fontWeight: '600' }}>{text}</span>
    </div>
);

export default InstallPWA;
