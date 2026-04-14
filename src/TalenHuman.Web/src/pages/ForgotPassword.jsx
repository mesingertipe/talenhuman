import React, { useState } from 'react';
import { Mail, ArrowLeft, ArrowRight, ShieldCheck, MailCheck, Bell, AlertCircle, Sparkles } from 'lucide-react';
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
      setTimeout(() => {
        onNext(email);
      }, 2000);
    } catch (err) {
      setError('Verifica el correo ingresado e intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-premium-flow-root animate-in fade-in duration-500">
        
        {/* 🏔️ ELITE STICKY HEADER */}
        <header className="premium-mobile-header">
            <button onClick={onBack} className="premium-back-btn">
                <ArrowLeft size={22} />
            </button>
            <div className="premium-header-title">
                <TalenHumanLogo size={24} white={true} />
                <span>ACCESO SEGURO</span>
            </div>
            <div style={{ width: 40 }} />
        </header>

        <main className="premium-mobile-content">
            <div className="premium-recovery-card-v2 animate-in slide-in-from-bottom-10">
                
                <div className="form-state-premium">
                    <div className="header-section-premium mb-10 text-center">
                        <div className="key-icon-box">
                            <MailCheck size={30} />
                        </div>
                        <h2 className="premium-title">Olvidé mi clave</h2>
                        <p className="premium-subtitle">Ingresa tu correo para recibir las instrucciones de seguridad.</p>
                    </div>

                    {error && (
                    <div className="premium-error-toast mb-8">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                    )}

                    <form onSubmit={handleSubmit} className="premium-form-layout">
                        <div className="premium-field-group">
                            <label className="premium-field-label">Correo corporativo</label>
                            <div className="premium-input-container">
                                <Mail className="premium-input-icon" size={18} />
                                <input 
                                    required
                                    type="email"
                                    className="premium-native-input"
                                    placeholder="nombre@empresa.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    style={{ color: '#1E293B', WebkitTextFillColor: '#1E293B' }}
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className={`login-submit-premium-v2 w-full mt-10 ${loading ? 'btn-disabled' : ''}`}
                        >
                            {loading ? <div className="loader-white"></div> : (
                                <div className="flex items-center gap-3">
                                    <span>ENVIAR CÓDIGO</span>
                                    <ArrowRight size={22} />
                                </div>
                            )}
                        </button>
                    </form>
                </div>
            </div>
            
            <footer className="premium-mobile-footer text-center mt-4">
                <div className="premium-version">V13.9.44-PREMIUM-STABLE</div>
            </footer>
        </main>
    </div>
  );
};

export default ForgotPassword;
