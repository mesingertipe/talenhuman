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
    <div className="modal-overlay" style={{ zIndex: 3000 }}>
      <div className="modal-content animate-in zoom-in-95" style={{ maxWidth: '600px', padding: 0 }}>
        <div className="p-8 space-y-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <ShieldCheck size={40} />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Privacidad y Seguridad de Datos</h2>
              <p className="text-slate-500 text-sm mt-1">Cumplimiento Legal Institucional</p>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar border border-slate-100 dark:border-slate-800">
            {policyText ? (
              <div className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                {policyText}
              </div>
            ) : (
              // Global Fallback Default
              <>
                <div className="flex gap-3">
                  <FileText className="text-indigo-500 shrink-0" size={20} />
                  <div>
                    <p className="font-semibold text-sm">Tratamiento de Información</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-1">
                      En cumplimiento con las normativas locales de protección de datos personales, TalenHuman informa que sus datos personales, laborales y biométricos serán tratados con fines estrictamente operativos.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Lock className="text-amber-500 shrink-0" size={20} />
                  <div>
                    <p className="font-semibold text-sm">Uso No Comercial</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-1">
                      Garantizamos que su información <strong>NO será utilizada para fines comerciales</strong>, mercadeo o cedida a terceros. El uso es exclusivo para la gestión institucional.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CheckCircle className="text-emerald-500 shrink-0" size={20} />
                  <div>
                    <p className="font-semibold text-sm">Autorización de Servicios</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-1">
                      Al aceptar, usted autoriza el uso de autenticación biométrica y geolocalización para la validación de sus procesos operativos en los puntos autorizados.
                    </p>
                  </div>
                </div>
              </>
            )}

            <div className="pt-4 border-t border-slate-200 dark:border-slate-700 italic text-[10px] text-slate-400 text-center">
              Registraremos su aceptación con fecha, hora e IP para propósitos de auditoría legal.
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg text-center font-medium">
              {error}
            </div>
          )}

          <div className="flex flex-col space-y-3">
            <button 
              onClick={handleAccept}
              disabled={loading}
              className="btn-premium btn-premium-primary w-full py-4 text-base"
            >
              {loading ? (
                <div className="loader mr-2" />
              ) : (
                <>Acepto Términos y Condiciones</>
              )}
            </button>
            
            <button 
              onClick={onLogout}
              className="btn-premium btn-premium-secondary w-full"
            >
              <LogOut size={18} className="mr-2" />
              Cerrar Sesión (No Acepto)
            </button>

            <p className="text-[10px] text-center text-slate-400 px-8">
              Si no acepta en este momento, siempre puede volver a entrar y revisar estos términos para continuar usando TalenHuman.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyConsentModal;
