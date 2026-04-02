import React from 'react';
import { 
  Calendar, MapPin, Clock, Bell, ChevronRight, 
  CheckCircle2, AlertCircle, Info, ShieldCheck, 
  User, Fingerprint, Star, Sparkles 
} from 'lucide-react';
import api from '../../services/api';
import BiometricEnrollModal from '../../components/Biometrics/BiometricEnrollModal';

const MobileDashboard = ({ user }) => {
  const [loading, setLoading] = React.useState(true);
  const [todayShift, setTodayShift] = React.useState(null);
  const [news, setNews] = React.useState([]);
  const [showBiometrics, setShowBiometrics] = React.useState(false);

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Safe Individual Fetches for V56 Elite
        try {
          const shiftsRes = await api.get('/shifts/my-shifts');
          const today = new Date().toISOString().split('T')[0];
          const currentShift = shiftsRes.data.find(s => s.startTime.startsWith(today));
          setTodayShift(currentShift);
        } catch (e) {
          console.error("Dashboard Shifts Error", e);
        }

        try {
          const newsRes = await api.get('/novedades/my-news');
          setNews(newsRes.data);
        } catch (e) {
          console.warn("News service offline (404)", e);
          setNews([]);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <div className="w-16 h-16 bg-white/5 rounded-3xl backdrop-blur-xl border border-white/10 flex items-center justify-center animate-pulse">
           <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mt-6">Sincronizando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-10 duration-1000 no-select pb-32 pt-6">
      
      {/* 🚀 BIOMETRIC MODAL (OPTIONAL SECURITY OPTION) */}
      {showBiometrics && <BiometricEnrollModal onComplete={() => setShowBiometrics(false)} onCancel={() => setShowBiometrics(false)} />}

      {/* 👑 ELITE HERO SECTION (V56 NATIVE IMMERSION) */}
      <section className="relative">
         <div className="flex items-center justify-between mb-10">
            <div className="flex flex-col">
               <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.6)] animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-300/80">Sesión Elite Activa</span>
               </div>
               <h2 className="text-4xl font-black tracking-tighter text-white leading-none">
                  Hola, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-indigo-400">
                    {user?.fullName?.split(' ')[0] || 'Humano'}!
                  </span>
               </h2>
               <div className="flex items-center gap-2 mt-4 px-3 py-1 bg-white/5 backdrop-blur-md rounded-full border border-white/5 w-fit">
                  <Star size={10} className="text-amber-400 fill-amber-400" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-indigo-200/60">
                    {user?.tenantName || 'TalenHuman Global'}
                  </span>
               </div>
            </div>
            
            <button 
               onClick={() => setShowBiometrics(true)}
               className="w-16 h-16 rounded-[2rem] bg-white/5 backdrop-blur-3xl border border-white/10 flex items-center justify-center text-indigo-300 shadow-2xl active:scale-90 transition-all group overflow-hidden"
            >
               <div className="absolute inset-0 bg-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
               <Fingerprint size={32} className="relative z-20 group-hover:scale-110 transition-transform" />
               <div className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center border-2 border-slate-950">
                  <Sparkles size={8} className="text-white" />
               </div>
            </button>
         </div>

         {/* 🗓️ TURNOS PREMIUM CARD (GLASSMORPHISM) */}
         {todayShift ? (
           <div className="group relative overflow-hidden bg-white/5 backdrop-blur-2xl rounded-[3.5rem] p-[1.5px] shadow-2xl transition-all active:scale-[0.98]">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/30 via-transparent to-blue-500/30" />
              <div className="relative bg-slate-950/80 rounded-[3.45rem] p-10 space-y-10">
                 <div className="flex justify-between items-start">
                    <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner">
                       <Clock size={28} />
                    </div>
                    <div className="flex flex-col items-end">
                       <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-1">Estado de Hoy</span>
                       <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-emerald-500/20">Programado</span>
                    </div>
                 </div>
                 
                 <div className="space-y-2">
                    <h3 className="text-6xl font-black tracking-tighter text-white">
                       {new Date(todayShift.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </h3>
                    <p className="text-indigo-300/40 font-black uppercase tracking-[0.4em] text-[11px] ml-1">Entrada Principal</p>
                 </div>

                 <div className="flex items-center gap-5 pt-10 border-t border-white/5">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 shadow-lg">
                       <MapPin size={24} className="text-indigo-400" />
                    </div>
                    <div>
                       <p className="text-base font-black text-white leading-tight">{todayShift.storeName || 'Sede Central'}</p>
                       <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mt-1">Ubicación Geolocalizada</p>
                    </div>
                 </div>
              </div>
           </div>
         ) : (
            <div className="relative bg-white/5 backdrop-blur-xl rounded-[3.5rem] p-12 border border-white/10 text-center space-y-8 shadow-2xl">
               <div className="w-28 h-28 bg-white/5 rounded-[3rem] mx-auto flex items-center justify-center text-white/5 border border-white/5 shadow-inner">
                  <Calendar size={56} strokeWidth={0.75} className="opacity-40" />
               </div>
               <div className="space-y-3">
                  <p className="text-2xl font-black text-white tracking-tight">Día de Descanso</p>
                  <p className="text-xs text-indigo-400/50 font-bold uppercase tracking-[0.3em]">Disfruta tu jornada, Edna ✨</p>
               </div>
            </div>
         )}
      </section>

      {/* ⚡ SMART ACTIONS GRID (APP-LIKE FEEL) */}
      <section className="space-y-6">
         <div className="px-4 flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-[0.35em] text-white/20">Operaciones Rápidas</h3>
            <div className="h-[1px] flex-1 bg-white/5 ml-4" />
         </div>
         <div className="grid grid-cols-2 gap-6">
            <button className="relative overflow-hidden bg-white/5 backdrop-blur-2xl p-10 rounded-[3rem] border border-white/10 flex flex-col items-center gap-6 group transition-all active:scale-95 shadow-xl">
               <div className="absolute inset-0 bg-indigo-500/5 group-active:bg-indigo-500/20 transition-colors" />
               <div className="w-20 h-20 bg-indigo-500/10 rounded-[2rem] flex items-center justify-center text-indigo-400 border border-indigo-500/20 group-hover:scale-110 shadow-lg shadow-indigo-500/10 transition-transform">
                  <CheckCircle2 size={36} />
               </div>
               <span className="text-xs font-black uppercase tracking-[0.15em] text-white/70">Asistencia</span>
            </button>
            <button className="relative overflow-hidden bg-white/5 backdrop-blur-2xl p-10 rounded-[3rem] border border-white/10 flex flex-col items-center gap-6 group transition-all active:scale-95 shadow-xl">
               <div className="absolute inset-0 bg-amber-500/5 group-active:bg-amber-500/20 transition-colors" />
               <div className="w-20 h-20 bg-amber-500/10 rounded-[2rem] flex items-center justify-center text-amber-400 border border-amber-500/20 group-hover:scale-110 shadow-lg shadow-amber-500/10 transition-transform">
                  <Info size={36} />
               </div>
               <span className="text-xs font-black uppercase tracking-[0.15em] text-white/70">Novedades</span>
            </button>
         </div>
      </section>

      {/* 🔔 NOVEDADES CRISTAL ALERT (V56 ELITE) */}
      {news.length > 0 && (
         <section className="space-y-4">
            <div className="px-4 flex items-center justify-between">
               <h3 className="text-[10px] font-black uppercase tracking-[0.35em] text-rose-500/60 font-bold">Alertas Prioritarias</h3>
               <div className="h-[1px] flex-1 bg-rose-500/10 ml-4" />
            </div>
            <div className="bg-gradient-to-br from-rose-500/30 to-rose-900/40 backdrop-blur-3xl rounded-[3rem] p-10 border border-rose-500/30 flex items-center gap-8 relative overflow-hidden group active:scale-[0.98] transition-transform shadow-2xl">
               <div className="absolute top-0 right-0 p-10 opacity-10 scale-150 rotate-12 group-hover:rotate-45 transition-transform duration-700">
                  <Bell size={120} />
               </div>
               <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-[1.8rem] flex items-center justify-center border border-white/20 shrink-0 shadow-lg">
                  <AlertCircle size={28} className="text-white" />
               </div>
               <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-rose-200 mb-1">Aviso Crítico</p>
                  <p className="text-lg font-black text-white truncate mb-2">{news[0].title}</p>
                  <div className="flex items-center gap-2 text-[9px] font-black text-white/40 uppercase tracking-widest">
                     <span>Ver Detalles</span>
                     <ChevronRight size={12} />
                  </div>
               </div>
            </div>
         </section>
      )}

    </div>
  );
};

export default MobileDashboard;
