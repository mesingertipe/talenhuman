import React, { useState, useEffect } from 'react';
import { Fingerprint, CheckCircle2, AlertCircle, ChevronRight, ShieldCheck } from 'lucide-react';
import { create } from '@github/webauthn-json';
import SecurityService from '../../services/SecurityService';

const BiometricEnrollModal = ({ onComplete, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [preLoading, setPreLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [authOptions, setAuthOptions] = useState(null);

  // 🚀 PRE-FETCH OPTIONS ON MOUNT (Android Gesture Prep)
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const options = await SecurityService.getRegistrationOptions();
        setAuthOptions(options);
      } catch (err) {
        console.error('Error pre-fetching options:', err);
        setError('No pudimos conectar con el servidor de seguridad. Reintenta.');
      } finally {
        setPreLoading(false);
      }
    };
    fetchOptions();
  }, []);

  const handleActivate = async () => {
    if (!authOptions) {
      setError('Las opciones de seguridad aún no están listas. Espera un segundo.');
      return;
    }

    setLoading(true);
    setError(null);
    
    // Safety timeout for Android (12 seconds)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('TIMEOUT')), 12000)
    );

    try {
      // 🚀 IMMEDIATE CALL TO CREATE (Gesture Valid)
      const credentialPromise = create({ publicKey: authOptions });
      
      const credential = await Promise.race([
        credentialPromise,
        timeoutPromise
      ]);

      // 3. Complete in backend
      await SecurityService.completeRegistration(credential);
      
      setSuccess(true);
      setTimeout(() => onComplete(), 1500);
    } catch (err) {
      console.error('Error detallado biometría:', err);
      if (err.message === 'TIMEOUT') {
         setError('El dispositivo no respondió. Intenta cerrar y abrir la app, o usa Chrome.');
      } else if (err.name === 'NotAllowedError') {
         setError('Operación cancelada o tiempo de espera agotado.');
      } else if (err.name === 'SecurityError' || (err.message && err.message.includes('rp.id'))) {
         setError(`Error de Dominio: El servidor espera talenhuman.com (FIDO2).`);
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
      
      {/* 🚀 ELITE BRAND HEADER (High Intensity Indigo) */}
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
        boxShadow: '0 20px 50px -10px rgba(124, 58, 237, 0.4)',
        zIndex: 10,
        borderRadius: '0 0 3rem 3rem'
      }}>
         <div style={{ position: 'relative', zIndex: 10, textAlign: 'center' }}>
            <div className={(loading || preLoading) ? "elite-pulse" : ""} style={{ 
              background: 'rgba(255,255,255,0.2)', padding: '25px', borderRadius: '35px', 
              backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)',
              display: 'inline-flex', marginBottom: '20px'
            }}>
               <Fingerprint size={56} />
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: '900', letterSpacing: '-1.5px', margin: 0 }}>Acceso Elite</h1>
            <p style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '4px', opacity: 0.6, marginTop: '8px' }}>SECURITY ECOSYSTEM</p>
         </div>
      </div>

      <div style={{ width: '100%', maxWidth: '400px', padding: '40px 30px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '40px', width: '100%' }}>
           {success ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                 <div style={{ background: '#ecfdf5', padding: '20px', borderRadius: '100px', color: '#10b981' }}>
                    <CheckCircle2 size={42} />
                 </div>
                 <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a' }}>¡Configurado!</h2>
              </div>
           ) : (
              <>
                 <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', letterSpacing: '-1px', marginBottom: '12px' }}>
                    Identidad <span style={{ color: '#4f46e5' }}>Segura</span>
                 </h2>
                 <p style={{ fontSize: '15px', color: '#64748b', lineHeight: '1.6', fontWeight: '500' }}>
                    Usa biometría nativa para entrar de forma instantánea y segura.
                 </p>
              </>
           )}
        </div>

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
                disabled={loading || preLoading}
                style={{
                  width: '100%',
                  background: (loading || preLoading) ? '#e2e8f0' : 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                  color: 'white',
                  padding: '22px',
                  borderRadius: '2.5rem',
                  fontSize: '16px',
                  fontWeight: '900',
                  border: 'none',
                  boxShadow: (loading || preLoading) ? 'none' : '0 20px 35px -10px rgba(124, 58, 237, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  cursor: (loading || preLoading) ? 'default' : 'pointer'
                }}
              >
                 {loading ? <div className="elite-spinner"></div> : (
                    <>
                       <span>{preLoading ? 'Preparando...' : 'Activar Biometría'}</span>
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
