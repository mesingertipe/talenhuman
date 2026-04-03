import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, Users, ArrowRight, ShieldAlert, Bell, Calendar, Fingerprint, ShieldCheck } from 'lucide-react';
import api from '../services/api';
import SecurityService from '../services/securityService';
import { get } from '@github/webauthn-json';
import TalenHumanLogo from '../components/Shared/TalenHumanLogo';
import './Login.css';

const Login = ({ onLogin, onForgotPassword, onSelfServiceReset, version }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      localStorage.setItem('tenantId', res.data.user.companyId);
      onLogin(res.data.user, res.data.token);
    } catch (err) {
      setError('Credenciales inválidas. Por favor intenta de nuevo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    if (!email) {
      setError('Escribe tu correo para usar biometría.');
      return;
    }

    setBiometricLoading(true);
    setError('');

    try {
      const options = await SecurityService.getAssertionOptions(email);
      const assertion = await get({ publicKey: options });
      const res = await SecurityService.completeAssertion(assertion);

      if (res.status === 'success') {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        onLogin(res.user, res.token);
      }
    } catch (err) {
      setError('Biometría no reconocida en este dispositivo.');
      console.error(err);
    } finally {
      setBiometricLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        
        {/* Left Side: Professional Sidebar */}
        <div className="login-sidebar">
          <div className="login-sidebar-content text-center xs:text-left">
            <div className="login-brand mb-12">
              <TalenHumanLogo size={48} />
            </div>
            
            <h1 className="login-hero-title">
              Gestiona tu talento <br />
              <span className="text-indigo-200 underline decoration-indigo-400">sin fronteras.</span>
            </h1>

            <div className="login-features">
              <div className="login-feature-item">
                <div className="login-feature-icon">
                  <Bell size={18} />
                </div>
                <span>Novedades en tiempo real</span>
              </div>
              <div className="login-feature-item">
                <div className="login-feature-icon">
                  <Calendar size={18} />
                </div>
                <span>Gestión de Horarios</span>
              </div>
              <div className="login-feature-item">
                <div className="login-feature-icon">
                  <Fingerprint size={18} />
                </div>
                <span>Marcaciones Seguras</span>
              </div>
            </div>
          </div>

          <div className="login-decoration-1"></div>
          <div className="login-decoration-2"></div>
        </div>

        {/* Right Side: Login Form */}
        <div className="login-form-side">
            <div className="login-form-container">
              {/* 🏠 Mobile Brand Header (Clean Version) */}
              <div className="login-mobile-brand">
                <TalenHumanLogo size={36} />
              </div>

              <div className="login-header text-center">
                <h2 className="login-title">¡Bienvenido!</h2>
                <p className="login-subtitle">Ingresa tus credenciales para acceder.</p>
              </div>

              {error && (
                <div className="login-error">
                  <ShieldAlert size={18} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="login-form">
                <div className="form-group">
                  <label className="form-label">Usuario o Correo Corporativo</label>
                  <div className="input-wrapper">
                    <Mail className="input-icon" size={18} />
                    <input 
                      type="text" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="login-input"
                      placeholder="admin@empresa.com"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Contraseña</label>
                  <div className="input-wrapper">
                    <Lock className="input-icon" size={18} />
                    <input 
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="login-input"
                      placeholder="••••••••"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="password-toggle"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="form-options flex flex-col gap-5 mt-4">
                  <div className="flex items-center justify-between w-full">
                    <label className="remember-me flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-slate-300 accent-indigo-600"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                      <span className="text-[10px] font-bold text-slate-400 tracking-widest">Recordarme</span>
                    </label>
                    <button 
                      type="button" 
                      className="forgot-password text-[10px] font-bold text-indigo-600 tracking-widest"
                      onClick={onForgotPassword}
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>

                  <div className="text-center pt-2">
                    <button 
                      type="button" 
                      className="link-sutil text-[10px] font-bold text-indigo-600 tracking-[0.15em]"
                      onClick={onSelfServiceReset}
                    >
                      No tengo correo corporativo
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    type="submit" 
                    disabled={loading || biometricLoading}
                    className="login-submit"
                    style={{ flex: 1 }}
                  >
                    {loading ? (
                      <div className="loader"></div>
                    ) : (
                      <>
                        <span>Ingresar</span>
                        <ArrowRight size={20} />
                      </>
                    )}
                  </button>

                  <button 
                    type="button"
                    disabled={loading || biometricLoading}
                    onClick={handleBiometricLogin}
                    className="login-biometric-btn"
                    style={{
                      width: '64px', height: '64px', borderRadius: '18px',
                      background: 'rgba(79, 70, 229, 0.1)', border: '2px solid rgba(79, 70, 229, 0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#4f46e5', transition: 'all 0.3s ease', cursor: 'pointer'
                    }}
                  >
                    {biometricLoading ? <div className="loader" style={{ borderColor: '#4f46e5', borderTopColor: 'transparent' }}></div> : <Fingerprint size={28} />}
                  </button>
                </div>
              </form>

              <div className="login-footer">
                 <p className="text-slate-600 font-bold">
                   ¿Necesitas ayuda? <a href="#" className="ml-1">Soporte</a>
                 </p>
                 <div className="version-tag">
                    {version || 'V13.0.0-RESTORED'}
                 </div>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
