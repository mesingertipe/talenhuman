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
import * as XLSX from 'xlsx';
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
  const [weeklyTrendData, setWeeklyTrendData] = useState([]);
  const [detailedRecords, setDetailedRecords] = useState([]);
  const [metadata, setMetadata] = useState({ stores: [], channels: [] });
  const [isExporting, setIsExporting] = useState(false);
  
  const [filters, setFilters] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
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
      
      const [summaryRes, evolutionRes, channelRes, weeklyTrendRes, recordsRes] = await Promise.all([
        api.get(`/sales/analytics/summary?${params.toString()}`),
        api.get(`/sales/analytics/evolution?${params.toString()}`),
        api.get(`/sales/analytics/channels?${params.toString()}`),
        api.get(`/sales/analytics/weekly-trend?${params.toString()}`),
        api.get(`/sales?${params.toString()}&pageSize=500`)
      ]);
      
      setSummaryData(summaryRes.data);
      setEvolutionData(evolutionRes.data);
      setChannelData(channelRes.data);
      setWeeklyTrendData(weeklyTrendRes.data);
      setDetailedRecords(recordsRes.data.items || []);
    } catch (err) {
      console.error("Error fetching analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  const chartData = useMemo(() => {
    if (!evolutionData.current) return [];
    
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
        Actual: curr ? curr[activeMetric] : 0,
        PromedioHistorico: hist ? (
          activeMetric === 'ventaNeta' ? hist.ventaNetaAvg :
          activeMetric === 'cantidadTickets' ? hist.ticketsAvg :
          activeMetric === 'comensales' ? hist.comensalesAvg :
          hist.ticketPromedioAvg
        ) : 0
      };
    });
  }, [evolutionData, activeMetric]);

  const globalTotals = useMemo(() => {
    if (!detailedRecords.length) return { ventaNeta: 0, cantidadTickets: 0, comensales: 0, ticketPromedio: 0 };
    const totalVenta = detailedRecords.reduce((acc, curr) => acc + curr.ventaNeta, 0);
    const totalTickets = detailedRecords.reduce((acc, curr) => acc + curr.cantidadTickets, 0);
    const totalComensales = detailedRecords.reduce((acc, curr) => acc + curr.comensales, 0);
    return {
      ventaNeta: totalVenta,
      cantidadTickets: totalTickets,
      comensales: totalComensales,
      ticketPromedio: totalTickets > 0 ? totalVenta / totalTickets : 0
    };
  }, [detailedRecords]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);
  };

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      const dataToExport = detailedRecords.map(r => ({
        'Tienda/Local': r.storeName,
        'Fecha/Hora': r.recordDate,
        'Canal': r.channelName,
        'Venta Neta': r.ventaNeta,
        'Tickets': r.cantidadTickets,
        'Comensales': r.comensales,
        'Ticket Promedio': r.ticketPromedio
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Reporte de Ventas");
      XLSX.writeFile(wb, `Reporte_BI_Ventas_${filters.startDate}_al_${filters.endDate}.xlsx`);
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const metricsConfig = {
    ventaNeta: { label: 'Venta Neta', icon: DollarSign, color: '#6366f1', format: formatCurrency },
    cantidadTickets: { label: 'Tickets', icon: Hash, color: '#8b5cf6', format: (v) => Math.round(v) },
    comensales: { label: 'Comensales', icon: Users, color: '#10b981', format: (v) => Math.round(v) },
    ticketPromedio: { label: 'Ticket Promedio', icon: BarChart3, color: '#f59e0b', format: formatCurrency }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20 px-4 md:px-0">
      {/* Top Banner & Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
             <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                <BarChart3 size={18} />
             </div>
             <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Panel de Control BI</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Centro de Comando Inteligente</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium italic">Visión 360° de la operación comercial y análisis predictivo.</p>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-black uppercase tracking-wider border border-emerald-500/20">
              Sincronización en Tiempo Real
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
      <section className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-[48px] shadow-sm border border-slate-50 dark:border-slate-800 relative z-50">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 px-2 tracking-widest mb-2 block">Fecha Inicio</label>
              <div className="relative group">
                <Calendar size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors z-10" />
                <input 
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                  className="w-full p-4 pl-14 rounded-3xl border-2 border-slate-50 dark:border-slate-900 bg-slate-50 dark:bg-slate-900/50 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all font-bold text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 px-2 tracking-widest mb-2 block">Fecha Fin</label>
              <div className="relative group">
                <Calendar size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors z-10" />
                <input 
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                  className="w-full p-4 pl-14 rounded-3xl border-2 border-slate-50 dark:border-slate-900 bg-slate-50 dark:bg-slate-900/50 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all font-bold text-sm"
                />
              </div>
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
              label="Canal"
              options={metadata.channels}
              value={filters.channelId}
              onChange={(val) => setFilters({...filters, channelId: val})}
              icon={Layers}
              placeholder="Filtro omnicanal"
            />
          </div>
        </div>
      </section>

      {/* HORIZONTAL METRIC SELECTOR */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.keys(metricsConfig).map(k => {
            const cfg = metricsConfig[k];
            const Icon = cfg.icon;
            const isActive = activeMetric === k;
            
            return (
              <button 
                key={k}
                onClick={() => setActiveMetric(k)}
                className={`p-5 rounded-[32px] border-2 text-left transition-all relative overflow-hidden flex items-center gap-4 ${
                  isActive 
                    ? 'bg-white dark:bg-slate-800 border-indigo-500 shadow-xl' 
                    : 'bg-slate-100/30 dark:bg-slate-900/30 border-transparent grayscale opacity-70 hover:grayscale-0 hover:opacity-100 hover:bg-white dark:hover:bg-slate-800'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md transition-all" style={{ background: isActive ? cfg.color : 'white', color: isActive ? 'white' : cfg.color }}>
                  <Icon size={24} />
                </div>
                <div>
                    <p className={`text-[10px] font-black tracking-widest mb-0.5 ${isActive ? 'text-indigo-500' : 'text-slate-400'}`}>{cfg.label}</p>
                    <h4 className="text-lg font-black text-slate-800 dark:text-white leading-none">
                      {cfg.format(globalTotals[k])}
                    </h4>
                </div>
              </button>
            );
          })}
      </div>

      {/* DASHBOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT COLUMN: TRENDS & ANALYTICS */}
          <div className="lg:col-span-2 space-y-8">
              {/* Evolution Chart (Intraday) */}
              <div className="bg-white dark:bg-slate-800 p-8 rounded-[56px] shadow-sm border border-slate-50 dark:border-slate-800">
                <div className="flex items-center justify-between mb-10">
                   <div>
                      <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">Evolución Intradía</h2>
                      <p className="text-[10px] font-black text-slate-400 tracking-widest mt-1 uppercase">Basado en fecha de inicio seleccionada</p>
                   </div>
                   <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                      <TrendingUp size={24} />
                   </div>
                </div>

                <div className="w-full h-[350px]">
                  {loading ? <div className="h-full flex items-center justify-center text-slate-400 font-bold">Analizando trayectorias...</div> : (
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
                        />
                        <Area type="monotone" dataKey="Actual" stroke={metricsConfig[activeMetric].color} strokeWidth={4} fillOpacity={1} fill="url(#colorArea)" />
                        <Line type="monotone" dataKey="PromedioHistorico" stroke="#CBD5E1" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold' }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Weekly Trend (Bar Chart) */}
              <div className="bg-white dark:bg-slate-800 p-8 rounded-[56px] shadow-sm border border-slate-50 dark:border-slate-800">
                <div className="flex items-center justify-between mb-10">
                   <div>
                      <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">Tendencia del Periodo</h2>
                      <p className="text-[10px] font-black text-slate-400 tracking-widest mt-1 uppercase">Carga diaria por {metricsConfig[activeMetric].label}</p>
                   </div>
                   <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                      <BarChart3 size={24} />
                   </div>
                </div>

                <div className="w-full h-[300px]">
                  {loading ? <div className="h-full flex items-center justify-center text-slate-400 font-bold">Procesando tendencia...</div> : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyTrendData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={activeColors.border} />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: activeColors.textMuted }} tickFormatter={(d) => new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: activeColors.textMuted }} tickFormatter={(v) => metricsConfig[activeMetric].format(v)} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px rgba(0,0,0,0.1)', background: activeColors.card }}
                          labelFormatter={(d) => new Date(d).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
                          formatter={(v) => [metricsConfig[activeMetric].format(v), metricsConfig[activeMetric].label]}
                        />
                        <Bar dataKey={activeMetric} fill={metricsConfig[activeMetric].color} radius={[10, 10, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
          </div>

          {/* RIGHT COLUMN: BAND SUMMARY & CHANNEL MIX */}
          <div className="space-y-8">
              {/* Bands breakdown */}
              <div className="bg-white dark:bg-slate-800 p-8 rounded-[56px] shadow-sm border border-slate-50 dark:border-slate-800">
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6">Desglose por Franjas</h3>
                <div className="space-y-4">
                  {summaryData.map((band, idx) => (
                    <div key={idx} className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-3xl group flex items-center justify-between border-l-4" style={{ borderColor: band.color }}>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">{band.name}</p>
                        <p className="text-lg font-black dark:text-white">{metricsConfig[activeMetric].format(band[activeMetric])}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-medium text-slate-400 underline decoration-slate-200">Tickets: {band.cantidadTickets}</p>
                        <p className="text-[10px] font-medium text-slate-400">Guests: {band.comensales}</p>
                      </div>
                    </div>
                  ))}
                  {summaryData.length === 0 && (
                     <div className="text-center py-10 opacity-30">
                        <Clock size={48} className="mx-auto mb-2" />
                        <p className="text-xs font-bold">Configure franjas en el módulo core</p>
                     </div>
                  )}
                </div>
              </div>

              {/* Channel Distribution */}
              <div className="bg-white dark:bg-slate-800 p-8 rounded-[56px] shadow-sm border border-slate-50 dark:border-slate-800">
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6">Mix de Canales</h3>
                <div className="h-[200px] mb-6">
                   <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={channelData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey={activeMetric}
                      >
                        {channelData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', background: activeColors.card }} />
                    </PieChart>
                   </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-1 gap-2">
                   {channelData.slice(0, 4).map((d, index) => (
                      <div key={index} className="flex items-center justify-between text-xs px-2">
                         <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[index % PIE_COLORS.length] }}></div>
                            <span className="font-bold text-slate-500">{d.name}</span>
                         </div>
                         <span className="font-black text-slate-800 dark:text-slate-200">{metricsConfig[activeMetric].format(d[activeMetric])}</span>
                      </div>
                   ))}
                </div>
              </div>
          </div>
      </div>

      {/* DETAILED RECORDS TABLE (Collapsed and improved) */}
      <section className="bg-white dark:bg-slate-800 rounded-[56px] shadow-sm border border-slate-50 dark:border-slate-800 overflow-hidden">
         <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
               <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                  <TableIcon size={24} />
               </div>
               <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">Auditoría de Registros</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Snapshot detallado del periodo</p>
               </div>
            </div>
            
            <div className="flex items-center gap-3">
               <button 
                  onClick={handleExportExcel}
                  disabled={isExporting}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-indigo-600 rounded-2xl text-white font-black text-xs hover:scale-105 transition-all"
               >
                  {isExporting ? <div className="loader mr-2"></div> : <Download size={16} />}
                  Exportar Excel
               </button>
            </div>
         </div>

         <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full text-left">
               <thead className="bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-10">
                  <tr>
                     <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tienda</th>
                     <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Fecha/Hora</th>
                     <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Canal</th>
                     <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Venta</th>
                     <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Tickets</th>
                     <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Guests</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50 dark:divide-slate-900">
                  {detailedRecords.slice(0, 100).map((rec, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                       <td className="px-8 py-4"><span className="font-black text-slate-800 dark:text-slate-200 text-sm">{rec.storeName}</span></td>
                       <td className="px-8 py-4 text-center">
                          <span className="text-xs font-bold text-slate-500">
                            {new Date(rec.recordDate).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                       </td>
                       <td className="px-8 py-4"><span className="text-xs font-bold text-slate-500">{rec.channelName}</span></td>
                       <td className="px-8 py-4 text-right font-black text-slate-800 dark:text-white text-sm">{formatCurrency(rec.ventaNeta)}</td>
                       <td className="px-8 py-4 text-center text-sm">{rec.cantidadTickets}</td>
                       <td className="px-8 py-4 text-center text-sm">{rec.comensales}</td>
                    </tr>
                  ))}
               </tbody>
            </table>
            
            {detailedRecords.length === 0 && (
               <div className="p-20 flex flex-col items-center justify-center text-slate-400 gap-4 opacity-50">
                  <Hash size={48} strokeWidth={1} />
                  <p className="font-black text-[12px] uppercase text-center tracking-[0.2em]">Seleccione un periodo con datos cargados para auditar</p>
               </div>
            )}
         </div>
      </section>
    </div>
  );
};

export default SalesAnalytics;
