import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Lock, CheckCircle2, ChevronDown, ShieldAlert, LogOut } from 'lucide-react';
import api from '../../services/api';

const PrivacyConsentModal = ({ onAccepted, onLogout, policyText }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showScrollHint, setShowScrollHint] = useState(true);
  const scrollRef = useRef(null);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 30) {
        setShowScrollHint(false);
      }
    }
  };

  const handleAccept = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.post('/Security/privacy-accept');
      onAccepted();
    } catch (err) {
      setError('Error al procesar. Reintenta.');
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
      background: '#f8fafc',
      fontFamily: "'Outfit', 'Inter', sans-serif",
      overflow: 'hidden',
      WebkitUserSelect: 'none',
      userSelect: 'none'
    }}>
      
      {/* 🚀 ELITE BRAND HEADER */}
      <div style={{
        width: '100%',
        background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
        padding: '60px 40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        position: 'relative',
        boxShadow: '0 20px 30px -10px rgba(79, 70, 229, 0.4)',
        zIndex: 10
      }}>
         <div style={{
           position: 'absolute', top: '-50%', right: '-30%', width: '300px', height: '300px',
           background: 'rgba(255, 255, 255, 0.1)', borderRadius: '50%', filter: 'blur(100px)'
         }}></div>
         
         <div style={{ position: 'relative', zIndex: 10, textAlign: 'center' }}>
            <div style={{ 
              background: 'rgba(255,255,255,0.2)', padding: '20px', borderRadius: '30px', 
              backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)',
              display: 'inline-flex', marginBottom: '15px'
            }}>
               <ShieldCheck size={40} />
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: '900', letterSpacing: '-1.5px', margin: 0 }}>Tu Privacidad</h1>
            <span style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '4px', opacity: 0.6 }}>SEGURIDAD CERTIFICADA</span>
         </div>
      </div>

      {/* 🎬 MAIN CONTENT */}
      <div style={{
        width: '100%', maxWidth: '500px', padding: '30px 25px 40px 25px',
        flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
           <h2 style={{ fontSize: '26px', fontWeight: '900', color: '#1e293b', letterSpacing: '-1px' }}>
             Tus datos están <span style={{ color: '#4f46e5' }}>Protegidos</span>
           </h2>
           <p style={{ fontSize: '14px', color: '#64748b', fontWeight: '600', marginTop: '5px' }}>
             Es obligatorio aceptar para continuar
           </p>
        </div>

        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          style={{
            flex: 1, overflowY: 'auto', background: 'white',
            borderRadius: '40px', padding: '30px', border: '1px solid #f1f5f9',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05)', position: 'relative'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
              {policyText ? (
                <div style={{ 
                  background: 'rgba(255,255,255,0.8)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '35px',
                  padding: '35px',
                  border: '1px solid #f1f5f9',
                  boxShadow: '0 20px 40px -15px rgba(0,0,0,0.05)'
                }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px', opacity: 0.8 }}>
                      <div style={{ background: '#eff6ff', color: '#3b82f6', padding: '10px', borderRadius: '15px' }}><ShieldCheck size={20}/></div>
                      <span style={{ fontSize: '11px', fontWeight: '900', letterSpacing: '2px', color: '#64748b' }}>TEXTO OFICIAL CONFIGURADO</span>
                   </div>
                   <div style={{ 
                      fontSize: '15px', color: '#1e293b', lineHeight: '1.9', 
                      whiteSpace: 'pre-wrap', fontWeight: '500',
                      fontFamily: "'Inter', sans-serif"
                   }}>
                      {policyText}
                   </div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: '20px' }}>
                    <div style={{ background: '#eff6ff', color: '#3b82f6', padding: '15px', borderRadius: '20px' }}><ShieldCheck size={24}/></div>
                    <div>
                        <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b', margin: '0 0 5px 0' }}>Privacidad por Diseño</h3>
                        <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.6', margin: 0 }}>Tus datos biométricos están encriptados y protegidos bajo estándares internacionales.</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '20px' }}>
                    <div style={{ background: '#f5f3ff', color: '#7c3aed', padding: '15px', borderRadius: '20px' }}><Lock size={24}/></div>
                    <div>
                        <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b', margin: '0 0 5px 0' }}>Uso Limitado</h3>
                        <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.6', margin: 0 }}>Solo usaremos tu información para el control de asistencia y seguridad operativa.</p>
                    </div>
                  </div>
                </>
              )}
              
              <div style={{ 
                background: '#fffbeb', border: '1px solid #fef3c7', padding: '20px', 
                borderRadius: '30px', display: 'flex', gap: '15px', alignItems: 'center'
              }}>
                 <ShieldAlert size={28} style={{ color: '#f59e0b', shrink: 0 }} />
                 <p style={{ fontSize: '12px', color: '#92400e', fontWeight: '700', margin: 0, lineHeight: '1.4' }}>
                   Al continuar, aceptas explícitamente el tratamiento de tus datos personales.
                 </p>
              </div>
          </div>

          {showScrollHint && (
             <div style={{
               position: 'sticky', bottom: '10px', display: 'flex', justifyContent: 'center', pointerEvents: 'none'
             }}>
                <div className="elite-bounce" style={{
                  background: '#4f46e5', color: 'white', padding: '10px', borderRadius: '100px',
                  boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.4)'
                }}>
                   <ChevronDown size={20} />
                </div>
             </div>
          )}
        </div>

        {/* 🎬 ACTION BUTTONS */}
        <div style={{ paddingTop: '30px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {error && <p style={{ color: '#ef4444', textAlign: 'center', fontSize: '12px', fontWeight: '900' }}>{error}</p>}
          
          <button 
            onClick={handleAccept}
            disabled={loading}
            style={{
              width: '100%',
              background: '#4f46e5',
              color: 'white',
              padding: '22px',
              borderRadius: '2.5rem',
              fontSize: '16px',
              fontWeight: '900',
              border: 'none',
              boxShadow: '0 20px 25px -5px rgba(79, 70, 229, 0.3)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px'
            }}
          >
            {loading ? <div className="elite-spinner"></div> : (
              <>
                 <CheckCircle2 size={24} />
                 Aceptar y Continuar
              </>
            )}
          </button>

          <button 
            onClick={onLogout}
            style={{
              background: 'none', border: 'none', color: '#94a3b8',
              padding: '10px', fontSize: '11px', fontWeight: '800',
              cursor: 'pointer', letterSpacing: '2px'
            }}
          >
            CANCELAR Y CERRAR SESIÓN
          </button>
        </div>
      </div>

      <style>{`
          @keyframes bounce {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-10px); }
          }
          .elite-bounce { animation: bounce 2s infinite; }
          .elite-spinner {
            width: 24px; height: 24px; border: 3px solid rgba(255,255,255,0.3);
            border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default PrivacyConsentModal;
