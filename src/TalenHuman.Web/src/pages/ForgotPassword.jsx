import React, { useState } from 'react';
import { Mail, ArrowLeft, ArrowRight, ShieldCheck, HelpCircle, ChevronRight, Bell, Calendar, AlertCircle } from 'lucide-react';
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
      setError('Por favor verifica el correo e intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-premium-flow-root animate-in fade-in duration-500">
        
        {/* 🏔️ ELITE STICKY HEADER */}
        <header className="elite-mobile-header">
            <button onClick={onBack} className="elite-back-btn">
                <ArrowLeft size={22} />
            </button>
            <div className="elite-header-title">
                <TalenHumanLogo size={24} white={true} />
                <span>RECUPERACIÓN</span>
            </div>
            <div style={{ width: 40 }} />
        </header>

        <main className="elite-mobile-content">
            <div className="premium-recovery-card-v2">
                
                <div className="form-state-premium">
                    <div className="header-section-premium">
                        <h2 className="premium-title">Olvidé mi clave</h2>
                        <p className="premium-subtitle">Ingresa tu correo corporativo y te enviaremos las instrucciones de seguridad.</p>
                    </div>

                    {error && (
                    <div className="premium-error-toast">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                    )}

                    {message && (
                    <div className="success-state-premium text-center py-4 mb-6">
                        <div className="success-icon-box" style={{ width: '44px', height: '44px', borderRadius: '14px' }}>
                            <ShieldCheck size={24} />
                        </div>
                        <p className="text-xs font-bold text-emerald-600 mt-2">{message}</p>
                    </div>
                    )}

                    <form onSubmit={handleSubmit} className="premium-form-layout">
                        <div className="premium-field-group">
                            <label className="premium-field-label">EMAIL CORPORATIVO</label>
                            <div className="premium-input-box-v2">
                                <Mail className="field-icon-v2" size={20} />
                                <input 
                                    required
                                    type="email"
                                    className="premium-field-input-v2"
                                    placeholder="nombre@empresa.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="login-submit-premium-v2 w-full mt-10"
                        >
                            {loading ? (
                            <div className="loader-white"></div>
                            ) : (
                            <>
                                <span>SOLICITAR ACCESO</span>
                                <ArrowRight size={22} />
                            </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
            
            <footer className="elite-mobile-footer">
                <p>PROTECCIÓN DE DATOS DE GRADO MILITAR</p>
                <div className="elite-version">V65.2.13-ELITE</div>
            </footer>
        </main>
    </div>
  );
};

export default ForgotPassword;
