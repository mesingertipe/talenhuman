import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Legend, AreaChart, Area, ComposedChart, PieChart, Pie, Cell
} from 'recharts';
import { 
  TrendingUp, Calendar, Filter, Store, Layers, Clock, 
  DollarSign, Hash, Users, ArrowUpRight, ArrowDownRight,
  ChevronDown, RefreshCw, BarChart3, Presentation, PieChart as PieIcon,
  Table as TableIcon, Download, Info, Search, X, Sparkles, Activity
} from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '../../services/api';
import SearchableSelect from '../../components/Shared/SearchableSelect';
import { useTheme } from '../../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

const SalesAnalytics = ({ user }) => {
  const { isDarkMode } = useTheme();
  
  // Elite Design Tokens - ABSOLUTE RELIABILITY VIA INLINE STYLES
  const activeColors = {
    bg: isDarkMode ? '#060914' : '#f8fafc',
    card: isDarkMode ? '#1e293b' : '#ffffff',
    border: isDarkMode ? '#334155' : '#f1f5f9',
    textMain: isDarkMode ? '#f1f5f9' : '#1e293b',
    textMuted: isDarkMode ? '#94a3b8' : '#64748b',
    accent: '#4f46e5',
    accentSoft: isDarkMode ? 'rgba(79, 70, 229, 0.15)' : '#eef2ff',
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
  const [metadata, setMetadata] = useState({ stores: [], channels: [] });
  
  const [filters, setFilters] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    storeId: '',
    channelId: ''
  });

  const [activeMetric, setActiveMetric] = useState('ventaNeta');

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
      
      const stores = storesRes.data;
      setMetadata({
        stores: stores,
        channels: channelsRes.data
      });

      // Role-based auto-selection: If only one store is available, select it automatically
      if (stores.length === 1 && !filters.storeId) {
        setFilters(prev => ({ ...prev, storeId: stores[0].id }));
      }
    } catch (err) {
      console.error("Error fetching metadata:", err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(filters);
      
      const [summaryRes, evolutionRes, channelRes, weeklyTrendRes] = await Promise.all([
        api.get(`/sales/analytics/summary?${params.toString()}`),
        api.get(`/sales/analytics/evolution?${params.toString()}`),
        api.get(`/sales/analytics/channels?${params.toString()}`),
        api.get(`/sales/analytics/weekly-trend?${params.toString()}`)
      ]);
      
      setSummaryData(summaryRes.data);
      setEvolutionData(evolutionRes.data);
      setChannelData(channelRes.data);
      setWeeklyTrendData(weeklyTrendRes.data);
    } catch (err) {
      console.error("Error fetching analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  const chartData = useMemo(() => {
    if (!evolutionData.current) return [];
    
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
    // We can't use detailedRecords anymore here since we're removing them.
    // We'll calculate totals from weeklyTrendData or summaryData
    const results = { ventaNeta: 0, cantidadTickets: 0, comensales: 0, ticketPromedio: 0 };
    if (weeklyTrendData.length) {
        results.ventaNeta = weeklyTrendData.reduce((acc, curr) => acc + (curr.ventaNeta || 0), 0);
        results.cantidadTickets = weeklyTrendData.reduce((acc, curr) => acc + (curr.ventaNeta ? curr.cantidadTickets : 0), 0);
        results.comensales = weeklyTrendData.reduce((acc, curr) => acc + (curr.ventaNeta ? curr.comensales : 0), 0);
        results.ticketPromedio = results.cantidadTickets > 0 ? results.ventaNeta / results.cantidadTickets : 0;
    }
    return results;
  }, [weeklyTrendData]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);
  };

  const metricsConfig = {
    ventaNeta: { label: 'Venta Neta', icon: DollarSign, color: '#4f46e5', format: formatCurrency },
    cantidadTickets: { label: 'Tickets', icon: Hash, color: '#8b5cf6', format: (v) => Math.round(v) },
    comensales: { label: 'Comensales', icon: Users, color: '#10b981', format: (v) => Math.round(v) },
    ticketPromedio: { label: 'Ticket Promedio', icon: BarChart3, color: '#f59e0b', format: formatCurrency }
  };

  const exportToExcel = () => {
    try {
      const wb = XLSX.utils.book_new();
      
      // 1. Summary Sheet
      const summaryStats = [
        ["Métrica", "Valor"],
        ["Venta Neta", globalTotals.ventaNeta],
        ["Tickets", globalTotals.cantidadTickets],
        ["Comensales", globalTotals.comensales],
        ["Ticket Promedio", globalTotals.ticketPromedio]
      ];
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryStats);
      XLSX.utils.book_append_sheet(wb, wsSummary, "Resumen General");

      // 2. Weekly Trend Sheet
      if (weeklyTrendData.length > 0) {
        const wsWeekly = XLSX.utils.json_to_sheet(weeklyTrendData.map(d => ({
          Fecha: d.date,
          "Venta Neta": d.ventaNeta,
          Tickets: d.cantidadTickets,
          Comensales: d.comensales,
          "Ticket Promedio": d.ticketPromedio
        })));
        XLSX.utils.book_append_sheet(wb, wsWeekly, "Tendencia Diaria");
      }

      // 3. Channels Sheet
      if (channelData.length > 0) {
        const wsChannels = XLSX.utils.json_to_sheet(channelData.map(d => ({
          Canal: d.name,
          "Venta Neta": d.ventaNeta,
          Tickets: d.cantidadTickets,
          Comensales: d.comensales
        })));
        XLSX.utils.book_append_sheet(wb, wsChannels, "Mix de Canales");
      }

      // 4. Time Bands Sheet
      if (summaryData.length > 0) {
        const wsBands = XLSX.utils.json_to_sheet(summaryData.map(d => ({
          Franja: d.name,
          "Venta Neta": d.ventaNeta,
          Tickets: d.cantidadTickets,
          Comensales: d.comensales
        })));
        XLSX.utils.book_append_sheet(wb, wsBands, "Franjas Horarias");
      }

      XLSX.writeFile(wb, `Reporte_BI_${filters.startDate}_al_${filters.endDate}.xlsx`);
    } catch (err) {
      console.error("Error exporting to Excel:", err);
      if (typeof showToast === 'function') {
        showToast("Error al exportar a Excel", "error");
      } else {
        alert("Error al exportar a Excel");
      }
    }
  };

  return (
    <div style={{ background: activeColors.bg, padding: '2rem 1.5rem', maxWidth: '1600px', margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Elite Header */}
      <header style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '2rem', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
             <div style={{ width: '40px', height: '40px', borderRadius: '14px', background: activeColors.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 10px 20px rgba(79, 70, 229, 0.3)' }}>
                <BarChart3 size={20} strokeWidth={2.5} />
             </div>
             <span style={{ fontSize: '10px', fontWeight: '900', color: activeColors.accent, uppercase: true, tracking: '0.2em' }}>PANEL DE CONTROL BI</span>
          </div>
          <h1 style={{ fontSize: '2.8rem', fontWeight: '950', color: activeColors.textMain, margin: 0, letterSpacing: '-0.04em' }}>Centro de Comando Inteligente</h1>
          <p style={{ color: activeColors.textMuted, fontSize: '1rem', fontWeight: '600', marginTop: '6px' }}>Visión 360° de la operación comercial y análisis predictivo.</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
           <div style={{ padding: '12px 24px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '20px', fontSize: '11px', fontWeight: '900', border: '1px solid rgba(16, 185, 129, 0.2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Sincronización en Tiempo Real
           </div>
           <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={exportToExcel}
            className="hover:scale-[1.02] active:scale-95"
            style={{ padding: '12px 24px', borderRadius: '16px', background: activeColors.card, border: `1px solid ${activeColors.border}`, color: activeColors.textMain, fontWeight: '800', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Download size={18} />
            EXPORTAR
          </button>
        </div>
           <button 
             onClick={fetchAnalytics}
             style={{ width: '56px', height: '56px', background: activeColors.card, borderRadius: '20px', border: `1.5px solid ${activeColors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: activeColors.textMuted, cursor: 'pointer', transition: 'all 0.3s' }}
           >
             <RefreshCw size={24} className={loading ? "animate-spin" : ""} />
           </button>
        </div>
      </header>

      {/* Control Panel (Filters) - REFACTORED TO INLINE */}
      <section style={{ background: activeColors.card, padding: '40px', borderRadius: '48px', border: `1.5px solid ${activeColors.border}`, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', position: 'relative', zIndex: 50 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 2.5fr) minmax(300px, 2fr) minmax(200px, 1fr)', gap: '30px', alignItems: 'flex-end' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.1em' }}>Fecha Inicio</label>
              <div style={{ position: 'relative' }}>
                <Calendar size={18} style={{ position: 'absolute', left: '20px', top: '19px', color: '#94a3b8', zIndex: 10 }} />
                <input 
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                  style={{ width: '100%', padding: '16px 24px 16px 54px', borderRadius: '20px', border: `2px solid ${activeColors.border}`, background: isDarkMode ? 'rgba(15, 23, 42, 0.5)' : '#f8fafc', color: activeColors.textMain, fontWeight: '800', fontSize: '0.9rem', outline: 'none' }}
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.1em' }}>Fecha Fin</label>
              <div style={{ position: 'relative' }}>
                <Calendar size={18} style={{ position: 'absolute', left: '20px', top: '19px', color: '#94a3b8', zIndex: 10 }} />
                <input 
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                  style={{ width: '100%', padding: '16px 24px 16px 54px', borderRadius: '20px', border: `2px solid ${activeColors.border}`, background: isDarkMode ? 'rgba(15, 23, 42, 0.5)' : '#f8fafc', color: activeColors.textMain, fontWeight: '800', fontSize: '0.9rem', outline: 'none' }}
                />
              </div>
            </div>
          </div>
          <div>
            <SearchableSelect 
              label="SEDE / ESTABLECIMIENTO"
              options={metadata.stores}
              value={filters.storeId}
              onChange={(val) => setFilters({...filters, storeId: val})}
              icon={Store}
              placeholder={metadata.stores.length === 1 ? metadata.stores[0].name : "Todas las sedes"}
              disabled={metadata.stores.length === 1}
            />
          </div>
          <div>
            <SearchableSelect 
              label="CANAL"
              options={metadata.channels}
              value={filters.channelId}
              onChange={(val) => setFilters({...filters, channelId: val})}
              icon={Layers}
              placeholder="Filtro omnicanal"
            />
          </div>
        </div>
      </section>

      {/* METRIC SELECTOR - REFACTORED TO INLINE */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          {Object.keys(metricsConfig).map(k => {
            const cfg = metricsConfig[k];
            const Icon = cfg.icon;
            const isActive = activeMetric === k;
            
            return (
              <button 
                key={k}
                onClick={() => setActiveMetric(k)}
                style={{ 
                    padding: '24px 30px', 
                    borderRadius: '35px', 
                    border: `2.5px solid ${isActive ? activeColors.accent : 'transparent'}`, 
                    textAlign: 'left', 
                    transition: 'all 0.3s', 
                    background: isActive ? activeColors.card : 'rgba(79, 70, 229, 0.03)',
                    boxShadow: isActive ? '0 30px 60px rgba(79, 70, 229, 0.15)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    cursor: 'pointer',
                    opacity: isActive ? 1 : 0.6
                }}
              >
                <div style={{ width: '60px', height: '60px', borderRadius: '20px', background: isActive ? cfg.color : '#ffffff', color: isActive ? 'white' : cfg.color, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  <Icon size={28} strokeWidth={2.5} />
                </div>
                <div>
                    <p style={{ fontSize: '10px', fontWeight: '950', color: isActive ? activeColors.accent : activeColors.textMuted, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{cfg.label}</p>
                    <h4 style={{ fontSize: '1.4rem', fontWeight: '950', color: activeColors.textMain, margin: 0 }}>
                      {cfg.format(globalTotals[k])}
                    </h4>
                </div>
              </button>
            );
          })}
      </div>

      {/* DASHBOARD GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px' }}>
          
          {/* Evolución Intradía */}
          <div style={{ background: activeColors.card, padding: '40px', borderRadius: '56px', border: `1.5px solid ${activeColors.border}`, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
                <div>
                    <h2 style={{ fontSize: '1.6rem', fontWeight: '950', color: activeColors.textMain, margin: 0, letterSpacing: '-0.02em' }}>Evolución Intradía</h2>
                    <p style={{ fontSize: '10px', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase', tracking: '0.1em', marginTop: '4px' }}>Comparativa vs Histórico (3 sem)</p>
                </div>
                <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(79, 70, 229, 0.1)', color: activeColors.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TrendingUp size={24} />
                </div>
            </div>

            <div style={{ width: '100%', height: '350px' }}>
                {loading ? <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: activeColors.textMuted, fontWeight: '700' }}>Analizando trayectorias...</div> : (
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
                        contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px rgba(0,0,0,0.1)', background: activeColors.card, padding: '15px' }}
                    />
                    <Area type="monotone" dataKey="Actual" stroke={metricsConfig[activeMetric].color} strokeWidth={4} fillOpacity={1} fill="url(#colorArea)" />
                    <Line type="monotone" dataKey="PromedioHistorico" stroke="#CBD5E1" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold' }} />
                    </AreaChart>
                </ResponsiveContainer>
                )}
            </div>
          </div>

          {/* Histograma Semanal (REPLACING DETAILED TABLE) */}
          <div style={{ background: activeColors.card, padding: '40px', borderRadius: '56px', border: `1.5px solid ${activeColors.border}`, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
                <div>
                    <h2 style={{ fontSize: '1.6rem', fontWeight: '950', color: activeColors.textMain, margin: 0, letterSpacing: '-0.02em' }}>Histograma Semanal</h2>
                    <p style={{ fontSize: '10px', fontWeight: '900', color: activeColors.textMuted, textTransform: 'uppercase', tracking: '0.1em', marginTop: '4px' }}>Venta Neta detallada por día</p>
                </div>
                <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BarChart3 size={24} />
                </div>
            </div>

            <div style={{ width: '100%', height: '350px' }}>
                {loading ? <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: activeColors.textMuted, fontWeight: '700' }}>Procesando tendencia...</div> : (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyTrendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={activeColors.border} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: activeColors.textMuted }} tickFormatter={(d) => new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: activeColors.textMuted }} tickFormatter={(v) => metricsConfig[activeMetric].format(v)} />
                    <Tooltip 
                        contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px rgba(0,0,0,0.1)', background: activeColors.card, padding: '15px' }}
                        labelFormatter={(d) => new Date(d).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
                        formatter={(v) => [metricsConfig[activeMetric].format(v), metricsConfig[activeMetric].label]}
                    />
                    <Bar dataKey={activeMetric} fill={metricsConfig[activeMetric].color} radius={[12, 12, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
                )}
            </div>
          </div>

          {/* Desglose por Franjas */}
          <div style={{ background: activeColors.card, padding: '40px', borderRadius: '56px', border: `1.5px solid ${activeColors.border}`, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: '950', color: activeColors.textMain, marginBottom: '30px' }}>Concentración por Franjas</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {summaryData.map((band, idx) => (
                    <div key={idx} style={{ padding: '24px', background: isDarkMode ? 'rgba(15, 23, 42, 0.5)' : '#f8fafc', borderRadius: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: `6px solid ${band.color || activeColors.accent}` }}>
                      <div>
                        <p style={{ fontSize: '9px', fontWeight: '950', color: activeColors.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' }}>{band.name}</p>
                        <p style={{ fontSize: '1.2rem', fontWeight: '950', color: activeColors.textMain, margin: 0 }}>{metricsConfig[activeMetric].format(band[activeMetric])}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '9px', fontWeight: '700', color: activeColors.textMuted, margin: 0 }}>Tickets: {band.cantidadTickets}</p>
                        <p style={{ fontSize: '9px', fontWeight: '700', color: activeColors.textMuted, margin: 0 }}>Guests: {band.comensales}</p>
                      </div>
                    </div>
                  ))}
                  {summaryData.length === 0 && (
                     <div style={{ textAlign: 'center', padding: '60px 0', opacity: 0.3 }}>
                        <Clock size={48} style={{ margin: '0 auto 10px' }} />
                        <p style={{ fontSize: '12px', fontWeight: '800' }}>Sin franjas configuradas</p>
                     </div>
                  )}
            </div>
          </div>

          {/* Mix de Canales */}
          <div style={{ background: activeColors.card, padding: '40px', borderRadius: '56px', border: `1.5px solid ${activeColors.border}`, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: '950', color: activeColors.textMain, marginBottom: '30px' }}>Mix de Canales</h3>
            <div style={{ height: '220px', marginBottom: '30px' }}>
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                    data={channelData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={8}
                    dataKey={activeMetric}
                    >
                    {channelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="none" />
                    ))}
                    </Pie>
                    <Tooltip 
                        contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px rgba(0,0,0,0.1)', background: activeColors.card, padding: '15px' }}
                    />
                </PieChart>
                </ResponsiveContainer>
            </div>
            
            {/* Legend - RECOVERED AND IMPROVED */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
                {channelData.map((d, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', background: isDarkMode ? 'rgba(15, 23, 42, 0.4)' : '#f8fafc', borderRadius: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: PIE_COLORS[index % PIE_COLORS.length] }}></div>
                        <span style={{ fontSize: '11px', fontWeight: '800', color: activeColors.textMain }}>{d.name}</span>
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: '950', color: activeColors.accent }}>{metricsConfig[activeMetric].format(d[activeMetric])}</span>
                    </div>
                ))}
            </div>
          </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
};

export default SalesAnalytics;
