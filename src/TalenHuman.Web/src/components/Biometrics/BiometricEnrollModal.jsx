import React from 'react';
import { Fingerprint, X, ShieldCheck, ChevronRight } from 'lucide-react';

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
    <div className="fixed inset-0 z-[6000] flex items-center justify-center bg-blue-600/30 backdrop-blur-md p-6 animate-in fade-in duration-500">
      
      {/* Background Pro Decoration */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-blue-500 rounded-full blur-3xl opacity-20" />
      <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-blue-700 rounded-full blur-3xl opacity-20" />

      <div className="bg-white/95 dark:bg-slate-900/95 w-full max-w-sm rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col items-center p-12 text-center animate-in zoom-in-95 duration-700 border border-white/20 relative z-10">
        
        <div className="w-28 h-28 bg-blue-50 dark:bg-blue-500/10 rounded-[2.5rem] flex items-center justify-center text-blue-600 dark:text-blue-400 mb-10 shadow-inner group">
          <Fingerprint size={64} className="animate-pulse group-hover:scale-110 transition-transform" />
        </div>

        <div className="space-y-4 mb-12">
           <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none px-4">
             Acceso Biométrico
           </h2>
           <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed px-4">
             Usa tu <strong>Huella Digital</strong> o <strong>FaceID</strong> para entrar de forma segura y veloz.
           </p>
        </div>

        <div className="w-full space-y-4">
          <button 
            onClick={handleActivate}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-3xl font-black text-base shadow-2xl shadow-blue-500/40 active:scale-[0.97] transition-all flex items-center justify-center gap-3"
          >
            {loading ? (
               <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
               <>
                  <span>Configurar / Activar</span>
                  <ChevronRight size={20} />
               </>
            )}
          </button>

          <button 
            onClick={onCancel}
            className="w-full text-slate-400 dark:text-slate-500 py-2 font-bold text-xs transition-colors hover:text-slate-600 dark:hover:text-slate-300"
          >
            Cerrar
          </button>
        </div>

        <div className="mt-12 flex items-center gap-2 opacity-30 pt-6 border-t border-slate-100 dark:border-white/5 w-full justify-center">
          <ShieldCheck size={14} className="text-blue-600" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Seguridad TalenHuman</span>
        </div>
      </div>
    </div>
  );
};

export default BiometricEnrollModal;
