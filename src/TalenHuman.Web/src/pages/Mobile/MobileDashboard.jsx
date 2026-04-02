import React from 'react';
import { Calendar, MapPin, Clock, Bell, ChevronRight, CheckCircle2, AlertCircle, Info, ShieldCheck, User } from 'lucide-react';
import api from '../../services/api';

const MobileDashboard = ({ user }) => {
  const [loading, setLoading] = React.useState(true);
  const [todayShift, setTodayShift] = React.useState(null);
  const [news, setNews] = React.useState([]);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [shiftsRes, newsRes] = await Promise.all([
          api.get('/scheduling/my-shifts'),
          api.get('/news/my-news')
        ]);
        
        const today = new Date().toISOString().split('T')[0];
        const currentShift = shiftsRes.data.find(s => s.startTime.startsWith(today));
        setTodayShift(currentShift);
        setNews(newsRes.data.filter(n => n.isUrgent)); 
      } catch (err) {
        console.error("Mobile Dashboard fetch error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Iniciando Experiencia...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-1000 no-select">
      
      {/* 🚀 NATIVE HERO BANNER */}
      <section className="relative -mx-5 -mt-40 pt-40 pb-12 px-6 rounded-b-[3rem] overflow-hidden">
        {/* Deep branding background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-700 via-indigo-900 to-slate-950" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
        
        <div className="relative z-10 space-y-6">
           <div className="flex items-center justify-between">
              <div className="flex flex-col">
                 <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200/60 leading-none">Sesión Activa</span>
                 </div>
                 <h2 className="text-3xl font-black tracking-tighter text-white leading-tight">
                    Hola, {user?.fullName?.split(' ')[0] || 'Humano'}!
                 </h2>
                 <p className="text-sm font-medium text-blue-100/60 mt-1">
                    {user?.tenantName || 'TalenHuman Global'}
                 </p>
              </div>
              
              <div className="w-16 h-16 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 p-1">
                 {user?.profilePicture ? (
                    <img src={user.profilePicture} alt="Avatar" className="w-full h-full object-cover rounded-2xl" />
                 ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/50">
                       <User size={32} />
                    </div>
                 )}
              </div>
           </div>

           {/* Quick Stats Integration */}
           <div className="flex gap-3">
              <div className="flex-1 bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-300 border border-indigo-500/20">
                    <ShieldCheck size={16} />
                 </div>
                 <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-blue-200/40 leading-none mb-1">Estado</p>
                    <p className="text-xs font-bold text-white leading-none">Protegido</p>
                 </div>
              </div>
              <div className="flex-1 bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-300 border border-blue-500/20">
                    <Calendar size={16} />
                 </div>
                 <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-blue-200/40 leading-none mb-1">Hoy</p>
                    <p className="text-xs font-bold text-white leading-none">En Turno</p>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* 🗓️ TURNOS HERO CARD */}
      <section className="-mt-12 relative z-20">
         {todayShift ? (
           <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-1 border border-slate-100 dark:border-white/5 shadow-2xl shadow-indigo-500/20">
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[2.2rem] p-6 text-white relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Clock size={120} strokeWidth={1} />
                 </div>
                 
                 <div className="relative z-10 space-y-6">
                    <div className="flex items-center justify-between">
                       <div className="bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-500/30 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                          <span className="text-[9px] font-black uppercase tracking-widest">Turno Asignado</span>
                       </div>
                       <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Horario de Hoy</span>
                    </div>

                    <div className="flex flex-col">
                       <h3 className="text-4xl font-black tracking-tighter mb-1">
                          {new Date(todayShift.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                       </h3>
                       <p className="text-blue-100/60 font-bold uppercase tracking-[0.2em] text-[10px]">Punto de Entrada</p>
                    </div>

                    <div className="h-px bg-white/10 w-full" />

                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                          <MapPin size={24} className="text-indigo-400" />
                       </div>
                       <div>
                          <p className="text-sm font-black text-white leading-none mb-1">{todayShift.storeName || 'Sede Principal'}</p>
                          <p className="text-[10px] font-bold text-blue-100/40 uppercase tracking-widest leading-none">Localización Registrada</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
         ) : (
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-white/5 shadow-xl text-center space-y-4">
               <div className="w-20 h-20 bg-slate-50 dark:bg-white/5 rounded-[2rem] mx-auto flex items-center justify-center text-slate-300">
                  <Calendar size={40} strokeWidth={1.5} />
               </div>
               <div className="space-y-1">
                  <p className="text-base font-black text-slate-800 dark:text-white">Sin planes para hoy</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Hoy es tu día de descanso</p>
               </div>
            </div>
         )}
      </section>

      {/* ⚡ QUICK ACTIONS GRID */}
      <section className="animate-in slide-in-from-bottom-10 delay-200 duration-1000">
         <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Operaciones Rápidas</h3>
         </div>
         <div className="grid grid-cols-2 gap-4">
            <button className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 flex flex-col items-center gap-4 shadow-xl active:scale-95 transition-all group">
               <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-500/10 rounded-[1.5rem] flex items-center justify-center text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white shadow-lg shadow-indigo-500/10">
                  <CheckCircle2 size={28} />
               </div>
               <span className="text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Asistencia</span>
            </button>
            <button className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 flex flex-col items-center gap-4 shadow-xl active:scale-95 transition-all group">
               <div className="w-14 h-14 bg-amber-50 dark:bg-amber-500/10 rounded-[1.5rem] flex items-center justify-center text-amber-600 transition-colors group-hover:bg-amber-600 group-hover:text-white shadow-lg shadow-amber-500/10">
                  <Info size={28} />
               </div>
               <span className="text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Novedades</span>
            </button>
         </div>
      </section>

      {/* 🔔 NOVEDADES ALERT */}
      {news.length > 0 && (
         <section className="animate-in slide-in-from-right-10 delay-300 duration-1000 mb-10">
            <div className="bg-rose-500 rounded-[2.5rem] p-6 text-white shadow-2xl shadow-rose-500/30 flex items-center gap-5 relative overflow-hidden group active:scale-[0.98] transition-transform">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Bell size={60} strokeWidth={1} />
               </div>
               <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shrink-0">
                  <AlertCircle size={28} />
               </div>
               <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-rose-100 mb-1">Aviso Urgente</p>
                  <p className="text-sm font-black text-white truncate leading-none mb-1">{news[0].title}</p>
                  <p className="text-[9px] font-bold text-rose-100/60 uppercase tracking-widest leading-none">Toca para revisar</p>
               </div>
               <ChevronRight size={20} className="text-white/40" />
            </div>
         </section>
      )}

      {/* Footer Space padding for Nav */}
      <div className="h-6" />

    </div>
  );
};

export default MobileDashboard;
