import React, { useState } from 'react';
import { User, ShieldCheck, LogOut, ChevronRight, Fingerprint } from 'lucide-react';
import BiometricEnrollModal from '../../components/Biometrics/BiometricEnrollModal';

const MobileProfile = ({ user }) => {
  const [showBiometricSetup, setShowBiometricSetup] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    window.location.replace('/');
  };

  const hasBiometrics = user?.biometricsEnrolled || false;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* Profile Header */}
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-5 mt-4">
        <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
          <User size={32} strokeWidth={2.5} />
        </div>
        <div className="flex-1 overflow-hidden">
          <h2 className="text-xl font-black text-slate-800 dark:text-white truncate">
            {user?.name || user?.email || 'Usuario'}
          </h2>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">
            {user?.roleName || 'Empleado'}
          </p>
        </div>
      </div>

      {/* Settings Group */}
      <div className="flex flex-col gap-3">
        <h3 className="px-4 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Seguridad y Acceso</h3>
        
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col">
          
          {/* Biometrics Toggle */}
          <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${hasBiometrics ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                <Fingerprint size={20} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-slate-800 dark:text-slate-200">Acceso Biométrico</span>
                <span className="text-xs text-slate-500 font-medium">
                  {hasBiometrics ? 'Activo y configurado' : 'Pulsa para configurar'}
                </span>
              </div>
            </div>

            <button 
                onClick={() => {
                  if (hasBiometrics) {
                     const newUser = { ...user, biometricsEnrolled: false };
                     localStorage.setItem('user', JSON.stringify(newUser));
                     localStorage.setItem('biometricsDismissed', 'true'); // 🚀 CRITICAL: Prevents immediate popup
                     window.location.reload(); 
                  } else {
                     setShowBiometricSetup(true);
                  }
                }}
                className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 ${hasBiometrics ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}
            >
                <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${hasBiometrics ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

        </div>
      </div>

      {/* Danger Zone */}
      <div className="flex flex-col gap-3 mt-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden">
          <button 
             onClick={handleLogout}
             className="w-full flex items-center justify-between p-5 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors"
          >
             <div className="flex items-center gap-4 text-red-500">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                   <LogOut size={20} strokeWidth={2.5} />
                </div>
                <span className="font-bold">Cerrar Sesión</span>
             </div>
             <ChevronRight size={20} className="text-slate-300" />
          </button>
        </div>
      </div>

      {showBiometricSetup && (
        <BiometricEnrollModal 
          onComplete={() => {
            const newUser = { ...user, biometricsEnrolled: true };
            localStorage.setItem('user', JSON.stringify(newUser));
            window.location.reload();
          }} 
          onCancel={() => setShowBiometricSetup(false)} 
        />
      )}

    </div>
  );
};

export default MobileProfile;
