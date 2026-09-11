import React, { useState, useEffect } from 'react';
import { Lock, Mail, Eye, EyeOff, ArrowRight, ShieldAlert, Bell, Calendar, Megaphone, Globe, Building2 } from 'lucide-react';
import api from '../services/api';
import TalenHumanLogo from '../components/Shared/TalenHumanLogo';
import './Login.css';

const Login = ({ onLogin, onForgotPassword, onSelfServiceReset, onBackToLanding, version }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectTenantData, setSelectTenantData] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('rememberedEmail');
    if (saved) {
      setEmail(saved);
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
      
      if (res.data.status === 'select_tenant') {
        setSelectTenantData({
          tempToken: res.data.tempToken,
          companies: res.data.companies
        });
        return;
      }

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      localStorage.setItem('tenantId', res.data.user.companyId);
      
      onLogin(res.data.user, res.data.token);
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.status === 'multiple_tenants_found') {
        setError(err.response.data.message);
        setEmail('');
      } else {
        setError('Credenciales inválidas. Por favor intenta de nuevo.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
        {/* 🚀 V65.1.39 PREMIUM ELITE CARD */}
        <div className="login-card">
            
            {/* 🏔️ SIDEBAR LANDING (Hidden on Mobile) */}
            <div className="login-sidebar">
              <div className="login-sidebar-content">
                <div className="login-brand mb-12" onClick={onBackToLanding} style={{ cursor: onBackToLanding ? 'pointer' : 'default' }}>
                  <TalenHumanLogo size={48} white={true} />
                </div>
                <h1 className="login-hero-title">
                  Gestiona tu talento <br />
                  <span className="text-indigo-200 underline">sin fronteras.</span>
                </h1>
                <p className="login-hero-subtitle">
                    Accede a la plataforma líder en gestión humana <br />
                    para equipos de alto rendimiento.
                </p>
                <div className="login-features">
                  <div className="login-feature-item">
                    <div className="login-feature-icon"><Bell size={18} /></div>
                    <span>Novedades en tiempo real</span>
                  </div>
                  <div className="login-feature-item">
                    <div className="login-feature-icon"><Calendar size={18} /></div>
                    <span>Gestión de Horarios</span>
                  </div>
                </div>
              </div>
              
              {/* Decorative elements from CSS */}
              <div className="login-decoration-1"></div>
              <div className="login-decoration-2"></div>
            </div>

            {/* 📝 FORM AREA */}
            <div className="login-form-side">
                <div className="login-form-container">
                  {/* 🏠 Mobile Brand Header (Purple Gradient background in CSS) */}
                  <div className="login-mobile-brand" onClick={onBackToLanding} style={{ cursor: onBackToLanding ? 'pointer' : 'default' }}>
                    <TalenHumanLogo size={36} white={true} />
                    <span className="login-mobile-brand-name">TalenHuman</span>
                  </div>

                  {onBackToLanding && (
                    <button 
                      type="button" 
                      onClick={onBackToLanding}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#4f46e5',
                        fontWeight: '700',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        marginBottom: '1rem',
                        padding: 0
                      }}
                    >
                      &larr; Volver al inicio
                    </button>
                  )}
                  <div className="login-header">
                    <h2 className="login-title">¡Bienvenido!</h2>
                    <p className="login-subtitle">Ingresa tus credenciales para acceder.</p>
                  </div>

                  {error && (
                    <div className="login-error animate-in fade-in slide-in-from-top-2">
                      <ShieldAlert size={18} />
                      <span>{error}</span>
                    </div>
                  )}

                  {selectTenantData ? (
                    <div className="tenant-selector animate-in slide-in-from-right-4" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{
                        width: '64px',
                        height: '64px',
                        background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 12px 24px rgba(79, 70, 229, 0.25)',
                        marginBottom: '1.5rem',
                        border: '2px solid white'
                      }}>
                        <Building2 size={32} color="white" />
                      </div>

                      <h3 className="text-2xl font-[950] text-slate-800 mb-2 tracking-tight text-center">Selecciona tu Entorno</h3>
                      <p className="text-sm text-slate-500 mb-8 text-center font-medium leading-relaxed max-w-[280px]">
                        Tu cuenta está vinculada a múltiples organizaciones. Elige el espacio de trabajo al que deseas ingresar.
                      </p>
                      
                      <div className="flex flex-col gap-4 w-full">
                        {selectTenantData.companies.map(company => (
                          <button
                            key={company.id}
                            disabled={loading}
                            onClick={async () => {
                              setLoading(true);
                              setError('');
                              try {
                                const res = await api.post('/auth/select-tenant', { companyId: company.id }, {
                                  headers: { Authorization: `Bearer ${selectTenantData.tempToken}` }
                                });
                                
                                localStorage.setItem('token', res.data.token);
                                localStorage.setItem('user', JSON.stringify(res.data.user));
                                localStorage.setItem('tenantId', res.data.user.companyId);
                                
                                onLogin(res.data.user, res.data.token);
                              } catch (err) {
                                setError('Error al seleccionar la empresa.');
                              } finally {
                                setLoading(false);
                              }
                            }}
                            className="group relative w-full text-left p-5 rounded-2xl border-2 border-slate-100 hover:border-indigo-500 hover:shadow-[0_8px_30px_rgb(99,102,241,0.12)] hover:-translate-y-1 transition-all duration-300 bg-white flex items-center gap-4 overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            
                            <div className="relative z-10 w-12 h-12 rounded-xl bg-slate-50 group-hover:bg-indigo-100/50 flex items-center justify-center transition-colors">
                               <Globe className="text-slate-400 group-hover:text-indigo-600 transition-colors" size={24} />
                            </div>

                            <div className="relative z-10 flex-1">
                                <span className="block font-bold text-slate-700 group-hover:text-indigo-900 transition-colors text-lg tracking-tight">{company.name}</span>
                                <span className="block text-xs font-semibold text-slate-400 group-hover:text-indigo-500/70 uppercase tracking-widest mt-1">Conectar Entorno &rarr;</span>
                            </div>
                          </button>
                        ))}
                      </div>

                      <button 
                        type="button" 
                        disabled={loading}
                        onClick={() => setSelectTenantData(null)}
                        className="w-full mt-8 py-3 text-slate-400 font-bold hover:text-slate-800 transition-colors text-sm tracking-widest uppercase hover:bg-slate-50 rounded-xl"
                      >
                        ← Cancelar e intentar otro usuario
                      </button>
                    </div>
                  ) : (
                  <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                      <label className="form-label">Usuario o correo corporativo</label>
                      <div className="input-wrapper">
                        <Mail className="input-icon" size={18} />
                        <input 
                          type="text" 
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="login-input"
                          placeholder="Identificación o usuario"
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
                          className="password-toggle"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className="form-options">
                        <label className="remember-me">
                          <input 
                            type="checkbox" 
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                          />
                          <span>Recordarme</span>
                        </label>
                        <button 
                          type="button" 
                          className="forgot-password"
                          onClick={onForgotPassword}
                        >
                          ¿Olvidaste tu contraseña?
                        </button>
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
                          <span>Ingresar</span>
                          <ArrowRight size={20} />
                        </>
                      )}
                    </button>

                    <div className="text-center mt-6">
                        <button 
                          type="button" 
                          className="link-sutil"
                          onClick={onSelfServiceReset}
                        >
                          No tengo correo corporativo
                        </button>
                    </div>
                  </form>
                  )}

                  <div className="login-footer">
                      <p>¿Necesitas ayuda? <a href="#">Soporte</a></p>
                      <div className="version-tag">{version}</div>
                  </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Login;
