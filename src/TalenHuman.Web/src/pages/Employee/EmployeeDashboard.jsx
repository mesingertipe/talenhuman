import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Clock, 
  MapPin, 
  Calendar, 
  Fingerprint, 
  Key, 
  Bell, 
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

import SecurityService from '../../services/securityService';
import { requestForToken } from '../../firebase';

const EmployeeDashboard = ({ user }) => {
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    // Al cargar el dashboard, intentar sincronizar token de Firebase para notificaciones
    const syncPushToken = async () => {
      try {
        const token = await requestForToken();
        if (token) {
          await SecurityService.updateFirebaseToken(token);
        }
      } catch (err) {
        console.warn("Fallo al sincronizar push token:", err);
      }
    };
    
    syncPushToken();
    
    return () => clearInterval(timer);
  }, []);

  const handleEnrollBiometrics = async () => {
    setIsLoading(true);
    try {
      await SecurityService.registerBiometrics();
      setBiometricsEnabled(true);
      alert("¡Biometría registrada con éxito! Ahora puedes usarla para acciones seguras.");
    } catch (err) {
      alert("No se pudo completar el registro biométrico. Asegúrate de estar en un entorno seguro (HTTPS).");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('es-CO', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    }).format(date);
  };

  return (
    <div className="space-y-6 pb-4 animate-in fade-in duration-500">
      {/* Welcome Section */}
      <section className="relative overflow-hidden rounded-3xl bg-indigo-600 p-6 text-white shadow-2xl shadow-indigo-500/20">
        <div className="relative z-10">
          <p className="text-indigo-100 text-sm font-medium">{formatDate(currentTime)}</p>
          <h2 className="text-2xl font-bold mt-1">¡Hola, {user?.fullName.split(' ')[0]}! 👋</h2>
          <p className="text-indigo-100 text-xs mt-1">Tienda: {user?.storeName || 'Punto Principal'}</p>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-24 h-24 bg-indigo-400/20 rounded-full blur-xl"></div>
      </section>

      {/* Main Action / Status Card */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Turno de hoy</span>
          </div>
          <span className="text-[10px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-full font-bold">
            PROGRAMADO
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <Clock size={16} className="text-indigo-500" />
              <span className="text-lg font-bold">08:00 AM - 05:00 PM</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500 text-xs">
              <MapPin size={14} />
              <span>Sede Central - Bogotá</span>
            </div>
          </div>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-4 py-3 flex items-center gap-2 font-bold transition-all shadow-lg shadow-indigo-500/25 active:scale-95">
            Marcar Entrada
          </button>
        </div>
      </section>

      {/* PWA / Security Section */}
      <section className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm transition-all active:scale-95 hover:border-indigo-200">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 mb-3">
            <Shield size={20} />
          </div>
          <h3 className="text-sm font-bold leading-tight">Seguridad Biométrica</h3>
          <p className="text-[10px] text-slate-500 mt-1">Activa FaceID o Huella</p>
          <div 
            onClick={!isLoading ? handleEnrollBiometrics : null}
            className={`mt-4 w-10 h-5 rounded-full relative transition-colors duration-300 cursor-pointer ${biometricsEnabled ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'} ${isLoading ? 'opacity-50' : ''}`}
          >
            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-300 ${biometricsEnabled ? 'left-6' : 'left-1'}`}>
              {isLoading && <div className="absolute inset-0 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm transition-all active:scale-95 hover:border-indigo-200">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 mb-3">
            <Key size={20} />
          </div>
          <h3 className="text-sm font-bold leading-tight">Cambiar Contraseña</h3>
          <p className="text-[10px] text-slate-500 mt-1">Último cambio: Hace 20 días</p>
          <ArrowRight size={14} className="mt-4 text-slate-400" />
        </div>
      </section>

      {/* Notifications / Alerts Panel */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Bell size={16} className="text-indigo-500" />
            Notificaciones Recientes
          </h3>
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-tighter">Ver todas</span>
        </div>
        
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 shrink-0">
              <CheckCircle2 size={16} />
            </div>
            <div>
              <p className="text-xs font-bold leading-none">Turno aprobado</p>
              <p className="text-[10px] text-slate-500 mt-1">Tu solicitud de cambio de turno para el viernes fue aceptada.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600 shrink-0">
              <AlertCircle size={16} />
            </div>
            <div>
              <p className="text-xs font-bold leading-none">Nueva Novedad Laboral</p>
              <p className="text-[10px] text-slate-500 mt-1">Se ha publicado una nueva circular informativa importante.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Install Prompt Footer (Only show if not in PWA mode) */}
      <div className="bg-slate-900 rounded-3xl p-4 flex items-center justify-between transition-all duration-500 hover:scale-[1.02]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white">
            <ArrowRight size={20} className="rotate-[-45deg]" />
          </div>
          <div>
            <p className="text-white text-xs font-bold">Instalar TalenHuman</p>
            <p className="text-slate-400 text-[10px]">Acceso rápido desde tu pantalla</p>
          </div>
        </div>
        <button className="bg-white text-slate-900 px-3 py-2 rounded-xl text-xs font-bold">
          Instalar
        </button>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
