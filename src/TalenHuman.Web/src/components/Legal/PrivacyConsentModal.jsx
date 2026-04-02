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
    <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-blue-600/30 backdrop-blur-md p-4 overflow-hidden">
      
      {/* Background Shapes for 'Pro' look */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-blue-500 rounded-full blur-3xl opacity-30" />
      <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-blue-700 rounded-full blur-3xl opacity-30" />

      <div className="bg-white/95 dark:bg-slate-900/95 w-full max-w-lg rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 duration-500 border border-white/20 relative z-10"
           style={{ maxHeight: '88vh' }}>
        
        {/* Header - Pro Minimalist */}
        <div className="p-8 pb-6 text-center shrink-0 border-b border-slate-100 dark:border-white/5">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4 border border-blue-100 dark:border-blue-500/20">
            <ShieldCheck size={12} />
            Privacidad TalenHuman
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">Privacidad y Seguridad</h2>
        </div>

        {/* Content Area */}
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar relative"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {policyText ? (
            <div className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed font-medium bg-slate-50/50 dark:bg-white/5 p-8 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-inner">
              {policyText}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-6 bg-blue-50/50 dark:bg-blue-500/5 rounded-3xl border border-blue-100/50 dark:border-blue-500/20 flex gap-4">
                 <ShieldCheck className="text-blue-600 shrink-0" size={24} />
                 <div>
                    <p className="font-bold text-slate-900 dark:text-white text-sm mb-1">Protección de Datos</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">Sus datos biométricos y personales serán tratados exclusivamente para control de asistencia.</p>
                 </div>
              </div>
            </div>
          )}

          {/* Action Area */}
          <div className="space-y-4 mt-8 pb-8">
            <button 
              onClick={handleAccept}
              disabled={loading}
              className="group w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-[1.75rem] font-bold shadow-2xl shadow-blue-500/30 transition-all active:scale-[0.97] flex items-center justify-center text-sm gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'ACEPTAR Y CONTINUAR'
              )}
            </button>
            
            <button 
              onClick={onLogout}
              className="w-full text-slate-400 dark:text-slate-500 py-2 font-bold text-xs transition-colors hover:text-slate-600 dark:hover:text-slate-300 flex items-center justify-center gap-2"
            >
              Cerrar sesión
            </button>
          </div>
        </div>

        {/* Scroll Hint */}
        {showScrollHint && (
          <div className="absolute bottom-24 right-8 pointer-events-none animate-bounce bg-blue-600 text-white p-2 rounded-full shadow-2xl">
            <ChevronDown size={20} />
          </div>
        )}
      </div>
    </div>
  );
};

export default PrivacyConsentModal;
