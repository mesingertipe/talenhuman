import React from 'react';
import { ShieldCheck, FileText, Lock, LogOut, ChevronDown, CheckCircle2, LucideUsers, ShieldAlert } from 'lucide-react';

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
    <div className="fixed inset-0 z-[10000] flex flex-col items-center bg-white overflow-hidden"
         style={{ minHeight: '100dvh' }}>
      
      {/* 🚀 ELITE BRAND HEADER (Consistent with Install/Login) */}
      <div className="w-full bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-10 flex flex-col items-center justify-center text-white relative shrink-0 shadow-lg">
         <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl opacity-50"></div>
         
         <div className="relative z-10 flex flex-col items-center gap-3">
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md border border-white/30 shadow-md">
               <ShieldCheck size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter" style={{ fontFamily: "'Outfit', sans-serif" }}>Privacidad de Datos</h1>
            <span className="text-[9px] uppercase font-bold tracking-[0.3em] text-blue-100 opacity-80">TalenHuman Security Core</span>
         </div>
      </div>

      {/* 🎬 MAIN CONTENT (Scrollable Policy) */}
      <div className="w-full max-w-2xl px-6 py-8 flex-1 flex flex-col overflow-hidden">
        <div className="text-center mb-6 shrink-0">
           <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">
             Tratamiento de <span className="text-blue-600">Información</span>
           </h2>
           <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">
             Revisión Obligatoria para continuar
           </p>
        </div>

        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-6 py-6 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-inner relative custom-scrollbar"
        >
          {policyText ? (
            <div className="text-sm text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">
              {policyText}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex gap-4 items-start">
                 <div className="bg-blue-100 p-2 rounded-lg text-blue-600 shrink-0"><ShieldCheck size={20} /></div>
                 <div>
                    <p className="font-bold text-slate-800 text-sm">Privacidad por Diseño</p>
                    <p className="text-xs text-slate-500 leading-relaxed">Tus datos biométricos están encriptados y nunca salen de los servidores seguros de TalenHuman.</p>
                 </div>
              </div>
              <div className="flex gap-4 items-start">
                 <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600 shrink-0"><Lock size={20} /></div>
                 <div>
                    <p className="font-bold text-slate-800 text-sm">Cumplimiento Legal</p>
                    <p className="text-xs text-slate-500 leading-relaxed">Operamos bajo los estándares más estrictos de protección de datos personales.</p>
                 </div>
              </div>
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3 items-center">
                 <ShieldAlert size={20} className="text-amber-500" />
                 <p className="text-[10px] font-bold text-amber-700 leading-tight">Al continuar, aceptas de forma explícita el tratamiento de tus datos para el control de asistencia.</p>
              </div>
            </div>
          )}

          {/* Scroll Hint overlay */}
          {showScrollHint && (
             <div className="sticky bottom-0 left-0 right-0 flex justify-center pb-2 pointer-events-none">
                <div className="bg-blue-600 text-white p-2 rounded-full shadow-lg animate-bounce">
                   <ChevronDown size={16} />
                </div>
             </div>
          )}
        </div>

        {/* 🎬 ACTION BUTTONS */}
        <div className="pt-8 flex flex-col gap-4 shrink-0">
          {error && <p className="text-red-500 text-center text-xs font-bold animate-pulse">{error}</p>}
          
          <button 
            onClick={handleAccept}
            disabled={loading}
            className="group w-full bg-blue-600 text-white py-5 rounded-[1.8rem] font-bold shadow-xl shadow-blue-600/30 active:scale-[0.97] transition-all flex items-center justify-center text-sm gap-3 overflow-hidden relative"
          >
            {loading ? (
               <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
               <>
                  <CheckCircle2 size={20} />
                  <span>Aceptar y Continuar</span>
                  <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
               </>
            )}
          </button>

          <button 
            onClick={onLogout}
            className="w-full text-slate-400 py-2 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut size={14} />
            Cancelar y Salir
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyConsentModal;
