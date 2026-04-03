import React, { useState } from 'react';
import { Fingerprint, ShieldCheck, X, AlertCircle, Sparkles } from 'lucide-react';
import { create } from '@github/webauthn-json';
import SecurityService from '../../services/securityService';

const BiometricEnrollModal = ({ onComplete, onCancel, theme }) => {
  const [loading, setLoading] = useState(false);
  const [preLoading, setPreLoading] = useState(false); // For "Preparing" state
  const [error, setError] = useState(null);
  const [diagInfo, setDiagInfo] = useState(null);
  const [success, setSuccess] = useState(false);
  const isDark = theme === 'dark';

  const handleActivate = async () => {
    // 🛡️ ANTI-DEBOUNCE PROTECTION (V63.5)
    if (loading || preLoading) return;
    
    setLoading(true);
    setError(null);
    setDiagInfo(null);
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('TIMEOUT_EXPIRED')), 60000)
    );

    try {
      // 🚀 USER GESTURE SYNC: Direct call within the click handler
      const authOptions = await SecurityService.getRegistrationOptions();
      
      const credentialPromise = create({ publicKey: authOptions });
      const credential = await Promise.race([credentialPromise, timeoutPromise]);

      await SecurityService.completeRegistration(credential);
      setSuccess(true);
      localStorage.setItem('hasBiometrics', 'true');
      setTimeout(() => onComplete(), 1500);
    } catch (err) {
      const errName = err.name || 'Error';
      const errMsg = err.message || '';

      if (errMsg === 'TIMEOUT_EXPIRED') {
          setError('El dispositivo no respondió (Timeout)');
          setDiagInfo('Asegura que tu biometría esté configurada.');
      } else if (errName === 'NotAllowedError') {
          setError('Operación cancelada o expirada.');
      } else if (errName === 'InvalidStateError') {
          // 🛡️ WebAuthn Duplicate Key Protection (V63.9)
          setError('Dispositivo ya vinculado');
          setDiagInfo('Este celular ya tiene biometría activa para TalenHuman.');
          // Auto-resolution: If it's already there, consider it a success and proceed
          setTimeout(() => {
              setSuccess(true);
              setTimeout(() => onComplete(), 1000);
          }, 1500);
      } else {
          setError(`Error: ${errName}`);
          setDiagInfo(errMsg.substring(0, 45));
      }
    } finally {
      setLoading(false);
    }
  };

  // 🛡️ UI PERSISTENCE: Hide global header/footer to prevent overlap (Elite Fix V63.6.7)
  React.useEffect(() => {
    const footer = document.getElementById('mobile-footer');
    const header = document.getElementById('mobile-header');
    if (footer) footer.style.display = 'none';
    if (header) header.style.display = 'none';
    
    return () => {
      if (footer) footer.style.display = 'block';
      if (header) header.style.display = 'flex';
    };
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', flexDirection: 'column',
      alignItems: 'center', background: isDark ? '#060914' : '#ffffff', fontFamily: "'Inter', sans-serif",
      overflowY: 'auto', minHeight: '100dvh', transition: 'background-color 0.4s'
    }}>
      
      {/* 🏔️ BRAND HEADER (ELITE PURPLE) + ESCAPE ROUTE (X) */}
      <div style={{
        width: '100%', background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        padding: '60px 40px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', color: 'white', borderBottomLeftRadius: '3.5rem', borderBottomRightRadius: '3.5rem',
        boxShadow: '0 20px 40px rgba(79, 70, 229, 0.25)', position: 'relative'
      }}>
         {/* ❌ ABSOLUTE CLOSE BUTTON (NEVER GET TRAPPED) */}
         <button 
            onClick={onCancel}
            style={{ 
                position: 'absolute', top: 'env(safe-area-inset-top, 20px)', right: '20px',
                width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)',
                border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', cursor: 'pointer', backdropFilter: 'blur(10px)'
            }}
         >
            <X size={20} />
         </button>

         <div style={{ 
            width: '80px', height: '80px', borderRadius: '28px', 
            background: 'rgba(255,255,255,0.2)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', marginBottom: '24px',
            boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
            animation: 'scaleIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
         }}>
            {success ? <ShieldCheck size={42} /> : <Fingerprint size={42} />}
         </div>
         <h2 style={{ fontSize: '28px', fontWeight: '900', margin: '0 0 8px', letterSpacing: '-0.5px' }}>
            {success ? '¡Acceso Vinculado!' : 'Biometría Talenhuman'}
         </h2>
         <p style={{ opacity: 0.8, fontSize: '15px', fontWeight: '500', margin: 0 }}>Talenhuman Security</p>
      </div>

      <div style={{ padding: '40px 32px', width: '100%', maxWidth: '400px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {success ? (
            <div style={{ textAlign: 'center', animation: 'scaleIn 0.5s ease' }}>
                <div style={{ color: '#10b981', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                   <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '20px', borderRadius: '30px' }}>
                      <Sparkles size={40} />
                   </div>
                   <h3 style={{ fontSize: '20px', fontWeight: '800', color: isDark ? '#ffffff' : '#1e293b' }}>Registro Completado</h3>
                   <p style={{ color: isDark ? 'rgba(255,255,255,0.4)' : '#64748b', fontSize: '14px', lineHeight: '1.6' }}>
                      Tu huella ha sido vinculada correctamente. <br/>Ahora podrás entrar mucho más rápido.
                   </p>
                </div>
            </div>
        ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', flex: 1 }}>
               <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: isDark ? '#ffffff' : '#1e293b', marginBottom: '12px' }}>Protege tu Acceso</h3>
                  <p style={{ fontSize: '14px', color: isDark ? 'rgba(255,255,255,0.4)' : '#64748b', lineHeight: '1.6', margin: 0 }}>
                    Vincula tu huella o reconocimiento facial para una experiencia más rápida y segura. 
                    Tus datos biométricos nunca salen de este dispositivo.
                  </p>
               </div>

               {error && (
                  <div style={{ 
                      background: isDark ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2', 
                      padding: '16px', borderRadius: '20px', 
                      border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2'}`,
                      animation: 'scaleIn 0.3s ease'
                  }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444', marginBottom: diagInfo ? '8px' : 0 }}>
                        <AlertCircle size={18} />
                        <span style={{ fontSize: '13px', fontWeight: '800' }}>{error}</span>
                     </div>
                     {diagInfo && <p style={{ fontSize: '11px', color: isDark ? 'rgba(239, 68, 68, 0.6)' : '#991b1b', margin: 0, fontWeight: '600' }}>{diagInfo}</p>}
                  </div>
               )}

               <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', marginTop: 'auto' }}>
                  <button 
                    onClick={handleActivate}
                    disabled={loading || preLoading}
                    className="no-select"
                    style={{
                      width: '100%', background: (loading || preLoading) ? (isDark ? '#1e293b' : '#e2e8f0') : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                      color: 'white', padding: '22px', borderRadius: '24px', fontSize: '16px',
                      fontWeight: '900', border: 'none', boxShadow: (loading || preLoading) ? 'none' : '0 12px 24px rgba(79, 70, 229, 0.3)',
                      cursor: (loading || preLoading) ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', transform: loading ? 'scale(0.98)' : 'scale(1)'
                    }}
                  >
                     {loading ? <div className="loading-spinner"></div> : <><Fingerprint size={20} /> <span>{preLoading ? 'Preparando...' : 'Vincular Huella'}</span></>}
                  </button>

                  <button 
                    onClick={onCancel} 
                    className="no-select"
                    style={{ 
                      background: 'transparent', border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`, 
                      color: isDark ? 'rgba(255,255,255,0.5)' : '#64748b', 
                      padding: '18px', borderRadius: '24px', fontSize: '14px', fontWeight: '700', 
                      cursor: 'pointer', width: '100%', transition: 'all 0.3s ease'
                    }}
                  >
                    Configurar más tarde
                  </button>
               </div>
            </div>
        )}
      </div>
      <style>{`
        .loading-spinner { width: 22px; height: 22px; border: 3px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite; } 
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
};

export default BiometricEnrollModal;
