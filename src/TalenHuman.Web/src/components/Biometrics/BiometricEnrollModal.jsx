import React, { useState } from 'react';
import { Fingerprint, CheckCircle2, AlertCircle, ChevronRight, ShieldCheck } from 'lucide-react';
import SecurityService from '../../services/securityService';

const BiometricEnrollModal = ({ onComplete, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleActivate = async () => {
    setLoading(true);
    setError(null);
    try {
      await SecurityService.registerBiometrics();
      setSuccess(true);
      setTimeout(() => onComplete(), 1500);
    } catch (err) {
      console.error('Error detallado biometría:', err);
      // 🚀 DETAILED ERROR ANALYSIS
      if (err.name === 'NotAllowedError') {
         setError('La operación fue cancelada o el usuario no respondió a tiempo.');
      } else if (err.name === 'SecurityError' || (err.message && err.message.includes('rp.id'))) {
         setError(`Error de Dominio (${err.name}): Verifica que estás en talenhuman.com y no en una IP o www.`);
      } else if (err.name === 'NotSupportedError') {
         setError('Este dispositivo no es compatible con el acceso biométrico seguro FIDO2.');
      } else {
         setError(`Error técnico: ${err.name || 'Fallo'} - ${err.message || 'Intenta de nuevo.'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      background: '#ffffff',
      fontFamily: "'Outfit', 'Inter', sans-serif",
      overflowY: 'auto',
      WebkitUserSelect: 'none',
      userSelect: 'none',
      minHeight: '100dvh'
    }}>
      
      {/* 🚀 ELITE BRAND HEADER (Consistent with Login) */}
      <div style={{
        width: '100%',
        background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
        padding: '70px 40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        position: 'relative',
        boxShadow: '0 20px 40px -10px rgba(79, 70, 229, 0.4)',
        zIndex: 10
      }}>
         <div style={{
           position: 'absolute', top: '-50%', right: '-20%', width: '300px', height: '300px',
           background: 'rgba(255, 255, 255, 0.1)', borderRadius: '50%', filter: 'blur(80px)'
         }}></div>
         
         <div style={{ position: 'relative', zIndex: 10, textAlign: 'center' }}>
            <div className={loading ? "elite-pulse" : ""} style={{ 
              background: 'rgba(255,255,255,0.2)', padding: '25px', borderRadius: '35px', 
              backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)',
              display: 'inline-flex', marginBottom: '20px'
            }}>
               <Fingerprint size={56} />
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: '900', letterSpacing: '-1.5px', margin: 0 }}>Acceso Biométrico</h1>
            <p style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '4px', opacity: 0.6, marginTop: '8px' }}>SECURITY ECOSYSTEM</p>
         </div>
      </div>

      <div style={{ width: '100%', maxWidth: '400px', padding: '40px 30px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        
        {/* 🎬 STATUS / HEADER TEXT */}
        <div style={{ textAlign: 'center', marginBottom: '40px', width: '100%' }}>
           {success ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                 <div style={{ background: '#ecfdf5', padding: '20px', borderRadius: '100px', color: '#10b981' }}>
                    <CheckCircle2 size={42} />
                 </div>
                 <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a' }}>¡Configurado!</h2>
                 <p style={{ fontSize: '15px', color: '#64748b', fontWeight: '600' }}>Sincronizando con el servidor...</p>
              </div>
           ) : (
              <>
                 <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', letterSpacing: '-1px', marginBottom: '12px' }}>
                   Tu <span style={{ color: '#4f46e5' }}>Huella</span> es la Clave
                 </h2>
                 <p style={{ fontSize: '15px', color: '#64748b', lineHeight: '1.6', fontWeight: '500' }}>
                   Usa FaceID o Huella Digital para entrar de forma segura sin recordar contraseñas.
                 </p>
              </>
           )}
        </div>

        {/* 🎬 MAIN ACTIONS */}
        {!success && (
           <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {error && (
                 <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', padding: '15px', borderRadius: '25px', display: 'flex', alignItems: 'center', gap: '12px', color: '#ef4444' }}>
                    <AlertCircle size={20} />
                    <p style={{ fontSize: '12px', fontWeight: '800', margin: 0 }}>{error}</p>
                 </div>
              )}

              <button 
                onClick={handleActivate}
                disabled={loading}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                  color: 'white',
                  padding: '22px',
                  borderRadius: '2.5rem',
                  fontSize: '16px',
                  fontWeight: '900',
                  border: 'none',
                  boxShadow: '0 20px 35px -10px rgba(79, 70, 229, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  cursor: 'pointer'
                }}
              >
                 {loading ? <div className="elite-spinner"></div> : (
                    <>
                       <span>Activar Biometría</span>
                       <ChevronRight size={20} />
                    </>
                 )}
              </button>

              <button 
                onClick={onCancel}
                style={{
                  background: 'none', border: 'none', color: '#94a3b8',
                  padding: '10px', fontSize: '11px', fontWeight: '800',
                  cursor: 'pointer', letterSpacing: '2px'
                }}
              >
                CONFIGURAR DESPUÉS
              </button>
           </div>
        )}

        <div style={{ marginTop: '50px', paddingTop: '30px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '10px', opacity: 0.3 }}>
           <ShieldCheck size={18} />
           <span style={{ fontSize: '9px', fontWeight: '900', letterSpacing: '3px' }}>ELITE SECURITY CORE</span>
        </div>
      </div>

      <style>{`
          @keyframes elite-pulse {
              0%, 100% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.05); opacity: 0.8; }
          }
          .elite-pulse { animation: elite-pulse 2s ease-in-out infinite; }
          .elite-spinner {
            width: 24px; height: 24px; border: 3px solid rgba(255,255,255,0.3);
            border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default BiometricEnrollModal;
