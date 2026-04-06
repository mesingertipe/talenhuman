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
    <div className="login-container mobile-premium-flow">
        {/* 🏔️ TOP BRAND BAR (Mobile Only) */}
        <div className="mobile-brand-bar">
            <TalenHumanLogo size={28} white={false} />
            <span className="brand-name-text">TalenHuman</span>
        </div>

        <div className="content-wrapper">
            {/* 🛡️ FLOATING PREMIUM CARD */}
            <div className="premium-recovery-card animate-in fade-in slide-in-from-bottom-12 duration-700">
                
                <button 
                onClick={onBack}
                className="back-control-premium"
                >
                <ArrowLeft size={18} />
                <span>VOLVER AL INICIO</span>
                </button>

                <div className="form-state-premium">
                    <div className="header-section-premium">
                        <h2 className="premium-title">Recuperación</h2>
                        <p className="premium-subtitle">Ingresa tu correo corporativo y te enviaremos las instrucciones para restablecer tu clave.</p>
                    </div>

                    {error && (
                    <div className="premium-error-toast animate-in fade-in slide-in-from-top-2">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                    )}

                    {message && (
                    <div className="success-state-premium text-center py-4 mb-6">
                        <div className="success-icon-box" style={{ width: '40px', height: '40px', borderRadius: '12px' }}>
                            <ShieldCheck size={20} />
                        </div>
                        <p className="text-xs font-bold text-emerald-600 mt-2">{message}</p>
                    </div>
                    )}

                    <form onSubmit={handleSubmit} className="premium-form-layout">
                        <div className="premium-field-group">
                            <label className="premium-field-label">EMAIL CORPORATIVO</label>
                            <div className="premium-input-box">
                                <Mail className="field-icon" size={20} />
                                <input 
                                    required
                                    type="email"
                                    className="premium-field-input"
                                    placeholder="nombre@empresa.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="login-submit-premium w-full mt-10"
                        >
                            {loading ? (
                            <div className="loader-white"></div>
                            ) : (
                            <>
                                <span>ENVIAR INSTRUCCIONES</span>
                                <ArrowRight size={22} />
                            </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
            
            <div className="premium-footer-note text-center mt-12">
                <p className="footer-label">SOPORTE TÉCNICO DISPONIBLE 24/7</p>
                <div className="elite-tag">V65.2.12-ELITE-PWA</div>
            </div>
        </div>
    </div>
  );
};

export default ForgotPassword;
