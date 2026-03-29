import React, { useState, useEffect } from 'react';
import { Users, CheckCircle, AlertCircle, Clock, XCircle, TrendingUp, PieChart as PieIcon, BarChart3 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area } from 'recharts';
import api from '../services/api';

const StatCard = ({ title, value, subValue, icon: Icon, color, trend }) => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-5 transition-all hover:shadow-xl hover:-translate-y-1 group">
    <div className={`w-14 h-14 rounded-2xl ${color} bg-opacity-10 flex items-center justify-center text-opacity-100 group-hover:scale-110 transition-transform`}>
      <Icon size={28} className={color.replace('bg-', 'text-')} />
    </div>
    <div className="flex-1">
      <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{title}</p>
      <div className="flex items-baseline gap-2">
        <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{value}</h3>
        {subValue && <span className="text-xs font-bold text-slate-400">{subValue}</span>}
      </div>
      {trend && (
        <div className={`text-[10px] font-bold mt-1 flex items-center gap-1 ${trend > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
           <TrendingUp size={10} /> {trend}% vs ayer
        </div>
      )}
    </div>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/attendance/stats');
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching stats", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const pieData = [
    { name: 'Correcto', value: stats.correct, color: '#6366f1' },
    { name: 'Errada', value: stats.errada, color: '#f59e0b' },
    { name: 'Sin Marcación', value: stats.sinMarcacion, color: '#ef4444' },
    { name: 'Desfasado', value: stats.desfasado, color: '#8b5cf6' },
  ].filter(d => d.value > 0);

  const totalAttendances = stats.correct + stats.errada + stats.desfasado + stats.sinMarcacion;
  const attendanceRate = totalAttendances > 0 ? Math.round((stats.correct / totalAttendances) * 100) : 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Panel de Control</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Resumen ejecutivo de asistencia operativa.</p>
        </div>
        <div className="px-6 py-3 bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-50 dark:border-slate-800 shadow-sm flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">En Vivo: {new Date().toLocaleDateString()}</span>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Colaboradores" value={stats.totalEmployees} icon={Users} color="bg-indigo-600" />
        <StatCard title="Asistencia OK" value={`${attendanceRate}%`} subValue={`(${stats.correct})`} icon={CheckCircle} color="bg-emerald-600" trend={2} />
        <StatCard title="Marc. Erradas" value={stats.errada} icon={AlertCircle} color="bg-amber-600" />
        <StatCard title="Sin Marcación" value={stats.sinMarcacion} icon={XCircle} color="bg-rose-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pie Chart: Distribution */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-sm border border-slate-50 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-8">
            <PieIcon size={20} className="text-indigo-500" />
            <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">Estado de Hoy</h2>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart: Last 7 Days */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-sm border border-slate-50 dark:border-slate-800">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
                <BarChart3 size={20} className="text-indigo-500" />
                <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">Tendencia 7 Días</h2>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.history}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                <Tooltip 
                   cursor={{ fill: '#f8fafc' }}
                   contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="correctO" name="Correctos" fill="#6366f1" radius={[10, 10, 0, 0]} barSize={30} />
                <Bar dataKey="errors" name="Incidentes" fill="#cbd5e1" radius={[10, 10, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
