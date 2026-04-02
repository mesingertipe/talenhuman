import React from 'react';
import { Calendar, MapPin, Clock, Bell, ChevronRight, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import api from '../../services/api';

const EmployeeDashboard = ({ user }) => {
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
        
        // Find today's shift
        const today = new Date().toISOString().split('T')[0];
        const currentShift = shiftsRes.data.find(s => s.startTime.startsWith(today));
        setTodayShift(currentShift);
        setNews(newsRes.data.filter(n => n.isUrgent)); // Only high importance for dashboard
      } catch (err) {
        console.error("Dashboard fetch error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="flex justify-center py-20 p-8"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* 🗓️ HERO SECTION: TURNO DE HOY (DomiCare Style) */}
      <section>
        <div className="flex items-center justify-between mb-4">
           <h3 className="text-lg font-black tracking-tight text-slate-800 dark:text-white">Turno de Hoy</h3>
           <span className="text-[10px] uppercase font-black tracking-widest text-indigo-500 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/10">
              {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
           </span>
        </div>

        {todayShift ? (
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-500/30 group active:scale-[0.98] transition-transform">
             {/* Decorative Background Elements */}
             <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-2xl" />
             <div className="absolute bottom-[-10%] left-[-10%] w-32 h-32 bg-blue-400/20 rounded-full blur-xl" />
             
             <div className="relative z-10 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                   <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg border border-white/20 flex items-center gap-2">
                      <Clock size={14} className="text-white" />
                      <span className="text-[10px] font-black uppercase tracking-widest tracking-tighter">En Curso</span>
                   </div>
                   <CheckCircle2 size={24} className="text-white/40" />
                </div>

                <div className="space-y-1">
                   <h2 className="text-3xl font-black tracking-tighter leading-none mb-1">
                      {new Date(todayShift.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - {new Date(todayShift.endTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                   </h2>
                   <p className="text-blue-100 font-bold opacity-80 uppercase tracking-widest text-[11px]">Horario de Operación</p>
                </div>

                <div className="flex items-center gap-4 bg-black/10 backdrop-blur-sm p-4 rounded-3xl border border-white/10">
                   <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
                      <MapPin size={20} className="text-white" />
                   </div>
                   <div className="flex-1">
                      <p className="text-xs font-black tracking-tight leading-none mb-1">{todayShift.storeName || 'Tienda Asignada'}</p>
                      <p className="text-[10px] font-bold text-blue-100/60 uppercase tracking-widest leading-none">Punto de Marcación</p>
                   </div>
                </div>
             </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 p-10 rounded-[2.5rem] text-center space-y-4 shadow-xl">
             <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-3xl mx-auto flex items-center justify-center text-slate-300">
                <Calendar size={32} />
             </div>
             <div className="space-y-1">
                <p className="text-sm font-black text-slate-800 dark:text-white">Sin turno programado</p>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Hoy es tu día libre</p>
             </div>
          </div>
        )}
      </section>

      {/* 📢 URGENT NEWS / NOVEDADES */}
      {news.length > 0 && (
        <section className="animate-in slide-in-from-right-8 duration-700 delay-200">
           <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black tracking-tight text-slate-800 dark:text-white">Avisos Importantes</h3>
              <span className="bg-red-500 w-2 h-2 rounded-full animate-ping" />
           </div>
           
           <div className="space-y-4">
              {news.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 p-5 bg-white dark:bg-slate-900 rounded-[2rem] border-l-4 border-l-red-500 shadow-xl shadow-slate-200/40 relative group overflow-hidden active:scale-95 transition-all">
                   <div className="bg-red-50 dark:bg-red-500/10 p-3 rounded-2xl flex items-center justify-center text-red-500">
                      <AlertCircle size={20} />
                   </div>
                   <div className="flex-1">
                      <p className="text-xs font-black text-slate-800 dark:text-white leading-tight mb-0.5">{item.title}</p>
                      <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">Atención Requerida</p>
                   </div>
                   <ChevronRight className="text-slate-300 group-hover:translate-x-1 transition-transform" size={18} />
                </div>
              ))}
           </div>
        </section>
      )}

      {/* 📊 ACCESO RÁPIDO / OPERACIONES */}
      <section className="animate-in slide-in-from-bottom-8 duration-700 delay-300">
         <h3 className="text-lg font-black tracking-tight text-slate-800 dark:text-white mb-4">Operaciones</h3>
         <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-white/5 flex flex-col items-center gap-3 shadow-xl active:scale-95 transition-all group">
               <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                  <CheckCircle2 size={24} />
               </div>
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Marcación</span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-white/5 flex flex-col items-center gap-3 shadow-xl active:scale-95 transition-all group">
               <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                  <Info size={24} />
               </div>
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Novedades</span>
            </div>
         </div>
      </section>

    </div>
  );
};

export default EmployeeDashboard;
