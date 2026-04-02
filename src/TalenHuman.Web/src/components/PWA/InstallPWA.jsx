import React, { useEffect, useState } from 'react';
import { Share, PlusSquare, Smartphone, LogOut, DownloadCloud, ChevronRight, ArrowRight, Chrome } from 'lucide-react';
import TalenHumanLogo from '../Shared/TalenHumanLogo';

const InstallPWA = ({ onLogout, version }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
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
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
      fontFamily: "'Outfit', 'Inter', sans-serif",
      color: '#ffffff',
      overflowY: 'auto',
      WebkitUserSelect: 'none',
      userSelect: 'none'
    }}>
      
      {/* 🚀 GLOW ELEMENTS */}
      <div style={{
        position: 'absolute', top: '-10%', right: '-10%', width: '300px', height: '300px',
        background: 'rgba(255, 255, 255, 0.1)', borderRadius: '50%', filter: 'blur(80px)'
      }}></div>

      {/* 🎬 LOGO & TITLE */}
      <div style={{ width: '100%', paddingTop: '60px', paddingBottom: '30px', textAlign: 'center', position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <TalenHumanLogo size={70} type="icon" />
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: '900', letterSpacing: '-1.5px', margin: '15px 0 0 0' }}>TalenHuman</h1>
          <p style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '3px', opacity: 0.6, marginTop: '8px' }}>SMART ENTERPRISE SYSTEM</p>
      </div>

      {/* 🎬 CRYSTAL CARD */}
      <div style={{ width: '100%', maxWidth: '380px', padding: '0 25px 40px 25px', position: 'relative', zIndex: 20 }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '45px',
            padding: '40px 30px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '30px'
          }}>
              
              <div style={{ textAlign: 'center' }}>
                  <h2 style={{ fontSize: '24px', fontWeight: '800', lineHeight: '1.2' }}>¡Instala la aplicación!</h2>
                  <p style={{ fontSize: '14px', opacity: 0.8, marginTop: '12px', lineHeight: '1.5', fontWeight: '500' }}>
                    Obtén una experiencia nativa y notificaciones en tiempo real instalando TalenHuman ahora.
                  </p>
              </div>

              {/* Steps Illustration Placeholder (Phone) */}
              <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
                 <div className="elite-floating-phone" style={{
                    width: '80px', height: '140px', background: '#0f172a', borderRadius: '25px',
                    border: '3px solid #1e293b', position: 'relative', padding: '5px'
                 }}>
                    <div style={{ width: '30px', height: '3px', background: '#1e293b', borderRadius: '10px', margin: '0 auto 8px auto' }}></div>
                    <div style={{ 
                      width: '100%', height: '100px', borderRadius: '18px', 
                      background: 'linear-gradient(to bottom, #4f46e5, #7c3aed)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                       <Smartphone size={24} style={{ opacity: 0.5 }} />
                    </div>
                 </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {isIOS ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                          <InstructionStep icon={<Share size={18}/>} text="Toca 'Compartir' en Safari" />
                          <InstructionStep icon={<PlusSquare size={18}/>} text="Busca 'Añadir a pantalla de inicio'" />
                      </div>
                  ) : deferredPrompt ? (
                      <button 
                          onClick={handleInstallClick}
                          style={{
                              width: '100%',
                              background: '#ffffff',
                              color: '#4f46e5',
                              padding: '20px',
                              borderRadius: '2.5rem',
                              fontSize: '16px',
                              fontWeight: '900',
                              border: 'none',
                              boxShadow: '0 15px 30px -5px rgba(255, 255, 255, 0.2)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '12px',
                              cursor: 'pointer',
                              transition: 'transform 0.2s ease'
                          }}
                          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.96)'}
                          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                          <DownloadCloud size={22} />
                          Instalar ahora
                      </button>
                  ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                          <InstructionStep icon={<Chrome size={18}/>} text="Toca los tres puntos de tu navegador" />
                          <InstructionStep icon={<PlusSquare size={18}/>} text="Selecciona 'Instalar aplicación'" />
                      </div>
                  )}
              </div>

              <div style={{ textAlign: 'center', marginTop: '10px' }}>
                  <button 
                    onClick={onLogout}
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'rgba(255,255,255,0.7)',
                      padding: '12px 30px',
                      borderRadius: '100px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Cerrar sesión segura
                  </button>
                  <p style={{ fontSize: '9px', fontWeight: '800', opacity: 0.3, marginTop: '25px', letterSpacing: '4px' }}>
                    {version || 'V16.3.0-ELITE'}
                  </p>
              </div>
          </div>
      </div>

      <style>{`
          @keyframes float {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-10px); }
          }
          .elite-floating-phone {
              animation: float 4s ease-in-out infinite;
              box-shadow: 0 40px 60px -15px rgba(0, 0, 0, 0.3);
          }
      `}</style>
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
