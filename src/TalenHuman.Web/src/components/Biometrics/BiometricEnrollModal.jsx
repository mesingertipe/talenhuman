import React, { useState, useEffect } from 'react';
import { Fingerprint, CheckCircle2, AlertCircle, ChevronRight, ShieldCheck, HelpCircle } from 'lucide-react';
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
    
    // Safety timeout for Android (15 seconds)
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
      // 🚀 EXTREME DIAGNOSTIC MAPPING
      const errName = err.name || 'Error';
      const errMsg = err.message || '';

      if (errMsg === 'TIMEOUT_EXPIRED') {
          setError('El dispositivo no respondió (Timeout)');
          setDiagInfo('Asegura que tu huella esté configurada en el sistema Android.');
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
      
      {/* 🚀 ELITE BRAND HEADER */}
      <div style={{
        width: '100%', background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
        padding: '70px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', color: 'white', borderRadius: '0 0 3rem 3rem'
      }}>
         <Fingerprint size={56} style={{ marginBottom: '20px', opacity: loading ? 0.5 : 1 }} />
         <h1 style={{ fontSize: '32px', fontWeight: '900', letterSpacing: '-1.5px', margin: 0 }}>Acceso Elite</h1>
         <p style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '4px', opacity: 0.6, marginTop: '8px' }}>V16.7.7 EXTREME</p>
      </div>

      <div style={{ width: '100%', maxWidth: '400px', padding: '40px 30px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '40px', width: '100%' }}>
           {success ? (
              <div style={{ color: '#10b981' }}>
                 <CheckCircle2 size={52} style={{ margin: '0 auto 15px' }} />
                 <h2 style={{ fontSize: '28px', fontWeight: '900' }}>¡Éxito!</h2>
              </div>
           ) : (
              <>
                 <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a' }}>Identidad <span style={{ color: '#4f46e5' }}>Segura</span></h2>
                 <p style={{ fontSize: '15px', color: '#64748b', marginTop: '10px' }}>Usa biometría nativa para entrar instantáneamente.</p>
              </>
           )}
        </div>

        {!success && (
           <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {error && (
                 <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', padding: '18px', borderRadius: '25px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444' }}>
                        <AlertCircle size={20} />
                        <span style={{ fontSize: '13px', fontWeight: '900' }}>{error}</span>
                    </div>
                    {diagInfo && <p style={{ fontSize: '11px', color: '#991b1b', margin: 0, fontWeight: '500', opacity: 0.8 }}>{diagInfo}</p>}
                 </div>
              )}

              <button 
                onClick={handleActivate}
                disabled={loading || preLoading}
                style={{
                  width: '100%', background: (loading || preLoading) ? '#e2e8f0' : 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                  color: 'white', padding: '22px', borderRadius: '2.5rem', fontSize: '17px',
                  fontWeight: '900', border: 'none', boxShadow: (loading || preLoading) ? 'none' : '0 20px 35px -10px rgba(124, 58, 237, 0.4)',
                  cursor: (loading || preLoading) ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px'
                }}
              >
                 {loading ? <div className="elite-spinner"></div> : <span>{preLoading ? 'Verificando...' : 'Activar Biometría'}</span>}
              </button>

              <button onClick={onCancel} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '11px', fontWeight: '800', cursor: 'pointer', letterSpacing: '2px' }}>
                CONFIGURAR DESPUÉS
              </button>
           </div>
        )}

        <div style={{ marginTop: '50px', display: 'flex', alignItems: 'center', gap: '10px', opacity: 0.3 }}>
           <ShieldCheck size={18} />
           <span style={{ fontSize: '9px', fontWeight: '900', letterSpacing: '3px' }}>ELITE COMPATIBILITY V16.7.7</span>
        </div>
      </div>
      <style>{`.elite-spinner { width: 22px; height: 22px; border: 3px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default BiometricEnrollModal;
