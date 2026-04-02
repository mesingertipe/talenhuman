import React from 'react';
import { Fingerprint, X, ShieldCheck } from 'lucide-react';

const BiometricEnrollModal = ({ onComplete, onCancel }) => {
  const [loading, setLoading] = React.useState(false);

  const handleActivate = async () => {
    setLoading(true);
    // Simulate WebAuthn/Biometric Enrollment
    setTimeout(() => {
      setLoading(false);
      onComplete();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[6000] flex items-center justify-center bg-blue-600/20 backdrop-blur-sm p-6 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col items-center p-10 text-center animate-in zoom-in-95 duration-500">
        
        <div className="w-24 h-24 bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 mb-8 shadow-inner">
          <Fingerprint size={56} className="animate-pulse" />
        </div>

        <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight mb-4">
          Acceso Biométrico
        </h2>

        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed px-2 mb-10">
          Usa tu <strong>Huella Digital</strong> o <strong>FaceID</strong> para entrar de forma segura y veloz.
        </p>

        <div className="w-full space-y-4">
          <button 
            onClick={handleActivate}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-3xl font-black text-base shadow-2xl shadow-blue-500/30 active:scale-[0.97] transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
               <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
               'Configurar / Activar'
            )}
          </button>

          <button 
            onClick={onCancel}
            className="w-full bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-slate-500 py-4 rounded-2xl font-bold text-sm transition-colors hover:text-slate-600 dark:hover:text-slate-300"
          >
            Cerrar
          </button>
        </div>

        <div className="mt-8 flex items-center gap-2 opacity-30">
          <ShieldCheck size={14} className="text-blue-600" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Seguridad TalenHuman</span>
        </div>
      </div>
    </div>
  );
};

export default BiometricEnrollModal;
