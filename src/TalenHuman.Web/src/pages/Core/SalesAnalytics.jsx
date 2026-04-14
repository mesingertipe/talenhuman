import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Legend, AreaChart, Area, ComposedChart, PieChart, Pie, Cell
} from 'recharts';
import { 
  TrendingUp, Calendar, Filter, Store, Layers, Clock, 
  DollarSign, Hash, Users, ArrowUpRight, ArrowDownRight,
  ChevronDown, RefreshCw, BarChart3, Presentation, PieChart as PieIcon,
  Table as TableIcon, Download, Info, Search
} from 'lucide-react';
import api from '../../services/api';
import SearchableSelect from '../../components/Shared/SearchableSelect';
import { useTheme } from '../../context/ThemeContext';

const SalesAnalytics = ({ user }) => {
  const { isDarkMode } = useTheme();
  const activeColors = {
    bg: isDarkMode ? '#0f172a' : '#f8fafc',
    card: isDarkMode ? '#1e293b' : '#ffffff',
    border: isDarkMode ? '#334155' : '#f1f5f9',
    textMain: isDarkMode ? '#f1f5f9' : '#1e293b',
    textMuted: isDarkMode ? '#94a3b8' : '#64748b',
    accent: '#6366f1',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444'
  };

  const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const [loading, setLoading] = useState(true);
  const [evolutionData, setEvolutionData] = useState({ current: [], history: [] });
  const [summaryData, setSummaryData] = useState([]);
  const [channelData, setChannelData] = useState([]);
  const [detailedRecords, setDetailedRecords] = useState([]);
  const [metadata, setMetadata] = useState({ stores: [], channels: [] });
  
  const [filters, setFilters] = useState({
    date: new Date().toISOString().split('T')[0],
    storeId: '',
    channelId: ''
  });

  const [activeMetric, setActiveMetric] = useState('ventaNeta'); // ventaNeta, cantidadTickets, comensales, ticketPromedio

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [filters]);

  const fetchMetadata = async () => {
    try {
      const [storesRes, channelsRes] = await Promise.all([
        api.get('/stores'),
        api.get('/sales/channels')
      ]);
      setMetadata({
        stores: storesRes.data,
        channels: channelsRes.data
      });
    } catch (err) {
      console.error("Error fetching metadata:", err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(filters);
      
      const [summaryRes, evolutionRes, channelRes, recordsRes] = await Promise.all([
        api.get(`/sales/analytics/summary?${params.toString()}`),
        api.get(`/sales/analytics/evolution?${params.toString()}`),
        api.get(`/sales/analytics/channels?${params.toString()}`),
        api.get(`/sales?startDate=${filters.date}&endDate=${filters.date}&pageSize=100${filters.storeId ? `&storeId=${filters.storeId}` : ''}`)
      ]);
      
      setSummaryData(summaryRes.data);
      setEvolutionData(evolutionRes.data);
      setChannelData(channelRes.data);
      setDetailedRecords(recordsRes.data.items || []);
    } catch (err) {
      console.error("Error fetching analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  const chartData = useMemo(() => {
    // Merge current and history for Recharts
    const timeSlots = Array.from(new Set([
      ...evolutionData.current.map(d => new Date(d.recordDate).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false })),
      ...evolutionData.history.map(d => d.time.substring(0, 5))
    ])).sort();

    return timeSlots.map(time => {
      const curr = evolutionData.current.find(d => new Date(d.recordDate).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false }) === time);
      const hist = evolutionData.history.find(d => d.time.substring(0, 5) === time);
      
      return {
        time,
        Current: curr ? curr[activeMetric] : 0,
        HistoryAvg: hist ? (
          activeMetric === 'ventaNeta' ? hist.ventaNetaAvg :
          activeMetric === 'cantidadTickets' ? hist.ticketsAvg :
          activeMetric === 'comensales' ? hist.comensalesAvg :
          hist.ticketPromedioAvg
        ) : 0
      };
    });
  }, [evolutionData, activeMetric]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);
  };

  const metricsConfig = {
    ventaNeta: { label: 'Venta Neta', icon: DollarSign, color: '#6366f1', format: formatCurrency },
    cantidadTickets: { label: 'Cant. Tickets', icon: Hash, color: '#8b5cf6', format: (v) => Math.round(v) },
    comensales: { label: 'Comensales', icon: Users, color: '#10b981', format: (v) => Math.round(v) },
    ticketPromedio: { label: 'Ticket Prom.', icon: BarChart3, color: '#f59e0b', format: formatCurrency }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {/* Top Banner & Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
             <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                <Presentation size={18} />
             </div>
             <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Master BI Dashboard</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Intelligence Command Center</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium italic">Visión 360° de la operación comercial y análisis predictivo de carga.</p>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-black uppercase tracking-wider border border-emerald-500/20">
              Live Sync Active
           </div>
          <button 
            onClick={fetchAnalytics}
            className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all text-slate-500"
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </header>

      {/* Control Panel (Filters) */}
      <section className="bg-white dark:bg-slate-800 p-8 rounded-[48px] shadow-sm border border-slate-50 dark:border-slate-800 relative z-50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <label className="text-[10px] font-black text-slate-400 px-2 uppercase tracking-widest mb-3 block">Fecha de Operación</label>
            <div className="relative group">
              <Calendar size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors z-10" />
              <input 
                type="date"
                value={filters.date}
                onChange={(e) => setFilters({...filters, date: e.target.value})}
                className="w-full p-5 pl-14 rounded-3xl border-2 border-slate-50 dark:border-slate-900 bg-slate-50 dark:bg-slate-900/50 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all font-bold text-sm"
              />
            </div>
          </div>
          <div>
            <SearchableSelect 
              label="Sede / Establecimiento"
              options={metadata.stores}
              value={filters.storeId}
              onChange={(val) => setFilters({...filters, storeId: val})}
              icon={Store}
              placeholder="Todas las sedes"
            />
          </div>
          <div>
            <SearchableSelect 
              label="Segmentación de Canal"
              options={metadata.channels}
              value={filters.channelId}
              onChange={(val) => setFilters({...filters, channelId: val})}
              icon={Layers}
              placeholder="Filtro omnicanal"
            />
          </div>
        </div>
      </section>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
         {/* Left Side: Metric Selectors */}
         <div className="lg:col-span-1 flex flex-col gap-4">
            {Object.keys(metricsConfig).map(k => {
              const cfg = metricsConfig[k];
              const Icon = cfg.icon;
              const isActive = activeMetric === k;
              
              return (
                <button 
                  key={k}
                  onClick={() => setActiveMetric(k)}
                  className={`p-6 rounded-[32px] border-2 text-left transition-all relative overflow-hidden group ${
                    isActive 
                      ? 'bg-white dark:bg-slate-800 border-indigo-500 shadow-2xl shadow-indigo-500/10 -translate-x-2' 
                      : 'bg-slate-100/30 dark:bg-slate-900/30 border-transparent grayscale opacity-60 hover:grayscale-0 hover:opacity-100 hover:bg-white dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-5 relative z-10">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: isActive ? cfg.color : 'white', color: isActive ? 'white' : cfg.color }}>
                      <Icon size={28} />
                    </div>
                    <div>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-indigo-500' : 'text-slate-400'}`}>{cfg.label}</p>
                        <h4 className="text-xl font-black text-slate-800 dark:text-white leading-tight">Master Metrics</h4>
                    </div>
                  </div>
                  {isActive && <div className="absolute right-0 top-0 h-full w-1.5 bg-indigo-500"></div>}
                </button>
              );
            })}
         </div>

         {/* Center: Band Cards */}
         <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            {summaryData.length > 0 ? summaryData.map((band, idx) => (
               <div key={idx} className="bg-white dark:bg-slate-800 p-10 rounded-[48px] shadow-sm border border-slate-50 dark:border-slate-800 relative overflow-hidden group hover:scale-[1.02] transition-all flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-slate-50 dark:bg-slate-900/30 rounded-full -mr-20 -mt-20 group-hover:scale-125 transition-transform duration-700"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-8">
                       <div style={{ background: `${band.color}15`, color: band.color }} className="w-12 h-12 rounded-2xl flex items-center justify-center">
                          <Clock size={24} />
                       </div>
                       <span style={{ color: band.color, background: `${band.color}10` }} className="text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">{band.name}</span>
                    </div>
                    
                    <div className="space-y-2">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{metricsConfig[activeMetric].label}</p>
                       <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                        {metricsConfig[activeMetric].format(band[activeMetric])}
                       </h3>
                    </div>
                  </div>
                  
                  <div className="mt-8 pt-8 border-t border-slate-50 dark:border-slate-900 grid grid-cols-2 gap-4 relative z-10">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Volumen Tickets</p>
                      <p className="font-black dark:text-white text-base">{band.cantidadTickets}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Afluencia Guests</p>
                      <p className="font-black dark:text-white text-base">{band.comensales}</p>
                    </div>
                  </div>
               </div>
            )) : (
              <div className="col-span-3 bg-slate-100/50 dark:bg-slate-900/50 rounded-[48px] border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-20 text-slate-400">
                  <BarChart3 size={64} className="mb-6 opacity-20" />
                  <p className="font-black text-[11px] uppercase tracking-[0.3em] text-center max-w-xs">Define Franjas Horarias en Configuración para activar este reporte</p>
              </div>
            )}
         </div>
      </div>

      {/* Advanced Visualizations Row */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-8">
         {/* Evolution Line Chart */}
         <div className="bg-white dark:bg-slate-800 p-10 rounded-[56px] shadow-sm border border-slate-50 dark:border-slate-800">
            <div className="flex items-center justify-between mb-12">
               <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">Timeline Analytics</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Comparativa Intradía (Franjas 30m)</p>
               </div>
               <TrendingUp className="text-indigo-500" size={32} />
            </div>

            <div className="w-full h-[400px]">
              {loading ? <div className="h-full flex items-center justify-center">Cargando Trayectorias...</div> : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={metricsConfig[activeMetric].color} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={metricsConfig[activeMetric].color} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={activeColors.border} />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: activeColors.textMuted }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: activeColors.textMuted }} tickFormatter={(v) => metricsConfig[activeMetric].format(v)} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px rgba(0,0,0,0.1)', background: activeColors.card }}
                      formatter={(v) => [metricsConfig[activeMetric].format(v), "Actual"]}
                    />
                    <Area type="monotone" dataKey="Current" stroke={metricsConfig[activeMetric].color} strokeWidth={4} fillOpacity={1} fill="url(#colorArea)" />
                    <Line type="monotone" dataKey="HistoryAvg" stroke="#CBD5E1" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
         </div>

         {/* Channel Distribution Pie Chart */}
         <div className="bg-white dark:bg-slate-800 p-10 rounded-[56px] shadow-sm border border-slate-50 dark:border-slate-800">
            <div className="flex items-center justify-between mb-12">
               <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">Mix de Canales</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Distribución de {metricsConfig[activeMetric].label}</p>
               </div>
               <PieIcon className="text-indigo-500" size={32} />
            </div>

            <div className="flex flex-col md:flex-row items-center gap-10">
               <div className="w-full md:w-[60%] h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={channelData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey={activeMetric}
                      >
                        {channelData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                         contentStyle={{ borderRadius: '16px', border: 'none', background: activeColors.card }}
                         formatter={(v) => metricsConfig[activeMetric].format(v)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
               </div>
               <div className="w-full md:w-[40%] space-y-4">
                  {channelData.map((d, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl">
                       <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ background: PIE_COLORS[index % PIE_COLORS.length] }}></div>
                          <span className="text-xs font-black text-slate-700 dark:text-slate-300">{d.name || "General"}</span>
                       </div>
                       <span className="text-xs font-black dark:text-white uppercase tracking-widest">{metricsConfig[activeMetric].format(d[activeMetric])}</span>
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </section>

      {/* Detailed Records Table */}
      <section className="bg-white dark:bg-slate-800 rounded-[56px] shadow-sm border border-slate-50 dark:border-slate-800 overflow-hidden">
         <div className="p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-bottom border-slate-50 dark:border-slate-900">
            <div className="flex items-center gap-5">
               <div className="w-14 h-14 bg-indigo-500 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
                  <TableIcon size={28} />
               </div>
               <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white">Auditoría de Registros</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Snapshot detallado del periodo actual</p>
               </div>
            </div>
            
            <div className="flex items-center gap-4">
               <div className="relative group flex-1 md:w-64">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input placeholder="Filtrar por tienda..." className="w-full p-3 pl-10 rounded-2xl bg-slate-50 dark:bg-slate-900 font-bold text-xs border border-transparent focus:border-indigo-500 outline-none transition-all" />
               </div>
               <button className="flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-700 rounded-2xl text-slate-600 dark:text-slate-300 font-black text-xs hover:bg-slate-200 transition-all">
                  <Download size={16} />
                  Exportar
               </button>
            </div>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead className="bg-slate-50 dark:bg-slate-900/50">
                  <tr>
                     <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tienda / Local</th>
                     <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Hora</th>
                     <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Canal</th>
                     <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Venta Neta</th>
                     <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Tickets</th>
                     <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Guests</th>
                     <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ticket Prom.</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50 dark:divide-slate-900">
                  {detailedRecords.map((rec, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors group">
                       <td className="px-10 py-6">
                          <div className="flex items-center gap-3">
                             <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20"></div>
                             <span className="font-black text-slate-800 dark:text-slate-200 text-sm">{rec.storeName}</span>
                          </div>
                       </td>
                       <td className="px-10 py-6 text-center">
                          <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700/50 rounded-lg text-xs font-black text-slate-600 dark:text-slate-400">
                            {new Date(rec.recordDate).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false })}
                          </span>
                       </td>
                       <td className="px-10 py-6">
                          <span className="text-xs font-bold text-slate-500">{rec.channelName}</span>
                       </td>
                       <td className="px-10 py-6 text-right font-black text-slate-800 dark:text-white text-sm">
                          {formatCurrency(rec.ventaNeta)}
                       </td>
                       <td className="px-10 py-6 text-center">
                          <span className="font-bold text-slate-600 dark:text-slate-400 text-sm">{rec.cantidadTickets}</span>
                       </td>
                       <td className="px-10 py-6 text-center">
                          <span className="font-bold text-slate-600 dark:text-slate-400 text-sm">{rec.comensales}</span>
                       </td>
                       <td className="px-10 py-6 text-right font-black text-indigo-500 text-sm">
                          {formatCurrency(rec.ticketPromedio)}
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
            
            {detailedRecords.length === 0 && (
               <div className="p-20 flex flex-col items-center justify-center text-slate-400 gap-4 opacity-50">
                  <Hash size={48} strokeWidth={1} />
                  <p className="font-black text-[12px] uppercase tracking-[0.2em]">No hay registros para este período</p>
               </div>
            )}
         </div>
      </section>
    </div>
  );
};

export default SalesAnalytics;
