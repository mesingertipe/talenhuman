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
        <header className="elite-mobile-header">
            <button onClick={onBack} className="elite-back-btn">
                <ArrowLeft size={22} />
            </button>
            <div className="elite-header-title">
                <TalenHumanLogo size={24} white={true} />
                <span>ACCESO ELITE</span>
            </div>
            <div style={{ width: 40 }} />
        </header>

        <main className="elite-mobile-content">
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
                        <div className="elite-field-group">
                            <label className="elite-field-label">EMAIL CORPORATIVO</label>
                            <div className="elite-input-container">
                                <Mail className="elite-input-icon" size={18} />
                                <input 
                                    required
                                    type="email"
                                    className="elite-native-input"
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
            
            <p className="security-engine-footer">
                TALENHUMAN SECURITY ENGINE
            </p>
        </main>
    </div>
  );
};

export default ForgotPassword;
