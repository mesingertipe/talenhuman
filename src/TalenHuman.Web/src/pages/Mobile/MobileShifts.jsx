import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, MapPin, 
  ChevronLeft, ChevronRight, 
  CalendarDays, CalendarRange, CalendarCheck,
  LayoutGrid, List, Sparkles, Filter
} from 'lucide-react';
import api from '../../services/api';

const MobileShifts = ({ user, theme }) => {
  const isDark = theme === 'dark';
  const [view, setView] = useState('day'); // 'day', 'week', 'month'
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    fetchShifts();
  }, [view, currentDate]);

  const fetchShifts = async () => {
    setLoading(true);
    try {
      let start, end;
      const d = new Date(currentDate);
      
      if (view === 'day') {
        start = new Date(d.setHours(0,0,0,0)).toISOString();
        end = new Date(d.setHours(23,59,59,999)).toISOString();
      } else if (view === 'week') {
        const first = d.getDate() - d.getDay();
        const last = first + 6;
        start = new Date(new Date(d.setDate(first)).setHours(0,0,0,0)).toISOString();
        end = new Date(new Date(d.setDate(last)).setHours(23,59,59,999)).toISOString();
      } else {
        start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
        end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString();
      }

      const res = await api.get('/shifts/my-shifts', { params: { start, end } });
      setShifts(res.data);
    } catch (err) {
      console.error("Fetch shifts error", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrev = () => {
    const d = new Date(currentDate);
    if (view === 'day') d.setDate(d.getDate() - 1);
    else if (view === 'week') d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (view === 'day') d.setDate(d.getDate() + 1);
    else if (view === 'week') d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  };

  const formatDateLabel = () => {
    if (view === 'day') return currentDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    if (view === 'week') {
      const first = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay()));
      const last = new Date(first);
      last.setDate(first.getDate() + 6);
      return `${first.getDate()} - ${last.getDate()} ${last.toLocaleDateString('es-ES', { month: 'short' })}`;
    }
    return currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  };

  const cardBg = isDark ? 'rgba(30, 41, 59, 0.4)' : '#ffffff';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0,0,0,0.04)';

  return (
    <div className="animate-in fade-in slide-in-from-right-10 duration-700 pb-20 no-select">
      
      {/* 🏔️ HEADER & TABS */}
      <div className="pt-4 px-2 mb-8">
         <h2 className="text-3xl font-black tracking-tighter text-slate-800 dark:text-white leading-tight">Mis Turnos</h2>
         <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">Programación Semanal</p>
         
         <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-2xl mt-6 gap-1">
            <TabButton active={view === 'day'} onClick={() => setView('day')} label="Día" isDark={isDark} />
            <TabButton active={view === 'week'} onClick={() => setView('week')} label="Semana" isDark={isDark} />
            <TabButton active={view === 'month'} onClick={() => setView('month')} label="Mes" isDark={isDark} />
         </div>
      </div>

      {/* 📅 DATE SELECTOR */}
      <div className="flex items-center justify-between px-4 mb-8 bg-white dark:bg-slate-900 py-4 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-xl shadow-slate-200/20">
         <button onClick={handlePrev} className="p-3 text-slate-400 hover:text-[#4f46e5] active:scale-90 transition-transform">
            <ChevronLeft size={24} strokeWidth={2.5} />
         </button>
         <div className="text-center">
            <p className="text-[14px] font-black tracking-tight text-slate-800 dark:text-white capitalize">{formatDateLabel()}</p>
         </div>
         <button onClick={handleNext} className="p-3 text-slate-400 hover:text-[#4f46e5] active:scale-90 transition-transform">
            <ChevronRight size={24} strokeWidth={2.5} />
         </button>
      </div>

      {/* 📜 SHIFT LIST */}
      <div className="space-y-4 px-1">
         {loading ? (
            <div className="py-20 flex flex-col items-center gap-4">
               <div className="w-10 h-10 border-4 border-[#4f46e5] border-t-transparent rounded-full animate-spin" />
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronizando Turnos...</p>
            </div>
         ) : shifts.length > 0 ? (
            shifts.map((shift, idx) => (
               <ShiftCard key={idx} shift={shift} isDark={isDark} />
            ))
         ) : (
            <div className="bg-slate-50 dark:bg-white/5 rounded-[3rem] p-16 border border-dashed border-slate-200 dark:border-white/10 text-center space-y-4">
               <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-3xl mx-auto flex items-center justify-center text-slate-300 shadow-sm">
                  <CalendarDays size={32} strokeWidth={1.5} />
               </div>
               <div className="space-y-1">
                  <p className="text-sm font-black text-slate-500">Sin turnos asignados</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">No hay programación para este periodo</p>
               </div>
            </div>
         )}
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, label, isDark }) => (
   <button 
      onClick={onClick}
      className={`flex-1 py-3 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${
         active 
            ? 'bg-white dark:bg-white/10 text-[#4f46e5] shadow-sm' 
            : 'text-slate-400'
      }`}
   >
      {label}
   </button>
);

const ShiftCard = ({ shift, isDark }) => {
   const isDescanso = shift.isDescanso;
   const startTime = new Date(shift.startTime);
   const endTime = new Date(shift.endTime);

   return (
      <div 
        className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 border border-slate-100 dark:border-white/5 shadow-xl shadow-slate-200/20 active:scale-[0.98] transition-transform overflow-hidden relative"
      >
         {isDescanso && (
            <div className="absolute top-0 right-0 p-4 opacity-5">
               <Sparkles size={100} />
            </div>
         )}

         <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  isDescanso 
                     ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 border border-amber-100' 
                     : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 border border-indigo-100'
               }`}>
                  {isDescanso ? <Sparkles size={24} /> : <Clock size={24} />}
               </div>
               <div>
                  <p className="text-sm font-black text-slate-800 dark:text-white">
                     {isDescanso ? 'Descanso' : 'Turno Operativo'}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                     {startTime.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' })}
                  </p>
               </div>
            </div>
            {!isDescanso && (
               <div className="px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 rounded-full">
                  <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Programado</span>
               </div>
            )}
         </div>

         {!isDescanso ? (
            <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-white/5 p-5 rounded-[2rem] border border-slate-100 dark:border-white/5">
               <div className="space-y-1">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Entrada</p>
                  <div className="flex items-center gap-2 text-slate-800 dark:text-white">
                     <span className="text-xl font-black tracking-tighter">
                        {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                     </span>
                  </div>
               </div>
               <div className="space-y-1">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Salida</p>
                  <div className="flex items-center gap-2 text-slate-800 dark:text-white">
                     <span className="text-xl font-black tracking-tighter">
                        {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                     </span>
                  </div>
               </div>
            </div>
         ) : (
            <div className="bg-amber-50 dark:bg-amber-500/10 p-5 rounded-[2rem] border border-amber-100 dark:border-amber-500/10 text-center">
               <p className="text-[13px] font-black text-amber-600 uppercase tracking-widest">¡Disfruta tu día libre! ✨</p>
            </div>
         )}

         {shift.observation && (
            <div className="mt-4 flex items-center gap-2 opacity-60 px-2">
               <Filter size={12} />
               <p className="text-[11px] font-bold text-slate-500 italic">"{shift.observation}"</p>
            </div>
         )}
      </div>
   );
};

export default MobileShifts;
