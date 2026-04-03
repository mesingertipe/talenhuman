import React, { useState, useEffect } from 'react';
import { Fingerprint, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { create } from '@github/webauthn-json';
import SecurityService from '../../services/securityService';

const BiometricEnrollModal = ({ onComplete, onCancel, theme }) => {
  const [loading, setLoading] = useState(false);
  const [preLoading, setPreLoading] = useState(true);
  const [error, setError] = useState(null);
  const [diagInfo, setDiagInfo] = useState(null);
  const [success, setSuccess] = useState(false);
  const [authOptions, setAuthOptions] = useState(null);

  const isDark = theme === 'dark';

  // 🚀 ENVIRONMENT AUDIT
  useEffect(() => {
    const checkEnvironment = () => {
        if (!window.isSecureContext) return "Entorno Inseguro (HTTPS requerido)";
        if (!window.PublicKeyCredential) return "Biometría no soportada en este navegador";
        return null;
    };

    const fetchOptions = async () => {
      const envError = checkEnvironment();
      if (envError) {
          setError(envError);
          setPreLoading(false);
          return;
      }

      try {
        const options = await SecurityService.getRegistrationOptions();
        setAuthOptions(options);
      } catch (err) {
        setError('Servidor no disponible. Reintenta.');
        setDiagInfo(err.message?.substring(0, 50));
      } finally {
        setPreLoading(false);
      }
    };
    fetchOptions();
  }, []);

  const handleActivate = async () => {
    if (!authOptions) return;

    setLoading(true);
    setError(null);
    setDiagInfo(null);
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('TIMEOUT_EXPIRED')), 60000)
    );

    try {
      const credentialPromise = create({ publicKey: authOptions });
      const credential = await Promise.race([credentialPromise, timeoutPromise]);

      await SecurityService.completeRegistration(credential);
      setSuccess(true);
      setTimeout(() => onComplete(), 1500);
    } catch (err) {
      const errName = err.name || 'Error';
      const errMsg = err.message || '';

      if (errMsg === 'TIMEOUT_EXPIRED') {
          setError('El dispositivo no respondió (Timeout)');
          setDiagInfo('Asegura que tu biometría esté configurada.');
      } else if (errName === 'NotAllowedError') {
          setError('Operación cancelada o expirada.');
      } else {
          setError(`Error: ${errName}`);
          setDiagInfo(errMsg.substring(0, 45));
      }
    } finally {
      setLoading(false);
    }
  };

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
                border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)', cursor: 'pointer', zIndex: 100
            }}
         >
            <div style={{ fontSize: '24px', fontWeight: '300' }}>×</div>
         </button>

         <div style={{ 
            width: '80px', height: '80px', borderRadius: '24px', background: 'rgba(255,255,255,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px',
            backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)'
         }}>
             <Fingerprint size={44} strokeWidth={1.5} style={{ opacity: loading ? 0.5 : 1 }} />
         </div>
         <h1 style={{ fontSize: '28px', fontWeight: '900', letterSpacing: '-1px', margin: 0, textAlign: 'center' }}>Elite Identity</h1>
         <span style={{ fontSize: '11px', fontWeight: '800', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.15em', opacity: 0.7 }}>Secure Biometrics</span>
      </div>

      <div style={{ width: '100%', maxWidth: '400px', padding: '32px 24px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start' }}>

        <div style={{ textAlign: 'center', marginBottom: '32px', width: '100%' }}>
           {success ? (
              <div style={{ color: '#10b981', animation: 'scaleIn 0.5s ease-out' }}>
                 <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <CheckCircle2 size={36} />
                 </div>
                 <h2 style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '-0.5px', color: isDark ? '#ffffff' : '#1e293b' }}>¡Activado!</h2>
                 <p style={{ fontSize: '14px', color: isDark ? 'rgba(255,255,255,0.5)' : '#64748b', marginTop: '8px' }}>Tu huella ahora es tu llave maestra.</p>
              </div>
           ) : (
              <>
                 <h2 style={{ fontSize: '26px', fontWeight: '900', color: isDark ? '#ffffff' : '#1e293b', letterSpacing: '-0.8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <ShieldCheck size={28} style={{ color: '#4f46e5' }} /> Tu <span style={{ color: '#4f46e5' }}>Huella</span>
                 </h2>
                 <p style={{ fontSize: '15px', color: isDark ? 'rgba(255,255,255,0.5)' : '#64748b', marginTop: '12px', lineHeight: '1.6' }}>Olvida las claves. Accede de forma instantánea usando el sensor biométrico.</p>
              </>
           )}
        </div>

        {!success && (
           <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {error && (
                 <div style={{ 
                    background: isDark ? 'rgba(239, 68, 68, 0.08)' : '#fef2f2', 
                    borderLeft: `4px solid #ef4444`, 
                    padding: '16px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '4px' 
                 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}>
                        <AlertCircle size={18} />
                        <span style={{ fontSize: '13px', fontWeight: '800' }}>{error}</span>
                    </div>
                    {diagInfo && <p style={{ fontSize: '11px', color: isDark ? 'rgba(239, 68, 68, 0.6)' : '#991b1b', margin: 0, fontWeight: '600' }}>{diagInfo}</p>}
                 </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
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
