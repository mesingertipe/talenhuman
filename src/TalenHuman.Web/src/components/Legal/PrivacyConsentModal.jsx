import React from 'react';
import { ShieldCheck, FileText, Lock, CheckCircle, LogOut, ChevronDown } from 'lucide-react';

const PrivacyConsentModal = ({ onAccepted, onLogout, policyText }) => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const scrollRef = React.useRef(null);
  const [showScrollHint, setShowScrollHint] = React.useState(true);

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

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollTop + clientHeight >= scrollHeight - 20) {
      setShowScrollHint(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-white/10"
        style={{ maxHeight: '85vh' }}>

        {/* Header - Restauración Logo TH */}
        <div className="p-6 text-center border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-xl shadow-indigo-500/20">
              TH
            </div>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Privacidad y Seguridad</h2>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-semibold opacity-70">Aviso Legal Obligatorio</p>
        </div>

        {/* Dynamic Content Area with Scroll */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar relative"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {policyText ? (
            <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed font-medium">
              {policyText}
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <ShieldCheck className="text-indigo-600 shrink-0" size={24} />
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-normal">
                  Sus datos biométricos y personales serán tratados exclusivamente para control de asistencia y seguridad institucional.
                </p>
              </div>
              <div className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <Lock className="text-amber-500 shrink-0" size={24} />
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-normal">
                  Garantizamos que su información NO será cedida a terceros ni utilizada con fines comerciales.
                </p>
              </div>
            </div>
          )}

          {/* Spacer to ensure content doesn't end abruptly before buttons */}
          <div className="h-4"></div>

          {/* Action Buttons - Natural flow (at the end of scroll) */}
          <div className="space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl text-center font-bold border border-red-100 mb-2">
                {error}
              </div>
            )}

            <button
              onClick={handleAccept}
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-500/30 transition-all active:scale-[0.98] flex items-center justify-center text-sm"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "ACEPTAR TÉRMINOS Y CONDICIONES"
              )}
            </button>

            <button
              onClick={onLogout}
              className="w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-3 rounded-2xl font-bold text-xs transition-colors hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center gap-2"
            >
              <LogOut size={16} />
              CERRAR SESIÓN (NO ACEPTO)
            </button>
          </div>

          <div className="text-[10px] text-center text-slate-400 pb-2">
            Identificador de Versión: {localStorage.getItem('app_version') || 'v12-Final'}
          </div>
        </div>

        {/* Scroll Hint Overlay */}
        {showScrollHint && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 pointer-events-none animate-bounce bg-indigo-600 text-white p-2 rounded-full shadow-lg">
            <ChevronDown size={20} />
          </div>
        )}
      </div>
    </div>
  );
};

export default PrivacyConsentModal;
