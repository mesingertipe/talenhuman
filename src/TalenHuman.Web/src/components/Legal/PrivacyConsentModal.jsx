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
    <div className="modal-overlay" style={{ zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="modal-content animate-in zoom-in-95 flex flex-col" 
           style={{ 
             maxWidth: '500px', 
             width: '100%',
             maxHeight: '90vh', 
             padding: 0,
             overflow: 'hidden' // Desbordamiento controlado por secciones
           }}>
        
        {/* Cabecera Fija */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <ShieldCheck size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Privacidad y Seguridad</h2>
              <p className="text-slate-500 text-xs mt-0.5">TalenHuman Elite V12</p>
            </div>
          </div>
        </div>

        {/* Cuerpo con Scroll Propio */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-50/50 dark:bg-slate-900/50">
          {policyText ? (
            <div className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
              {policyText}
            </div>
          ) : (
            <>
              <div className="flex gap-3 bg-white dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                <FileText className="text-indigo-500 shrink-0" size={18} />
                <div>
                  <p className="font-semibold text-xs text-slate-900 dark:text-white">Tratamiento de Información</p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal mt-0.5">
                    Sus datos personales, laborales y biométricos serán tratados con fines estrictamente operativos y de ley.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 bg-white dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                <Lock className="text-amber-500 shrink-0" size={18} />
                <div>
                  <p className="font-semibold text-xs text-slate-900 dark:text-white">Confidencialidad</p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal mt-0.5">
                    Garantizamos que su información <strong>NO será utilizada para fines comerciales</strong> ni cedida a terceros.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 bg-white dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                <CheckCircle className="text-emerald-500 shrink-0" size={18} />
                <div>
                  <p className="font-semibold text-xs text-slate-900 dark:text-white">Uso Operativo</p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal mt-0.5">
                    Autoriza el uso de biometría y geolocalización para validación de procesos en sitio.
                  </p>
                </div>
              </div>
            </>
          )}

            <div className="pt-2 italic text-[9px] text-slate-400 text-center flex items-center justify-center gap-2">
              <span>Registraremos su aceptación con fecha e IP.</span>
              <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">{window.localStorage.getItem('app_version') || 'v12'}</span>
            </div>
        </div>

        {/* Acciones Fijas al Fondo */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          {error && (
            <div className="mb-4 p-2 bg-red-50 text-red-600 text-[10px] rounded-lg text-center font-medium border border-red-100">
              {error}
            </div>
          )}

          <div className="flex flex-col space-y-3">
            <button 
              onClick={handleAccept}
              disabled={loading}
              className="btn-premium btn-premium-primary w-full py-3.5 text-base shadow-lg shadow-indigo-500/20 active:scale-95 transition-transform"
            >
              {loading ? (
                <div className="loader mr-2" />
              ) : (
                <>ACEPTAR TÉRMINOS</>
              )}
            </button>
            
            <button 
              onClick={onLogout}
              className="btn-premium btn-premium-secondary w-full py-2.5 text-sm"
            >
              <LogOut size={16} className="mr-2" />
              CERRAR SESIÓN
            </button>

            <p className="text-[9px] text-center text-slate-400 mt-2">
              Al realizar esta acción, usted confirma la veracidad de su perfil.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyConsentModal;
