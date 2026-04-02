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
    <div className="fixed inset-0 z-[10000] flex flex-col items-center bg-gradient-to-br from-slate-50 to-blue-50 overflow-hidden no-select"
         style={{ minHeight: '100dvh' }}>
      
      {/* 🚀 ELITE BRAND HEADER (Consistent with Login) */}
      <div className="w-full bg-gradient-to-br from-[#7c3aed] via-[#6366f1] to-[#4f46e5] p-12 flex flex-col items-center justify-center text-white relative shrink-0 shadow-2xl">
         <div className="absolute top-[-20%] right-[-10%] w-80 h-80 bg-white/10 rounded-full blur-3xl opacity-50"></div>
         
         <div className="relative z-10 flex flex-col items-center gap-3">
            <div className="bg-white/20 p-4 rounded-[1.5rem] backdrop-blur-md border border-white/30 shadow-lg mb-2">
               <ShieldCheck size={32} className="text-white drop-shadow-md" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter" style={{ fontFamily: "'Outfit', sans-serif" }}>Tu Privacidad</h1>
            <span className="text-[10px] font-black tracking-[0.3em] text-blue-100/60 uppercase">Seguridad Certificada</span>
         </div>
      </div>

      {/* 🎬 MAIN CONTENT (Scrollable Policy) */}
      <div className="w-full max-w-2xl px-6 py-10 flex-1 flex flex-col overflow-hidden">
        <div className="text-center mb-8 shrink-0">
           <h2 className="text-3xl font-black text-slate-800 tracking-tighter leading-tight">
             Tratamiento de <span className="text-blue-600">Información</span>
           </h2>
           <p className="text-slate-400 font-bold text-xs mt-2">
             Revisión obligatoria para tu seguridad
           </p>
        </div>

        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-8 py-8 bg-white rounded-[3rem] border border-slate-100 shadow-2xl shadow-blue-900/5 relative custom-scrollbar"
        >
          {policyText ? (
            <div className="text-sm text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">
              {policyText}
            </div>
          ) : (
            <div className="space-y-8 py-4">
              <div className="flex gap-5 items-start px-2">
                 <div className="bg-blue-50 p-4 rounded-2xl text-blue-600 shrink-0 border border-blue-100"><ShieldCheck size={24} /></div>
                 <div>
                    <p className="font-black text-slate-800 text-base tracking-tight mb-1">Privacidad por Diseño</p>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">Tus datos biométricos están encriptados y nunca salen de los servidores seguros de TalenHuman. Utilizamos tecnología WebAuthn de última generación.</p>
                 </div>
              </div>
              <div className="flex gap-5 items-start px-2">
                 <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600 shrink-0 border border-indigo-100"><Lock size={24} /></div>
                 <div>
                    <p className="font-black text-slate-800 text-base tracking-tight mb-1">Cumplimiento Legal</p>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">Operamos bajo los estándares más estrictos de protección de datos personales. Tu información solo se usa para el registro de asistencia operativa.</p>
                 </div>
              </div>
              <div className="p-6 bg-amber-50 border border-amber-100 rounded-[2rem] flex gap-4 items-center animate-in zoom-in-95 duration-700">
                 <ShieldAlert size={28} className="text-amber-500 shrink-0" />
                 <p className="text-xs font-bold text-amber-700 leading-tight">Al continuar, aceptas de forma explícita el tratamiento de tus datos personales para el control de asistencia.</p>
              </div>
            </div>
          )}

          {/* Scroll Hint overlay */}
          {showScrollHint && (
             <div className="sticky bottom-0 left-0 right-0 flex justify-center pb-4 pointer-events-none">
                <div className="bg-blue-600 text-white p-3 rounded-full shadow-2xl shadow-blue-500/40 animate-bounce">
                   <ChevronDown size={20} />
                </div>
             </div>
          )}
        </div>

        {/* 🎬 ACTION BUTTONS */}
        <div className="pt-10 flex flex-col gap-6 shrink-0">
          {error && <p className="text-red-500 text-center text-xs font-black animate-pulse">{error}</p>}
          
          <button 
            onClick={handleAccept}
            disabled={loading}
            className="group w-full bg-blue-600 text-white py-6 rounded-[2.2rem] font-black shadow-2xl shadow-blue-600/30 active:scale-[0.97] transition-all flex items-center justify-center text-sm gap-3 overflow-hidden relative"
          >
            {loading ? (
               <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
               <>
                  <CheckCircle2 size={24} />
                  <span>Aceptar y Continuar</span>
                  <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
               </>
            )}
          </button>

          <button 
            onClick={onLogout}
            className="w-full bg-slate-100 text-slate-500 hover:bg-slate-200 py-4 rounded-[2rem] font-bold text-xs transition-colors flex items-center justify-center gap-2 border border-slate-200/50"
          >
            <LogOut size={16} />
            Cancelar y Salir de la App
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyConsentModal;
