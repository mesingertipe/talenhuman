import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Legend, AreaChart, Area, ComposedChart
} from 'recharts';
import { 
  TrendingUp, Calendar, Filter, Store, Layers, Clock, 
  DollarSign, Hash, Users, ArrowUpRight, ArrowDownRight,
  ChevronDown, RefreshCw, BarChart3, Presentation
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
    accent: '#6366f1'
  };

  const [loading, setLoading] = useState(true);
  const [evolutionData, setEvolutionData] = useState({ current: [], history: [] });
  const [summaryData, setSummaryData] = useState([]);
  const [metadata, setMetadata] = useState({ stores: [], channels: [] });
  
  const [filters, setFilters] = useState({
    date: new Date().toISOString().split('T')[0],
    storeId: '',
    channelId: ''
  });

  const [activeMetric, setActiveMetric] = useState('VentaNeta'); // VentaNeta, CantidadTickets, Comensales, TicketPromedio

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
      
      const [summaryRes, evolutionRes] = await Promise.all([
        api.get(`/sales/analytics/summary?${params.toString()}`),
        api.get(`/sales/analytics/evolution?${params.toString()}`)
      ]);
      
      setSummaryData(summaryRes.data);
      setEvolutionData(evolutionRes.data);
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
          activeMetric === 'VentaNeta' ? hist.ventaNetaAvg :
          activeMetric === 'CantidadTickets' ? hist.ticketsAvg :
          activeMetric === 'Comensales' ? hist.comensalesAvg :
          hist.ticketPromedioAvg
        ) : 0
      };
    });
  }, [evolutionData, activeMetric]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);
  };

  const metricsConfig = {
    VentaNeta: { label: 'Venta Neta', icon: DollarSign, color: '#6366f1', format: formatCurrency },
    CantidadTickets: { label: 'Cant. Tickets', icon: Hash, color: '#8b5cf6', format: (v) => Math.round(v) },
    Comensales: { label: 'Comensales', icon: Users, color: '#10b981', format: (v) => Math.round(v) },
    TicketPromedio: { label: 'Ticket Prom.', icon: BarChart3, color: '#f59e0b', format: formatCurrency }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
             <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                <Presentation size={18} />
             </div>
             <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Business Intelligence</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Analítica de Ventas</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Análisis evolutivo comparado vs históricos de 4 semanas.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchAnalytics}
            className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all text-slate-500"
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </header>

      {/* Advanced Filters */}
      <section className="bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-sm border border-slate-50 dark:border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="text-[10px] font-black text-slate-400 px-2 uppercase tracking-widest mb-3 block">Período de Análisis</label>
            <div className="relative group">
              <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors z-10" />
              <input 
                type="date"
                value={filters.date}
                onChange={(e) => setFilters({...filters, date: e.target.value})}
                className="w-full p-4 pl-12 rounded-3xl border-2 border-slate-50 dark:border-slate-900 bg-slate-50 dark:bg-slate-900/50 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all font-bold text-sm"
              />
            </div>
          </div>
          <div>
            <SearchableSelect 
              label="Tienda / Sede"
              options={metadata.stores}
              value={filters.storeId}
              onChange={(val) => setFilters({...filters, storeId: val})}
              icon={Store}
              placeholder="Todas las tiendas"
            />
          </div>
          <div>
            <SearchableSelect 
              label="Canal Operativo"
              options={metadata.channels}
              value={filters.channelId}
              onChange={(val) => setFilters({...filters, channelId: val})}
              icon={Layers}
              placeholder="Consolidado completo"
            />
          </div>
        </div>
      </section>

      {/* Metric Selectors & Band Summary */}
      <section className="grid grid-cols-1 lg:grid-cols-4 gap-6">
         <div className="lg:col-span-1 space-y-4">
            {Object.keys(metricsConfig).map(k => {
              const cfg = metricsConfig[k];
              const Icon = cfg.icon;
              const isActive = activeMetric === k;
              
              return (
                <div 
                  key={k}
                  onClick={() => setActiveMetric(k)}
                  className={`p-5 rounded-[32px] border-2 cursor-pointer transition-all ${
                    isActive 
                      ? 'bg-white dark:bg-slate-800 border-indigo-500 shadow-xl shadow-indigo-500/10 -translate-x-2' 
                      : 'bg-slate-100/50 dark:bg-slate-900/50 border-transparent grayscale opacity-70 hover:grayscale-0 hover:opacity-100 hover:bg-white dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center`} style={{ background: `${cfg.color}15`, color: cfg.color }}>
                      <Icon size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{cfg.label}</p>
                        <h4 className="text-xl font-black text-slate-800 dark:text-white leading-tight">Metodología BI</h4>
                    </div>
                  </div>
                </div>
              );
            })}
         </div>

         {/* Time Bands Summary Cards */}
         <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            {summaryData.map((band, idx) => (
               <div key={idx} className="bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-sm border border-slate-50 dark:border-slate-800 relative overflow-hidden group hover:scale-[1.02] transition-all">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 dark:bg-slate-900/30 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                       <div style={{ background: `${band.color}15`, color: band.color }} className="w-10 h-10 rounded-xl flex items-center justify-center">
                          <Clock size={20} />
                       </div>
                       <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight">{band.name}</span>
                    </div>
                    
                    <div className="space-y-4">
                       <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{metricsConfig[activeMetric].label}</p>
                          <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                            {metricsConfig[activeMetric].format(band[activeMetric])}
                          </h3>
                       </div>
                       <div className="pt-4 border-t border-slate-50 dark:border-slate-900 grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Tickets</p>
                            <p className="font-black dark:text-white text-sm">{band.cantidadTickets}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Guests</p>
                            <p className="font-black dark:text-white text-sm">{band.comensales}</p>
                          </div>
                       </div>
                    </div>
                  </div>
               </div>
            ))}
            {summaryData.length === 0 && (
               <div className="col-span-3 bg-slate-100/50 dark:bg-slate-900/50 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-12 text-slate-400">
                  <Clock size={48} className="mb-4 opacity-20" />
                  <p className="font-black text-[10px] uppercase tracking-[0.2em]">Configura Franjas Horarias para ver el resumen</p>
               </div>
            )}
         </div>
      </section>

      {/* Timeline Evolution Chart */}
      <section className="bg-white dark:bg-slate-800 p-10 rounded-[48px] shadow-sm border border-slate-50 dark:border-slate-800">
        <div className="flex items-center justify-between mb-12">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500">
                 <TrendingUp size={24} />
              </div>
              <div>
                 <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">Evolución Segmentada (30 min)</h2>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Comparativa vs Promedio Histórico 4 Semanas</p>
              </div>
           </div>
           
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                 <span className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-400">Día Seleccionado</span>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                 <span className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-400">Promedio Historico</span>
              </div>
           </div>
        </div>

        <div className="w-full h-[450px]">
          {loading ? (
             <div className="h-full flex items-center justify-center bg-slate-50/50 dark:bg-slate-900/30 rounded-3xl">
                <div className="flex flex-col items-center gap-4">
                   <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Calculando Trayectorias...</p>
                </div>
             </div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <defs>
                  <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#f1f5f9'} />
                <XAxis 
                  dataKey="time" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 800, fill: activeColors.textMuted }} 
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 800, fill: activeColors.textMuted }}
                  tickFormatter={(v) => metricsConfig[activeMetric].format(v)}
                />
                <Tooltip 
                  cursor={{ stroke: activeColors.accent, strokeWidth: 1, strokeDasharray: '5 5' }}
                  contentStyle={{ 
                    borderRadius: '24px', 
                    border: 'none', 
                    boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
                    padding: '20px',
                    background: isDarkMode ? '#1e293b' : '#ffffff'
                  }}
                  formatter={(value, name) => [
                    <span className="font-black text-slate-800 dark:text-white">{metricsConfig[activeMetric].format(value)}</span>,
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{name === 'Current' ? 'Día Seleccionado' : 'Media Histórica'}</span>
                  ]}
                />
                <Area type="monotone" dataKey="Current" name="Current" fillOpacity={1} fill="url(#colorCurrent)" stroke="#6366f1" strokeWidth={3} />
                <Line type="monotone" dataKey="HistoryAvg" name="History" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
             <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 opacity-50 bg-slate-50/50 dark:bg-slate-900/30 rounded-3xl">
                <BarChart3 size={64} strokeWidth={1} />
                <p className="font-black text-[12px] uppercase tracking-[0.3em]">Sin registros para visualizar</p>
             </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default SalesAnalytics;
