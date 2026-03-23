import React, { useState } from 'react';
import { Shield, User, Calendar, Lock, ArrowLeft, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';

const SelfServiceReset = ({ onBack }) => {
  const [formData, setFormData] = useState({
    identificationNumber: '',
    birthDate: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/self-service-reset', {
        identificationNumber: formData.identificationNumber,
        birthDate: formData.birthDate,
        newPassword: formData.newPassword
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data || 'No se pudo validar la información. Verifique sus datos.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="login-card p-8 animate-in zoom-in duration-300">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 mb-6">
            <CheckCircle size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">¡Clave restablecida!</h2>
          <p className="text-slate-500 mb-8">
            Tu contraseña ha sido actualizada exitosamente. Ya puedes ingresar con tu nueva clave.
          </p>
          <button 
            onClick={onBack}
            className="w-full btn-premium btn-premium-primary"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-card p-8 animate-in slide-in-from-right-4 duration-300">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors mb-6 font-medium text-sm"
      >
        <ArrowLeft size={16} /> Volver
      </button>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Shield className="text-indigo-600" />
          Restablecer sin Correo
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Valida tu identidad con tus datos personales.
        </p>
      </div>

      {error && (
        <div className="p-3 mb-6 flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 rounded-xl text-sm font-medium animate-in fade-in">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Número de Cédula</label>
          <div className="relative">
            <User className="absolute left-3 top-3.5 text-slate-400" size={18} />
            <input 
              required
              type="text"
              className="login-input"
              placeholder="Ej: 1016..."
              value={formData.identificationNumber}
              onChange={(e) => setFormData({ ...formData, identificationNumber: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Fecha de Nacimiento</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3.5 text-slate-400" size={18} />
            <input 
              required
              type="date"
              className="login-input"
              value={formData.birthDate}
              onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nueva Contraseña</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
            <input 
              required
              type={showPassword ? "text" : "password"}
              className="login-input"
              placeholder="Mínimo 6 caracteres"
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3.5 text-slate-400 hover:text-indigo-600"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Confirmar Contraseña</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
            <input 
              required
              type={showPassword ? "text" : "password"}
              className="login-input"
              placeholder="Repite la contraseña"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full btn-premium btn-premium-primary mt-6"
        >
          {loading ? 'Validando...' : 'Restablecer Contraseña'}
        </button>
      </form>
    </div>
  );
};

export default SelfServiceReset;
