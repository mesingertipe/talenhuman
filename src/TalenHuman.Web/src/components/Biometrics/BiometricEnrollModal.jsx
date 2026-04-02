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
      
      {/* 🏔️ BRAND HEADER (INDIGO) */}
      <div style={{
        width: '100%', background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
        padding: '70px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', color: 'white', borderBottomLeftRadius: '3.5rem', borderBottomRightRadius: '3.5rem',
        boxShadow: '0 20px 30px -10px rgba(79, 70, 229, 0.3)'
      }}>
         <Fingerprint size={72} strokeWidth={1.2} style={{ marginBottom: '24px', opacity: loading ? 0.5 : 1 }} />
         <h1 style={{ fontSize: '30px', fontWeight: '800', letterSpacing: '-1px', margin: 0, textAlign: 'center' }}>Acceso Seguro</h1>
      </div>

      <div style={{ width: '100%', maxWidth: '400px', padding: '40px 32px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>

        <div style={{ textAlign: 'center', marginBottom: '40px', width: '100%' }}>
           {success ? (
              <div style={{ color: '#10b981', animation: 'scaleIn 0.5s ease-out' }}>
                 <CheckCircle2 size={64} style={{ margin: '0 auto 15px' }} />
                 <h2 style={{ fontSize: '26px', fontWeight: '800', letterSpacing: '-0.5px' }}>¡Todo Listo!</h2>
                 <p style={{ fontSize: '15px', color: isDark ? 'rgba(255,255,255,0.5)' : '#64748b', marginTop: '10px' }}>Tu biometría ha sido vinculada correctamente.</p>
              </div>
           ) : (
              <>
                 <h2 style={{ fontSize: '26px', fontWeight: '800', color: isDark ? '#ffffff' : '#1e293b', letterSpacing: '-0.8px' }}>Tu <span style={{ color: '#4f46e5' }}>Huella</span> es la Clave</h2>
                 <p style={{ fontSize: '15px', color: isDark ? 'rgba(255,255,255,0.5)' : '#64748b', marginTop: '12px', lineHeight: '1.6' }}>Olvida las contraseñas. Accede de forma instantánea usando el sensor biométrico de tu dispositivo.</p>
              </>
           )}
        </div>

        {!success && (
           <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {error && (
                 <div style={{ 
                    background: isDark ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2', 
                    border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2'}`, 
                    padding: '16px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '4px' 
                 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}>
                        <AlertCircle size={18} />
                        <span style={{ fontSize: '13px', fontWeight: '700' }}>{error}</span>
                    </div>
                    {diagInfo && <p style={{ fontSize: '11px', color: isDark ? 'rgba(239, 68, 68, 0.6)' : '#991b1b', margin: 0 }}>{diagInfo}</p>}
                 </div>
              )}

              <button 
                onClick={handleActivate}
                disabled={loading || preLoading}
                style={{
                  width: '100%', background: (loading || preLoading) ? (isDark ? '#1e293b' : '#e2e8f0') : '#4f46e5',
                  color: 'white', padding: '20px', borderRadius: '24px', fontSize: '16px',
                  fontWeight: '700', border: 'none', boxShadow: (loading || preLoading) ? 'none' : '0 15px 30px -10px rgba(79, 70, 229, 0.4)',
                  cursor: (loading || preLoading) ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  transition: 'all 0.3s ease'
                }}
              >
                 {loading ? <div className="loading-spinner"></div> : <span>{preLoading ? 'Preparando...' : 'Activar Biometría'}</span>}
              </button>

              <button 
                onClick={onCancel} 
                style={{ 
                  background: 'none', border: 'none', color: isDark ? 'rgba(255,255,255,0.4)' : '#64748b', 
                  fontSize: '14px', fontWeight: '600', cursor: 'pointer', padding: '12px', width: '100%', 
                  transition: 'color 0.2s' 
                }}
              >
                Configurar más tarde
              </button>
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
