import React, { useState, useEffect } from 'react';
import { Fingerprint, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { create } from '@github/webauthn-json';
import SecurityService from '../../services/securityService';

const BiometricEnrollModal = ({ onComplete, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [preLoading, setPreLoading] = useState(true);
  const [error, setError] = useState(null);
  const [diagInfo, setDiagInfo] = useState(null);
  const [success, setSuccess] = useState(false);
  const [authOptions, setAuthOptions] = useState(null);

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
    
    // Safety timeout for mobile (15 seconds)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('TIMEOUT_EXPIRED')), 15000)
    );

    try {
      const credentialPromise = create({ publicKey: authOptions });
      const credential = await Promise.race([credentialPromise, timeoutPromise]);

      await SecurityService.completeRegistration(credential);
      setSuccess(true);
      setTimeout(() => onComplete(), 1500);
    } catch (err) {
      console.error('DIAGNOSTIC:', err);
      const errName = err.name || 'Error';
      const errMsg = err.message || '';

      if (errMsg === 'TIMEOUT_EXPIRED') {
          setError('El dispositivo no respondió (Timeout)');
          setDiagInfo('Asegura que tu huella esté configurada en el sistema.');
      } else if (errName === 'NotAllowedError') {
          setError('Operación cancelada o expirada.');
      } else if (errName === 'SecurityError') {
          setError('Bloqueo de Seguridad (RP ID Mismatch)');
          setDiagInfo(`Dominio: ${window.location.hostname}`);
      } else if (errName === 'NotSupportedError') {
          setError('Hardware No Compatible (FIDO2)');
          setDiagInfo('Este dispositivo no soporta el estándar de seguridad requerido.');
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
      alignItems: 'center', background: '#ffffff', fontFamily: "'Outfit', 'Inter', sans-serif",
      overflowY: 'auto', minHeight: '100dvh'
    }}>
      
      {/* 🚀 CLEAN BRAND HEADER (NO ELITE) */}
      <div style={{
        width: '100%', background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
        padding: '70px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', color: 'white', borderBottomLeftRadius: '3rem', borderBottomRightRadius: '3rem',
        boxShadow: '0 20px 25px -5px rgba(124, 58, 237, 0.3)'
      }}>
         <Fingerprint size={64} strokeWidth={1.5} style={{ marginBottom: '20px', opacity: loading ? 0.5 : 1, filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.2))' }} />
         <h1 style={{ fontSize: '32px', fontWeight: '900', letterSpacing: '-1.5px', margin: 0 }}>Acceso Biométrico</h1>
      </div>

      <div style={{ width: '100%', maxWidth: '400px', padding: '40px 30px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '40px', width: '100%' }}>
           {success ? (
              <div style={{ color: '#10b981', animation: 'scaleIn 0.5s ease-out' }}>
                 <CheckCircle2 size={64} style={{ margin: '0 auto 15px' }} />
                 <h2 style={{ fontSize: '28px', fontWeight: '900' }}>¡Completado!</h2>
                 <p style={{ fontSize: '15px', color: '#64748b', marginTop: '10px' }}>Tu huella ha sido registrada de forma segura.</p>
              </div>
           ) : (
              <>
                 <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', letterSpacing: '-1px' }}>Tu Huella es la Clave</h2>
                 <p style={{ fontSize: '15px', color: '#64748b', marginTop: '12px', lineHeight: '1.6' }}>Olvida las contraseñas. Accede a tu cuenta de manera instantánea y segura usando tu huella dactilar o rostro nativo.</p>
              </>
           )}
        </div>

        {!success && (
           <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {error && (
                 <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', padding: '15px', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}>
                        <AlertCircle size={18} />
                        <span style={{ fontSize: '13px', fontWeight: '800' }}>{error}</span>
                    </div>
                    {diagInfo && <p style={{ fontSize: '11px', color: '#991b1b', margin: 0, fontWeight: '500', opacity: 0.8 }}>{diagInfo}</p>}
                 </div>
              )}

              <button 
                onClick={handleActivate}
                disabled={loading || preLoading}
                style={{
                  width: '100%', background: (loading || preLoading) ? '#e2e8f0' : 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                  color: 'white', padding: '20px', borderRadius: '2rem', fontSize: '16px',
                  fontWeight: '800', border: 'none', boxShadow: (loading || preLoading) ? 'none' : '0 15px 30px -10px rgba(124, 58, 237, 0.4)',
                  cursor: (loading || preLoading) ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  transition: 'all 0.2s ease'
                }}
              >
                 {loading ? <div className="loading-spinner"></div> : <span>{preLoading ? 'Preparando...' : 'Activar Biometría'}</span>}
              </button>

              <button 
                onClick={onCancel} 
                style={{ 
                  background: 'none', border: 'none', color: '#64748b', fontSize: '13px', fontWeight: '700', 
                  cursor: 'pointer', padding: '15px', width: '100%', borderRadius: '2rem', transition: 'background 0.2s' 
                }}
              >
                Configurar Más Tarde
              </button>
           </div>
        )}
      </div>
      <style>{`
        .loading-spinner { width: 20px; height: 20px; border: 3px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite; } 
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
};

export default BiometricEnrollModal;
