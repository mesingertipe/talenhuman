import React from 'react';
import { Clock, ArrowUpRight, ArrowDownLeft, MapPin, Calendar, ListTodo } from 'lucide-react';
import api from '../../services/api';

const MobileAttendance = ({ user }) => {
  const [data, setData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const res = await api.get('/attendance', { params: { start: today, end: today } });
        setData(res.data);
      } catch (err) {
        console.error("Fetch attendance error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sincronizando Historial...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-10 duration-700 no-select pb-20">
      
      {/* 📍 PAGE HEADER */}
      <div className="pt-4 px-2">
         <h2 className="text-3xl font-black tracking-tighter text-slate-800 dark:text-white leading-tight">Mi Actividad</h2>
         <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">Registros de Hoy</p>
      </div>

      {/* 📜 ACTIVITY LIST */}
      <div className="space-y-4">
        {data.length > 0 ? (
          data.map((item, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 border border-slate-100 dark:border-white/5 shadow-xl shadow-slate-200/20 active:scale-[0.98] transition-transform">
               
               <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-100 dark:border-emerald-500/10">
                        <Clock size={20} />
                     </div>
                     <div>
                        <p className="text-xs font-black text-slate-800 dark:text-white">{item.storeName || 'Sede Principal'}</p>
                        <div className="flex items-center gap-1 opacity-40">
                           <MapPin size={10} />
                           <span className="text-[9px] font-bold uppercase tracking-widest">Punto de Control</span>
                        </div>
                     </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                    item.status === 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    {item.statusText || 'Procesado'}
                  </span>
               </div>

               <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-white/5 p-4 rounded-[2rem]">
                  <div className="space-y-1">
                     <div className="flex items-center gap-2 text-emerald-500">
                        <ArrowUpRight size={14} />
                        <span className="text-sm font-black tracking-tight">{item.clockIn ? new Date(item.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                     </div>
                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-5">Entrada</p>
                  </div>
                  <div className="space-y-1">
                     <div className="flex items-center gap-2 text-indigo-500">
                        <ArrowDownLeft size={14} />
                        <span className="text-sm font-black tracking-tight">{item.clockOut ? new Date(item.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                     </div>
                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-5">Salida</p>
                  </div>
               </div>

            </div>
          ))
        ) : (
          <div className="bg-slate-50 dark:bg-white/5 rounded-[3rem] p-16 border border-dashed border-slate-200 dark:border-white/10 text-center space-y-4">
             <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-3xl mx-auto flex items-center justify-center text-slate-300 shadow-sm">
                <ListTodo size={32} strokeWidth={1.5} />
             </div>
             <div className="space-y-1">
                <p className="text-sm font-black text-slate-500">Sin marcas registradas</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Tu historial aparecerá aquí</p>
             </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default MobileAttendance;
