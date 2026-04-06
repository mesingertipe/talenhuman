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
                    <div className="header-section-premium mb-10">
                        <div className="flex items-center gap-3 mb-2">
                           <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                               <MailCheck size={18} />
                           </div>
                           <h2 className="premium-title" style={{ margin: 0 }}>OLVIDÉ MI CLAVE</h2>
                        </div>
                        <p className="premium-subtitle">Ingresa tu correo corporativo para recibir un código de seguridad instantáneo.</p>
                    </div>

                    {error && (
                    <div className="premium-error-toast mb-8">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                    )}

                    {message && (
                    <div className="success-state-premium text-center py-4 mb-6">
                        <div className="success-icon-box" style={{ width: '50px', height: '50px', borderRadius: '15px' }}>
                            <ShieldCheck size={28} />
                        </div>
                        <p className="text-xs font-black text-emerald-600 mt-2">{message}</p>
                    </div>
                    )}

                    <form onSubmit={handleSubmit} className="premium-form-layout">
                        <div className="premium-field-group">
                            <label className="premium-field-label">CORREO CORPORATIVO</label>
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
            
            <footer className="elite-mobile-footer">
                <p>SEGURIDAD AVANZADA TALENHUMAN</p>
                <div className="elite-version">V65.2.14-ELITE</div>
            </footer>
        </main>
    </div>
  );
};

export default ForgotPassword;
