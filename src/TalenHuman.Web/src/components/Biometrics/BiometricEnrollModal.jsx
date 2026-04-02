import React from 'react';
import { Fingerprint, X, ShieldCheck, ChevronRight, TabletSmartphone, CheckCircle2, AlertCircle } from 'lucide-react';
import SecurityService from '../../services/securityService';

const BiometricEnrollModal = ({ onComplete, onCancel }) => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [success, setSuccess] = React.useState(false);

  const handleActivate = async () => {
    setLoading(true);
    setError(null);
    try {
      // 🚀 REAL BIOMETRIC ENROLLMENT
      await SecurityService.registerBiometrics();
      
      setSuccess(true);
      setTimeout(() => {
        onComplete();
      }, 1500);
    } catch (err) {
      console.error('Error biometría:', err);
      // Detailed error messages for common WebAuthn issues
      if (err.name === 'NotAllowedError') {
        setError('Operación cancelada o denegada por el usuario.');
      } else if (err.name === 'NotSupportedError') {
        setError('Este dispositivo no soporta biometría o el sitio no es seguro (HTTPS).');
      } else {
        setError('Error al configurar biometría. Reintenta.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex flex-col items-center bg-white overflow-y-auto"
         style={{ minHeight: '100dvh' }}>
      
      {/* 🚀 ELITE BRAND HEADER (Consistent) */}
      <div className="w-full bg-gradient-to-br from-slate-800 via-slate-900 to-black p-12 flex flex-col items-center justify-center text-white relative shrink-0 shadow-2xl">
         <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
         
         <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="bg-white/10 p-4 rounded-3xl backdrop-blur-md border border-white/20 shadow-xl mb-2">
               <Fingerprint size={48} className={`text-white ${loading ? 'animate-pulse' : ''}`} />
            </div>
            <h1 className="text-3xl font-black tracking-tighter" style={{ fontFamily: "'Outfit', sans-serif" }}>Acceso Biométrico</h1>
            <div className="flex items-center gap-2">
               <div className="h-[1px] w-6 bg-white/20"></div>
               <span className="text-[9px] uppercase font-bold tracking-[0.4em] text-slate-400">Security Ecosystem</span>
               <div className="h-[1px] w-6 bg-white/20"></div>
            </div>
         </div>
      </div>

      <div className="w-full max-w-sm px-10 py-12 flex-1 flex flex-col items-center justify-center">
        {/* 🎬 STATUS / HEADER TEXT */}
        <div className="text-center mb-10 w-full animate-in zoom-in-95 duration-500">
           {success ? (
              <div className="flex flex-col items-center gap-4">
                 <div className="bg-green-100 p-3 rounded-full text-green-600">
                    <CheckCircle2 size={40} />
                 </div>
                 <h2 className="text-2xl font-black text-slate-900">¡Configurado!</h2>
                 <p className="text-slate-500 text-sm font-medium">Redirigiendo al sistema...</p>
              </div>
           ) : (
              <>
                 <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight mb-3">
                   Tu <span className="text-indigo-600">Huella</span> es la Clave
                 </h2>
                 <p className="text-slate-500 font-medium text-sm px-2">
                   Usa <strong>FaceID</strong> o <strong>Huella Digital</strong> para entrar de forma segura y veloz sin recordar contraseñas.
                 </p>
              </>
           )}
        </div>

        {/* 🎬 MAIN ACTIONS */}
        {!success && (
           <div className="w-full space-y-6 animate-in slide-in-from-bottom-4 duration-700">
              {error && (
                 <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex gap-3 items-center text-red-700">
                    <AlertCircle size={20} className="shrink-0" />
                    <p className="text-[11px] font-bold leading-tight">{error}</p>
                 </div>
              )}

              <button 
                onClick={handleActivate}
                disabled={loading}
                className="group relative w-full bg-slate-900 text-white py-6 rounded-[2.2rem] font-bold text-sm uppercase tracking-widest shadow-2xl shadow-slate-900/30 flex items-center justify-center gap-4 active:scale-[0.98] transition-all overflow-hidden"
              >
                 {loading ? (
                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                 ) : (
                    <>
                       <span>Activar Biometría</span>
                       <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </>
                 )}
                 <div className="absolute inset-0 bg-white/5 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              </button>

              <button 
                onClick={onCancel}
                className="w-full text-slate-400 py-2 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-colors flex items-center justify-center gap-2"
              >
                Configurar después
              </button>
           </div>
        )}

        <div className="mt-16 flex flex-col items-center gap-4 opacity-10 pt-8 border-t border-slate-100 w-full">
           <ShieldCheck size={20} className="text-slate-900" />
           <span className="text-[8px] font-black uppercase tracking-[0.6em] text-slate-900">Elite V16.3 Security</span>
        </div>
      </div>
    </div>
  );
};

export default BiometricEnrollModal;
