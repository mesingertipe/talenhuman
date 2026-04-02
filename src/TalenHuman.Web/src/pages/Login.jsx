import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, Users, ArrowRight, ShieldAlert } from 'lucide-react';
import api from '../services/api';
import './Login.css';

const Login = ({ onLogin, onForgotPassword, onSelfServiceReset, version }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
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

  return (
    <div className="login-container">
      <div className="login-card">
        
        {/* Left Side: Professional Sidebar */}
        <div className="login-sidebar">
          <div className="login-sidebar-content text-center xs:text-left">
            <div className="login-brand mb-12">
              <div className="login-brand-icon">
                <Users size={28} />
              </div>
              <span className="login-brand-name">TalenHuman</span>
            </div>
            
            <h1 className="login-hero-title">
              Gestiona tu talento <br />
              <span className="text-indigo-200 underline decoration-indigo-400">sin fronteras.</span>
            </h1>
          </div>

          <div className="login-decoration-1"></div>
          <div className="login-decoration-2"></div>
        </div>

        {/* Right Side: Login Form */}
        <div className="login-form-side">
          <div className="login-form-container">
            <div className="login-mobile-brand">
               <Users size={20} />
               <span>TalenHuman</span>
            </div>

            <div className="login-header text-center">
              <h2 className="login-title">Bienvenido</h2>
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
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Recordarme</span>
                  </label>
                  <button 
                    type="button" 
                    className="text-xs font-black text-indigo-600 hover:underline uppercase tracking-wider"
                    onClick={onForgotPassword}
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                <div className="text-center pt-2 border-t border-slate-100">
                  <button 
                    type="button" 
                    className="text-[11px] font-black text-slate-400 hover:text-indigo-600 uppercase tracking-[0.15em] transition-colors"
                    onClick={onSelfServiceReset}
                  >
                    No tengo correo corporativo
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="login-submit"
              >
                {loading ? (
                  <div className="loader"></div>
                ) : (
                  <>
                    <span>Ingresar al Sistema</span>
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>

            <div className="login-footer">
               <p>
                 ¿Necesitas ayuda? <a href="#">Soporte</a>
               </p>
               <div className="mt-4 text-[10px] opacity-20 font-mono tracking-widest text-center">
                 {version || 'V12.8.5-STABLE'}
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
