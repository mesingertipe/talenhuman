import React, { useState, useEffect } from 'react';
import { 
    Users, CheckCircle, AlertCircle, Clock, XCircle, TrendingUp, 
    PieChart as PieIcon, BarChart3, Calendar, Filter, Building2, Tags, Briefcase, ChevronDown
} from 'lucide-react';
import { 
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area 
} from 'recharts';
import api from '../services/api';
import SearchableSelect from '../components/Shared/SearchableSelect';

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
      {trend !== undefined && (
        <div className={`text-[10px] font-bold mt-1 flex items-center gap-1 ${trend >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
           <TrendingUp size={10} className={trend < 0 ? 'rotate-180' : ''} /> {Math.abs(trend)}% vs ayer
        </div>
      )}
    </div>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Filter Metadata
  const [metadata, setMetadata] = useState({
      stores: [],
      brands: [],
      profiles: []
  });

  // Filter State
  const [filters, setFilters] = useState({
      start: new Date().toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
      storeId: '',
      brandId: '',
      profileId: ''
  });

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchStats();
  }, [filters]);

  const fetchMetadata = async () => {
      try {
          const [storesRes, brandsRes, profilesRes] = await Promise.all([
              api.get('/stores'),
              api.get('/brands'),
              api.get('/profiles')
          ]);
          setMetadata({
              stores: storesRes.data,
              brands: brandsRes.data,
              profiles: profilesRes.data
          });
      } catch (error) {
          console.error("Error fetching filter metadata", error);
      }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.start) params.append('start', filters.start);
      if (filters.end) params.append('end', filters.end);
      if (filters.storeId) params.append('storeId', filters.storeId);
      if (filters.brandId) params.append('brandId', filters.brandId);
      if (filters.profileId) params.append('profileId', filters.profileId);

      const response = await api.get(`/attendance/stats?${params.toString()}`);
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching stats", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
      setFilters(prev => ({ ...prev, [name]: value }));
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const pieData = stats ? [
    { name: 'Correcto', value: stats.correct, color: '#6366f1' },
    { name: 'Errada', value: stats.errada, color: '#f59e0b' },
    { name: 'Sin Marcación', value: stats.sinMarcacion, color: '#ef4444' },
    { name: 'Desfasado', value: stats.desfasado, color: '#8b5cf6' },
  ].filter(d => d.value > 0) : [];

  const totalAttendances = stats ? (stats.correct + stats.errada + stats.desfasado + stats.sinMarcacion) : 0;
  const attendanceRate = totalAttendances > 0 ? Math.round((stats.correct / totalAttendances) * 100) : 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Panel de Control</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Resumen ejecutivo de asistencia operativa.</p>
        </div>
        <div className="flex items-center gap-3">
            <div className="px-6 py-3 bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-50 dark:border-slate-800 shadow-sm flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest whitespace-nowrap">En Vivo: {new Date().toLocaleDateString()}</span>
            </div>
        </div>
      </header>

      {/* Advanced Filters Panel */}
      <div className="bg-slate-50/50 dark:bg-slate-900/30 p-6 rounded-[40px] border border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3 mb-6 px-2">
            <Filter size={18} className="text-indigo-500" />
            <h2 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Filtros de Análisis</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 px-2 uppercase tracking-widest">Desde</label>
                <div className="relative">
                    <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        type="date" 
                        value={filters.start}
                        onChange={(e) => handleFilterChange('start', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 px-2 uppercase tracking-widest">Hasta</label>
                <div className="relative">
                    <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        type="date" 
                        value={filters.end}
                        onChange={(e) => handleFilterChange('end', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                    />
                </div>
            </div>

            <div className="md:mt-2">
                <SearchableSelect
                    label="Tienda"
                    options={metadata.stores}
                    value={filters.storeId}
                    onChange={(val) => handleFilterChange('storeId', val)}
                    placeholder="Todas las tiendas"
                    icon={Building2}
                />
            </div>

            <div className="md:mt-2">
                <SearchableSelect
                    label="Marca"
                    options={metadata.brands}
                    value={filters.brandId}
                    onChange={(val) => handleFilterChange('brandId', val)}
                    placeholder="Todas las marcas"
                    icon={Tags}
                />
            </div>

            <div className="md:mt-2">
                <SearchableSelect
                    label="Puesto / Cargo"
                    options={metadata.profiles}
                    value={filters.profileId}
                    onChange={(val) => handleFilterChange('profileId', val)}
                    placeholder="Todos los puestos"
                    icon={Briefcase}
                />
            </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <StatCard title="Colaboradores" value={stats?.totalEmployees || 0} icon={Users} color="bg-indigo-600" />
        <StatCard title="Tiendas" value={stats?.totalStores || 0} icon={Building2} color="bg-slate-600" />
        <StatCard title="Marcas" value={stats?.totalBrands || 0} icon={Tags} color="bg-sky-600" />
        <StatCard title="Asistencia OK" value={`${attendanceRate}%`} subValue={`(${stats?.correct || 0})`} icon={CheckCircle} color="bg-emerald-600" />
        <StatCard title="Marc. Erradas" value={stats?.errada || 0} icon={AlertCircle} color="bg-amber-600" />
        <StatCard title="Sin Marcación" value={stats?.sinMarcacion || 0} icon={XCircle} color="bg-rose-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pie Chart: Distribution */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-sm border border-slate-50 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-8">
            <PieIcon size={20} className="text-indigo-500" />
            <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">Distribución Asistencia</h2>
          </div>
          <div className="w-full" style={{ height: '300px', position: 'relative' }}>
            {pieData.length > 0 ? (
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
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 opacity-50">
                    <PieIcon size={48} strokeWidth={1} />
                    <p className="text-[10px] font-black uppercase tracking-widest">Sin datos en este periodo</p>
                </div>
            )}
          </div>
        </div>

        {/* Bar Chart: Last 7 Days (History) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-sm border border-slate-50 dark:border-slate-800">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
                <BarChart3 size={20} className="text-indigo-500" />
                <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">Tendencia Histórica</h2>
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Últimos 7 días analizados</span>
          </div>
          <div className="w-full" style={{ height: '300px', position: 'relative' }}>
            {stats?.history && stats.history.length > 0 ? (
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
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 opacity-50">
                    <BarChart3 size={48} strokeWidth={1} />
                    <p className="text-[10px] font-black uppercase tracking-widest">Sin datos históricos disponibles</p>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
