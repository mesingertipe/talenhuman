import React, { useState } from 'react';
import { Mail, ArrowLeft, ArrowRight, ShieldCheck, HelpCircle, ChevronRight, Bell, Calendar } from 'lucide-react';
import api from '../services/api';
import TalenHumanLogo from '../components/Shared/TalenHumanLogo';
import './Login.css';

const ForgotPassword = ({ onBack, onNext }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setMessage(res.data.message);
      // Wait a bit then move to next step
      setTimeout(() => {
        onNext(email);
      }, 2000);
    } catch (err) {
      setError('Error al procesar la solicitud. Verifica el correo e intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
        {/* 🚀 ELITE V12 PREMIUM CARD */}
        <div className="login-card">
            
            {/* 🏔️ SIDEBAR LANDING (Hidden on Mobile) */}
            <div className="login-sidebar">
              <div className="login-sidebar-content">
                <div className="login-brand mb-12">
                  <TalenHumanLogo size={48} white={true} />
                </div>
                <h1 className="login-hero-title">
                  Recupera <br />
                  <span className="text-indigo-200 underline">tu acceso.</span>
                </h1>
                <p className="login-hero-subtitle">
                    Ingresa tu correo corporativo y te enviaremos las instrucciones para restablecer tu clave de forma segura.
                </p>
                <div className="login-features">
                  <div className="login-feature-item">
                    <div className="login-feature-icon"><ShieldCheck size={18} /></div>
                    <span>Proceso con Validación OTP</span>
                  </div>
                  <div className="login-feature-item">
                    <div className="login-feature-icon"><Bell size={18} /></div>
                    <span>Notificación inmediata</span>
                  </div>
                </div>
              </div>
              <div className="login-decoration-1"></div>
              <div className="login-decoration-2"></div>
            </div>

            {/* 📝 FORM AREA */}
            <div className="login-form-side">
                <div className="login-form-container">
                    
                  {/* 🏠 Mobile Brand Header */}
                  <div className="login-mobile-brand">
                    <TalenHumanLogo size={36} white={true} />
                    <span className="login-mobile-brand-name">TalenHuman</span>
                  </div>

                  <button 
                    onClick={onBack}
                    className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-all mb-8 font-black text-[10px] uppercase tracking-[0.2em]"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    <ArrowLeft size={16} /> Volver al Inicio
                  </button>

                  <div className="login-header">
                    <h2 className="login-title">¿Olvido su Clave?</h2>
                    <p className="login-subtitle">Enviaremos un código de seguridad a su email corporativo registrado.</p>
                  </div>

                  {error && (
                    <div className="login-error animate-in fade-in slide-in-from-bottom-2">
                      <HelpCircle size={18} />
                      <span>{error}</span>
                    </div>
                  )}

                  {message && (
                    <div className="animate-in zoom-in duration-300 mb-6" style={{ background: 'rgba(16, 185, 129, 0.05)', color: '#10b981', padding: '1.25rem', borderRadius: '20px', border: '1px solid rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#10b981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <ShieldCheck size={20} />
                        </div>
                        <span className="text-xs font-bold leading-snug">{message}</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group mb-8">
                      <label className="form-label">Email Corporativo</label>
                      <div className="input-wrapper">
                        <Mail className="input-icon" size={18} />
                        <input 
                          type="email" 
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="login-input"
                          placeholder="nombre@empresa.com"
                        />
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      disabled={loading}
                      className="login-submit w-full"
                    >
                      {loading ? (
                        <div className="loader"></div>
                      ) : (
                        <>
                          <span>Enviar Instrucciones</span>
                          <ArrowRight size={20} />
                        </>
                      )}
                    </button>
                  </form>

                  <div className="login-footer mt-12 text-center">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                         ¿No recibiste el correo? <a href="#" className="text-indigo-600 ml-1">Soporte</a>
                      </p>
                  </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default ForgotPassword;
