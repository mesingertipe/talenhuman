import React from 'react';
import { ShieldCheck, FileText, Lock, LogOut, ChevronDown, CheckCircle2 } from 'lucide-react';

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
    if (scrollTop + clientHeight >= scrollHeight - 30) {
      setShowScrollHint(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-[0_30px_70px_-15px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 duration-500 border border-slate-100 dark:border-white/5"
           style={{ maxHeight: '88vh' }}>
        
        {/* Header - Pro Minimalist */}
        <div className="p-8 pb-6 text-center shrink-0">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4 border border-green-100 dark:border-green-500/20">
            <CheckCircle2 size={12} />
            Seguridad Verificada
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">Privacidad y Seguridad</h2>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 font-medium uppercase tracking-[0.25em]">Consentimiento Legal TalenHuman</p>
        </div>

        {/* Content Area */}
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-8 py-2 custom-scrollbar relative"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {policyText ? (
            <div className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed font-medium bg-slate-50/50 dark:bg-white/5 p-6 rounded-[2rem] border border-slate-100 dark:border-white/5">
              {policyText}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-5 bg-indigo-50/50 dark:bg-indigo-500/5 rounded-2xl border border-indigo-100/50 dark:border-indigo-500/20 flex gap-4">
                 <ShieldCheck className="text-indigo-600 shrink-0" size={24} />
                 <div>
                    <p className="font-bold text-slate-900 dark:text-white text-sm mb-1">Protección de Datos</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Sus datos biométricos y personales serán tratados exclusivamente para control de asistencia y seguridad institucional.</p>
                 </div>
              </div>
              <div className="p-5 bg-slate-50/50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10 flex gap-4">
                 <Lock className="text-slate-400 shrink-0" size={24} />
                 <div>
                    <p className="font-bold text-slate-900 dark:text-white text-sm mb-1">Confidencialidad Garantizada</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Garantizamos que su información NO será cedida a terceros ni utilizada con fines comerciales.</p>
                 </div>
              </div>
            </div>
          )}

          {/* Action Area - Natural flow (at the end of scroll) */}
          <div className="space-y-4 mt-8 pb-8">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs rounded-2xl text-center font-bold border border-red-100 dark:border-red-500/20">
                {error}
              </div>
            )}
            
            <button 
              onClick={handleAccept}
              disabled={loading}
              className="group w-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 py-5 rounded-[1.75rem] font-bold shadow-2xl transition-all active:scale-[0.97] hover:bg-slate-800 dark:hover:bg-slate-50 flex items-center justify-center text-sm gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
              ) : (
                <>
                  ACEPTAR TÉRMINOS Y CONDICIONES
                  <ChevronDown className="group-hover:translate-x-1 transition-transform rotate-[-90deg]" size={18} />
                </>
              )}
            </button>
            
            <button 
              onClick={onLogout}
              className="w-full text-slate-400 dark:text-slate-500 py-2 font-bold text-xs transition-colors hover:text-slate-600 dark:hover:text-slate-300 flex items-center justify-center gap-2"
            >
              No acepto estos términos, cerrar sesión
            </button>
          </div>
        </div>

        {/* Scroll Hint Overlay */}
        {showScrollHint && (
          <div className="absolute bottom-24 right-8 pointer-events-none animate-bounce bg-white dark:bg-slate-800 text-slate-900 dark:text-white p-2 rounded-full shadow-xl border border-slate-100 dark:border-white/10">
            <ChevronDown size={20} />
          </div>
        )}
      </div>
    </div>
  );
};

export default PrivacyConsentModal;
