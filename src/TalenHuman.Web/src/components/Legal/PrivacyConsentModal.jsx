import React from 'react';
import { ShieldCheck, FileText, Lock, CheckCircle, LogOut } from 'lucide-react';

const PrivacyConsentModal = ({ onAccepted, onLogout, policyText }) => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const handleAccept = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/security/privacy-accept', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Error al procesar la aceptación.');

      const data = await response.json();
      if (data.success) {
        // Update local storage to avoid re-modal
        const user = JSON.parse(localStorage.getItem('user'));
        user.acceptedPrivacyPolicy = true;
        localStorage.setItem('user', JSON.stringify(user));
        onAccepted(user);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ 
      zIndex: 3000, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '0.5rem',
      backgroundColor: 'rgba(0,0,0,0.85)'
    }}>
      <div className="modal-content animate-in zoom-in-95 flex flex-col relative" 
           style={{ 
             maxWidth: '480px', 
             width: '100%',
             height: '85vh', 
             maxHeight: '700px',
             padding: 0,
             overflow: 'hidden',
             borderRadius: '24px'
           }}>
        
        {/* Cabecera Fija */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Privacidad y Seguridad</h2>
              <p className="text-slate-500 text-[10px] mt-0.5">TalenHuman Elite V12</p>
            </div>
          </div>
        </div>

        {/* Cuerpo con Scroll Forzado */}
        <div className="flex-1 overflow-y-scroll p-5 space-y-4 bg-white dark:bg-slate-900" 
             style={{ 
               WebkitOverflowScrolling: 'touch', 
               overscrollBehavior: 'contain',
               paddingBottom: '160px' // Espacio extra para que el texto no se tape con los botones fijos
             }}>
          
          {policyText ? (
            <div className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              {policyText}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                <FileText className="text-indigo-500 shrink-0" size={18} />
                <p className="text-[11px] text-slate-600 dark:text-slate-400">Sus datos personales y biométricos serán tratados con fines operativos.</p>
              </div>
              <div className="flex gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                <Lock className="text-amber-500 shrink-0" size={18} />
                <p className="text-[11px] text-slate-600 dark:text-slate-400">Garantizamos confidencialidad absoluta y uso no comercial.</p>
              </div>
            </div>
          )}

          <div className="pt-4 italic text-[9px] text-slate-400 text-center flex flex-col items-center gap-1">
            <span>Aceptación vinculada a su IP y Fecha.</span>
            <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded text-[8px]">{window.localStorage.getItem('app_version') || 'V12.5.3'}</span>
          </div>
        </div>

        {/* Acciones - Fijas en la parte inferior del modal */}
        <div className="absolute bottom-0 left-0 right-0 p-5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 shadow-[0_-10px_20px_rgba(0,0,0,0.1)]">
          {error && (
            <div className="mb-3 p-2 bg-red-50 text-red-600 text-[10px] rounded-lg text-center font-medium border border-red-100">
              {error}
            </div>
          )}

          <div className="flex flex-col space-y-2">
            <button 
              onClick={handleAccept}
              disabled={loading}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/30 transition-all active:scale-95 flex items-center justify-center"
            >
              {loading ? <div className="loader size-4 mr-2" /> : "ACEPTAR TÉRMINOS"}
            </button>
            
            <button 
              onClick={onLogout}
              className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-semibold text-xs flex items-center justify-center"
            >
              <LogOut size={14} className="mr-2" />
              CERRAR SESIÓN
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyConsentModal;
